import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { StateField } from "@codemirror/state";
import { RangeSetBuilder } from "@codemirror/rangeset";
import { Line } from "@codemirror/text";

interface Settings {
  showActiveIndentationGroup: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  showActiveIndentationGroup: true,
};

const tabDecoration = (getSettings: () => Settings) =>
  ViewPlugin.fromClass(
    class {
      decorator: MatchDecorator;
      decorations: DecorationSet = Decoration.none;

      constructor(public view: EditorView) {
        this.decorator = new MatchDecorator({
          regexp: new RegExp(`(?:\t| {${view.state.tabSize}})`, "g"),
          decoration: (match, view) => {
            if (!getSettings().showActiveIndentationGroup) {
              return Decoration.mark({
                class: `cm-tab`,
              });
            }

            const currentIndent = view.state.field(activeIndentField);

            return Decoration.mark({
              class: `cm-tab${
                currentIndent - 1 === match.index
                  ? " cm-indent-group-level"
                  : ""
              }`,
            });
          },
        });

        this.decorations = this.decorator.createDeco(view);
      }

      update(update: ViewUpdate) {
        if (!getSettings().showActiveIndentationGroup) {
          this.decorations = this.decorator.updateDeco(
            update,
            this.decorations
          );
        } else {
          this.decorations = this.decorator.createDeco(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

function getLineIndent(tabSize: number, line: Line) {
  const match = line.text.match(new RegExp(`^((?:\t| {${tabSize}})+)`));

  if (!match) return 0;

  return match[1].split(new RegExp(`(?:\t| {${tabSize}})`)).length - 1;
}

const indentationGroupDecoration = Decoration.line({
  attributes: { class: "cm-indent-group" },
});

function tagIndentationGroup(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();
  const state = view.state;

  if (!state.selection?.main) return builder.finish();

  const currentLine = state.doc.lineAt(state.selection.main.from);
  const currentIndent = view.state.field(activeIndentField);

  if (currentIndent === 0) return builder.finish();

  const indentationGroup: Line[] = [currentLine];

  let from: number = currentLine.from;
  let to: number = currentLine.to;

  while (from > 0) {
    const prevLine = state.doc.lineAt(from - 1);
    const prevIndent = getLineIndent(state.tabSize, prevLine);

    if (prevIndent >= currentIndent) {
      indentationGroup.push(prevLine);
      from = prevLine.from;
    } else {
      break;
    }
  }

  while (to < state.doc.length - 1) {
    const nextLine = state.doc.lineAt(to + 1);
    const nextIndent = getLineIndent(state.tabSize, nextLine);

    if (nextIndent >= currentIndent) {
      indentationGroup.push(nextLine);
      to = nextLine.to;
    } else {
      break;
    }
  }

  indentationGroup
    .sort((a, b) => a.from - b.from)
    .forEach((line) => {
      builder.add(line.from, line.from, indentationGroupDecoration);
    });

  return builder.finish();
}

const indentationGroup = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = tagIndentationGroup(view);
    }

    update(update: ViewUpdate) {
      this.decorations = tagIndentationGroup(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

const activeIndentField = StateField.define<number>({
  create(state) {
    if (!state.selection?.main) return 0;
    return getLineIndent(
      state.tabSize,
      state.doc.lineAt(state.selection.main.from)
    );
  },
  update(_, tr) {
    const state = tr.state;
    return getLineIndent(
      state.tabSize,
      state.doc.lineAt(state.selection.main.from)
    );
  },
});

export default class IndentationGuidesPlugin extends Plugin {
  settings: Settings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new SettingsTab(this.app, this));

    this.registerEditorExtension([
      activeIndentField,
      indentationGroup,
      tabDecoration(() => this.settings),
    ]);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SettingsTab extends PluginSettingTab {
  plugin: IndentationGuidesPlugin;

  constructor(app: App, plugin: IndentationGuidesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Highlight active indentation group")
      .addToggle((toggle) => {
        toggle
          .setValue(
            this.plugin.settings.showActiveIndentationGroup === undefined
              ? true
              : this.plugin.settings.showActiveIndentationGroup
          )
          .onChange(async (value) => {
            this.plugin.settings.showActiveIndentationGroup = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
