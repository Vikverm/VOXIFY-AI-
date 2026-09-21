import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  Volume2,
  Gauge,
  Sliders,
  Sparkles,
  Smile,
  Mic,
  Calendar,
  Eraser,
  HelpCircle,
  ChevronDown,
  Wind,
  Music,
} from "lucide-react";

interface SSMLToolbarProps {
  onInsertTag: (tag: string, endTag?: string) => void;
  onClearTags: () => void;
  voiceEngine: "neural" | "standard" | "turbo" | "high-res";
}

export const SSMLToolbar: React.FC<SSMLToolbarProps> = ({
  onInsertTag,
  onClearTags,
  voiceEngine,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div
      ref={toolbarRef}
      className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs select-none"
    >
      {/* Left: SSML Action Ribbon */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          SSML Tags:
        </span>

        {/* 1. PAUSE / BREAK DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("pause")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              activeDropdown === "pause"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Insert audio break / pause"
          >
            <Clock className="h-3 w-3 text-blue-600" />
            <span>Pause</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>

          {activeDropdown === "pause" && (
            <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Select Pause Duration
              </div>
              {[
                { label: "0.1s Micro-pause", tag: '<break time="0.1s"/>' },
                { label: "0.2s Comma break", tag: '<break time="0.2s"/>' },
                { label: "0.5s Sentence pause", tag: '<break time="0.5s"/>' },
                { label: "1.0s Breath break", tag: '<break time="1.0s"/>' },
                { label: "2.0s Paragraph pause", tag: '<break time="2.0s"/>' },
                { label: "3.0s Long transition", tag: '<break time="3.0s"/>' },
                { label: "4.0s Section divider", tag: '<break time="4.0s"/>' },
                { label: "5.0s Chapter break", tag: '<break time="5.0s"/>' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onInsertTag(item.tag + " ");
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. SPEED / PROSODY RATE DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("speed")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              activeDropdown === "speed"
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Adjust speech rate for selected text"
          >
            <Gauge className="h-3 w-3 text-purple-600" />
            <span>Speed</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>

          {activeDropdown === "speed" && (
            <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Voice Speed Tag
              </div>
              {[
                { label: "Very Slow (0.7x)", start: '<prosody rate="x-slow">', end: "</prosody>" },
                { label: "Slow (0.85x)", start: '<prosody rate="slow">', end: "</prosody>" },
                { label: "Medium (1.0x)", start: '<prosody rate="medium">', end: "</prosody>" },
                { label: "Fast (1.2x)", start: '<prosody rate="fast">', end: "</prosody>" },
                { label: "Very Fast (1.4x)", start: '<prosody rate="x-fast">', end: "</prosody>" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onInsertTag(item.start + " ", " " + item.end);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. PITCH DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("pitch")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              activeDropdown === "pitch"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Adjust voice pitch for selected text"
          >
            <Sliders className="h-3 w-3 text-indigo-600" />
            <span>Pitch</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>

          {activeDropdown === "pitch" && (
            <div className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Voice Pitch Tag
              </div>
              {[
                { label: "Very Low (-4st)", start: '<prosody pitch="x-low">', end: "</prosody>" },
                { label: "Low (-2st)", start: '<prosody pitch="low">', end: "</prosody>" },
                { label: "Default (0st)", start: '<prosody pitch="medium">', end: "</prosody>" },
                { label: "High (+2st)", start: '<prosody pitch="high">', end: "</prosody>" },
                { label: "Very High (+4st)", start: '<prosody pitch="x-high">', end: "</prosody>" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onInsertTag(item.start + " ", " " + item.end);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. VOLUME DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("volume")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              activeDropdown === "volume"
                ? "border-amber-600 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Adjust volume level for specific words"
          >
            <Volume2 className="h-3 w-3 text-amber-600" />
            <span>Volume</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>

          {activeDropdown === "volume" && (
            <div className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Voice Volume Tag
              </div>
              {[
                { label: "Soft (-6dB)", start: '<prosody volume="soft">', end: "</prosody>" },
                { label: "Medium (0dB)", start: '<prosody volume="medium">', end: "</prosody>" },
                { label: "Loud (+6dB)", start: '<prosody volume="loud">', end: "</prosody>" },
                { label: "X-Loud (+12dB)", start: '<prosody volume="x-loud">', end: "</prosody>" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onInsertTag(item.start + " ", " " + item.end);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. EMPHASIS BUTTON */}
        <button
          type="button"
          onClick={() => onInsertTag('<emphasis level="strong">', "</emphasis>")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          title="Emphasize important words"
        >
          <Sparkles className="h-3 w-3 text-emerald-600" />
          <span>Emphasis</span>
        </button>

        {/* 6. WHISPER BUTTON */}
        <button
          type="button"
          onClick={() => onInsertTag('<amazon:effect name="whispered">', "</amazon:effect>")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-teal-800 text-xs font-semibold transition cursor-pointer"
          title="Make voice soft and whispered"
        >
          <Smile className="h-3 w-3 text-teal-600" />
          <span>Whisper</span>
        </button>

        {/* 7. BREATH BUTTON */}
        <button
          type="button"
          onClick={() => onInsertTag('<amazon:breath duration="medium" volume="default"/> ')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-sky-800 text-xs font-semibold transition cursor-pointer"
          title="Insert natural breath sound"
        >
          <Wind className="h-3 w-3 text-sky-600" />
          <span>Breath</span>
        </button>

        {/* 8. SAY-AS / PRONUNCIATION FORMAT DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("say-as")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              activeDropdown === "say-as"
                ? "border-rose-600 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Format numbers, dates, times, or spell out letters"
          >
            <Calendar className="h-3 w-3 text-rose-600" />
            <span>Say-As</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>

          {activeDropdown === "say-as" && (
            <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30 space-y-0.5 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Interpret Text As
              </div>
              {[
                { label: "Spell Out Letters", start: '<say-as interpret-as="characters">', end: "</say-as>" },
                { label: "Individual Digits", start: '<say-as interpret-as="digits">', end: "</say-as>" },
                { label: "Telephone Number", start: '<say-as interpret-as="telephone">', end: "</say-as>" },
                { label: "Date (DMY / MDY)", start: '<say-as interpret-as="date" format="dmy">', end: "</say-as>" },
                { label: "Time (12h/24h)", start: '<say-as interpret-as="time">', end: "</say-as>" },
                { label: "Ordinal (1st, 2nd)", start: '<say-as interpret-as="ordinal">', end: "</say-as>" },
                { label: "Fraction (1/2, 3/4)", start: '<say-as interpret-as="fraction">', end: "</say-as>" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onInsertTag(item.start + " ", " " + item.end);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Clean / SSML Info */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClearTags}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
          title="Remove all SSML tags to keep plain text"
        >
          <Eraser className="h-3 w-3" />
          <span>Strip Tags</span>
        </button>

        <span className="hidden md:inline text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
          SSML 1.1 Supported
        </span>
      </div>
    </div>
  );
};
