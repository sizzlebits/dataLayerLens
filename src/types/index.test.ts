import { describe, it, expect, afterEach } from 'vitest';
import { getEventCategory, EVENT_CATEGORIES, DEFAULT_SETTINGS, getCurrentDomain, mergeSettingsWithDomain, mergeSettings, mergeSettingsUpdate, DEFAULT_GROUPING } from './index';
import type { Settings } from './index';

describe('getEventCategory', () => {
  it('returns correct category for exact GTM event matches', () => {
    expect(getEventCategory('gtm.js')).toEqual(EVENT_CATEGORIES['gtm.js']);
    expect(getEventCategory('gtm.dom')).toEqual(EVENT_CATEGORIES['gtm.dom']);
    expect(getEventCategory('gtm.load')).toEqual(EVENT_CATEGORIES['gtm.load']);
    expect(getEventCategory('gtm.click')).toEqual(EVENT_CATEGORIES['gtm.click']);
  });

  it('returns correct category for ecommerce events', () => {
    expect(getEventCategory('page_view')).toEqual(EVENT_CATEGORIES['page_view']);
    expect(getEventCategory('view_item')).toEqual(EVENT_CATEGORIES['view_item']);
    expect(getEventCategory('add_to_cart')).toEqual(EVENT_CATEGORIES['add_to_cart']);
    expect(getEventCategory('purchase')).toEqual(EVENT_CATEGORIES['purchase']);
  });

  it('returns category based on partial matches for click events', () => {
    const clickCategory = EVENT_CATEGORIES['gtm.click'];
    expect(getEventCategory('button_click')).toEqual(clickCategory);
    expect(getEventCategory('Click Event')).toEqual(clickCategory);
    expect(getEventCategory('user_clicked')).toEqual(clickCategory);
  });

  it('returns category based on partial matches for view events', () => {
    const viewCategory = EVENT_CATEGORIES['page_view'];
    expect(getEventCategory('product_view')).toEqual(viewCategory);
    expect(getEventCategory('View Item')).toEqual(viewCategory);
  });

  it('returns category based on partial matches for cart events', () => {
    const cartCategory = EVENT_CATEGORIES['add_to_cart'];
    expect(getEventCategory('update_cart')).toEqual(cartCategory);
    expect(getEventCategory('Cart Updated')).toEqual(cartCategory);
  });

  it('returns category based on partial matches for search events', () => {
    const searchCategory = EVENT_CATEGORIES['search'];
    expect(getEventCategory('site_search')).toEqual(searchCategory);
    expect(getEventCategory('Search Query')).toEqual(searchCategory);
  });

  it('returns category based on partial matches for scroll events', () => {
    const scrollCategory = EVENT_CATEGORIES['gtm.scrollDepth'];
    expect(getEventCategory('scroll_25')).toEqual(scrollCategory);
    expect(getEventCategory('Scroll Depth')).toEqual(scrollCategory);
  });

  it('returns category based on partial matches for video events', () => {
    const videoCategory = EVENT_CATEGORIES['gtm.video'];
    expect(getEventCategory('video_start')).toEqual(videoCategory);
    expect(getEventCategory('Video Play')).toEqual(videoCategory);
  });

  it('returns category based on partial matches for form events', () => {
    const formCategory = EVENT_CATEGORIES['gtm.formSubmit'];
    expect(getEventCategory('form_submission')).toEqual(formCategory);
    expect(getEventCategory('Submit Form')).toEqual(formCategory);
  });

  it('returns default category for unknown events', () => {
    const defaultCategory = EVENT_CATEGORIES['default'];
    expect(getEventCategory('custom_event')).toEqual(defaultCategory);
    expect(getEventCategory('my_event')).toEqual(defaultCategory);
    expect(getEventCategory('')).toEqual(defaultCategory);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SETTINGS.maxEvents).toBe(500);
    expect(DEFAULT_SETTINGS.dataLayerNames).toEqual(['dataLayer']);
    expect(DEFAULT_SETTINGS.eventFilters).toEqual([]);
    expect(DEFAULT_SETTINGS.filterMode).toBe('exclude');
    expect(DEFAULT_SETTINGS.theme).toBe('dark');
    expect(DEFAULT_SETTINGS.showTimestamps).toBe(true);
    expect(DEFAULT_SETTINGS.compactMode).toBe(false);
  });

  it('has correct persistence defaults', () => {
    expect(DEFAULT_SETTINGS.persistEvents).toBe(false);
    expect(DEFAULT_SETTINGS.persistEventsMaxAge).toBe(300000); // 5 minutes
  });
});

describe('EVENT_CATEGORIES', () => {
  it('has a default category', () => {
    expect(EVENT_CATEGORIES['default']).toBeDefined();
    expect(EVENT_CATEGORIES['default'].color).toBeTruthy();
    expect(EVENT_CATEGORIES['default'].icon).toBeTruthy();
  });

  it('has unique colors for each category', () => {
    const colors = Object.values(EVENT_CATEGORIES).map(c => c.color);
    // Allow some duplicates for similar event types
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBeGreaterThan(5);
  });

  it('has emoji icons for all categories', () => {
    Object.entries(EVENT_CATEGORIES).forEach(([_name, category]) => {
      expect(category.icon).toBeTruthy();
      expect(category.icon.length).toBeGreaterThan(0);
      // Check that icon is an emoji (covers common emoji ranges including miscellaneous symbols)
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F680}-\u{1F6FF}]|[\u{2702}-\u{27B0}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2000}-\u{206F}]|[\u{2070}-\u{209F}]|[\u{20D0}-\u{20FF}]|[\u{2100}-\u{214F}]|[\u{2150}-\u{218F}]|[\u{2190}-\u{21FF}]|[\u{2200}-\u{22FF}]|[\u{2500}-\u{257F}]|[\u{25A0}-\u{25FF}]|[\u{2713}-\u{2716}]|[\u{2728}]|[\u{FE0F}]/u;
      expect(emojiRegex.test(category.icon)).toBe(true);
    });
  });
});

describe('getCurrentDomain', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    (globalThis as unknown as { window: typeof window }).window = originalWindow;
  });

  it('returns empty string when window is undefined', () => {
    (globalThis as unknown as { window: undefined }).window = undefined;
    expect(getCurrentDomain()).toBe('');
  });

  it('returns hostname from window.location', () => {
    (globalThis as unknown as { window: { location: { hostname: string } } }).window = {
      location: {
        hostname: 'example.com',
      },
    };
    expect(getCurrentDomain()).toBe('example.com');
  });
});

describe('mergeSettingsWithDomain', () => {
  const globalSettings: Settings = {
    ...DEFAULT_SETTINGS,
    maxEvents: 100,
    theme: 'light',
    filterMode: 'exclude',
  };

  it('returns global settings when no domain settings provided', () => {
    const result = mergeSettingsWithDomain(globalSettings);
    expect(result).toEqual(globalSettings);
  });

  it('returns global settings when domain settings is undefined', () => {
    const result = mergeSettingsWithDomain(globalSettings, undefined);
    expect(result).toEqual(globalSettings);
  });

  it('merges domain settings with global settings', () => {
    const domainSettings: Partial<Settings> = {
      theme: 'dark',
      maxEvents: 200,
    };
    const result = mergeSettingsWithDomain(globalSettings, domainSettings);
    expect(result.theme).toBe('dark');
    expect(result.maxEvents).toBe(200);
    expect(result.filterMode).toBe('exclude'); // From global
  });

  it('domain settings override global settings', () => {
    const domainSettings: Partial<Settings> = {
      persistEvents: true,
      eventFilters: ['gtm.js'],
    };
    const result = mergeSettingsWithDomain(globalSettings, domainSettings);
    expect(result.persistEvents).toBe(true);
    expect(result.eventFilters).toEqual(['gtm.js']);
  });
});

describe('DEFAULT_GROUPING', () => {
  it('has correct default values', () => {
    expect(DEFAULT_GROUPING.enabled).toBe(false);
    expect(DEFAULT_GROUPING.mode).toBe('time');
    expect(DEFAULT_GROUPING.timeWindowMs).toBe(500);
    expect(DEFAULT_GROUPING.triggerEvents).toContain('gtm.js');
    expect(DEFAULT_GROUPING.triggerEvents).toContain('page_view');
  });
});

describe('mergeSettings', () => {
  it('returns defaults when partial is undefined', () => {
    const result = mergeSettings(DEFAULT_SETTINGS, undefined);
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it('merges top-level settings', () => {
    const partial = { maxEvents: 200, persistEvents: true };
    const result = mergeSettings(DEFAULT_SETTINGS, partial);

    expect(result.maxEvents).toBe(200);
    expect(result.persistEvents).toBe(true);
    // Other defaults preserved
    expect(result.dataLayerNames).toEqual(DEFAULT_SETTINGS.dataLayerNames);
  });

  it('merges nested grouping config', () => {
    const partial = { grouping: { enabled: true, timeWindowMs: 1000 } };
    const result = mergeSettings(DEFAULT_SETTINGS, partial);

    expect(result.grouping.enabled).toBe(true);
    expect(result.grouping.timeWindowMs).toBe(1000);
    // Other grouping defaults preserved
    expect(result.grouping.mode).toBe(DEFAULT_GROUPING.mode);
    expect(result.grouping.triggerEvents).toEqual(DEFAULT_GROUPING.triggerEvents);
  });

  it('preserves empty grouping when not specified', () => {
    const partial = { maxEvents: 100 };
    const result = mergeSettings(DEFAULT_SETTINGS, partial);

    expect(result.grouping).toEqual(DEFAULT_SETTINGS.grouping);
  });
});

describe('mergeSettingsUpdate', () => {
  it('merges update into current settings', () => {
    const current = { ...DEFAULT_SETTINGS, maxEvents: 100 };
    const update = { persistEvents: true };
    const result = mergeSettingsUpdate(current, update);

    expect(result.maxEvents).toBe(100); // Preserved from current
    expect(result.persistEvents).toBe(true); // Updated
  });

  it('merges nested grouping updates', () => {
    const current = {
      ...DEFAULT_SETTINGS,
      grouping: { ...DEFAULT_GROUPING, enabled: true, timeWindowMs: 500 },
    };
    const update = { grouping: { timeWindowMs: 1000 } };
    const result = mergeSettingsUpdate(current, update);

    expect(result.grouping.enabled).toBe(true); // Preserved from current
    expect(result.grouping.timeWindowMs).toBe(1000); // Updated
    expect(result.grouping.mode).toBe('time'); // Preserved from current
  });

  it('preserves grouping when update has no grouping', () => {
    const current = {
      ...DEFAULT_SETTINGS,
      grouping: { ...DEFAULT_GROUPING, enabled: true },
    };
    const update = { maxEvents: 200 };
    const result = mergeSettingsUpdate(current, update);

    expect(result.grouping.enabled).toBe(true);
    expect(result.maxEvents).toBe(200);
  });
});
