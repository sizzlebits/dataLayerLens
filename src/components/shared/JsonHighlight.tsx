import type { ReactNode } from 'react';

interface JsonHighlightProps {
  data: unknown;
}

export function JsonHighlight({ data }: JsonHighlightProps) {
  const renderValue = (value: unknown, depth = 0): ReactNode => {
    if (value === null) {
      return <span className="text-slate-500">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-amber-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-cyan-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-400">[]</span>;

      return (
        <>
          <span className="text-slate-400">[</span>
          <div className="ml-3">
            {value.map((item, i) => (
              <div key={i}>
                {renderValue(item, depth + 1)}
                {i < value.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-slate-400">]</span>
        </>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;

      return (
        <>
          <span className="text-slate-400">{'{'}</span>
          <div className="ml-3">
            {entries.map(([key, val], i) => (
              <div key={key}>
                <span className="text-pink-400">"{key}"</span>
                <span className="text-slate-400">: </span>
                {renderValue(val, depth + 1)}
                {i < entries.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-slate-400">{'}'}</span>
        </>
      );
    }

    return <span className="text-slate-400">{String(value)}</span>;
  };

  return <>{renderValue(data)}</>;
}
