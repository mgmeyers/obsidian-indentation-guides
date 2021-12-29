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
    this.toggleClass("ig-code", this.settings.code);
    this.toggleClass("ig-uncategorized", this.settings.uncatagorizedIndents);
  }

  unload() {
    document.body.removeClasses(["ig-lists", "ig-code", "ig-uncategorized"]);
  }

  toggleClass(className: string, on: boolean) {
    if (on) {
      document.body.addClass(className);
    } else {
      document.body.removeClass(className);
    }
  }
}
