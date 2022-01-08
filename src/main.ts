import { Plugin } from "obsidian";
import {
  activeIndentField,
  indentationGroup,
  tabDecoration,
} from "./editorExtensions";
import { Settings, DEFAULT_SETTINGS, SettingsTab } from "./settings";

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

    this.app.workspace.trigger("parse-style-settings");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.applyClasses();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyClasses();
  }

  applyClasses() {
    this.toggleClass("ig-lists", this.settings.lists);
    this.toggleClass("ig-lists-preview", this.settings.previewLists);
    this.toggleClass("ig-code", this.settings.code);
    this.toggleClass("ig-uncategorized", this.settings.uncatagorizedIndents);
  }

  onunload() {
    document.body.removeClasses(["ig-lists", "ig-code", "ig-uncategorized"]);
  }

  toggleClass(className: string, on: boolean) {
    document.body.toggleClass(className, on);
  }
}
