import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsHandler, createSettingsHandler } from './SettingsHandler';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING, type Settings, type DomainSettings } from '@/types';
import type { IBrowserAPI } from '@/services/browser';

function createMockBrowserAPI() {
  const storage: Record<string, unknown> = {};

  return {
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[]) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          const result: Record<string, unknown> = {};
          for (const key of keyArray) {
            if (storage[key] !== undefined) {
              result[key] = storage[key];
            }
          }
          return result;
        }),
        set: vi.fn(async (data: Record<string, unknown>) => {
          Object.assign(storage, data);
        }),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    runtime: {
      sendMessage: vi.fn(),
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
    action: {
      onClicked: { addListener: vi.fn() },
    },
    _storage: storage, // For test inspection
  } as unknown as IBrowserAPI & { _storage: Record<string, unknown> };
}

describe('SettingsHandler', () => {
  let mockAPI: ReturnType<typeof createMockBrowserAPI>;
  let handler: SettingsHandler;

  beforeEach(() => {
    mockAPI = createMockBrowserAPI();
    handler = new SettingsHandler({
      browserAPI: mockAPI,
    });
  });

  describe('getSettingsForDomain', () => {
    it('returns default settings when no settings stored', async () => {
      const settings = await handler.getSettingsForDomain();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('merges saved global settings with defaults', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        maxEvents: 200,
        persistEvents: true,
      };

      const settings = await handler.getSettingsForDomain();

      expect(settings.maxEvents).toBe(200);
      expect(settings.persistEvents).toBe(true);
      expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
    });

    it('merges grouping settings with defaults', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        grouping: { enabled: true },
      };

      const settings = await handler.getSettingsForDomain();

      expect(settings.grouping.enabled).toBe(true);
      expect(settings.grouping.mode).toBe(DEFAULT_GROUPING.mode);
      expect(settings.grouping.timeWindowMs).toBe(DEFAULT_GROUPING.timeWindowMs);
    });

    it('returns global settings when no domain settings exist for the domain', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        maxEvents: 300,
      };

      const settings = await handler.getSettingsForDomain('example.com');

      expect(settings.maxEvents).toBe(300);
    });

    it('merges domain-specific settings with global', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        maxEvents: 200,
        theme: 'light',
      };
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'example.com': {
          domain: 'example.com',
          settings: { maxEvents: 500, persistEvents: true },
          createdAt: 1000,
          updatedAt: 2000,
        },
      };

      const settings = await handler.getSettingsForDomain('example.com');

      expect(settings.maxEvents).toBe(500);
      expect(settings.persistEvents).toBe(true);
      expect(settings.theme).toBe('light');
    });

    it('domain settings are independent from global', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        persistEvents: true,
      };
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'example.com': {
          domain: 'example.com',
          settings: { persistEvents: false },
          createdAt: 1000,
          updatedAt: 2000,
        },
      };

      const settings = await handler.getSettingsForDomain('example.com');

      expect(settings.persistEvents).toBe(false);
    });
  });

  describe('saveDomainSettings', () => {
    it('creates new domain settings', async () => {
      await handler.saveDomainSettings('example.com', { maxEvents: 300 });

      const stored = mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>;
      expect(stored['example.com']).toBeDefined();
      expect(stored['example.com'].settings.maxEvents).toBe(300);
      expect(stored['example.com'].domain).toBe('example.com');
    });

    it('updates existing domain settings', async () => {
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'example.com': {
          domain: 'example.com',
          settings: { maxEvents: 100 },
          createdAt: 1000,
          updatedAt: 1000,
        },
      };

      await handler.saveDomainSettings('example.com', { maxEvents: 500, persistEvents: true });

      const stored = mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>;
      expect(stored['example.com'].settings.maxEvents).toBe(500);
      expect(stored['example.com'].settings.persistEvents).toBe(true);
      expect(stored['example.com'].createdAt).toBe(1000);
    });

    it('sets createdAt for new domain', async () => {
      const before = Date.now();
      await handler.saveDomainSettings('new-domain.com', {});
      const after = Date.now();

      const stored = mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>;
      expect(stored['new-domain.com'].createdAt).toBeGreaterThanOrEqual(before);
      expect(stored['new-domain.com'].createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('deleteDomainSettings', () => {
    it('removes domain settings', async () => {
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'example.com': { domain: 'example.com', settings: {}, createdAt: 1000, updatedAt: 1000 },
        'other.com': { domain: 'other.com', settings: {}, createdAt: 1000, updatedAt: 1000 },
      };

      await handler.deleteDomainSettings('example.com');

      const stored = mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>;
      expect(stored['example.com']).toBeUndefined();
      expect(stored['other.com']).toBeDefined();
    });

    it('handles deleting non-existent domain', async () => {
      await expect(handler.deleteDomainSettings('nonexistent.com')).resolves.not.toThrow();
    });
  });

  describe('getAllDomainSettings', () => {
    it('returns empty object when no domain settings', async () => {
      const result = await handler.getAllDomainSettings();
      expect(result).toEqual({});
    });

    it('returns all domain settings', async () => {
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'a.com': { domain: 'a.com', settings: {}, createdAt: 1, updatedAt: 1 },
        'b.com': { domain: 'b.com', settings: {}, createdAt: 2, updatedAt: 2 },
      };

      const result = await handler.getAllDomainSettings();

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['a.com']).toBeDefined();
      expect(result['b.com']).toBeDefined();
    });
  });

  describe('saveGlobalSettings', () => {
    it('saves new global settings', async () => {
      await handler.saveGlobalSettings({ maxEvents: 1000 });

      const stored = mockAPI._storage['datalayer_monitor_settings'] as Settings;
      expect(stored.maxEvents).toBe(1000);
    });

    it('merges with existing global settings', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = {
        maxEvents: 200,
        theme: 'light',
      };

      await handler.saveGlobalSettings({ persistEvents: true });

      const stored = mockAPI._storage['datalayer_monitor_settings'] as Settings;
      expect(stored.maxEvents).toBe(200);
      expect(stored.theme).toBe('light');
      expect(stored.persistEvents).toBe(true);
    });
  });

  describe('exportAllSettings', () => {
    it('exports global and domain settings', async () => {
      mockAPI._storage['datalayer_monitor_settings'] = { maxEvents: 300 };
      mockAPI._storage['datalayer_monitor_domain_settings'] = {
        'test.com': { domain: 'test.com', settings: {}, createdAt: 1, updatedAt: 1 },
      };

      const exported = await handler.exportAllSettings();

      expect(exported.globalSettings.maxEvents).toBe(300);
      expect(exported.domainSettings['test.com']).toBeDefined();
      expect(exported.version).toBe('1.0');
      expect(exported.exportedAt).toBeDefined();
    });

    it('includes defaults in exported global settings', async () => {
      const exported = await handler.exportAllSettings();

      expect(exported.globalSettings).toMatchObject(DEFAULT_SETTINGS);
    });
  });

  describe('importAllSettings', () => {
    it('imports global settings', async () => {
      await handler.importAllSettings({
        globalSettings: { ...DEFAULT_SETTINGS, maxEvents: 999 },
      });

      const stored = mockAPI._storage['datalayer_monitor_settings'] as Settings;
      expect(stored.maxEvents).toBe(999);
    });

    it('imports domain settings', async () => {
      await handler.importAllSettings({
        domainSettings: {
          'imported.com': { domain: 'imported.com', settings: { maxEvents: 123 }, createdAt: 1, updatedAt: 1 },
        },
      });

      const stored = mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>;
      expect(stored['imported.com'].settings.maxEvents).toBe(123);
    });

    it('imports both global and domain settings', async () => {
      await handler.importAllSettings({
        globalSettings: { ...DEFAULT_SETTINGS, theme: 'light' },
        domainSettings: { 'test.com': { domain: 'test.com', settings: {}, createdAt: 1, updatedAt: 1 } },
      });

      expect((mockAPI._storage['datalayer_monitor_settings'] as Settings).theme).toBe('light');
      expect((mockAPI._storage['datalayer_monitor_domain_settings'] as Record<string, DomainSettings>)['test.com']).toBeDefined();
    });

    it('handles empty import', async () => {
      await expect(handler.importAllSettings({})).resolves.not.toThrow();
    });
  });

  describe('custom storage keys', () => {
    it('uses custom global settings key', async () => {
      const customHandler = new SettingsHandler({
        browserAPI: mockAPI,
        globalSettingsKey: 'custom_global',
      });

      mockAPI._storage['custom_global'] = { maxEvents: 777 };

      const settings = await customHandler.getSettingsForDomain();

      expect(settings.maxEvents).toBe(777);
    });

    it('uses custom domain settings key', async () => {
      const customHandler = new SettingsHandler({
        browserAPI: mockAPI,
        domainSettingsKey: 'custom_domain',
      });

      await customHandler.saveDomainSettings('test.com', { maxEvents: 888 });

      expect(mockAPI._storage['custom_domain']).toBeDefined();
    });
  });
});

describe('createSettingsHandler', () => {
  it('creates SettingsHandler instance', () => {
    const mockAPI = createMockBrowserAPI();
    const handler = createSettingsHandler({ browserAPI: mockAPI });

    expect(handler).toBeDefined();
    expect(typeof handler.getSettingsForDomain).toBe('function');
    expect(typeof handler.saveDomainSettings).toBe('function');
  });
});
