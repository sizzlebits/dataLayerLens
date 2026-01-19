import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Download,
  Upload,
  Globe,
  Clock,
  History,
  Search,
  PanelRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DomainSettings, DEFAULT_GROUPING, EVENT_CATEGORIES } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

type Tab = 'main' | 'settings' | 'domains';

// Common event names for suggestions
const COMMON_EVENTS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'gtm.linkClick', 'gtm.formSubmit',
  'gtm.historyChange', 'gtm.scrollDepth', 'gtm.timer', 'gtm.video',
  'page_view', 'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info',
  'purchase', 'refund', 'sign_up', 'login', 'search', 'view_promotion',
  'select_promotion', 'virtualPageView', 'custom_event',
];

export function Popup() {
  const { settings, loadSettings, updateSettings, events, loadEvents, clearEvents, isLoading } = useStore();
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

    // Clear status after 3 seconds
    setTimeout(() => setImportStatus(null), 3000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleOverlay = async () => {
    const newState = !settings.overlayEnabled;
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await browserAPI.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_OVERLAY',
          payload: { enabled: newState },
        });
        // Only update settings if content script confirmed the change
        if (response?.enabled !== undefined) {
          updateSettings({ overlayEnabled: response.enabled });
        }
      }
    } catch (error) {
      console.error('Failed to toggle overlay:', error);
      // If content script isn't loaded, try to inject it
      try {
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab?.id && tab?.url) {
          // Check if this is a restricted URL where we can't inject scripts
          const isRestrictedUrl = tab.url.startsWith('chrome://') ||
                                   tab.url.startsWith('chrome-extension://') ||
                                   tab.url.startsWith('moz-extension://') ||
                                   tab.url.startsWith('edge://') ||
                                   tab.url.startsWith('about:') ||
                                   tab.url.startsWith('https://chrome.google.com/webstore');

          if (isRestrictedUrl) {
            console.warn('Cannot inject content script on restricted URL:', tab.url);
            return;
          }

          if (browserAPI.scripting?.executeScript) {
            await browserAPI.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js'],
            });
            // Wait a moment for content script to initialize
            setTimeout(async () => {
              try {
                const response = await browserAPI.tabs.sendMessage(tab.id!, {
                  type: 'TOGGLE_OVERLAY',
                  payload: { enabled: newState },
                });
                if (response?.enabled !== undefined) {
                  updateSettings({ overlayEnabled: response.enabled });
                }
              } catch {
                // Still failed
                console.error('Content script injection failed - try refreshing the page');
              }
            }, 100);
          } else {
            console.warn('Scripting API not available');
          }
        }
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
      }
    }
  };

  const openSidePanel = async () => {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab?.windowId && browserAPI.sidePanel?.open) {
        await browserAPI.sidePanel.open({ tabId: tab.id });
        // Close the popup after opening sidepanel
        window.close();
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  };

  const addDataLayerName = () => {
    if (newLayerName.trim() && !settings.dataLayerNames.includes(newLayerName.trim())) {
      updateSettings({
        dataLayerNames: [...settings.dataLayerNames, newLayerName.trim()],
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

  if (isLoading) {
    return (
      <div className="w-80 min-h-96 flex items-center justify-center bg-dl-dark">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-dl-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-80 min-h-96 bg-gradient-to-br from-dl-dark to-dl-darker overflow-hidden pb-10">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-dl-primary/20 to-dl-secondary/20 px-4 py-3 border-b border-dl-border"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 bg-gradient-to-br from-dl-primary to-dl-secondary rounded-xl flex items-center justify-center shadow-lg"
          >
            <Layers className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">DataLayer Lens</h1>
            <p className="text-xs text-slate-400">Track your GTM events with clarity</p>
          </div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <div className="flex border-b border-dl-border">
        {[
          { id: 'main' as const, label: 'Monitor', icon: Zap },
          { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
          { id: 'domains' as const, label: 'Domains', icon: Globe },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-dl-accent'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dl-primary to-dl-accent"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-4"
          >
            {/* Active Filters Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-3 border ${
                settings.eventFilters.length > 0
                  ? settings.filterMode === 'exclude'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                  : 'bg-dl-card border-dl-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      settings.eventFilters.length === 0
                        ? 'text-slate-400'
                        : settings.filterMode === 'exclude'
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {settings.eventFilters.length === 0
                      ? 'No filters active'
                      : `${settings.filterMode === 'exclude' ? 'EXCLUDING' : 'INCLUDING'} ${
                          settings.eventFilters.length
                        } filter${settings.eventFilters.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    onClick={() => setIsAddingFilter(!isAddingFilter)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isAddingFilter
                        ? 'bg-dl-primary/20 text-dl-primary'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                  {settings.eventFilters.length > 0 && (
                    <motion.button
                      onClick={() => updateSettings({ eventFilters: [] })}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/10"
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear all
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filter tags */}
              {settings.eventFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {settings.eventFilters.map((filter) => (
                    <span
                      key={filter}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        settings.filterMode === 'exclude'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {filter}
                      <button
                        onClick={() =>
                          updateSettings({
                            eventFilters: settings.eventFilters.filter((f) => f !== filter),
                          })
                        }
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add filter UI */}
              <AnimatePresence>
                {isAddingFilter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {/* Mode toggle */}
                    <div className="flex gap-1 mb-2">
                      <button
                        onClick={() => updateSettings({ filterMode: 'include' })}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                          settings.filterMode === 'include'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-dl-card text-slate-400 border border-dl-border hover:text-white'
                        }`}
                      >
                        Include Only
                      </button>
                      <button
                        onClick={() => updateSettings({ filterMode: 'exclude' })}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                          settings.filterMode === 'exclude'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-dl-card text-slate-400 border border-dl-border hover:text-white'
                        }`}
                      >
                        Exclude
                      </button>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Search or type custom event..."
                        className="w-full bg-dl-card border border-dl-border rounded px-3 py-1.5 pl-7 text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {/* Suggestions */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {/* Custom event option */}
                      {filterSearch && !COMMON_EVENTS.includes(filterSearch) && !settings.eventFilters.includes(filterSearch) && (
                        <button
                          onClick={() => {
                            updateSettings({
                              eventFilters: [...settings.eventFilters, filterSearch],
                            });
                            setFilterSearch('');
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs rounded bg-dl-primary/10 text-dl-primary hover:bg-dl-primary/20 transition-colors"
                        >
                          Add custom: "{filterSearch}"
                        </button>
                      )}

                      {/* Filtered suggestions */}
                      {COMMON_EVENTS.filter(
                        (e) =>
                          e.toLowerCase().includes(filterSearch.toLowerCase()) &&
                          !settings.eventFilters.includes(e)
                      )
                        .slice(0, 8)
                        .map((eventName) => (
                          <button
                            key={eventName}
                            onClick={() => {
                              updateSettings({
                                eventFilters: [...settings.eventFilters, eventName],
                              });
                              setFilterSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <span className="text-sm">{EVENT_CATEGORIES[eventName]?.icon || '📌'}</span>
                            <span className="text-slate-300">{eventName}</span>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Overlay Toggle */}
            <motion.div
              className="bg-dl-card rounded-xl p-4 border border-dl-border"
              whileHover={{ borderColor: 'rgba(99, 102, 241, 0.5)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.overlayEnabled ? (
                    <Eye className="w-5 h-5 text-dl-success" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-500" />
                  )}
                  <div>
                    <p className="font-medium text-white">Page Overlay</p>
                    <p className="text-xs text-slate-400">
                      {settings.overlayEnabled ? 'Visible on page' : 'Hidden'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={toggleOverlay}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.overlayEnabled
                      ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                      : 'bg-dl-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ left: settings.overlayEnabled ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
            </motion.div>

            {/* Side Panel Button */}
            <motion.button
              onClick={openSidePanel}
              className="w-full bg-dl-card rounded-xl p-4 border border-dl-border hover:border-dl-primary/50 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PanelRight className="w-5 h-5 text-dl-primary" />
                  <div className="text-left">
                    <p className="font-medium text-white">Side Panel</p>
                    <p className="text-xs text-slate-400">Open in browser sidebar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </motion.button>

            {/* Event Stats */}
            <motion.div
              className="bg-dl-card rounded-xl p-4 border border-dl-border"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Events Captured</h3>
                <motion.span
                  key={events.length}
                  initial={{ scale: 1.5, color: '#22d3ee' }}
                  animate={{ scale: 1, color: '#e2e8f0' }}
                  className="text-2xl font-bold"
                >
                  {events.length}
                </motion.span>
              </div>

              <motion.button
                onClick={clearEvents}
                disabled={events.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium border border-red-500/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: events.length > 0 ? 1.02 : 1 }}
                whileTap={{ scale: events.length > 0 ? 0.98 : 1 }}
              >
                <Trash2 className="w-4 h-4" />
                Clear All Events
              </motion.button>
            </motion.div>

            {/* Quick Info */}
            <div className="text-center text-xs text-slate-500 py-2">
              <p>
                {currentDomain && (
                  <span className="block mb-1 text-dl-accent">{currentDomain}</span>
                )}
                Monitoring:{' '}
                {settings.dataLayerNames.map((name, i) => (
                  <span key={name}>
                    <code className="text-dl-accent">{name}</code>
                    {i < settings.dataLayerNames.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>
          </motion.div>
        ) : activeTab === 'settings' ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4 max-h-80 overflow-y-auto"
          >
            {/* DataLayer Names */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-dl-primary" />
                DataLayer Arrays
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {settings.dataLayerNames.map((name) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between bg-dl-card rounded-lg px-3 py-2 border border-dl-border group"
                    >
                      <code className="text-sm text-dl-accent">{name}</code>
                      <motion.button
                        onClick={() => removeDataLayerName(name)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dl-error/20 rounded transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={settings.dataLayerNames.length <= 1}
                      >
                        <X className="w-3.5 h-3.5 text-dl-error" />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add new layer */}
                <AnimatePresence>
                  {isAddingLayer ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newLayerName}
                        onChange={(e) => setNewLayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addDataLayerName()}
                        placeholder="e.g., dataLayer_v2"
                        className="flex-1 bg-dl-card border border-dl-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                        autoFocus
                      />
                      <motion.button
                        onClick={addDataLayerName}
                        className="p-2 bg-dl-success/20 hover:bg-dl-success/30 text-dl-success rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsAddingLayer(false);
                          setNewLayerName('');
                        }}
                        className="p-2 bg-dl-error/20 hover:bg-dl-error/30 text-dl-error rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => setIsAddingLayer(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-dl-border hover:border-dl-primary text-slate-400 hover:text-dl-primary rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add DataLayer
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Max Events */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Max Events</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={settings.maxEvents}
                  onChange={(e) => updateSettings({ maxEvents: Number(e.target.value) })}
                  className="flex-1 accent-dl-primary"
                />
                <span className="text-sm text-dl-accent font-mono w-12 text-right">
                  {settings.maxEvents}
                </span>
              </div>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-dl-warning" />
                <span className="text-sm text-white">Animations</span>
              </div>
              <motion.button
                onClick={() => updateSettings({ animationsEnabled: !settings.animationsEnabled })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.animationsEnabled
                    ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                    : 'bg-dl-border'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: settings.animationsEnabled ? 20 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Timestamps Toggle */}
            <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-dl-accent" />
                <span className="text-sm text-white">Show Timestamps</span>
              </div>
              <motion.button
                onClick={() => updateSettings({ showTimestamps: !settings.showTimestamps })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.showTimestamps
                    ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                    : 'bg-dl-border'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: settings.showTimestamps ? 20 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Persist Events Toggle */}
            <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-yellow-400" />
                <div>
                  <span className="text-sm text-white block">Persist Events</span>
                  <span className="text-xs text-slate-500">Keep events across page refreshes</span>
                </div>
              </div>
              <motion.button
                onClick={() => updateSettings({ persistEvents: !settings.persistEvents })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.persistEvents
                    ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                    : 'bg-dl-border'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: settings.persistEvents ? 20 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Overlay Position Anchor */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-dl-primary" />
                Overlay Position
              </h3>
              <div className="bg-dl-card rounded-lg p-3 border border-dl-border">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => updateSettings({
                      overlayAnchor: {
                        ...(settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' }),
                        vertical: 'top'
                      }
                    })}
                    className={`py-1.5 text-xs rounded border transition-colors ${
                      settings.overlayAnchor?.vertical === 'top'
                        ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                        : 'border-dl-border text-slate-400 hover:text-white'
                    }`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => updateSettings({
                      overlayAnchor: {
                        ...(settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' }),
                        vertical: 'bottom'
                      }
                    })}
                    className={`py-1.5 text-xs rounded border transition-colors ${
                      (settings.overlayAnchor?.vertical ?? 'bottom') === 'bottom'
                        ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                        : 'border-dl-border text-slate-400 hover:text-white'
                    }`}
                  >
                    Bottom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({
                      overlayAnchor: {
                        ...(settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' }),
                        horizontal: 'left'
                      }
                    })}
                    className={`py-1.5 text-xs rounded border transition-colors ${
                      settings.overlayAnchor?.horizontal === 'left'
                        ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                        : 'border-dl-border text-slate-400 hover:text-white'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => updateSettings({
                      overlayAnchor: {
                        ...(settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' }),
                        horizontal: 'right'
                      }
                    })}
                    className={`py-1.5 text-xs rounded border transition-colors ${
                      (settings.overlayAnchor?.horizontal ?? 'right') === 'right'
                        ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                        : 'border-dl-border text-slate-400 hover:text-white'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>

            {/* Console Logging Toggle */}
            <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-dl-accent" />
                <div>
                  <span className="text-sm text-white block">Console Logging</span>
                  <span className="text-xs text-slate-500">Log events to browser console</span>
                </div>
              </div>
              <motion.button
                onClick={() => updateSettings({ consoleLogging: !settings.consoleLogging })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.consoleLogging
                    ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                    : 'bg-dl-border'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: settings.consoleLogging ? 20 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Debug Logging Toggle */}
            <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-sm text-white block">Debug Logging</span>
                  <span className="text-xs text-slate-500">Extension debug info</span>
                </div>
              </div>
              <motion.button
                onClick={() => updateSettings({ debugLogging: !settings.debugLogging })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.debugLogging
                    ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                    : 'bg-dl-border'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ left: settings.debugLogging ? 20 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Event Grouping */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-dl-primary" />
                Event Grouping
              </h3>
              <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
                <span className="text-sm text-white">Enable Grouping</span>
                <motion.button
                  onClick={() =>
                    updateSettings({
                      grouping: {
                        ...(settings.grouping || DEFAULT_GROUPING),
                        enabled: !(settings.grouping?.enabled ?? false),
                      },
                    })
                  }
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    settings.grouping?.enabled
                      ? 'bg-gradient-to-r from-dl-primary to-dl-secondary'
                      : 'bg-dl-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ left: settings.grouping?.enabled ? 20 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
              {settings.grouping?.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateSettings({
                          grouping: { ...(settings.grouping || DEFAULT_GROUPING), mode: 'time' },
                        })
                      }
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
                        settings.grouping?.mode === 'time'
                          ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                          : 'border-dl-border text-slate-400 hover:text-white'
                      }`}
                    >
                      Time Window
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({
                          grouping: { ...(settings.grouping || DEFAULT_GROUPING), mode: 'event' },
                        })
                      }
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
                        settings.grouping?.mode === 'event'
                          ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                          : 'border-dl-border text-slate-400 hover:text-white'
                      }`}
                    >
                      Trigger Events
                    </button>
                  </div>

                  {/* Time Window Options */}
                  {settings.grouping?.mode === 'time' && (
                    <div className="flex gap-2">
                      {[200, 500, 1000].map((ms) => (
                        <button
                          key={ms}
                          onClick={() =>
                            updateSettings({
                              grouping: { ...(settings.grouping || DEFAULT_GROUPING), timeWindowMs: ms },
                            })
                          }
                          className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                            settings.grouping?.timeWindowMs === ms
                              ? 'bg-dl-accent/20 border-dl-accent text-dl-accent'
                              : 'border-dl-border text-slate-400 hover:text-white'
                          }`}
                        >
                          {ms}ms
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trigger Events Options */}
                  {settings.grouping?.mode === 'event' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">
                        Events that start a new group:
                      </p>

                      {/* Current trigger events */}
                      <div className="flex flex-wrap gap-1.5">
                        {(settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents).map(
                          (trigger) => (
                            <span
                              key={trigger}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-dl-primary/20 text-dl-primary"
                            >
                              {trigger}
                              <button
                                onClick={() =>
                                  updateSettings({
                                    grouping: {
                                      ...(settings.grouping || DEFAULT_GROUPING),
                                      triggerEvents: (
                                        settings.grouping?.triggerEvents ||
                                        DEFAULT_GROUPING.triggerEvents
                                      ).filter((t) => t !== trigger),
                                    },
                                  })
                                }
                                className="hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )
                        )}
                      </div>

                      {/* Add trigger event */}
                      <AnimatePresence>
                        {isAddingTrigger ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                              <input
                                type="text"
                                value={triggerSearch}
                                onChange={(e) => setTriggerSearch(e.target.value)}
                                placeholder="Search or type event name..."
                                className="w-full bg-dl-card border border-dl-border rounded px-3 py-1.5 pl-7 text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-24 overflow-y-auto space-y-1">
                              {/* Custom trigger option */}
                              {triggerSearch &&
                                !COMMON_EVENTS.includes(triggerSearch) &&
                                !(
                                  settings.grouping?.triggerEvents ||
                                  DEFAULT_GROUPING.triggerEvents
                                ).includes(triggerSearch) && (
                                  <button
                                    onClick={() => {
                                      updateSettings({
                                        grouping: {
                                          ...(settings.grouping || DEFAULT_GROUPING),
                                          triggerEvents: [
                                            ...(settings.grouping?.triggerEvents ||
                                              DEFAULT_GROUPING.triggerEvents),
                                            triggerSearch,
                                          ],
                                        },
                                      });
                                      setTriggerSearch('');
                                    }}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded bg-dl-primary/10 text-dl-primary hover:bg-dl-primary/20 transition-colors"
                                  >
                                    Add custom: "{triggerSearch}"
                                  </button>
                                )}

                              {/* Suggestions */}
                              {COMMON_EVENTS.filter(
                                (e) =>
                                  e.toLowerCase().includes(triggerSearch.toLowerCase()) &&
                                  !(
                                    settings.grouping?.triggerEvents ||
                                    DEFAULT_GROUPING.triggerEvents
                                  ).includes(e)
                              )
                                .slice(0, 6)
                                .map((eventName) => (
                                  <button
                                    key={eventName}
                                    onClick={() => {
                                      updateSettings({
                                        grouping: {
                                          ...(settings.grouping || DEFAULT_GROUPING),
                                          triggerEvents: [
                                            ...(settings.grouping?.triggerEvents ||
                                              DEFAULT_GROUPING.triggerEvents),
                                            eventName,
                                          ],
                                        },
                                      });
                                      setTriggerSearch('');
                                    }}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                                  >
                                    <span className="text-sm">
                                      {EVENT_CATEGORIES[eventName]?.icon || '📌'}
                                    </span>
                                    <span className="text-slate-300">{eventName}</span>
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setIsAddingTrigger(true)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs border border-dashed border-dl-border hover:border-dl-primary text-slate-400 hover:text-dl-primary rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add trigger event
                          </button>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Export/Import Settings */}
            <div className="space-y-3 pt-2 border-t border-dl-border">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Download className="w-4 h-4 text-dl-primary" />
                Backup & Restore
              </h3>
              <div className="flex gap-2">
                <motion.button
                  onClick={exportSettings}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-dl-card border border-dl-border rounded-lg text-sm text-white hover:border-dl-primary transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-dl-card border border-dl-border rounded-lg text-sm text-white hover:border-dl-primary transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-4 h-4" />
                  Import
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </div>
              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs text-center py-2 rounded ${
                    importStatus.includes('success')
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-red-400 bg-red-500/10'
                  }`}
                >
                  {importStatus}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="domains"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4 max-h-80 overflow-y-auto"
          >
            {/* Current Domain Info */}
            {currentDomain && (
              <div className="bg-dl-card rounded-lg p-3 border border-dl-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-dl-primary" />
                    <span className="text-sm font-medium text-white">Current Site</span>
                  </div>
                  {domainSettings[currentDomain] && (
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <code className="text-xs text-dl-accent block mb-2">{currentDomain}</code>
                {!domainSettings[currentDomain] && (
                  <motion.button
                    onClick={async () => {
                      // Save current settings as domain-specific
                      await browserAPI.runtime.sendMessage({
                        type: 'UPDATE_SETTINGS',
                        domain: currentDomain,
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
                    }}
                    className="w-full text-xs py-1.5 px-3 bg-dl-primary/20 hover:bg-dl-primary/30 text-dl-primary border border-dl-primary/30 rounded transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    Save current settings for this domain
                  </motion.button>
                )}
              </div>
            )}

            {/* Domain Settings List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Saved Domain Overrides</h3>
              {Object.keys(domainSettings).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No domain overrides saved</p>
                  <p className="text-xs mt-1">
                    Use the button above to save settings specific to each domain you visit
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {Object.entries(domainSettings).map(([domain, ds]) => (
                      <motion.div
                        key={domain}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between bg-dl-card rounded-lg px-3 py-2 border border-dl-border group"
                      >
                        <div>
                          <code className="text-xs text-dl-accent block">{domain}</code>
                          <span className="text-xs text-slate-500">
                            Updated {new Date(ds.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <motion.button
                          onClick={() => deleteDomain(domain)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-dl-error/20 rounded transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Remove domain settings"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-dl-error" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-slate-500 text-center pt-2 border-t border-dl-border">
              <p>Domain settings override global settings when you visit that site</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t border-dl-border bg-dl-darker/80 backdrop-blur-sm"
      >
        <p className="text-center text-xs text-slate-500">
          Made with{' '}
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            ✨
          </motion.span>{' '}
          for GTM enthusiasts
        </p>
      </motion.footer>
    </div>
  );
}
