import { App, PluginSettingTab, Setting } from "obsidian";
import IndentationGuidesPlugin from "./main";

export interface Settings {
  showActiveIndentationGroup: boolean;
  lists: boolean;
  previewLists: boolean;
  uncatagorizedIndents: boolean;
  code: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showActiveIndentationGroup: true,
  lists: true,
  previewLists: false,
  uncatagorizedIndents: false,
  code: false,
};

export class SettingsTab extends PluginSettingTab {
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
              ? DEFAULT_SETTINGS.showActiveIndentationGroup
              : this.plugin.settings.showActiveIndentationGroup
          )
          .onChange(async (value) => {
            this.plugin.settings.showActiveIndentationGroup = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show list indentation guides")
      .addToggle((toggle) => {
        toggle
          .setValue(
            this.plugin.settings.lists === undefined
              ? DEFAULT_SETTINGS.lists
              : this.plugin.settings.lists
          )
          .onChange(async (value) => {
            this.plugin.settings.lists = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show list indentation guides (reading mode)")
      .setDesc("Note: this may conflict with some themes")
      .addToggle((toggle) => {
        toggle
          .setValue(
            this.plugin.settings.previewLists === undefined
              ? DEFAULT_SETTINGS.previewLists
              : this.plugin.settings.previewLists
          )
          .onChange(async (value) => {
            this.plugin.settings.previewLists = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show code indentation guides (experimental)")
      .addToggle((toggle) => {
        toggle
          .setValue(
            this.plugin.settings.code === undefined
              ? DEFAULT_SETTINGS.code
              : this.plugin.settings.code
          )
          .onChange(async (value) => {
            this.plugin.settings.code = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show plain text indentation guides")
      .setDesc(
        "Indentation guides will be show for any indented text that isn't a list or code"
      )
      .addToggle((toggle) => {
        toggle
          .setValue(
            this.plugin.settings.uncatagorizedIndents === undefined
              ? DEFAULT_SETTINGS.uncatagorizedIndents
              : this.plugin.settings.uncatagorizedIndents
          )
          .onChange(async (value) => {
            this.plugin.settings.uncatagorizedIndents = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
