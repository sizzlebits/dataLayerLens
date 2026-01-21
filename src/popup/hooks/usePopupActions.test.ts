import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePopupActions } from './usePopupActions';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING } from '@/types';

// Mock browser API - must be before any imports that use it
const mockBrowserAPI = {
  runtime: {
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
  },
};

// Set up globals before tests
beforeEach(() => {
  vi.stubGlobal('chrome', mockBrowserAPI);
  vi.stubGlobal('browser', undefined);
});

function createMockProps(overrides = {}) {
  return {
    settings: DEFAULT_SETTINGS,
    updateSettings: vi.fn(),
    events: [],
    clearEvents: vi.fn(),
    newLayerName: '',
    setNewLayerName: vi.fn(),
    setIsAddingLayer: vi.fn(),
    setDomainSettings: vi.fn(),
    loadDomainSettings: vi.fn().mockResolvedValue(undefined),
    loadSettings: vi.fn(),
    setImportStatus: vi.fn(),
    fileInputRef: { current: null },
    setIsAddingFilter: vi.fn(),
    setFilterSearch: vi.fn(),
    setIsAddingTrigger: vi.fn(),
    setTriggerSearch: vi.fn(),
    ...overrides,
  };
}

describe('usePopupActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addDataLayerName', () => {
    it('adds new dataLayer name', () => {
      const updateSettings = vi.fn();
      const setNewLayerName = vi.fn();
      const setIsAddingLayer = vi.fn();
      const props = createMockProps({
        newLayerName: 'customLayer',
        settings: { ...DEFAULT_SETTINGS, dataLayerNames: ['dataLayer'] },
        updateSettings,
        setNewLayerName,
        setIsAddingLayer,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addDataLayerName();
      });

      expect(updateSettings).toHaveBeenCalledWith({
        dataLayerNames: ['dataLayer', 'customLayer'],
      });
      expect(setNewLayerName).toHaveBeenCalledWith('');
      expect(setIsAddingLayer).toHaveBeenCalledWith(false);
    });

    it('does not add duplicate dataLayer name', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        newLayerName: 'dataLayer',
        settings: { ...DEFAULT_SETTINGS, dataLayerNames: ['dataLayer'] },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addDataLayerName();
      });

      expect(updateSettings).not.toHaveBeenCalled();
    });

    it('does not add empty dataLayer name', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        newLayerName: '',
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addDataLayerName();
      });

      expect(updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('removeDataLayerName', () => {
    it('removes dataLayer name from list', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, dataLayerNames: ['dataLayer', 'customLayer'] },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.removeDataLayerName('customLayer');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        dataLayerNames: ['dataLayer'],
      });
    });
  });

  describe('addFilter', () => {
    it('adds new filter', () => {
      const updateSettings = vi.fn();
      const setFilterSearch = vi.fn();
      const setIsAddingFilter = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, eventFilters: ['existing'] },
        updateSettings,
        setFilterSearch,
        setIsAddingFilter,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addFilter('new_filter');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        eventFilters: ['existing', 'new_filter'],
      });
      expect(setFilterSearch).toHaveBeenCalledWith('');
      expect(setIsAddingFilter).toHaveBeenCalledWith(false);
    });

    it('does not add duplicate filter', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, eventFilters: ['existing'] },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addFilter('existing');
      });

      expect(updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('removeFilter', () => {
    it('removes filter from list', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, eventFilters: ['filter1', 'filter2'] },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.removeFilter('filter1');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        eventFilters: ['filter2'],
      });
    });
  });

  describe('addTriggerEvent', () => {
    it('adds new trigger event', () => {
      const updateSettings = vi.fn();
      const setTriggerSearch = vi.fn();
      const setIsAddingTrigger = vi.fn();
      const props = createMockProps({
        settings: {
          ...DEFAULT_SETTINGS,
          grouping: { ...DEFAULT_GROUPING, triggerEvents: ['page_view'] },
        },
        updateSettings,
        setTriggerSearch,
        setIsAddingTrigger,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addTriggerEvent('custom_event');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        grouping: expect.objectContaining({
          triggerEvents: ['page_view', 'custom_event'],
        }),
      });
      expect(setTriggerSearch).toHaveBeenCalledWith('');
      expect(setIsAddingTrigger).toHaveBeenCalledWith(false);
    });

    it('does not add duplicate trigger event', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: {
          ...DEFAULT_SETTINGS,
          grouping: { ...DEFAULT_GROUPING, triggerEvents: ['page_view'] },
        },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.addTriggerEvent('page_view');
      });

      expect(updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('removeTriggerEvent', () => {
    it('removes trigger event from list', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: {
          ...DEFAULT_SETTINGS,
          grouping: { ...DEFAULT_GROUPING, triggerEvents: ['page_view', 'gtm.js'] },
        },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.removeTriggerEvent('page_view');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        grouping: expect.objectContaining({
          triggerEvents: ['gtm.js'],
        }),
      });
    });
  });

  describe('handleSourceColorChange', () => {
    it('updates source color', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, sourceColors: { dataLayer: '#ff0000' } },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.handleSourceColorChange('dataLayer', '#00ff00');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        sourceColors: { dataLayer: '#00ff00' },
      });
    });

    it('adds new source color', () => {
      const updateSettings = vi.fn();
      const props = createMockProps({
        settings: { ...DEFAULT_SETTINGS, sourceColors: {} },
        updateSettings,
      });

      const { result } = renderHook(() => usePopupActions(props));

      act(() => {
        result.current.handleSourceColorChange('newSource', '#0000ff');
      });

      expect(updateSettings).toHaveBeenCalledWith({
        sourceColors: { newSource: '#0000ff' },
      });
    });
  });

  // Note: Browser API dependent tests (toggleOverlay, deleteDomain, exportEvents, etc.)
  // would require more complex mocking setup and are better suited for integration tests.
  // The pure logic functions above cover the main functionality.
});
