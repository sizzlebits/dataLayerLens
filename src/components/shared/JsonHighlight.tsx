import type { ReactNode } from 'react';

interface JsonHighlightProps {
  data: unknown;
}

export function JsonHighlight({ data }: JsonHighlightProps) {
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
          <div className="ml-3">
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
          <div className="ml-3">
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

  return <>{renderValue(data)}</>;
}
