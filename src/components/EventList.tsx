import { useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Copy, Check, Clock, Tag, Database } from 'lucide-react';
import { DataLayerEvent, getEventCategory } from '@/types';

interface EventListProps {
  events: DataLayerEvent[];
  expandedEvents: Set<string>;
  onToggleExpand: (id: string) => void;
  onCopy: (event: DataLayerEvent) => void;
  copiedId?: string | null;
  filter?: string;
}

export function EventList({
  events,
  expandedEvents,
  onToggleExpand,
  onCopy,
  copiedId,
  filter,
}: EventListProps) {
  const filteredEvents = useMemo(() => {
    if (!filter) return events;

    const searchLower = filter.toLowerCase();
    return events.filter((event) => {
      return (
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    });
  }, [events, filter]);

  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-theme-text-tertiary">
        <Database className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No events captured</p>
        <p className="text-xs text-theme-text-disabled">Waiting for dataLayer pushes...</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dl-border">
      <AnimatePresence initial={false}>
        {filteredEvents.map((event, index) => (
          <EventRow
            key={event.id}
            event={event}
            isNew={index === 0}
            isExpanded={expandedEvents.has(event.id)}
            isCopied={copiedId === event.id}
            onToggle={() => onToggleExpand(event.id)}
            onCopy={() => onCopy(event)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface EventRowProps {
  event: DataLayerEvent;
  isNew: boolean;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

function EventRow({ event, isNew, isExpanded, isCopied, onToggle, onCopy }: EventRowProps) {
  const category = getEventCategory(event.event);
  const time = new Date(event.timestamp).toLocaleTimeString();

  return (
    <motion.div
      data-event-id={event.id}
      layout
      initial={isNew ? { backgroundColor: 'rgba(99, 102, 241, 0.2)' } : false}
      animate={{ backgroundColor: 'transparent' }}
      transition={{ duration: 1 }}
      className="group hover:bg-dl-card/50"
    >
      {/* Event Header */}
      <div onClick={onToggle} className="flex items-center gap-3 px-4 py-3 cursor-pointer">
        <motion.button
          className="p-1 hover:bg-dl-border rounded transition-colors"
          animate={{ rotate: isExpanded ? 90 : 0 }}
        >
          <ChevronRight className="w-4 h-4 text-theme-text-tertiary" />
        </motion.button>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate" style={{ color: category.color }}>
              {event.event}
            </span>
            <span className="px-1.5 py-0.5 bg-dl-border rounded text-[10px] text-theme-text-secondary font-mono flex-shrink-0">
              {event.source}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-theme-text-tertiary">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {time}
            <span className="text-theme-text-disabled">•</span>
            <Tag className="w-3 h-3 flex-shrink-0" />
            {Object.keys(event.data).length} properties
          </div>
        </div>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-dl-border rounded-lg transition-all flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-dl-success" />
          ) : (
            <Copy className="w-4 h-4 text-theme-text-secondary" />
          )}
        </motion.button>
      </div>

      {/* Event Data */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-16">
              <pre className="p-4 bg-dl-darker rounded-lg text-xs font-mono overflow-x-auto">
                <JsonHighlight data={event.data} />
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function JsonHighlight({ data }: { data: unknown }) {
  const renderValue = (value: unknown, depth = 0): ReactNode => {
    if (value === null) {
      return <span className="text-theme-text-tertiary">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-json-boolean">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-json-number">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-json-string">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-theme-text-secondary">[]</span>;

      return (
        <>
          <span className="text-theme-text-secondary">[</span>
          <div className="ml-4">
            {value.map((item, i) => (
              <div key={i}>
                {renderValue(item, depth + 1)}
                {i < value.length - 1 && <span className="text-theme-text-secondary">,</span>}
              </div>
            ))}
          </div>
          <span className="text-theme-text-secondary">]</span>
        </>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-theme-text-secondary">{'{}'}</span>;

      return (
        <>
          <span className="text-theme-text-secondary">{'{'}</span>
          <div className="ml-4">
            {entries.map(([key, val], i) => (
              <div key={key}>
                <span className="text-json-key">"{key}"</span>
                <span className="text-theme-text-secondary">: </span>
                {renderValue(val, depth + 1)}
                {i < entries.length - 1 && <span className="text-theme-text-secondary">,</span>}
              </div>
            ))}
          </div>
          <span className="text-theme-text-secondary">{'}'}</span>
        </>
      );
    }

    return <span className="text-theme-text-secondary">{String(value)}</span>;
  };

  return renderValue(data);
}
