/**
 * Unified EventPanel component.
 * Used by both SidePanel and DevToolsPanel with context-specific configuration.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Clock,
  Database,
  Grid,
  Settings,
  Plus,
  FolderOpen,
  Folder,
  Download,
  Terminal,
} from 'lucide-react';
import { getEventCategory } from '@/types';
import { EventRow } from '../EventRow';
import { SettingsDrawer } from '../SettingsDrawer';
import { Toast } from '../Toast';
import { isClipboardApiAvailable } from '@/utils/clipboard';
import { useEventPanelState, PAGE_SIZE } from './useEventPanelState';
import { useEventPanelActions } from './useEventPanelActions';

export interface EventPanelProps {
  /** Context determines UI differences between sidepanel and devtools */
  context: 'sidepanel' | 'devtools';
}

export function EventPanel({ context }: EventPanelProps) {
  // Use the shared state hook
  const state = useEventPanelState({ context });

  // Use the shared actions hook
  const actions = useEventPanelActions({
    context,
    tabId: state.tabId,
    settings: state.settings,
    filteredEvents: state.filteredEvents,
    setEvents: state.setEvents,
    setSettings: state.setSettings,
    setExpandedEvents: state.setExpandedEvents,
    setCopiedId: state.setCopiedId,
    setNewEventIds: state.setNewEventIds,
    setCurrentPage: state.setCurrentPage,
    setFilterMenuEvent: state.setFilterMenuEvent,
    setCollapsedGroups: state.setCollapsedGroups,
    setCopyError: state.setCopyError,
  });

  const clipboardAvailable = isClipboardApiAvailable();
  const isCompact = context === 'sidepanel';

  return (
    <div className="h-screen flex flex-col bg-dl-darker text-slate-200 overflow-hidden">
      {/* Header */}
      <header className={`flex-shrink-0 bg-gradient-to-r from-dl-dark to-dl-darker border-b border-dl-border ${
        isCompact ? 'px-3 py-2' : 'devtools-header px-4 py-3'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={!isCompact ? { rotate: 180 } : undefined}
              transition={{ duration: 0.3 }}
              className={`bg-gradient-to-br from-dl-primary to-dl-secondary rounded-lg flex items-center justify-center ${
                isCompact ? 'w-6 h-6' : 'w-8 h-8'
              }`}
            >
              <Layers className={isCompact ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white'} />
            </motion.div>
            <div>
              <h1 className={`font-semibold text-white ${isCompact ? 'text-sm' : 'font-bold'}`}>
                DataLayer Lens
              </h1>
              {!isCompact && (
                <p className="text-xs text-slate-500">{state.filteredEvents.length} events</p>
              )}
            </div>
            {isCompact && (
              <span className="px-2 py-0.5 bg-dl-primary/20 text-dl-primary text-xs rounded-full font-medium">
                {state.filteredEvents.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Console Logging - DevTools only */}
            {context === 'devtools' && (
              <motion.button
                onClick={actions.toggleConsoleLogging}
                className={`header-btn hide-md ${
                  state.settings.consoleLogging
                    ? 'bg-dl-accent/20 text-dl-accent'
                    : 'bg-dl-card text-slate-400 hover:text-slate-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Log events to browser console"
              >
                <Terminal className="btn-icon" />
                <span className="btn-label">Console</span>
              </motion.button>
            )}

            {/* Grouping Toggle */}
            <motion.button
              onClick={actions.toggleGrouping}
              className={isCompact
                ? `p-1.5 rounded-lg transition-colors ${
                    state.settings.grouping?.enabled
                      ? 'bg-dl-primary/20 text-dl-primary'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dl-card'
                  }`
                : `header-btn ${
                    state.settings.grouping?.enabled
                      ? 'bg-dl-primary/20 text-dl-primary'
                      : 'bg-dl-card text-slate-400 hover:text-slate-200'
                  }`
              }
              whileHover={{ scale: isCompact ? 1.05 : 1.02 }}
              whileTap={{ scale: isCompact ? 0.95 : 0.98 }}
              title="Toggle grouping"
            >
              <Grid className={isCompact ? 'w-4 h-4' : 'btn-icon'} />
              {!isCompact && <span className="btn-label">Group</span>}
            </motion.button>

            {/* Persist Toggle */}
            <motion.button
              onClick={actions.togglePersist}
              className={isCompact
                ? `p-1.5 rounded-lg transition-colors ${
                    state.settings.persistEvents
                      ? 'bg-dl-primary/20 text-dl-primary'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dl-card'
                  }`
                : `header-btn ${
                    state.settings.persistEvents
                      ? 'bg-dl-primary/20 text-dl-primary'
                      : 'bg-dl-card text-slate-400 hover:text-slate-200'
                  }`
              }
              whileHover={{ scale: isCompact ? 1.05 : 1.02 }}
              whileTap={{ scale: isCompact ? 0.95 : 0.98 }}
              title="Persist events on refresh"
            >
              <Clock className={isCompact ? 'w-4 h-4' : 'btn-icon'} />
              {!isCompact && <span className="btn-label">Persist</span>}
            </motion.button>

            {/* Export */}
            <motion.button
              onClick={actions.exportEvents}
              className={isCompact
                ? 'p-1.5 text-slate-400 hover:text-slate-200 hover:bg-dl-card rounded-lg transition-colors'
                : 'header-btn hide-md bg-dl-card hover:bg-dl-border text-slate-300'
              }
              whileHover={{ scale: isCompact ? 1.05 : 1.02 }}
              whileTap={{ scale: isCompact ? 0.95 : 0.98 }}
              title="Export events"
              disabled={state.filteredEvents.length === 0}
            >
              <Download className={isCompact ? 'w-4 h-4' : 'btn-icon'} />
              {!isCompact && <span className="btn-label">Export</span>}
            </motion.button>

            {/* Clear */}
            <motion.button
              onClick={actions.clearEvents}
              className={isCompact
                ? 'p-1.5 text-slate-400 hover:text-dl-error hover:bg-dl-error/10 rounded-lg transition-colors'
                : 'header-btn bg-dl-error/10 hover:bg-dl-error/20 text-dl-error'
              }
              whileHover={{ scale: isCompact ? 1.05 : 1.02 }}
              whileTap={{ scale: isCompact ? 0.95 : 0.98 }}
              title="Clear all events"
            >
              <Trash2 className={isCompact ? 'w-4 h-4' : 'btn-icon'} />
              {!isCompact && <span className="btn-label">Clear</span>}
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => state.setShowSettings(true)}
              className={isCompact
                ? 'p-1.5 text-slate-400 hover:text-slate-200 hover:bg-dl-card rounded-lg transition-colors'
                : 'header-btn bg-dl-card hover:bg-dl-border text-slate-300'
              }
              whileHover={{ scale: isCompact ? 1.05 : 1.02 }}
              whileTap={{ scale: isCompact ? 0.95 : 0.98 }}
              title="Open settings"
            >
              <Settings className={isCompact ? 'w-4 h-4' : 'btn-icon'} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className={`flex-shrink-0 bg-dl-dark border-b border-dl-border space-y-2 ${
        isCompact ? 'px-3 py-2' : 'search-filter-bar px-4 py-3'
      }`}>
        <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${
              isCompact ? 'left-2.5 w-3.5 h-3.5' : 'left-3 w-4 h-4'
            }`} />
            <input
              type="text"
              value={state.searchText}
              onChange={(e) => state.setSearchText(e.target.value)}
              placeholder="Search events..."
              className={`w-full bg-dl-card border border-dl-border rounded-lg text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none focus:ring-1 focus:ring-dl-primary/50 ${
                isCompact ? 'pl-8 pr-7 py-1.5 text-xs' : 'pl-10 pr-8 py-2 text-sm'
              }`}
            />
            {state.searchText && (
              <button
                onClick={() => state.setSearchText('')}
                className={`absolute top-1/2 -translate-y-1/2 p-0.5 hover:bg-dl-border rounded text-slate-400 hover:text-slate-200 ${
                  isCompact ? 'right-2' : 'right-3'
                }`}
              >
                <X className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <motion.button
            onClick={() => state.setShowFilters(!state.showFilters)}
            className={`rounded-lg font-medium flex items-center gap-1 transition-colors ${
              state.showFilters || state.settings.eventFilters.length > 0
                ? 'bg-dl-primary/20 text-dl-primary'
                : 'bg-dl-card text-slate-400 hover:text-slate-200'
            } ${isCompact ? 'p-1.5 text-xs' : 'px-3 py-2 text-xs gap-1.5'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Toggle filters"
          >
            <Filter className="w-3.5 h-3.5" />
            {!isCompact && <span className="filter-label">Filters</span>}
            {state.settings.eventFilters.length > 0 && (
              <span className={`bg-dl-primary text-white rounded-full min-w-[16px] text-center ${
                isCompact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-[10px]'
              }`}>
                {state.settings.eventFilters.length}
              </span>
            )}
            {state.showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
        </div>

        {/* Filters Drawer */}
        <AnimatePresence>
          {state.showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`space-y-2 ${isCompact ? 'pt-1' : 'pt-2 space-y-3'}`}>
                {/* Filter Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-slate-500 uppercase tracking-wider ${
                    isCompact ? 'text-[10px]' : 'text-xs'
                  }`}>Mode:</span>
                  <button
                    onClick={actions.toggleFilterMode}
                    className={`rounded font-medium transition-colors ${
                      state.settings.filterMode === 'include'
                        ? 'bg-dl-success/20 text-dl-success'
                        : 'bg-dl-error/20 text-dl-error'
                    } ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
                  >
                    {state.settings.filterMode === 'include' ? 'Include only' : 'Exclude'}
                  </button>
                </div>

                {/* Active Filters */}
                {state.settings.eventFilters.length > 0 && (
                  <div className={`flex flex-wrap ${isCompact ? 'gap-1' : 'gap-1.5'}`}>
                    {state.settings.eventFilters.map((filter) => (
                      <span
                        key={filter}
                        className={`inline-flex items-center gap-1 rounded-full font-medium ${
                          state.settings.filterMode === 'include'
                            ? 'bg-dl-success/20 text-dl-success'
                            : 'bg-dl-error/20 text-dl-error'
                        } ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
                      >
                        {filter}
                        <button
                          onClick={() => actions.removeFilter(filter)}
                          className="hover:bg-white/10 rounded-full p-0.5"
                        >
                          <X className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Available Event Types */}
                <div className={isCompact ? 'space-y-1' : 'space-y-1.5'}>
                  <span className={`text-slate-500 uppercase tracking-wider ${
                    isCompact ? 'text-[10px]' : 'text-xs'
                  }`}>
                    Add filter from captured events:
                  </span>
                  <div className={`flex flex-wrap overflow-y-auto ${
                    isCompact ? 'gap-1 max-h-24' : 'gap-1.5 max-h-28'
                  }`}>
                    {state.availableEventTypes
                      .filter((type) => !state.settings.eventFilters.includes(type))
                      .map((type) => {
                        const category = getEventCategory(type);
                        return (
                          <button
                            key={type}
                            onClick={() => actions.addFilter(type, state.settings.filterMode)}
                            className={`inline-flex items-center gap-1 rounded-full font-medium opacity-70 hover:opacity-100 transition-opacity ${
                              isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                            }`}
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                            }}
                          >
                            <Plus className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                            {type}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {state.filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Database className={isCompact ? 'w-10 h-10 mb-3 opacity-30' : 'w-12 h-12 mb-4 opacity-30'} />
            <p className={isCompact ? 'text-sm font-medium' : 'text-lg font-medium'}>No events captured</p>
            <p className={isCompact ? 'text-xs' : 'text-sm'}>Waiting for dataLayer pushes...</p>
          </div>
        ) : state.settings.grouping?.enabled ? (
          /* Grouped View */
          <div className="divide-y divide-dl-border">
            {state.paginatedGroups.map((group) => {
              const isCollapsed = state.collapsedGroups.has(group.id);
              const groupTime = new Date(group.startTime).toLocaleTimeString();
              return (
                <div key={group.id} className="bg-dl-dark/30">
                  {/* Group Header */}
                  <div
                    onClick={() => actions.toggleGroupCollapsed(group.id)}
                    className={`flex items-center cursor-pointer hover:bg-dl-card/50 border-l-2 border-dl-primary/50 ${
                      isCompact ? 'gap-2 px-3 py-2' : 'gap-3 px-4 py-3'
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight className={isCompact ? 'w-3.5 h-3.5 text-slate-500' : 'w-4 h-4 text-slate-500'} />
                    </motion.div>
                    {isCollapsed ? (
                      <Folder className={isCompact ? 'w-4 h-4 text-dl-primary' : 'w-5 h-5 text-dl-primary'} />
                    ) : (
                      <FolderOpen className={isCompact ? 'w-4 h-4 text-dl-primary' : 'w-5 h-5 text-dl-primary'} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-slate-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                          {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                        </span>
                        {group.triggerEvent && (
                          <span className={`text-dl-primary truncate ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                            triggered by {group.triggerEvent}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 text-slate-500 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
                        <Clock className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                        {groupTime}
                      </div>
                    </div>
                  </div>

                  {/* Group Events */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`border-l-2 border-dl-primary/20 ${isCompact ? 'pl-4 ml-3' : 'pl-6 ml-4'}`}>
                          {group.events.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              isExpanded={state.expandedEvents.has(event.id)}
                              isCopied={state.copiedId === event.id}
                              isNew={state.newEventIds.has(event.id)}
                              showFilterMenu={state.filterMenuEvent === event.id}
                              compact={isCompact}
                              sourceColor={actions.getSourceColorForEvent(event.source)}
                              onToggle={() => actions.toggleExpanded(event.id)}
                              onCopy={clipboardAvailable || context === 'sidepanel' ? () => actions.copyEvent(event) : undefined}
                              onAddFilterInclude={() => actions.addFilter(event.event, 'include')}
                              onAddFilterExclude={() => actions.addFilter(event.event, 'exclude')}
                              onToggleFilterMenu={() =>
                                state.setFilterMenuEvent((prev) => (prev === event.id ? null : event.id))
                              }
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat View */
          <div className="divide-y divide-dl-border">
            {state.paginatedEvents.map((event, index) => {
              const isPersisted = event.source.includes('(persisted)');
              const prevEvent = index > 0 ? state.paginatedEvents[index - 1] : null;
              const prevIsPersisted = prevEvent?.source.includes('(persisted)');
              const showSeparator = state.settings.persistEvents && isPersisted && !prevIsPersisted && index > 0;

              return (
                <div key={event.id}>
                  {showSeparator && (
                    <div className="flex items-center gap-3 py-3 px-4 bg-dl-card/30">
                      <div className="flex-1 h-px bg-dl-border" />
                      <span className={`text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5 ${
                        isCompact ? 'text-[10px]' : 'text-xs'
                      }`}>
                        <Clock className="w-3 h-3" />
                        Persisted Events
                      </span>
                      <div className="flex-1 h-px bg-dl-border" />
                    </div>
                  )}
                  <EventRow
                    event={event}
                    isExpanded={state.expandedEvents.has(event.id)}
                    isCopied={state.copiedId === event.id}
                    isNew={state.newEventIds.has(event.id)}
                    showFilterMenu={state.filterMenuEvent === event.id}
                    compact={isCompact}
                    sourceColor={actions.getSourceColorForEvent(event.source)}
                    onToggle={() => actions.toggleExpanded(event.id)}
                    onCopy={clipboardAvailable || context === 'sidepanel' ? () => actions.copyEvent(event) : undefined}
                    onAddFilterInclude={() => actions.addFilter(event.event, 'include')}
                    onAddFilterExclude={() => actions.addFilter(event.event, 'exclude')}
                    onToggleFilterMenu={() =>
                      state.setFilterMenuEvent((prev) => (prev === event.id ? null : event.id))
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className={`flex-shrink-0 flex items-center justify-center bg-dl-dark border-t border-dl-border ${
          isCompact ? 'gap-3 px-3 py-2' : 'gap-4 px-4 py-3'
        }`}>
          <button
            onClick={() => state.setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={state.currentPage === 0}
            className={`bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-300 transition-colors ${
              isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 rounded-lg text-xs'
            }`}
          >
            ← Prev
          </button>
          <span className={`text-slate-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {state.settings.grouping?.enabled ? (
              <>
                {state.currentPage * PAGE_SIZE + 1}-{Math.min((state.currentPage + 1) * PAGE_SIZE, state.eventGroups.length)} of{' '}
                {state.eventGroups.length} groups
              </>
            ) : (
              <>
                {state.currentPage * PAGE_SIZE + 1}-{Math.min((state.currentPage + 1) * PAGE_SIZE, state.filteredEvents.length)} of{' '}
                {state.filteredEvents.length}
              </>
            )}
          </span>
          <button
            onClick={() => state.setCurrentPage((p) => Math.min(state.totalPages - 1, p + 1))}
            disabled={state.currentPage >= state.totalPages - 1}
            className={`bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-300 transition-colors ${
              isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 rounded-lg text-xs'
            }`}
          >
            Next →
          </button>
        </div>
      )}

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={state.showSettings}
        onClose={() => state.setShowSettings(false)}
        settings={state.settings}
        onUpdateSettings={actions.handleUpdateSettings}
        activeTabId={state.tabId}
        eventCount={state.filteredEvents.length}
        onExport={actions.exportEvents}
        detectedSources={state.uniqueSources}
      />

      {/* Copy Error Toast - DevTools only */}
      {context === 'devtools' && <Toast message={state.copyError} type="error" />}
    </div>
  );
}
