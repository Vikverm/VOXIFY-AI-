import React from "react";
import { Sliders, Gauge, RotateCcw, Activity, Wand2, Mic2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { PitchLevel, SpeedLevel, AudioFilterPreset } from "../types";

interface PitchSpeedControlsProps {
  // Model generation parameters
  modelPitch: PitchLevel;
  onChangeModelPitch: (pitch: PitchLevel) => void;
  modelSpeed: SpeedLevel;
  onChangeModelSpeed: (speed: SpeedLevel) => void;

  // Real-time playback parameters
  playbackSpeed: number;
  onChangePlaybackSpeed: (speed: number) => void;
  pitchSemitones: number;
  onChangePitchSemitones: (semitones: number) => void;
  audioFilter: AudioFilterPreset;
  onChangeAudioFilter: (filter: AudioFilterPreset) => void;
  onResetPlaybackControls: () => void;
  hasAudioLoaded: boolean;
}

const PITCH_LEVELS: { id: PitchLevel; label: string; desc: string; color: string }[] = [
  { id: "very-low", label: "Deep Bass", desc: "-4 semitones", color: "from-purple-600 to-indigo-700" },
  { id: "low", label: "Warm Register", desc: "-2 semitones", color: "from-indigo-600 to-blue-600" },
  { id: "normal", label: "Natural", desc: "Original", color: "from-blue-600 to-cyan-600" },
  { id: "high", label: "Bright High", desc: "+2 semitones", color: "from-cyan-600 to-teal-600" },
  { id: "very-high", label: "Melodic Lift", desc: "+4 semitones", color: "from-teal-600 to-emerald-600" },
];

const SPEED_LEVELS: { id: SpeedLevel; label: string; desc: string }[] = [
  { id: "very-slow", label: "0.75x", desc: "Deliberate" },
  { id: "slow", label: "0.90x", desc: "Relaxed" },
  { id: "normal", label: "1.00x", desc: "Natural Pace" },
  { id: "fast", label: "1.20x", desc: "Brisk Tempo" },
  { id: "very-fast", label: "1.40x", desc: "Rapid Speech" },
];

const FILTER_PRESETS: { id: AudioFilterPreset; label: string; desc: string; iconColor: string }[] = [
  { id: "none", label: "Studio Clean", desc: "Direct flat response", iconColor: "text-slate-500" },
  { id: "warm-radio", label: "Podcast Warmth", desc: "Rich low-end & smooth highs", iconColor: "text-amber-500" },
  { id: "vocal-clarity", label: "Vocal Clarity", desc: "Boosts presence & articulation", iconColor: "text-blue-500" },
  { id: "vintage-phone", label: "Vintage Lo-Fi", desc: "Bandpass telephone character", iconColor: "text-rose-500" },
  { id: "cinematic-air", label: "Cinematic Air", desc: "Polished air & depth", iconColor: "text-purple-500" },
];

export const PitchSpeedControls: React.FC<PitchSpeedControlsProps> = ({
  modelPitch,
  onChangeModelPitch,
  modelSpeed,
  onChangeModelSpeed,
  playbackSpeed,
  onChangePlaybackSpeed,
  pitchSemitones,
  onChangePitchSemitones,
  audioFilter,
  onChangeAudioFilter,
  onResetPlaybackControls,
  hasAudioLoaded,
}) => {
  return (
    <div
      id="pitch-speed-controls-panel"
      className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-5 shadow-sm space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Pitch, Pace & Acoustic Tuning
            </h3>
            <p className="text-[11px] text-slate-500">
              Dual Synthesis Engine & Real-Time DSP Audio Modulator
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-full">
          Live 24kHz DSP
        </span>
      </div>

      {/* Synthesis Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Model Pitch Setting */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-indigo-600" />
              <span>Voice Pitch Inflection</span>
            </label>
            <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full capitalize">
              {modelPitch.replace("-", " ")}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {PITCH_LEVELS.map((item) => {
              const active = item.id === modelPitch;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  id={`pitch-preset-${item.id}`}
                  onClick={() => onChangeModelPitch(item.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer select-none ${
                    active
                      ? "border-indigo-600 bg-indigo-50/90 text-indigo-950 font-bold shadow-xs ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs leading-tight">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                    {item.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Model Speed Setting */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-amber-600" />
              <span>Cadence & Speaking Pace</span>
            </label>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full capitalize">
              {modelSpeed.replace("-", " ")}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {SPEED_LEVELS.map((item) => {
              const active = item.id === modelSpeed;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  id={`speed-preset-${item.id}`}
                  onClick={() => onChangeModelSpeed(item.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer select-none ${
                    active
                      ? "border-amber-500 bg-amber-50/90 text-amber-950 font-bold shadow-xs ring-2 ring-amber-400/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs leading-tight">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                    {item.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Live Playback & Acoustic DSP Filters */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xs">
              <Wand2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Live Acoustic DSP & Real-Time Modulator
              </h4>
              <p className="text-[11px] text-slate-500">
                Modulate speed, detune pitch, and apply studio filters without re-synthesizing
              </p>
            </div>
          </div>

          <button
            type="button"
            id="reset-playback-controls-btn"
            onClick={onResetPlaybackControls}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 shadow-2xs transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Effects</span>
          </button>
        </div>

        {/* Live Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          {/* Playback Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <span>Playback Speed Rate</span>
              </span>
              <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200/60 shadow-2xs">
                {playbackSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              id="live-playback-speed-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={playbackSpeed}
              onChange={(e) => onChangePlaybackSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg transition-all"
            />
            <div className="flex justify-between text-[10px] text-slate-500 px-0.5 font-mono">
              <button
                type="button"
                onClick={() => onChangePlaybackSpeed(0.75)}
                className="hover:text-indigo-600"
              >
                0.75x
              </button>
              <button
                type="button"
                onClick={() => onChangePlaybackSpeed(1.0)}
                className="hover:text-indigo-600 font-bold text-indigo-600"
              >
                1.00x (Normal)
              </button>
              <button
                type="button"
                onClick={() => onChangePlaybackSpeed(1.5)}
                className="hover:text-indigo-600"
              >
                1.50x
              </button>
              <button
                type="button"
                onClick={() => onChangePlaybackSpeed(2.0)}
                className="hover:text-indigo-600"
              >
                2.00x
              </button>
            </div>
          </div>

          {/* Pitch Semitones Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Pitch Detune Offset</span>
              <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200/60 shadow-2xs">
                {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} semitones
              </span>
            </div>
            <input
              id="live-pitch-semitones-slider"
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchSemitones}
              onChange={(e) => onChangePitchSemitones(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg transition-all"
            />
            <div className="flex justify-between text-[10px] text-slate-500 px-0.5 font-mono">
              <button
                type="button"
                onClick={() => onChangePitchSemitones(-12)}
                className="hover:text-purple-600"
              >
                -12 (Octave Down)
              </button>
              <button
                type="button"
                onClick={() => onChangePitchSemitones(0)}
                className="hover:text-purple-600 font-bold text-purple-600"
              >
                0 (Original)
              </button>
              <button
                type="button"
                onClick={() => onChangePitchSemitones(12)}
                className="hover:text-purple-600"
              >
                +12 (Octave Up)
              </button>
            </div>
          </div>
        </div>

        {/* Acoustic EQ Filters */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Mic2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Acoustic EQ & Room Profile (Web Audio DSP)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {FILTER_PRESETS.map((filter) => {
              const active = audioFilter === filter.id;
              return (
                <motion.button
                  key={filter.id}
                  type="button"
                  id={`filter-preset-${filter.id}`}
                  onClick={() => onChangeAudioFilter(filter.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-2.5 rounded-xl border text-left transition select-none cursor-pointer ${
                    active
                      ? "border-blue-600 bg-blue-50/90 text-blue-950 font-bold shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs block font-bold leading-tight">{filter.label}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-normal">
                    {filter.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {!hasAudioLoaded && (
          <p className="text-[11px] text-slate-500 text-center italic mt-1">
            Generate speech to audition real-time pitch shifting, tempo modulation, and room EQ in real time
          </p>
        )}
      </div>
    </div>
  );
};
