/**
 * Hook for managing Popup component actions.
 */

import { Settings, DomainSettings, DEFAULT_GROUPING } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface UsePopupActionsProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  events: unknown[];
  clearEvents: () => void;
  newLayerName: string;
  setNewLayerName: (name: string) => void;
  setIsAddingLayer: (adding: boolean) => void;
  setDomainSettings: (fn: (prev: Record<string, DomainSettings>) => Record<string, DomainSettings>) => void;
  loadDomainSettings: () => Promise<void>;
  loadSettings: () => void;
  setImportStatus: (status: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setIsAddingFilter: (adding: boolean) => void;
  setFilterSearch: (search: string) => void;
  setIsAddingTrigger: (adding: boolean) => void;
  setTriggerSearch: (search: string) => void;
}

export function usePopupActions({
  settings,
  updateSettings,
  events,
  newLayerName,
  setNewLayerName,
  setIsAddingLayer,
  setDomainSettings,
  loadDomainSettings,
  loadSettings,
  setImportStatus,
  fileInputRef,
  setIsAddingFilter,
  setFilterSearch,
  setIsAddingTrigger,
  setTriggerSearch,
}: UsePopupActionsProps) {
  // DataLayer actions
  const addDataLayerName = () => {
    if (newLayerName && !settings.dataLayerNames.includes(newLayerName)) {
      updateSettings({
        dataLayerNames: [...settings.dataLayerNames, newLayerName],
      });
      setNewLayerName('');
      setIsAddingLayer(false);
    }
  };

  const removeDataLayerName = (name: string) => {
    updateSettings({
      dataLayerNames: settings.dataLayerNames.filter((n) => n !== name),
    });
  };

  // Domain actions
  const deleteDomain = async (domain: string) => {
    try {
      await browserAPI.runtime.sendMessage({ type: 'DELETE_DOMAIN_SETTINGS', domain });
      setDomainSettings((prev) => {
        const next = { ...prev };
        delete next[domain];
        return next;
      });
    } catch (error) {
      console.error('Failed to delete domain settings:', error);
    }
  };

  const saveCurrentDomainSettings = async (domain: string) => {
    try {
      await browserAPI.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        domain,
        saveGlobal: false,
        payload: {
          eventFilters: settings.eventFilters,
          filterMode: settings.filterMode,
          dataLayerNames: settings.dataLayerNames,
          grouping: settings.grouping,
          persistEvents: settings.persistEvents,
        },
      });
      loadDomainSettings();
    } catch (error) {
      console.error('Failed to save domain settings:', error);
    }
  };

  // Export/Import actions
  const exportSettings = async () => {
    try {
      const response = await browserAPI.runtime.sendMessage({ type: 'EXPORT_ALL_SETTINGS' });
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datalayer-monitor-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const exportEvents = async () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datalayer-events-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.globalSettings && !data.domainSettings) {
        setImportStatus('Invalid settings file');
        return;
      }

      const response = await browserAPI.runtime.sendMessage({
        type: 'IMPORT_ALL_SETTINGS',
        payload: data,
      });

      if (response?.success) {
        setImportStatus('Settings imported successfully!');
        loadSettings();
        loadDomainSettings();
      } else {
        setImportStatus(response?.error || 'Import failed');
      }
    } catch (error) {
      setImportStatus('Failed to parse settings file');
      console.error('Failed to import settings:', error);
    }

    setTimeout(() => setImportStatus(null), 3000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Overlay actions
  const toggleOverlay = async () => {
    const newState = !settings.overlayEnabled;
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await browserAPI.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_OVERLAY',
          payload: { enabled: newState },
        });
        if (response?.enabled !== undefined) {
          updateSettings({ overlayEnabled: response.enabled });
        }
      }
    } catch (error) {
      console.error('Failed to toggle overlay:', error);
    }
  };

  const openSidePanel = async () => {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab?.windowId && browserAPI.sidePanel?.open) {
        await browserAPI.sidePanel.open({ tabId: tab.id });
        window.close();
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  };

  const handleViewModeChange = async (mode: 'overlay' | 'sidepanel' | 'devtools') => {
    // Update the setting
    updateSettings({ viewMode: mode });

    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      if (mode === 'overlay') {
        // Turn on overlay mode
        const response = await browserAPI.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_OVERLAY',
          payload: { enabled: true },
        });
        if (response?.enabled !== undefined) {
          updateSettings({ overlayEnabled: response.enabled });
        }
      } else {
        // Turn off overlay when switching to sidepanel or devtools
        if (settings.overlayEnabled) {
          await browserAPI.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_OVERLAY',
            payload: { enabled: false },
          });
          updateSettings({ overlayEnabled: false });
        }

        if (mode === 'sidepanel') {
          // Open the side panel
          if (tab.windowId && browserAPI.sidePanel?.open) {
            await browserAPI.sidePanel.open({ tabId: tab.id });
            window.close();
          }
        }
        // For devtools, we can't open it programmatically - the UI shows instructions
      }
    } catch (error) {
      console.error('Failed to change view mode:', error);
    }
  };

  // Filter actions
  const addFilter = (filter: string) => {
    if (!settings.eventFilters.includes(filter)) {
      updateSettings({
        eventFilters: [...settings.eventFilters, filter],
      });
    }
    setFilterSearch('');
    setIsAddingFilter(false);
  };

  const removeFilter = (filter: string) => {
    updateSettings({
      eventFilters: settings.eventFilters.filter((f) => f !== filter),
    });
  };

  const clearFilters = () => {
    updateSettings({ eventFilters: [] });
  };

  const setFilterMode = (mode: 'include' | 'exclude') => {
    updateSettings({ filterMode: mode });
  };

  // Trigger event actions
  const addTriggerEvent = (event: string) => {
    const currentTriggers = settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents;
    if (!currentTriggers.includes(event)) {
      updateSettings({
        grouping: {
          ...(settings.grouping || DEFAULT_GROUPING),
          triggerEvents: [...currentTriggers, event],
        },
      });
    }
    setTriggerSearch('');
    setIsAddingTrigger(false);
  };

  const removeTriggerEvent = (event: string) => {
    const currentTriggers = settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents;
    updateSettings({
      grouping: {
        ...(settings.grouping || DEFAULT_GROUPING),
        triggerEvents: currentTriggers.filter((t) => t !== event),
      },
    });
  };

  // Source color actions
  const handleSourceColorChange = (source: string, color: string) => {
    updateSettings({
      sourceColors: {
        ...settings.sourceColors,
        [source]: color,
      },
    });
  };

  return {
    // DataLayer actions
    addDataLayerName,
    removeDataLayerName,

    // Domain actions
    deleteDomain,
    saveCurrentDomainSettings,

    // Export/Import actions
    exportSettings,
    exportEvents,
    importSettings,

    // Overlay actions
    toggleOverlay,
    openSidePanel,
    handleViewModeChange,

    // Filter actions
    addFilter,
    removeFilter,
    clearFilters,
    setFilterMode,

    // Trigger actions
    addTriggerEvent,
    removeTriggerEvent,

    // Color actions
    handleSourceColorChange,
  };
}
