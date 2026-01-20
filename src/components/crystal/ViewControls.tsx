import { clsx } from 'clsx';

interface ViewControlsProps {
  elevation: number;
  azimuth: number;
  onElevationChange: (value: number) => void;
  onAzimuthChange: (value: number) => void;
  onReset: () => void;
  className?: string;
}

export function ViewControls({
  elevation,
  azimuth,
  onElevationChange,
  onAzimuthChange,
  onReset,
  className,
}: ViewControlsProps) {
  return (
    <div className={clsx('mt-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 w-20">Elevation</label>
        <input
          type="range"
          min="-90"
          max="90"
          value={elevation}
          onChange={(e) => onElevationChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-crystal-600"
        />
        <span className="text-sm text-slate-500 w-12 text-right">{elevation}°</span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 w-20">Azimuth</label>
        <input
          type="range"
          min="-180"
          max="180"
          value={azimuth}
          onChange={(e) => onAzimuthChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-crystal-600"
        />
        <span className="text-sm text-slate-500 w-12 text-right">{azimuth}°</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="text-sm text-slate-600 hover:text-crystal-600 transition-colors"
        >
          Reset view
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => {
            onElevationChange(90);
            onAzimuthChange(0);
          }}
          className="text-sm text-slate-600 hover:text-crystal-600 transition-colors"
        >
          Top
        </button>
        <button
          onClick={() => {
            onElevationChange(0);
            onAzimuthChange(0);
          }}
          className="text-sm text-slate-600 hover:text-crystal-600 transition-colors"
        >
          Front
        </button>
        <button
          onClick={() => {
            onElevationChange(0);
            onAzimuthChange(90);
          }}
          className="text-sm text-slate-600 hover:text-crystal-600 transition-colors"
        >
          Side
        </button>
      </div>
    </div>
  );
}
