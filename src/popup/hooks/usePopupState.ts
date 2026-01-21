/**
 * Hook for managing Popup component state.
 */

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { DomainSettings } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export type Tab = 'main' | 'settings' | 'domains';

export function usePopupState() {
  // Store state
  const { settings, loadSettings, updateSettings, events, loadEvents, clearEvents, isLoading } = useStore();

  // Local state
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [newLayerName, setNewLayerName] = useState('');
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [domainSettings, setDomainSettings] = useState<Record<string, DomainSettings>>({});
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter management state
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Trigger events state
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState('');

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadEvents();
    loadCurrentDomain();
    loadDomainSettings();
  }, [loadSettings, loadEvents]);

  const loadCurrentDomain = async () => {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        setCurrentDomain(url.hostname);
      }
    } catch {
      // Ignore errors
    }
  };

  const loadDomainSettings = async () => {
    try {
      const response = await browserAPI.runtime.sendMessage({ type: 'GET_DOMAIN_SETTINGS' });
      if (response?.domainSettings) {
        setDomainSettings(response.domainSettings);
      }
    } catch {
      // Ignore errors
    }
  };

  return {
    // Store state
    settings,
    loadSettings,
    updateSettings,
    events,
    clearEvents,
    isLoading,

    // Tab state
    activeTab,
    setActiveTab,

    // DataLayer state
    newLayerName,
    setNewLayerName,
    isAddingLayer,
    setIsAddingLayer,

    // Domain state
    currentDomain,
    setCurrentDomain,
    domainSettings,
    setDomainSettings,
    loadDomainSettings,

    // Import/Export state
    importStatus,
    setImportStatus,
    fileInputRef,

    // Filter state
    isAddingFilter,
    setIsAddingFilter,
    filterSearch,
    setFilterSearch,

    // Trigger state
    isAddingTrigger,
    setIsAddingTrigger,
    triggerSearch,
    setTriggerSearch,
  };
}
