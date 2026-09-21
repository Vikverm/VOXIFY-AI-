import React, { useRef, useState } from "react";
import { formatTime } from "../utils/audio";

interface AudioVisualizerProps {
  peaks: number[];
  progress: number; // 0 to 1
  isPlaying: boolean;
  duration: number;
  onSeek: (progress: number) => void;
  className?: string;
  analyserData?: Uint8Array | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  peaks,
  progress,
  isPlaying,
  duration,
  onSeek,
  className = "",
  analyserData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newProgress);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const hProgress = hoverX / rect.width;
    setHoverProgress(hProgress);
    setHoverTime(formatTime(hProgress * duration));
  };

  const handleMouseLeave = () => {
    setHoverProgress(null);
    setHoverTime(null);
  };

  // Generate fallback peaks if none available yet
  const displayPeaks =
    peaks.length > 0
      ? peaks
      : Array.from({ length: 68 }, (_, i) => Math.sin(i * 0.22) * 0.38 + 0.48);

  return (
    <div
      id="waveform-container"
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative h-24 w-full cursor-pointer select-none rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 p-3 shadow-inner ring-1 ring-white/10 transition hover:ring-blue-500/30 overflow-hidden ${className}`}
      title="Click anywhere to scrub playback"
    >
      {/* Ambient background glow when playing */}
      {isPlaying && (
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-blue-500/15 blur-2xl rounded-full animate-pulse-glow" />
      )}

      {/* Interactive Waveform Bars */}
      <div className="relative z-10 flex h-full w-full items-center justify-between gap-[2px] sm:gap-[3px]">
        {displayPeaks.map((peak, idx) => {
          const barProgress = idx / displayPeaks.length;
          const isPlayed = barProgress <= progress;

          // If playing and live frequency data is supplied, modulate peak height
          let heightPercent = Math.max(12, Math.round(peak * 100));
          if (isPlaying && analyserData && analyserData.length > 0) {
            const freqIdx = Math.floor((idx / displayPeaks.length) * (analyserData.length / 2));
            const freqVal = (analyserData[freqIdx] || 0) / 255;
            heightPercent = Math.min(100, Math.max(15, Math.round((peak * 0.55 + freqVal * 0.45) * 100)));
          }

          // Dynamic vibrant gradient per bar position: Cyan -> Blue -> Violet -> Magenta
          const hue = 190 + (idx / displayPeaks.length) * 100; // 190 (cyan) to 290 (purple/pink)

          return (
            <div
              key={idx}
              className="relative flex h-full flex-1 items-center justify-center"
            >
              <div
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: isPlayed ? `hsl(${hue}, 90%, 55%)` : undefined,
                }}
                className={`w-full rounded-full transition-all duration-75 ${
                  isPlayed
                    ? "shadow-sm shadow-cyan-400/40 brightness-110"
                    : "bg-slate-700/70 group-hover:bg-slate-600/80"
                } ${isPlaying && isPlayed ? "scale-y-[1.04]" : "opacity-90"}`}
              />
            </div>
          );
        })}
      </div>

      {/* Hover position indicator & timestamp tooltip */}
      {hoverProgress !== null && hoverTime !== null && (
        <div
          style={{ left: `${hoverProgress * 100}%` }}
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-[1px] -translate-x-1/2 bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-md bg-cyan-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow-md">
            {hoverTime}
          </div>
        </div>
      )}

      {/* Playhead indicator with glowing cyan/violet halo */}
      <div
        style={{ left: `${Math.min(99.5, Math.max(0.5, progress * 100))}%` }}
        className="pointer-events-none absolute top-0 bottom-0 z-20 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-400 via-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-75"
      >
        <div className="absolute top-1/2 -left-1.5 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] ring-2 ring-cyan-500/50" />
      </div>
    </div>
  );
};
