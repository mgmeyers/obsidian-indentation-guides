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
import { Settings } from "./settings";

function getLineIndent(line: Line) {
  const match = line.text.match(/^((?:\t| {4})+)/);

  if (!match) return 0;

  return match[1].split(/(?:\t| {4})/).length - 1;
}

export const activeIndentField = StateField.define<number>({
  create(state) {
    if (!state.selection?.main) return 0;
    return getLineIndent(state.doc.lineAt(state.selection.main.from));
  },
  update(_, tr) {
    // Can we prevent any unnecessary work here?
    const state = tr.state;
    return getLineIndent(state.doc.lineAt(state.selection.main.from));
  },
});

export const tabDecoration = (getSettings: () => Settings) => {
  return ViewPlugin.fromClass(
    class {
      decorator: MatchDecorator;
      decorations: DecorationSet = Decoration.none;

      constructor(public view: EditorView) {
        this.decorator = new MatchDecorator({
          regexp: new RegExp(/(?:\t| {4})/g),
          decoration: (match, view) => {
            if (!getSettings().showActiveIndentationGroup) {
              return Decoration.mark({
                class: `cm-tab`,
              });
            }

            const currentIndent = view.state.field(activeIndentField);

            return Decoration.mark({
              class: `cm-tab${
                currentIndent - 1 === match.index / match[0].length
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
          // It seems we have to recreate the decorations with each update or else
          // cm-indent-group-level won't be applied. Is there some way to work around this?
          this.decorations = this.decorator.createDeco(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
};

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
    const prevIndent = getLineIndent(prevLine);

    if (prevIndent >= currentIndent) {
      indentationGroup.push(prevLine);
      from = prevLine.from;
    } else {
      break;
    }
  }

  while (to < state.doc.length - 1) {
    const nextLine = state.doc.lineAt(to + 1);
    const nextIndent = getLineIndent(nextLine);

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

export const indentationGroup = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = tagIndentationGroup(view);
    }

    update(update: ViewUpdate) {
      // Can we prevent any unnecessary work here?
      this.decorations = tagIndentationGroup(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
