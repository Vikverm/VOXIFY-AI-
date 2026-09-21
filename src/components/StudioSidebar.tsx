import React, { useState, useRef } from "react";
import {
  Sparkles,
  Cpu,
  Globe,
  Sliders,
  Volume2,
  Mic2,
  Radio,
  RotateCcw,
  Check,
  ChevronRight,
  Search,
  CheckCircle2,
  X,
  Gauge,
  SlidersHorizontal,
  Layers,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  VoiceOption,
  StyleOption,
  LanguageOption,
  PitchLevel,
  SpeedLevel,
  AudioFilterPreset,
  VoiceEngineType,
} from "../types";
import { CountryFlag } from "./CountryFlag";

interface StudioSidebarProps {
  // Voice engine
  voiceEngine: VoiceEngineType;
  onChangeVoiceEngine: (engine: VoiceEngineType) => void;

  // Language
  selectedLanguage: string;
  languages: LanguageOption[];
  onSelectLanguage: (code: string) => void;

  // Voices
  voices: VoiceOption[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;

  // Styles / Emotion
  styles: StyleOption[];
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;

  // Pitch & Speed
  modelPitch: PitchLevel;
  onChangeModelPitch: (pitch: PitchLevel) => void;
  modelSpeed: SpeedLevel;
  onChangeModelSpeed: (speed: SpeedLevel) => void;
  playbackSpeed: number;
  onChangePlaybackSpeed: (speed: number) => void;
  pitchSemitones: number;
  onChangePitchSemitones: (semitones: number) => void;

  // VoxFX Audio Filter
  audioFilter: AudioFilterPreset;
  onChangeAudioFilter: (filter: AudioFilterPreset) => void;
  onResetControls: () => void;

  // Optional controlled modal
  isLangModalOpen?: boolean;
  setIsLangModalOpen?: (open: boolean) => void;
  onToggleLangModal?: (open: boolean) => void;
}

const PITCH_LEVELS: { id: PitchLevel; label: string; desc: string }[] = [
  { id: "very-low", label: "Bass (-4st)", desc: "Deep" },
  { id: "low", label: "Warm (-2st)", desc: "Baritone" },
  { id: "normal", label: "Default (0st)", desc: "Natural" },
  { id: "high", label: "Bright (+2st)", desc: "Tenor/High" },
  { id: "very-high", label: "Melodic (+4st)", desc: "Airy" },
];

const SPEED_LEVELS: { id: SpeedLevel; label: string; desc: string }[] = [
  { id: "very-slow", label: "0.75x", desc: "Deliberate" },
  { id: "slow", label: "0.90x", desc: "Relaxed" },
  { id: "normal", label: "1.00x", desc: "Natural Pace" },
  { id: "fast", label: "1.20x", desc: "Brisk Tempo" },
  { id: "very-fast", label: "1.40x", desc: "Rapid Speech" },
];

const FILTER_PRESETS: { id: AudioFilterPreset; label: string; desc: string }[] = [
  { id: "none", label: "Studio Clean", desc: "Direct flat acoustic response" },
  { id: "warm-radio", label: "Warm Radio", desc: "FM broadcast podcast warmth" },
  { id: "vocal-clarity", label: "Vocal Clarity", desc: "Boosts presence & crisp articulation" },
  { id: "vintage-phone", label: "Vintage Lo-Fi", desc: "Bandpass telephone character" },
  { id: "cinematic-air", label: "Cinematic Air", desc: "Polished air, reverb & depth" },
];

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  voiceEngine,
  onChangeVoiceEngine,
  selectedLanguage,
  languages,
  onSelectLanguage,
  voices,
  selectedVoice,
  onSelectVoice,
  styles,
  selectedStyle,
  onSelectStyle,
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
  onResetControls,
  isLangModalOpen: externalIsLangModalOpen,
  setIsLangModalOpen: externalSetIsLangModalOpen,
  onToggleLangModal,
}) => {
  const [sidebarTab, setSidebarTab] = useState<"voice" | "tuning" | "voxfx">("voice");
  const [internalIsLangModalOpen, setInternalIsLangModalOpen] = useState(false);

  const isLangModalOpen = externalIsLangModalOpen !== undefined ? externalIsLangModalOpen : internalIsLangModalOpen;
  const setIsLangModalOpen = onToggleLangModal || externalSetIsLangModalOpen || setInternalIsLangModalOpen;

  const [langSearch, setLangSearch] = useState("");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<"all" | "female" | "male" | "neutral">("all");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [loadingSampleVoice, setLoadingSampleVoice] = useState<string | null>(null);

  const audioSampleCacheRef = useRef<Map<string, string>>(new Map());
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentLang = languages.find((l) => l.code === selectedLanguage) || languages[0];
  const activeVoiceObj = voices.find((v) => v.id === selectedVoice) || voices[0];
  const activeStyleObj = styles.find((s) => s.id === selectedStyle) || styles[0];
  const activeFilterObj = FILTER_PRESETS.find((f) => f.id === audioFilter) || FILTER_PRESETS[0];

  const femaleCount = voices.filter((v) => v.gender.toLowerCase().includes("female")).length;
  const maleCount = voices.filter(
    (v) => v.gender.toLowerCase().includes("male") && !v.gender.toLowerCase().includes("female")
  ).length;
  const neutralCount = voices.filter(
    (v) => !v.gender.toLowerCase().includes("female") && !v.gender.toLowerCase().includes("male")
  ).length;

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      (l.countryName && l.countryName.toLowerCase().includes(langSearch.toLowerCase())) ||
      (l.countryCode && l.countryCode.toLowerCase().includes(langSearch.toLowerCase())) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const filteredVoices = voices.filter((v) => {
    const q = voiceSearch.toLowerCase();
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

  // Stop any active audition
  const stopAudition = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPreviewingVoice(null);
    setLoadingSampleVoice(null);
  };

  // Quick voice sample preview using real Gemini TTS audio or fallback
  const handleAuditionVoice = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();
    if (previewingVoice === voiceId || loadingSampleVoice === voiceId) {
      stopAudition();
      return;
    }

    stopAudition();
    setLoadingSampleVoice(voiceId);

    try {
      // Check cache first
      let audioUrl = audioSampleCacheRef.current.get(voiceId);

      if (!audioUrl) {
        const res = await fetch(`/api/tts/voice-sample?voice=${encodeURIComponent(voiceId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.audioUrl) {
            audioUrl = data.audioUrl;
            audioSampleCacheRef.current.set(voiceId, audioUrl);
          }
        }
      }

      if (audioUrl) {
        setLoadingSampleVoice(null);
        setPreviewingVoice(voiceId);

        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          setPreviewingVoice(null);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          setPreviewingVoice(null);
          activeAudioRef.current = null;
        };

        await audio.play();
        return;
      }
    } catch {
      // Ignore and fallback to Web Speech API
    }

    // Fallback if network preview is unavailable
    setLoadingSampleVoice(null);
    setPreviewingVoice(voiceId);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Hello, this is ${voiceId} on Voxify Neural AI.`
      );
      utterance.rate = 1.0;
      utterance.onend = () => setPreviewingVoice(null);
      utterance.onerror = () => setPreviewingVoice(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPreviewingVoice(null), 1800);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Sleek Segmented Sidebar Navigation Tabs */}
      <div className="border-b border-slate-200/80 bg-slate-50/90 p-1.5 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setSidebarTab("voice")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarTab === "voice"
              ? "bg-white text-blue-700 shadow-xs ring-1 ring-blue-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Mic2 className="h-3.5 w-3.5" />
          <span>Voice</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab("tuning")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarTab === "tuning"
              ? "bg-white text-purple-700 shadow-xs ring-1 ring-purple-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Tuning</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab("voxfx")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarTab === "voxfx"
              ? "bg-white text-rose-700 shadow-xs ring-1 ring-rose-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>VoxFX™</span>
        </button>
      </div>

      {/* Clean Quick Summary Pill Bar */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
            <CountryFlag countryCode={currentLang.countryCode} className="w-3.5 h-2.5 shrink-0" />
            <span>{activeVoiceObj?.name || selectedVoice}</span>
          </span>
          <span>&bull;</span>
          <span className="truncate text-slate-600">{activeStyleObj?.name?.split(" ")[0]}</span>
          <span>&bull;</span>
          <span className="truncate text-slate-600">{activeFilterObj?.label}</span>
        </div>
        <span className="shrink-0 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
          {voiceEngine}
        </span>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: VOICE & LANGUAGE SELECTION                        */}
        {/* ======================================================== */}
        {sidebarTab === "voice" && (
          <div className="space-y-4">
            {/* 1. Language Picker Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-600" />
                  <span>Language / Dialect</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{languages.length} Available</span>
              </label>

              <button
                type="button"
                onClick={() => setIsLangModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/90 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CountryFlag countryCode={currentLang.countryCode} className="w-6 h-4.5 rounded-xs shadow-xs shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {currentLang.name} {currentLang.countryName ? `(${currentLang.countryName})` : ""}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {currentLang.nativeName} &bull; <span className="font-mono">{currentLang.code.toUpperCase()}</span>
                    </span>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-semibold hover:underline shrink-0">Change &rarr;</span>
              </button>
            </div>

            {/* 2. Engine Segmented Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-blue-600" />
                  <span>Synthesis Engine</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {voiceEngine === "high-res" ? "ProPlus 48k" : voiceEngine}
                </span>
              </label>

              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {[
                  { id: "neural", label: "Neural", sub: "Human" },
                  { id: "high-res", label: "Pro 48k", sub: "HD" },
                  { id: "turbo", label: "Turbo", sub: "Fast" },
                  { id: "standard", label: "Standard", sub: "Lite" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeVoiceEngine(item.id as VoiceEngineType)}
                    className={`py-1.5 px-1 rounded-lg text-center transition cursor-pointer ${
                      voiceEngine === item.id
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="block text-xs leading-tight">{item.label}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Voices List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mic2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Choose Voice ({filteredVoices.length})</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">
                  {voices.length} Studio Voices Available
                </span>
              </div>

              {/* Voice Category Filter Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100/90 text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setVoiceGenderFilter("all")}
                  className={`flex-1 py-1 rounded-md transition text-center ${
                    voiceGenderFilter === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  All ({voices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGenderFilter("female")}
                  className={`flex-1 py-1 rounded-md transition text-center ${
                    voiceGenderFilter === "female"
                      ? "bg-white text-slate-900 shadow-2xs font-bold text-rose-700"
                      : "hover:text-slate-900"
                  }`}
                >
                  Female ({femaleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGenderFilter("male")}
                  className={`flex-1 py-1 rounded-md transition text-center ${
                    voiceGenderFilter === "male"
                      ? "bg-white text-slate-900 shadow-2xs font-bold text-blue-700"
                      : "hover:text-slate-900"
                  }`}
                >
                  Male ({maleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGenderFilter("neutral")}
                  className={`flex-1 py-1 rounded-md transition text-center ${
                    voiceGenderFilter === "neutral"
                      ? "bg-white text-slate-900 shadow-2xs font-bold text-purple-700"
                      : "hover:text-slate-900"
                  }`}
                >
                  Neutral ({neutralCount})
                </button>
              </div>

              {/* Voice Filter Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, timbre, or use case..."
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
                />
                {voiceSearch && (
                  <button
                    type="button"
                    onClick={() => setVoiceSearch("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Voice Cards */}
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/60 p-2 shadow-2xs">
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredVoices.length === 0 ? (
                    <div className="text-center py-6 px-3 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No voices match "{voiceSearch}"
                    </div>
                  ) : (
                    filteredVoices.map((v) => {
                      const isSelected = v.id === selectedVoice;
                      const isAuditioning = previewingVoice === v.id;
                      const isLoadingThisSample = loadingSampleVoice === v.id;

                      const isFemale = v.gender.toLowerCase().includes("female");
                      const isMale = v.gender.toLowerCase().includes("male") && !isFemale;

                      // Themed backgrounds for cards based on voice archetype
                      const cardStyle = isFemale
                        ? {
                            card: isSelected
                              ? "bg-gradient-to-r from-rose-100/90 via-pink-50 to-white border-rose-500 text-slate-900 ring-2 ring-rose-400/30 shadow-xs"
                              : "bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-white border-rose-200/70 hover:from-rose-100/80 hover:via-pink-50/70 hover:to-white hover:border-rose-300 text-slate-800 shadow-2xs",
                            badge: "bg-rose-100/80 text-rose-700 border-rose-200",
                            avatarGrad: "from-rose-500 via-pink-500 to-rose-600 text-white",
                            checkColor: "text-rose-600",
                          }
                        : isMale
                        ? {
                            card: isSelected
                              ? "bg-gradient-to-r from-blue-100/90 via-sky-50 to-white border-blue-600 text-slate-900 ring-2 ring-blue-500/30 shadow-xs"
                              : "bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-white border-blue-200/70 hover:from-blue-100/80 hover:via-sky-50/70 hover:to-white hover:border-blue-300 text-slate-800 shadow-2xs",
                            badge: "bg-blue-100/80 text-blue-700 border-blue-200",
                            avatarGrad: "from-blue-600 via-indigo-600 to-blue-700 text-white",
                            checkColor: "text-blue-600",
                          }
                        : {
                            card: isSelected
                              ? "bg-gradient-to-r from-purple-100/90 via-fuchsia-50 to-white border-purple-600 text-slate-900 ring-2 ring-purple-500/30 shadow-xs"
                              : "bg-gradient-to-r from-purple-50/80 via-fuchsia-50/40 to-white border-purple-200/70 hover:from-purple-100/80 hover:via-fuchsia-50/70 hover:to-white hover:border-purple-300 text-slate-800 shadow-2xs",
                            badge: "bg-purple-100/80 text-purple-700 border-purple-200",
                            avatarGrad: "from-purple-600 via-fuchsia-600 to-purple-700 text-white",
                            checkColor: "text-purple-600",
                          };

                      return (
                        <div
                          key={v.id}
                          onClick={() => onSelectVoice(v.id)}
                          className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${cardStyle.card}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-2xs ring-2 ring-white/90 bg-gradient-to-br ${cardStyle.avatarGrad}`}
                            >
                              {v.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">{v.name}</span>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cardStyle.badge}`}
                                >
                                  {v.gender}
                                </span>
                                {v.basePitch && (
                                  <span className="text-[9px] text-slate-500 bg-white/80 border border-slate-200/60 px-1.5 py-0.2 rounded font-medium hidden sm:inline">
                                    {v.basePitch}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-600 block truncate mt-0.5">{v.tone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={(e) => handleAuditionVoice(e, v.id)}
                              disabled={isLoadingThisSample}
                              title="Sample voice preview"
                              className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
                                isAuditioning
                                  ? "bg-purple-600 text-white border-purple-700 shadow-xs animate-pulse"
                                  : isLoadingThisSample
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : "bg-white/90 hover:bg-white text-slate-500 hover:text-blue-600 border-slate-200/80 shadow-2xs"
                              }`}
                            >
                              {isLoadingThisSample ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {isSelected && <CheckCircle2 className={`h-4 w-4 shrink-0 ${cardStyle.checkColor}`} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TUNING, STYLES & EMOTIONS                         */}
        {/* ======================================================== */}
        {sidebarTab === "tuning" && (
          <div className="space-y-4">
            {/* Speaking Style / Emotion */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Speaking Emotion & Delivery</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {styles.map((st) => {
                  const isSelected = st.id === selectedStyle;
                  const icon =
                    st.id === "natural"
                      ? "💬"
                      : st.id === "cheerful"
                      ? "✨"
                      : st.id === "calm"
                      ? "🌿"
                      : st.id === "dramatic"
                      ? "🎭"
                      : st.id === "professional"
                      ? "🎙️"
                      : st.id === "whisper"
                      ? "🤫"
                      : "🎵";

                  const styleColors: Record<
                    string,
                    { unselected: string; selected: string }
                  > = {
                    natural: {
                      unselected: "bg-sky-50/80 hover:bg-sky-100/80 border-sky-200 text-slate-800",
                      selected: "bg-sky-600 border-sky-700 text-white shadow-sm ring-2 ring-sky-400/30 font-bold",
                    },
                    cheerful: {
                      unselected: "bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 text-slate-800",
                      selected: "bg-amber-600 border-amber-700 text-white shadow-sm ring-2 ring-amber-400/30 font-bold",
                    },
                    calm: {
                      unselected: "bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 text-slate-800",
                      selected: "bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/30 font-bold",
                    },
                    dramatic: {
                      unselected: "bg-purple-50/80 hover:bg-purple-100/80 border-purple-200 text-slate-800",
                      selected: "bg-purple-600 border-purple-700 text-white shadow-sm ring-2 ring-purple-400/30 font-bold",
                    },
                    professional: {
                      unselected: "bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200 text-slate-800",
                      selected: "bg-indigo-600 border-indigo-700 text-white shadow-sm ring-2 ring-indigo-400/30 font-bold",
                    },
                    whisper: {
                      unselected: "bg-rose-50/80 hover:bg-rose-100/80 border-rose-200 text-slate-800",
                      selected: "bg-rose-600 border-rose-700 text-white shadow-sm ring-2 ring-rose-400/30 font-bold",
                    },
                  };

                  const theme = styleColors[st.id] || {
                    unselected: "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700",
                    selected: "bg-purple-600 border-purple-700 text-white shadow-sm font-bold",
                  };

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectStyle(st.id)}
                      className={`p-2 rounded-xl text-left text-xs transition cursor-pointer flex items-center gap-2 border ${
                        isSelected ? theme.selected : theme.unselected
                      }`}
                    >
                      <span className="text-sm shrink-0">{icon}</span>
                      <span className="truncate font-semibold">{st.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pitch Register
                </label>
                <span className="text-[10px] text-blue-600 font-bold uppercase">{modelPitch}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PITCH_LEVELS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChangeModelPitch(p.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition text-center truncate ${
                      modelPitch === p.id
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={p.desc}
                  >
                    {p.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Speech Cadence & Tempo
                </label>
                <span className="text-[10px] text-purple-600 font-bold uppercase">{modelSpeed}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {SPEED_LEVELS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangeModelSpeed(s.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition text-center ${
                      modelSpeed === s.id
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={s.desc}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Semitone & Playback Sliders */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Pitch Micro-Tune:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st
                  </span>
                </div>
                <input
                  type="range"
                  min={-6}
                  max={6}
                  step={1}
                  value={pitchSemitones}
                  onChange={(e) => onChangePitchSemitones(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">Playback Rate:</span>
                  <span className="font-mono font-bold text-slate-900">{playbackSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={playbackSpeed}
                  onChange={(e) => onChangePlaybackSpeed(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={onResetControls}
                  className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 ml-auto underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Tuning</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: VOXFX™ AUDIO MASTERING FILTERS                     */}
        {/* ======================================================== */}
        {sidebarTab === "voxfx" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-rose-500" />
                <span>DSP Audio Mastering Filters</span>
              </label>
            </div>

            <div className="space-y-2">
              {FILTER_PRESETS.map((f) => {
                const isSelected = audioFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChangeAudioFilter(f.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-rose-600 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-500/30 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-slate-900">{f.label}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{f.desc}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">Real-Time DSP Processing</span>
              <p className="text-[11px] leading-relaxed">
                VoxFX™ filters are applied dynamically in your browser using standard Web Audio API
                biquad filtering, presence boosting, and acoustic dynamics.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Language Selection Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Select Voice Language & Dialect</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLangModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search languages or country codes (e.g., Spanish, es-ES)..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Languages Grid */}
            <div className="overflow-y-auto divide-y divide-slate-100 space-y-1 flex-1 pr-1">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsLangModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                    lang.code === selectedLanguage
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CountryFlag
                      countryCode={lang.countryCode}
                      className="w-8 h-5.5 rounded-xs shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold block">{lang.name}</span>
                        {lang.countryName && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {lang.countryName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {lang.nativeName} &bull; <span className="font-mono text-[10px]">{lang.code.toUpperCase()}</span>
                      </span>
                    </div>
                  </div>
                  {lang.code === selectedLanguage && (
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
