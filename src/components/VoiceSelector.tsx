import React, { useState, useRef } from "react";
import { User, Volume2, Square, Loader2, Sparkles, Activity, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { VoiceOption } from "../types";
import { getAudioContext, base64ToArrayBuffer } from "../utils/audio";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
}

interface VoiceTheme {
  gradient: string;
  glow: string;
  borderActive: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  avatarBg: string;
}

// Visual theme configurations per voice character
const VOICE_THEMES: Record<string, VoiceTheme> = {
  Kore: {
    gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    glow: "shadow-rose-500/20",
    borderActive: "border-rose-500 ring-2 ring-rose-400/30",
    badgeBg: "bg-rose-100 text-rose-800",
    badgeText: "Warm & Melodic",
    dotColor: "bg-rose-500",
    avatarBg: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
  },
  Puck: {
    gradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
    glow: "shadow-cyan-500/20",
    borderActive: "border-cyan-500 ring-2 ring-cyan-400/30",
    badgeBg: "bg-cyan-100 text-cyan-800",
    badgeText: "Crisp & Lively",
    dotColor: "bg-cyan-500",
    avatarBg: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
  },
  Charon: {
    gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
    glow: "shadow-purple-500/20",
    borderActive: "border-purple-500 ring-2 ring-purple-400/30",
    badgeBg: "bg-purple-100 text-purple-800",
    badgeText: "Resonant & Deep",
    dotColor: "bg-purple-500",
    avatarBg: "bg-gradient-to-br from-purple-600 to-indigo-700 text-white",
  },
  Fenrir: {
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    glow: "shadow-amber-500/20",
    borderActive: "border-amber-500 ring-2 ring-amber-400/30",
    badgeBg: "bg-amber-100 text-amber-800",
    badgeText: "Authoritative",
    dotColor: "bg-amber-500",
    avatarBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
  },
  Zephyr: {
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    glow: "shadow-emerald-500/20",
    borderActive: "border-emerald-500 ring-2 ring-emerald-400/30",
    badgeBg: "bg-emerald-100 text-emerald-800",
    badgeText: "Airy & Fresh",
    dotColor: "bg-emerald-500",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  },
  Aoede: {
    gradient: "from-teal-500/10 via-cyan-500/5 to-transparent",
    glow: "shadow-teal-500/20",
    borderActive: "border-teal-500 ring-2 ring-teal-400/30",
    badgeBg: "bg-teal-100 text-teal-800",
    badgeText: "Breezy & Natural",
    dotColor: "bg-teal-500",
    avatarBg: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white",
  },
  Leda: {
    gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
    glow: "shadow-pink-500/20",
    borderActive: "border-pink-500 ring-2 ring-pink-400/30",
    badgeBg: "bg-pink-100 text-pink-800",
    badgeText: "Graceful & Warm",
    dotColor: "bg-pink-500",
    avatarBg: "bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white",
  },
  Orus: {
    gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
    glow: "shadow-blue-500/20",
    borderActive: "border-blue-500 ring-2 ring-blue-400/30",
    badgeBg: "bg-blue-100 text-blue-800",
    badgeText: "Bold & Dynamic",
    dotColor: "bg-blue-500",
    avatarBg: "bg-gradient-to-br from-blue-600 to-sky-600 text-white",
  },
  Callirrhoe: {
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    glow: "shadow-violet-500/20",
    borderActive: "border-violet-500 ring-2 ring-violet-400/30",
    badgeBg: "bg-violet-100 text-violet-800",
    badgeText: "Lyrical Storyteller",
    dotColor: "bg-violet-500",
    avatarBg: "bg-gradient-to-br from-violet-600 to-purple-700 text-white",
  },
  Autonoe: {
    gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
    glow: "shadow-indigo-500/20",
    borderActive: "border-indigo-500 ring-2 ring-indigo-400/30",
    badgeBg: "bg-indigo-100 text-indigo-800",
    badgeText: "Articulate & Clear",
    dotColor: "bg-indigo-500",
    avatarBg: "bg-gradient-to-br from-indigo-600 to-blue-600 text-white",
  },
  Enceladus: {
    gradient: "from-slate-600/10 via-indigo-600/5 to-transparent",
    glow: "shadow-slate-600/20",
    borderActive: "border-slate-700 ring-2 ring-slate-500/30",
    badgeBg: "bg-slate-100 text-slate-800",
    badgeText: "Cinematic Deep",
    dotColor: "bg-slate-700",
    avatarBg: "bg-gradient-to-br from-slate-700 to-indigo-900 text-white",
  },
  Despina: {
    gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
    glow: "shadow-yellow-500/20",
    borderActive: "border-amber-500 ring-2 ring-amber-400/30",
    badgeBg: "bg-amber-100 text-amber-900",
    badgeText: "Youthful & Bright",
    dotColor: "bg-amber-500",
    avatarBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  },
  Erinome: {
    gradient: "from-emerald-600/10 via-teal-600/5 to-transparent",
    glow: "shadow-emerald-600/20",
    borderActive: "border-emerald-600 ring-2 ring-emerald-500/30",
    badgeBg: "bg-emerald-100 text-emerald-900",
    badgeText: "Gentle Zen",
    dotColor: "bg-emerald-600",
    avatarBg: "bg-gradient-to-br from-emerald-600 to-teal-700 text-white",
  },
};

// Deterministic theme fallback generator
function getVoiceTheme(voice: VoiceOption): VoiceTheme {
  if (VOICE_THEMES[voice.id]) {
    return VOICE_THEMES[voice.id];
  }

  const isFemale = voice.gender.toLowerCase().includes("female");
  const isMale = voice.gender.toLowerCase().includes("male") && !isFemale;

  if (isFemale) {
    return {
      gradient: "from-rose-500/10 to-transparent",
      glow: "shadow-rose-500/20",
      borderActive: "border-rose-500 ring-2 ring-rose-400/30",
      badgeBg: "bg-rose-100 text-rose-800",
      badgeText: voice.tone.split(",")[0] || "Studio Female",
      dotColor: "bg-rose-500",
      avatarBg: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
    };
  }

  if (isMale) {
    return {
      gradient: "from-blue-500/10 to-transparent",
      glow: "shadow-blue-500/20",
      borderActive: "border-blue-600 ring-2 ring-blue-400/30",
      badgeBg: "bg-blue-100 text-blue-800",
      badgeText: voice.tone.split(",")[0] || "Studio Male",
      dotColor: "bg-blue-600",
      avatarBg: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white",
    };
  }

  return {
    gradient: "from-purple-500/10 to-transparent",
    glow: "shadow-purple-500/20",
    borderActive: "border-purple-600 ring-2 ring-purple-400/30",
    badgeBg: "bg-purple-100 text-purple-800",
    badgeText: voice.tone.split(",")[0] || "Studio Neutral",
    dotColor: "bg-purple-600",
    avatarBg: "bg-gradient-to-br from-purple-600 to-indigo-600 text-white",
  };
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
}) => {
  const [auditioningVoice, setAuditioningVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<"all" | "female" | "male" | "neutral">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioSampleCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  const femaleCount = voices.filter((v) => v.gender.toLowerCase().includes("female")).length;
  const maleCount = voices.filter(
    (v) => v.gender.toLowerCase().includes("male") && !v.gender.toLowerCase().includes("female")
  ).length;
  const neutralCount = voices.filter(
    (v) => !v.gender.toLowerCase().includes("female") && !v.gender.toLowerCase().includes("male")
  ).length;

  const filteredVoices = voices.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      v.gender.toLowerCase().includes(q) ||
      v.tone.toLowerCase().includes(q) ||
      (v.recommendedFor && v.recommendedFor.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (voiceGenderFilter === "female") {
      return v.gender.toLowerCase().includes("female");
    }
    if (voiceGenderFilter === "male") {
      return v.gender.toLowerCase().includes("male") && !v.gender.toLowerCase().includes("female");
    }
    if (voiceGenderFilter === "neutral") {
      return !v.gender.toLowerCase().includes("female") && !v.gender.toLowerCase().includes("male");
    }
    return true;
  });

  const stopAudition = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.onended = null;
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
      } catch {
        // Safe ignore
      }
      activeSourceRef.current = null;
    }
    setAuditioningVoice(null);
  };

  const handleAudition = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (auditioningVoice === voiceId) {
      stopAudition();
      return;
    }

    stopAudition();
    setLoadingVoice(voiceId);

    try {
      const audioCtx = getAudioContext();
      let buffer = audioSampleCacheRef.current.get(voiceId);

      if (!buffer) {
        const res = await fetch(`/api/tts/voice-sample?voice=${encodeURIComponent(voiceId)}`);
        const data = await res.json();
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || "Failed to load sample");
        }
        const arrayBuf = base64ToArrayBuffer(data.audioBase64);
        buffer = await audioCtx.decodeAudioData(arrayBuf);
        audioSampleCacheRef.current.set(voiceId, buffer);
      }

      setLoadingVoice(null);
      setAuditioningVoice(voiceId);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      activeSourceRef.current = source;

      source.onended = () => {
        setAuditioningVoice(null);
        activeSourceRef.current = null;
      };

      source.start(0);
    } catch (err) {
      console.error("Audition failed:", err);
      setLoadingVoice(null);
      setAuditioningVoice(null);
    }
  };

  return (
    <div id="voice-selector-section" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
            <User className="h-3.5 w-3.5" />
          </span>
          <span>Select AI Voice Personality ({filteredVoices.length})</span>
        </label>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            <span>Click sample to audition voice</span>
          </span>
          <span className="hidden sm:inline">&bull; 24kHz Studio Neural</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setVoiceGenderFilter("all")}
            className={`px-3 py-1 rounded-lg transition font-medium ${
              voiceGenderFilter === "all"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({voices.length})
          </button>
          <button
            type="button"
            onClick={() => setVoiceGenderFilter("female")}
            className={`px-3 py-1 rounded-lg transition font-medium ${
              voiceGenderFilter === "female"
                ? "bg-white text-rose-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Female ({femaleCount})
          </button>
          <button
            type="button"
            onClick={() => setVoiceGenderFilter("male")}
            className={`px-3 py-1 rounded-lg transition font-medium ${
              voiceGenderFilter === "male"
                ? "bg-white text-blue-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Male ({maleCount})
          </button>
          <button
            type="button"
            onClick={() => setVoiceGenderFilter("neutral")}
            className={`px-3 py-1 rounded-lg transition font-medium ${
              voiceGenderFilter === "neutral"
                ? "bg-white text-purple-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Neutral ({neutralCount})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoice;
          const isAuditioning = auditioningVoice === voice.id;
          const isLoadingSample = loadingVoice === voice.id;
          const theme = getVoiceTheme(voice);

          return (
            <motion.div
              key={voice.id}
              id={`voice-option-${voice.id.toLowerCase()}`}
              onClick={() => onSelectVoice(voice.id)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`group relative flex flex-col justify-between text-left p-3.5 rounded-2xl border cursor-pointer select-none overflow-hidden transition-all duration-200 ${
                isSelected
                  ? `bg-white ${theme.borderActive} shadow-lg ${theme.glow}`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-100"
              }`}
            >
              {/* Subtle dynamic background gradient accent */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${theme.gradient} opacity-80`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    {/* Character Avatar Icon */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shadow-xs transition-transform duration-200 group-hover:scale-105 ${theme.avatarBg}`}
                    >
                      {voice.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {voice.name}
                        </span>
                        {isSelected && (
                          <span className={`h-2 w-2 rounded-full ${theme.dotColor} animate-ping`} />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {voice.gender.split("/")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Audition Play/Stop Button with Animated Equalizer Bars */}
                  <button
                    type="button"
                    id={`audition-btn-${voice.id.toLowerCase()}`}
                    onClick={(e) => handleAudition(e, voice.id)}
                    title={isAuditioning ? "Stop Preview" : "Preview Voice Sample"}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all shadow-xs ${
                      isAuditioning
                        ? "bg-slate-900 text-white shadow-slate-900/30 ring-1 ring-white/20"
                        : isLoadingSample
                        ? "bg-slate-100 text-slate-500"
                        : isSelected
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isLoadingSample ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isAuditioning ? (
                      <>
                        {/* Animated Equalizer Bars */}
                        <div className="flex items-end gap-[2px] h-3">
                          <span className="w-1 bg-cyan-400 rounded-full animate-eq-1" />
                          <span className="w-1 bg-pink-400 rounded-full animate-eq-2" />
                          <span className="w-1 bg-amber-400 rounded-full animate-eq-3" />
                        </div>
                        <Square className="h-2.5 w-2.5 fill-current ml-0.5" />
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Sample</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2 mt-1">
                  {voice.tone}
                </p>
              </div>

              {/* Bottom tag bar */}
              <div className="relative z-10 mt-3 pt-2 border-t border-slate-100/90 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span
                  className="truncate max-w-[105px]"
                  title={`Recommended for: ${voice.recommendedFor}`}
                >
                  {voice.recommendedFor.split(",")[0]}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${theme.badgeBg}`}
                >
                  {voice.basePitch}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
