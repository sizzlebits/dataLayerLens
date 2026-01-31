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
  Highlighter,
} from 'lucide-react';
import { DataLayerEvent, getEventCategory, getHighlightCssVar, isHighlightColorKey } from '@/types';
import { JsonHighlight } from './JsonHighlight';

export interface EventRowProps {
  event: DataLayerEvent;
  isExpanded: boolean;
  isCopied?: boolean;
  isNew?: boolean;
  showFilterMenu?: boolean;
  compact?: boolean;
  showTimestamps?: boolean;
  showEmojis?: boolean;
  sourceColor?: string; // Color for the dataLayer source
  highlightColor?: string; // Color for left edge highlight bar and text
  onToggle: () => void;
  onCopy?: () => void;
  onAddFilterInclude?: () => void;
  onAddFilterExclude?: () => void;
  onToggleFilterMenu?: () => void;
  onToggleHighlight?: () => void; // Toggle highlight for this event type
}

export function EventRow({
  event,
  isExpanded,
  isCopied = false,
  isNew = false,
  showFilterMenu = false,
  compact = false,
  showTimestamps = true,
  showEmojis = true,
  sourceColor,
  highlightColor,
  onToggle,
  onCopy,
  onAddFilterInclude,
  onAddFilterExclude,
  onToggleFilterMenu,
  onToggleHighlight,
}: EventRowProps) {
  const category = getEventCategory(event.event);
  const isHighlighted = !!highlightColor;
  // Convert color key to CSS variable, or use raw value if it's a hex color (legacy)
  const highlightCssColor = highlightColor
    ? (isHighlightColorKey(highlightColor) ? getHighlightCssVar(highlightColor) : highlightColor)
    : undefined;
  const eventDate = new Date(event.timestamp);
  const time = eventDate.toLocaleTimeString();
  const timeWithMs = eventDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
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
      className={`group hover:bg-dl-card/50 relative ${isNew ? 'new-event' : ''}`}
      style={isNew ? {
        animation: 'highlightFade 2s ease-out forwards',
      } : undefined}
    >
      {/* Highlight Bar */}
      {highlightCssColor && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${isNew ? 'highlight-bar-flash' : ''}`}
          style={{ backgroundColor: highlightCssColor }}
          data-testid="highlight-bar"
        />
      )}

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
        className={`relative flex items-center gap-2 cursor-pointer ${compact ? 'py-2 px-3' : 'py-3 px-4'} focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dl-darker`}
      >
        <motion.div
          className="p-0.5 hover:bg-dl-border rounded transition-colors"
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          aria-hidden="true"
        >
          <ChevronRight className={compact ? 'w-3.5 h-3.5 text-theme-text-tertiary' : 'w-4 h-4 text-theme-text-tertiary'} />
        </motion.div>

        {showEmojis && (
          <div
            className={`rounded flex items-center justify-center flex-shrink-0 ${
              compact ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-lg'
            }`}
            style={{ backgroundColor: highlightCssColor
              ? `color-mix(in srgb, ${highlightCssColor} 20%, transparent)`
              : 'var(--color-bg-card)'
            }}
          >
            {category.icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${
                highlightCssColor ? 'highlight-text' : 'text-theme-text'
              }`}
              style={highlightCssColor ? { '--highlight-color': highlightCssColor } as React.CSSProperties : undefined}
            >
              {event.event}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 text-theme-text-tertiary ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono border ${
                compact ? 'text-[9px]' : 'text-[10px]'
              } ${
                !sourceColor ? 'bg-theme-bg-card border-theme-border-base text-theme-text-secondary' : ''
              }`}
              style={sourceColor ? {
                backgroundColor: `${sourceColor}15`,
                borderColor: `${sourceColor}40`,
                color: sourceColor,
              } : undefined}
            >
              {event.dataLayerIndex !== undefined && (
                <span className="opacity-60">#{event.dataLayerIndex}</span>
              )}
              {cleanSource}
              {isPersisted && (
                <span title="Persisted event">
                  <Clock
                    className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
                    style={sourceColor ? { color: sourceColor } : undefined}
                  />
                </span>
              )}
            </span>
            {showTimestamps && (
              <>
                <span className="text-theme-text-disabled">•</span>
                <span title={timeWithMs} className="inline-flex items-center gap-1 cursor-default">
                  <Clock className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                  {time}
                </span>
              </>
            )}
            <span className="text-theme-text-disabled">•</span>
            <Tag className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {Object.keys(event.data).length} props
          </div>
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-gradient-to-l from-dl-darker via-dl-darker to-transparent pl-6 pr-1">
          {/* Highlight Toggle */}
          {onToggleHighlight && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleHighlight();
              }}
              className={`p-1.5 rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary ${
                isHighlighted
                  ? 'bg-dl-accent/20 text-dl-accent'
                  : 'hover:bg-dl-border text-theme-text-secondary hover:text-dl-accent'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isHighlighted ? 'Remove highlight' : 'Highlight this event type'}
              aria-pressed={isHighlighted}
            >
              <Highlighter className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
            </motion.button>
          )}

          {showFilterActions && (
            <>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFilterMenu?.();
                }}
                className="p-1.5 hover:bg-dl-border rounded transition-all text-theme-text-secondary hover:text-dl-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-theme-text-secondary hover:bg-dl-success/20 hover:text-dl-success transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dl-success"
                      role="menuitem"
                    >
                      <ListPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Whitelist</span>
                    </button>
                    <button
                      onClick={onAddFilterExclude}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-theme-text-secondary hover:bg-dl-error/20 hover:text-dl-error transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dl-error"
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
                <Copy className={`text-theme-text-secondary ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} aria-hidden="true" />
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
