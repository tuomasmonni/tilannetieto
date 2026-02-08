'use client';

interface LayerToggle {
  key: string;
  label: string;
  icon: string;
  visible: boolean;
  opacity: number;
  hasOpacity: boolean;
}

interface WeatherMapControlsProps {
  layers: LayerToggle[];
  onToggle: (key: string) => void;
  onOpacityChange: (key: string, opacity: number) => void;
  radarPlaying: boolean;
  radarFrameIndex: number;
  radarFrameCount: number;
  radarTimestamp: string | null;
  onRadarPlayToggle: () => void;
}

export default function WeatherMapControls({
  layers,
  onToggle,
  onOpacityChange,
  radarPlaying,
  radarFrameIndex,
  radarFrameCount,
  radarTimestamp,
  onRadarPlayToggle,
}: WeatherMapControlsProps) {
  const radarTimeLabel = radarTimestamp
    ? new Date(radarTimestamp).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="fixed top-20 right-3 z-30 sm:right-4 sm:top-20">
      <div className="glass-surface border border-white/10 rounded-xl p-2 flex flex-col gap-1 min-w-[140px]">
        <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5">KERROKSET</span>

        {layers.map((layer) => (
          <div key={layer.key}>
            <button
              onClick={() => onToggle(layer.key)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                layer.visible
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span>{layer.icon}</span>
              <span className="flex-1 text-left">{layer.label}</span>
              <div
                className={`w-2 h-2 rounded-full ${layer.visible ? 'bg-cyan-400' : 'bg-zinc-600'}`}
              />
            </button>

            {/* Opacity slider */}
            {layer.visible && layer.hasOpacity && (
              <div className="px-2 pb-1">
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(layer.opacity * 100)}
                  onChange={(e) => onOpacityChange(layer.key, parseInt(e.target.value) / 100)}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            )}

            {/* Radar controls */}
            {layer.key === 'radar' && layer.visible && radarFrameCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 pb-1">
                <button
                  onClick={onRadarPlayToggle}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
                >
                  {radarPlaying ? '⏸' : '▶'}
                </button>
                <span className="text-[10px] text-zinc-400">
                  {radarTimeLabel} ({radarFrameIndex + 1}/{radarFrameCount})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
