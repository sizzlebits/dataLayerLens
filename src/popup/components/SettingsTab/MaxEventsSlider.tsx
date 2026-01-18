/**
 * MaxEventsSlider - Component for configuring max events limit.
 */

export interface MaxEventsSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function MaxEventsSlider({
  value,
  onChange,
  min = 10,
  max = 200,
  step = 10,
}: MaxEventsSliderProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">Max Events</h3>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-dl-primary"
        />
        <span className="text-sm text-dl-accent font-mono w-12 text-right">{value}</span>
      </div>
    </div>
  );
}
