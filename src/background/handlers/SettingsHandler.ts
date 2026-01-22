/**
 * SettingsHandler - Handles settings-related messages in the background script.
 */

import type { IBrowserAPI } from '@/services/browser';
import type { Settings, DomainSettings } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING } from '@/types';

export interface SettingsHandlerOptions {
  browserAPI: IBrowserAPI;
  globalSettingsKey?: string;
  domainSettingsKey?: string;
}

export interface ISettingsHandler {
  /** Get settings for a specific domain (merges global with domain-specific) */
  getSettingsForDomain(domain?: string): Promise<Settings>;
  /** Save domain-specific settings */
  saveDomainSettings(domain: string, settings: Partial<Settings>): Promise<void>;
  /** Delete domain-specific settings */
  deleteDomainSettings(domain: string): Promise<void>;
  /** Get all domain settings */
  getAllDomainSettings(): Promise<Record<string, DomainSettings>>;
  /** Save global settings */
  saveGlobalSettings(settings: Partial<Settings>): Promise<void>;
  /** Export all settings (global and domain-specific) */
  exportAllSettings(): Promise<{
    globalSettings: Settings;
    domainSettings: Record<string, DomainSettings>;
    exportedAt: number;
    version: string;
  }>;
  /** Import all settings */
  importAllSettings(data: {
    globalSettings?: Settings;
    domainSettings?: Record<string, DomainSettings>;
  }): Promise<void>;
}

const DEFAULT_GLOBAL_KEY = 'datalayer_monitor_settings';
const DEFAULT_DOMAIN_KEY = 'datalayer_monitor_domain_settings';

/**
 * Handles settings storage and retrieval for the background script.
 */
export class SettingsHandler implements ISettingsHandler {
  private browserAPI: IBrowserAPI;
  private globalSettingsKey: string;
  private domainSettingsKey: string;

  constructor(options: SettingsHandlerOptions) {
    this.browserAPI = options.browserAPI;
    this.globalSettingsKey = options.globalSettingsKey ?? DEFAULT_GLOBAL_KEY;
    this.domainSettingsKey = options.domainSettingsKey ?? DEFAULT_DOMAIN_KEY;
  }

  async getSettingsForDomain(domain?: string): Promise<Settings> {
    const result = await this.browserAPI.storage.local.get([
      this.globalSettingsKey,
      this.domainSettingsKey,
    ]);

    const savedGlobal = (result[this.globalSettingsKey] || {}) as Partial<Settings>;
    const globalSettings: Settings = {
      ...DEFAULT_SETTINGS,
      ...savedGlobal,
      grouping: { ...DEFAULT_GROUPING, ...(savedGlobal.grouping || {}) },
    };

    if (!domain) return globalSettings;

    const domainSettingsMap = (result[this.domainSettingsKey] || {}) as Record<string, DomainSettings>;
    const domainOverride = domainSettingsMap[domain];

    if (!domainOverride) {
      return globalSettings;
    }

    // Merge domain-specific settings with global
    // Filter out undefined values from domain settings to avoid overriding global settings
    const domainSettings = domainOverride.settings || {};
    const filteredDomainSettings: Partial<Settings> = {};
    for (const [key, value] of Object.entries(domainSettings)) {
      if (value !== undefined) {
        (filteredDomainSettings as Record<string, unknown>)[key] = value;
      }
    }

    return {
      ...globalSettings,
      ...filteredDomainSettings,
      grouping: { ...globalSettings.grouping, ...(filteredDomainSettings.grouping || {}) },
    };
  }

  async saveDomainSettings(domain: string, settings: Partial<Settings>): Promise<void> {
    const result = await this.browserAPI.storage.local.get(this.domainSettingsKey);
    const allDomainSettings = (result[this.domainSettingsKey] || {}) as Record<string, DomainSettings>;

    const existing = allDomainSettings[domain];
    allDomainSettings[domain] = {
      domain,
      settings: { ...existing?.settings, ...settings },
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await this.browserAPI.storage.local.set({
      [this.domainSettingsKey]: allDomainSettings,
    });
  }

  async deleteDomainSettings(domain: string): Promise<void> {
    const result = await this.browserAPI.storage.local.get(this.domainSettingsKey);
    const allDomainSettings = (result[this.domainSettingsKey] || {}) as Record<string, DomainSettings>;

    delete allDomainSettings[domain];

    await this.browserAPI.storage.local.set({
      [this.domainSettingsKey]: allDomainSettings,
    });
  }

  async getAllDomainSettings(): Promise<Record<string, DomainSettings>> {
    const result = await this.browserAPI.storage.local.get(this.domainSettingsKey);
    return (result[this.domainSettingsKey] || {}) as Record<string, DomainSettings>;
  }

  async saveGlobalSettings(settings: Partial<Settings>): Promise<void> {
    const result = await this.browserAPI.storage.local.get(this.globalSettingsKey);
    const savedGlobal = (result[this.globalSettingsKey] || {}) as Partial<Settings>;
    const current: Settings = { ...DEFAULT_SETTINGS, ...savedGlobal };
    const updated = { ...current, ...settings };

    await this.browserAPI.storage.local.set({
      [this.globalSettingsKey]: updated,
    });
  }

  async exportAllSettings(): Promise<{
    globalSettings: Settings;
    domainSettings: Record<string, DomainSettings>;
    exportedAt: number;
    version: string;
  }> {
    const [globalResult, domainSettings] = await Promise.all([
      this.browserAPI.storage.local.get(this.globalSettingsKey),
      this.getAllDomainSettings(),
    ]);

    const savedGlobal = (globalResult[this.globalSettingsKey] || {}) as Partial<Settings>;
    return {
      globalSettings: { ...DEFAULT_SETTINGS, ...savedGlobal },
      domainSettings,
      exportedAt: Date.now(),
      version: '1.0',
    };
  }

  async importAllSettings(data: {
    globalSettings?: Settings;
    domainSettings?: Record<string, DomainSettings>;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (data.globalSettings) {
      promises.push(
        this.browserAPI.storage.local.set({
          [this.globalSettingsKey]: data.globalSettings,
        })
      );
    }

    if (data.domainSettings) {
      promises.push(
        this.browserAPI.storage.local.set({
          [this.domainSettingsKey]: data.domainSettings,
        })
      );
    }

    await Promise.all(promises);
  }
}

/**
 * Factory function to create a SettingsHandler instance.
 */
export function createSettingsHandler(options: SettingsHandlerOptions): ISettingsHandler {
  return new SettingsHandler(options);
}
