import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Copy,
  Check,
  Filter,
  Clock,
  Tag,
  ListPlus,
  ListMinus,
} from 'lucide-react';
import { DataLayerEvent, getEventCategory } from '@/types';
import { JsonHighlight } from './JsonHighlight';

export interface EventRowProps {
  event: DataLayerEvent;
  isExpanded: boolean;
  isCopied?: boolean;
  isNew?: boolean;
  showFilterMenu?: boolean;
  compact?: boolean;
  showTimestamps?: boolean;
  sourceColor?: string; // Color for the dataLayer source
  onToggle: () => void;
  onCopy?: () => void;
  onAddFilterInclude?: () => void;
  onAddFilterExclude?: () => void;
  onToggleFilterMenu?: () => void;
}

export function EventRow({
  event,
  isExpanded,
  isCopied = false,
  isNew = false,
  showFilterMenu = false,
  compact = false,
  showTimestamps = true,
  sourceColor,
  onToggle,
  onCopy,
  onAddFilterInclude,
  onAddFilterExclude,
  onToggleFilterMenu,
}: EventRowProps) {
  const category = getEventCategory(event.event);
  const time = new Date(event.timestamp).toLocaleTimeString();
  const showFilterActions = onAddFilterInclude && onAddFilterExclude && onToggleFilterMenu;
  const showCopyButton = !!onCopy;

  // Check if event is persisted and extract clean source name
  const isPersisted = event.source.includes('(persisted)');
  const cleanSource = event.source.replace(' (persisted)', '').replace('(persisted)', '');

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: 20 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`group hover:bg-dl-card/50 ${isNew ? 'new-event' : ''}`}
      style={isNew ? {
        animation: 'highlightFade 2s ease-out forwards',
      } : undefined}
    >
      {/* Event Header */}
      <div
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${event.event} event from ${cleanSource}. Press Enter to ${isExpanded ? 'collapse' : 'expand'}`}
        className={`flex items-center gap-2 cursor-pointer ${compact ? 'px-3 py-2' : 'px-4 py-3'} focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dl-darker`}
      >
        <motion.div
          className="p-0.5 hover:bg-dl-border rounded transition-colors"
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          aria-hidden="true"
        >
          <ChevronRight className={compact ? 'w-3.5 h-3.5 text-slate-500' : 'w-4 h-4 text-slate-500'} />
        </motion.div>

        <div
          className={`rounded flex items-center justify-center flex-shrink-0 ${
            compact ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-lg'
          }`}
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}
              style={{ color: category.color }}
            >
              {event.event}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span
              className={`inline-flex items-center gap-1 px-1 py-0.5 rounded font-mono ${compact ? 'text-[9px]' : 'text-[10px]'}`}
              style={sourceColor ? {
                backgroundColor: `${sourceColor}20`,
                color: sourceColor,
              } : {
                backgroundColor: 'rgba(51, 65, 85, 0.5)',
                color: '#94a3b8',
              }}
            >
              {event.dataLayerIndex !== undefined && (
                <span className="opacity-60">#{event.dataLayerIndex}</span>
              )}
              {cleanSource}
              {isPersisted && (
                <span title="Persisted event">
                  <Clock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} style={{ color: sourceColor || '#94a3b8' }} />
                </span>
              )}
            </span>
            {showTimestamps && (
              <>
                <span className="text-slate-600">•</span>
                <Clock className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                {time}
              </>
            )}
            <span className="text-slate-600">•</span>
            <Tag className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {Object.keys(event.data).length} props
          </div>
        </div>

        <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {showFilterActions && (
            <>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFilterMenu?.();
                }}
                className="p-1.5 hover:bg-dl-border rounded transition-all text-slate-400 hover:text-dl-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Add to filters"
                aria-haspopup="menu"
                aria-expanded={showFilterMenu}
              >
                <Filter className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
              </motion.button>

              {/* Filter dropdown menu */}
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-dl-card border border-dl-border rounded-lg shadow-xl overflow-hidden min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
                    aria-label="Filter options"
                  >
                    <button
                      onClick={onAddFilterInclude}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-dl-success/20 hover:text-dl-success transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dl-success"
                      role="menuitem"
                    >
                      <ListPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Whitelist</span>
                    </button>
                    <button
                      onClick={onAddFilterExclude}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-dl-error/20 hover:text-dl-error transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dl-error"
                      role="menuitem"
                    >
                      <ListMinus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Blacklist</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {showCopyButton && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onCopy?.();
              }}
              className={`hover:bg-dl-border rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary ${compact ? 'p-1.5' : 'p-2'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isCopied ? 'Copied!' : 'Copy event data'}
            >
              {isCopied ? (
                <Check className={`text-dl-success ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} aria-hidden="true" />
              ) : (
                <Copy className={`text-slate-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} aria-hidden="true" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Event Data */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={compact ? 'px-3 pb-2 pl-10' : 'px-4 pb-4 pl-16'}>
              <pre className={`bg-dl-darker rounded-lg font-mono overflow-x-auto max-h-[300px] overflow-y-auto ${
                compact ? 'p-3 text-[10px]' : 'p-4 text-xs'
              }`}>
                <JsonHighlight data={event.data} />
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
