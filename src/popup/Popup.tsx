/**
 * Popup - Main popup component for the extension.
 * Uses extracted hooks and components for cleaner organisation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings as SettingsIcon, Globe, Sparkles } from 'lucide-react';
import { usePopupState, type Tab } from './hooks/usePopupState';
import { usePopupActions } from './hooks/usePopupActions';
import { MonitorTab } from './components/MonitorTab';
import { SettingsTab } from './components/SettingsTab';
import { DomainsTab } from './components/DomainsTab';
import { SupportLink } from '@/components/shared/SupportLink';
import { AppIcon } from '@/components/shared/AppIcon';

interface PopupProps {
  /** Optional: Override theme for marketing/storybook (bypasses storage) */
  forceTheme?: 'light' | 'dark';
}

export function Popup({ forceTheme }: PopupProps = {}) {
  const state = usePopupState();
  const actions = usePopupActions({
    settings: state.settings,
    updateSettings: state.updateSettings,
    events: state.events,
    clearEvents: state.clearEvents,
    newLayerName: state.newLayerName,
    setNewLayerName: state.setNewLayerName,
    setIsAddingLayer: state.setIsAddingLayer,
    setDomainSettings: state.setDomainSettings,
    loadDomainSettings: state.loadDomainSettings,
    loadSettings: state.loadSettings,
    setImportStatus: state.setImportStatus,
    fileInputRef: state.fileInputRef,
    setIsAddingFilter: state.setIsAddingFilter,
    setFilterSearch: state.setFilterSearch,
    setIsAddingTrigger: state.setIsAddingTrigger,
    setTriggerSearch: state.setTriggerSearch,
  });

  if (state.isLoading) {
    return (
      <div className="w-80 h-96 flex items-center justify-center bg-dl-dark">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-dl-primary" />
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Zap }[] = [
    { id: 'main', label: 'Monitor', icon: Zap },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'domains', label: 'Domains', icon: Globe },
  ];

  return (
    <div
      className="w-80 h-[28rem] flex flex-col bg-gradient-to-br from-dl-dark to-dl-darker"
      {...(forceTheme ? { 'data-theme': forceTheme } : {})}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 bg-gradient-to-r from-dl-primary/20 to-dl-secondary/20 px-4 py-3 border-b border-dl-border"
      >
        <div className="flex items-center gap-3">
          <AppIcon size="lg" variant="indented" />
          <div>
            <h1 className="font-bold text-lg text-theme-text tracking-tight">DataLayer Lens</h1>
            <p className="text-xs text-theme-text-secondary">Track your GTM events with clarity</p>
          </div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex border-b border-dl-border">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => state.setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
              state.activeTab === tab.id
                ? 'text-dl-accent'
                : 'text-theme-text-secondary hover:text-theme-text'
            }`}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {state.activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dl-primary to-dl-accent"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Content - scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.activeTab === 'main' && (
            <MonitorTab
              key="main"
              settings={state.settings}
              events={state.events}
              currentDomain={state.currentDomain}
              onClearEvents={state.clearEvents}
              onExportEvents={actions.exportEvents}
              onAddFilter={actions.addFilter}
              onRemoveFilter={actions.removeFilter}
              onClearFilters={actions.clearFilters}
              onSetFilterMode={actions.setFilterMode}
            />
          )}

          {state.activeTab === 'settings' && (
            <SettingsTab
              key="settings"
              settings={state.settings}
              onUpdateSettings={state.updateSettings}
              onExportSettings={actions.exportSettings}
              onImportSettings={actions.importSettings}
              importStatus={state.importStatus}
            />
          )}

          {state.activeTab === 'domains' && (
            <DomainsTab
              key="domains"
              currentDomain={state.currentDomain}
              domainSettings={state.domainSettings}
              onSaveCurrentDomain={() => actions.saveCurrentDomainSettings(state.currentDomain)}
              onDeleteDomain={actions.deleteDomain}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer - fixed at bottom */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 px-4 py-2 border-t border-dl-border bg-dl-darker/80 backdrop-blur-sm"
      >
        <SupportLink />
      </motion.footer>
    </div>
  );
}
