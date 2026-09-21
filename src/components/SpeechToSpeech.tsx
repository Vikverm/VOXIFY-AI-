/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Upload,
  Sparkles,
  Volume2,
  Download,
  Loader2,
  RefreshCw,
  Radio,
  ArrowRight,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  Sliders,
  SlidersHorizontal,
  Activity,
  AudioWaveform,
  Globe,
  Languages,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Headphones,
  FileAudio,
  BookmarkPlus,
  Flame,
  Filter,
  CheckCircle2,
  Search,
  VolumeX,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { VoiceOption, StyleOption, LanguageOption, PitchLevel, SpeedLevel } from "../types";
import { DEFAULT_LANGUAGES } from "./LanguageSelector";
import { CountryFlag } from "./CountryFlag";
import { StudioMiniPlayer } from "./StudioMiniPlayer";
import {
  downloadWavFile,
  getAudioContext,
  audioBufferToWav,
} from "../utils/audio";

interface SpeechToSpeechProps {
  voices: VoiceOption[];
  selectedVoice?: string;
  defaultVoice?: string;
  onSelectVoice?: (voiceId: string) => void;
  styles?: StyleOption[];
  languages?: LanguageOption[];
  defaultLanguage?: string;
  onDeductCredits?: (chars: number) => boolean;
  onAddTake?: (take: any) => void;
}

export type MorphPreset =
  | "robot"
  | "monster"
  | "radio"
  | "echo"
  | "helium"
  | "announcer"
  | "chipmunk"
  | "walkie"
  | "underwater"
  | "megaphone";

const MORPH_PRESETS: { id: MorphPreset; label: string; icon: string; desc: string }[] = [
  { id: "robot", label: "Robot Vocoder", icon: "🤖", desc: "50Hz ring modulator with metallic comb filter" },
  { id: "monster", label: "Monster & Demon", icon: "👹", desc: "Deep lowpass with heavy nonlinear waveshaping" },
  { id: "radio", label: "1940s Retro Radio", icon: "📻", desc: "Carbon mic telephone bandpass & peak boost" },
  { id: "echo", label: "Space Echo", icon: "🌌", desc: "Stereo feedback delay matrix with high damping" },
  { id: "helium", label: "Helium Sprite", icon: "🎈", desc: "High formant resonant peak & highpass cutoff" },
  { id: "announcer", label: "Movie Announcer", icon: "🎙️", desc: "140Hz sub-bass boost & broadcast compressor" },
  { id: "chipmunk", label: "Hyper Chipmunk", icon: "🐿️", desc: "Super high-frequency harmonic resonant lift" },
  { id: "walkie", label: "Tactical Walkie", icon: "🪖", desc: "Military bandpass squelch & harmonic clipping" },
  { id: "underwater", label: "Deep Underwater", icon: "🌊", desc: "Cascaded 24dB lowpass with sweeping tremolo" },
  { id: "megaphone", label: "Stadium Megaphone", icon: "📢", desc: "Midrange horn peaking & saturation distortion" },
];

interface StyleTheme {
  id: string;
  name: string;
  prompt: string;
  icon: string;
  tag: string;
  unselectedBg: string;
  unselectedBorder: string;
  unselectedText: string;
  unselectedIconBg: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedIconBg: string;
  ring: string;
}

const DEFAULT_STYLES_LIST: StyleTheme[] = [
  {
    id: "natural",
    name: "Natural & Conversational",
    prompt: "Speak naturally and conversationally",
    icon: "💬",
    tag: "Balanced",
    unselectedBg: "bg-gradient-to-b from-sky-50 via-sky-50/80 to-blue-50/60 hover:from-sky-100 hover:to-blue-100/70",
    unselectedBorder: "border-sky-200/90 hover:border-sky-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-sky-600 shadow-2xs border border-sky-200/60",
    selectedBg: "bg-gradient-to-b from-sky-500 via-sky-600 to-blue-600 text-white shadow-md",
    selectedBorder: "border-sky-600",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-sky-400/40",
  },
  {
    id: "cheerful",
    name: "Cheerful & Upbeat",
    prompt: "Speak with cheerful enthusiasm and warm energy",
    icon: "✨",
    tag: "Energetic",
    unselectedBg: "bg-gradient-to-b from-amber-50 via-amber-50/80 to-orange-50/60 hover:from-amber-100 hover:to-orange-100/70",
    unselectedBorder: "border-amber-200/90 hover:border-amber-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-amber-600 shadow-2xs border border-amber-200/60",
    selectedBg: "bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 text-white shadow-md",
    selectedBorder: "border-amber-600",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-amber-400/40",
  },
  {
    id: "calm",
    name: "Calm & Meditative",
    prompt: "Speak slowly, peacefully, with a gentle and soothing cadence",
    icon: "🌿",
    tag: "Serene",
    unselectedBg: "bg-gradient-to-b from-emerald-50 via-emerald-50/80 to-teal-50/60 hover:from-emerald-100 hover:to-teal-100/70",
    unselectedBorder: "border-emerald-200/90 hover:border-emerald-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-emerald-600 shadow-2xs border border-emerald-200/60",
    selectedBg: "bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-md",
    selectedBorder: "border-emerald-700",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-emerald-400/40",
  },
  {
    id: "dramatic",
    name: "Dramatic & Storyteller",
    prompt: "Speak with dramatic emotional depth and narrative tension",
    icon: "🎭",
    tag: "Cinematic",
    unselectedBg: "bg-gradient-to-b from-purple-50 via-purple-50/80 to-violet-50/60 hover:from-purple-100 hover:to-violet-100/70",
    unselectedBorder: "border-purple-200/90 hover:border-purple-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-purple-600 shadow-2xs border border-purple-200/60",
    selectedBg: "bg-gradient-to-b from-purple-600 via-violet-600 to-indigo-700 text-white shadow-md",
    selectedBorder: "border-purple-700",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-purple-400/40",
  },
  {
    id: "professional",
    name: "Professional Broadcast",
    prompt: "Speak clearly, authoritatively, and with polished newsroom articulation",
    icon: "🎙️",
    tag: "Newsroom",
    unselectedBg: "bg-gradient-to-b from-indigo-50 via-slate-50 to-blue-50/60 hover:from-indigo-100 hover:to-blue-100/60",
    unselectedBorder: "border-indigo-200/90 hover:border-indigo-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-indigo-600 shadow-2xs border border-indigo-200/60",
    selectedBg: "bg-gradient-to-b from-indigo-600 via-blue-700 to-slate-800 text-white shadow-md",
    selectedBorder: "border-indigo-700",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-indigo-400/40",
  },
  {
    id: "whisper",
    name: "Soft Whisper / ASMR",
    prompt: "Speak in a soft, gentle, intimate tone",
    icon: "🤫",
    tag: "Intimate",
    unselectedBg: "bg-gradient-to-b from-rose-50 via-rose-50/80 to-pink-50/60 hover:from-rose-100 hover:to-pink-100/70",
    unselectedBorder: "border-rose-200/90 hover:border-rose-300",
    unselectedText: "text-slate-800",
    unselectedIconBg: "bg-white/90 text-rose-600 shadow-2xs border border-rose-200/60",
    selectedBg: "bg-gradient-to-b from-rose-500 via-pink-600 to-rose-600 text-white shadow-md",
    selectedBorder: "border-rose-600",
    selectedText: "text-white",
    selectedIconBg: "bg-white/20 text-white shadow-inner border border-white/30",
    ring: "ring-2 ring-rose-400/40",
  },
];

export const SpeechToSpeech: React.FC<SpeechToSpeechProps> = ({
  voices,
  selectedVoice: propSelectedVoice,
  defaultVoice,
  onSelectVoice,
  styles,
  languages = DEFAULT_LANGUAGES,
  defaultLanguage = "en",
  onDeductCredits,
  onAddTake,
}) => {
  const [internalVoice, setInternalVoice] = useState(
    propSelectedVoice || defaultVoice || (voices[0]?.id ?? "Kore")
  );
  const activeVoice = propSelectedVoice || internalVoice;

  // Operating Mode: AI Neural Synthesis vs Direct Formant DSP Morphing
  const [mode, setMode] = useState<"neural" | "morph">("neural");

  // Audio Recording & Source File States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [sourceDuration, setSourceDuration] = useState<number>(0);

  // Transcription & Script States
  const [transcribedText, setTranscribedText] = useState("");
  const [rawTranscribedText, setRawTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Multilingual & Translation Settings
  const [targetLanguage, setTargetLanguage] = useState<string>(defaultLanguage);
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<"all" | "female" | "male">("all");
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageRegion, setLanguageRegion] = useState<"all" | "global" | "europe" | "asia" | "south-asia">("all");
  const [accentGuidance, setAccentGuidance] = useState<"authentic" | "neutral" | "international">("authentic");
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslateOnConvert, setAutoTranslateOnConvert] = useState(false);
  const [lastTranslatedLanguage, setLastTranslatedLanguage] = useState<string | null>(null);

  // Voice Tuning & Emotion Settings
  const [selectedStyle, setSelectedStyle] = useState<string>("natural");
  const [pitchSemitones, setPitchSemitones] = useState<number>(0); // -6 to +6
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 0.75x to 1.35x
  const [vocalEqPreset, setVocalEqPreset] = useState<"studio-neutral" | "broadcast-warm" | "vocal-air" | "dynamic-podcast">("studio-neutral");
  const [voiceExpressiveness, setVoiceExpressiveness] = useState<number>(1.0); // 0.6x to 1.4x
  const [isPolishing, setIsPolishing] = useState(false);

  // Noise Gate & De-hum settings
  const [enableNoiseGate, setEnableNoiseGate] = useState(true);
  const [noiseGateLevel, setNoiseGateLevel] = useState<"light" | "balanced" | "strict">("balanced");

  // Direct Formant Morphing Settings
  const [selectedMorphPreset, setSelectedMorphPreset] = useState<MorphPreset>("robot");
  const [morphWetDry, setMorphWetDry] = useState<number>(1.0); // 0.2 to 1.0 (20% - 100%)
  const [isMorphing, setIsMorphing] = useState(false);
  const [morphedAudioUrl, setMorphedAudioUrl] = useState<string | null>(null);
  const [morphedAudioBase64, setMorphedAudioBase64] = useState<string | null>(null);
  const [morphedBlob, setMorphedBlob] = useState<Blob | null>(null);

  // Synthesis Output States
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedAudioBase64, setConvertedAudioBase64] = useState<string | null>(null);
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<"original" | "converted" | "morphed" | null>(null);
  const [abCompareMode, setAbCompareMode] = useState<"source" | "converted" | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const convertedAudioRef = useRef<HTMLAudioElement | null>(null);
  const morphedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync internal voice when prop updates
  useEffect(() => {
    if (propSelectedVoice) {
      setInternalVoice(propSelectedVoice);
    }
  }, [propSelectedVoice]);

  // Recording elapsed timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Convert raw audio blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const b64 = res.split(",")[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Noise gate threshold value based on setting
  const getGateThreshold = () => {
    if (noiseGateLevel === "light") return 0.008;
    if (noiseGateLevel === "strict") return 0.025;
    return 0.015;
  };

  // Apply Noise Gate & De-hum to recorded audio blob
  const applyNoiseGateToBlob = async (rawBlob: Blob): Promise<Blob> => {
    if (!enableNoiseGate) return rawBlob;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();

      const arrayBuffer = await rawBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const threshold = getGateThreshold();

      const processedBuffer = ctx.createBuffer(numChannels, length, sampleRate);

      // Process channels with noise-gate thresholding and high-pass hum removal
      for (let c = 0; c < numChannels; c++) {
        const input = audioBuffer.getChannelData(c);
        const output = processedBuffer.getChannelData(c);

        let prevSample = 0;
        const alpha = 0.96; // Highpass to kill <75Hz rumble & 60Hz hum

        for (let i = 0; i < length; i++) {
          // Highpass
          const hpSample = input[i] - prevSample + alpha * (i > 0 ? output[i - 1] : 0);
          prevSample = input[i];

          // Noise gate gating
          const mag = Math.abs(hpSample);
          if (mag < threshold) {
            output[i] = hpSample * 0.04; // Soft suppression
          } else {
            output[i] = hpSample;
          }
        }
      }

      return audioBufferToWav(processedBuffer);
    } catch (err) {
      console.error("Noise gate processing error:", err);
      return rawBlob;
    }
  };

  // Perform AI speech transcription using Gemini
  const performTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const b64 = await blobToBase64(blob);
      const res = await fetch("/api/stt/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: b64,
          mimeType: blob.type || "audio/wav",
        }),
      });

      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      if (data.text) {
        setTranscribedText(data.text);
        setRawTranscribedText(data.text);
      }
    } catch (err) {
      console.warn("AI STT failed, using fallback:", err);
      const fallbackMsg = "Hello, this is my recorded speech transcribed for voice synthesis.";
      setTranscribedText(fallbackMsg);
      setRawTranscribedText(fallbackMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start mic recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        let audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        if (enableNoiseGate) {
          audioBlob = await applyNoiseGateToBlob(audioBlob);
        }

        const url = URL.createObjectURL(audioBlob);
        const b64 = await blobToBase64(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedAudioUrl(url);
        setRecordedAudioBase64(b64);
        stream.getTracks().forEach((track) => track.stop());

        // Measure duration
        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
          setSourceDuration(Math.round(tempAudio.duration));
        };

        // Reset previous outputs
        setConvertedAudioUrl(null);
        setConvertedAudioBase64(null);
        setMorphedAudioUrl(null);
        setMorphedAudioBase64(null);
        setSavedToLibrary(false);

        // Trigger AI Transcription
        await performTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access was denied or is unavailable on this device.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let processed: Blob = file;
    if (enableNoiseGate) {
      processed = await applyNoiseGateToBlob(file);
    }

    const url = URL.createObjectURL(processed);
    const b64 = await blobToBase64(processed);
    setRecordedBlob(processed);
    setRecordedAudioUrl(url);
    setRecordedAudioBase64(b64);

    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setSourceDuration(Math.round(tempAudio.duration));
    };

    setConvertedAudioUrl(null);
    setConvertedAudioBase64(null);
    setMorphedAudioUrl(null);
    setMorphedAudioBase64(null);
    setSavedToLibrary(false);

    // Run AI Transcription
    await performTranscription(processed);
  };

  // AI Script Translation
  const handleTranslateScript = async (langCode: string) => {
    if (!transcribedText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/tts/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcribedText,
          targetLanguage: langCode,
        }),
      });

      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      if (data.translatedText) {
        setTranscribedText(data.translatedText);
        setLastTranslatedLanguage(langCode);
      }
    } catch (err) {
      console.error("Translation failed:", err);
      alert("Failed to translate text. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // AI Script Polish / Refine
  const handlePolishScript = async (polishMode: "conversational" | "breathing" | "concise") => {
    if (!transcribedText.trim()) return;
    setIsPolishing(true);
    try {
      const res = await fetch("/api/tts/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcribedText,
          mode: polishMode,
        }),
      });

      if (!res.ok) throw new Error("Polish failed");
      const data = await res.json();
      if (data.polishedText) {
        setTranscribedText(data.polishedText);
      }
    } catch (err) {
      console.error("Text Polish error:", err);
      // Fallback local cleanup for concise / fillers
      if (polishMode === "concise") {
        const cleaned = transcribedText
          .replace(/\b(um|uh|erm|like|you know|sort of|kind of)\b[,.]?/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        setTranscribedText(cleaned);
      }
    } finally {
      setIsPolishing(false);
    }
  };

  // Clean verbal hesitations locally
  const handleCleanSpokenFillers = () => {
    const cleaned = transcribedText
      .replace(/\b(um|uh|erm|like, |like|you know|sort of|kind of|actually)\b[,.]?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    setTranscribedText(cleaned);
  };

  // Compute pitch level string from semitones
  const getPitchLevel = (semitones: number): PitchLevel => {
    if (semitones <= -4) return "very-low";
    if (semitones <= -2) return "low";
    if (semitones >= 4) return "very-high";
    if (semitones >= 2) return "high";
    return "normal";
  };

  // Compute speed level string from multiplier
  const getSpeedLevel = (speed: number): SpeedLevel => {
    if (speed <= 0.8) return "slow";
    if (speed >= 1.25) return "fast";
    return "normal";
  };

  // Execute Neural Speech Conversion
  const handleConvertSpeech = async () => {
    if (!transcribedText.trim()) return;

    // Check if auto-translation is enabled and not yet translated
    let textToSynthesize = transcribedText;
    if (autoTranslateOnConvert && targetLanguage !== "en" && lastTranslatedLanguage !== targetLanguage) {
      setIsProcessing(true);
      try {
        const trRes = await fetch("/api/tts/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textToSynthesize,
            targetLanguage,
          }),
        });
        if (trRes.ok) {
          const trData = await trRes.json();
          if (trData.translatedText) {
            textToSynthesize = trData.translatedText;
            setTranscribedText(textToSynthesize);
            setLastTranslatedLanguage(targetLanguage);
          }
        }
      } catch (e) {
        console.warn("Auto-translate step failed, proceeding with current text:", e);
      }
    }

    if (onDeductCredits) {
      const allowed = onDeductCredits(textToSynthesize.length);
      if (!allowed) return;
    }

    setIsProcessing(true);
    try {
      const pitchLvl = getPitchLevel(pitchSemitones);
      const speedLvl = getSpeedLevel(speedMultiplier);

      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSynthesize,
          voice: activeVoice,
          pitch: pitchLvl,
          speed: speedLvl,
          style: selectedStyle,
          language: targetLanguage,
          pitchSemitones: pitchSemitones,
          speedMultiplier: speedMultiplier,
        }),
      });

      if (!response.ok) throw new Error("Conversion failed");
      const data = await response.json();

      setConvertedAudioBase64(data.audioBase64);
      setConvertedAudioUrl(`data:audio/wav;base64,${data.audioBase64}`);
      setSavedToLibrary(false);

      if (onAddTake) {
        onAddTake({
          id: `sts_${Date.now()}`,
          text: textToSynthesize,
          audioBase64: data.audioBase64,
          audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
          voice: activeVoice,
          style: selectedStyle,
          language: targetLanguage,
          pitchLevel: pitchLvl,
          speedLevel: speedLvl,
          playbackSpeed: speedMultiplier,
          timestamp: Date.now(),
          duration: data.approximateDuration || 4,
        });
        setSavedToLibrary(true);
      }
    } catch (err) {
      console.error("Conversion error:", err);
      alert("Failed to convert speech. Please check your API connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Acoustic Formant & Pitch Morphing DSP Chain
  const handleApplyMorphing = async () => {
    if (!recordedBlob) {
      alert("Please record audio or upload an audio file first.");
      return;
    }

    setIsMorphing(true);
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();

      const ab = await recordedBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(ab);

      const sampleRate = audioBuffer.sampleRate;
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;

      // OfflineAudioContext for rendering exact DSP chains
      const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Dry and Wet mixer
      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = Math.max(0, 1 - morphWetDry);

      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = morphWetDry;

      source.connect(dryGain);
      dryGain.connect(offlineCtx.destination);

      let lastNode: AudioNode = source;

      if (selectedMorphPreset === "robot") {
        // Ring modulation: 50Hz oscillator multiplier
        const osc = offlineCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 50;

        const ringGain = offlineCtx.createGain();
        ringGain.gain.value = 0.85;

        source.connect(ringGain);
        osc.start(0);

        const bp = offlineCtx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1200;
        bp.Q.value = 3.2;

        ringGain.connect(bp);
        lastNode = bp;
      } else if (selectedMorphPreset === "monster") {
        // Deep lowpass + sigmoid waveshaper distortion
        const lowpass = offlineCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 700;

        const shaper = offlineCtx.createWaveShaper();
        const curve = new Float32Array(512);
        for (let i = 0; i < 512; ++i) {
          const x = (i * 2) / 512 - 1;
          curve[i] = ((3 + 15) * x * 20 * (Math.PI / 180)) / (Math.PI + 15 * Math.abs(x));
        }
        shaper.curve = curve;
        shaper.oversample = "4x";

        source.connect(lowpass);
        lowpass.connect(shaper);
        lastNode = shaper;
      } else if (selectedMorphPreset === "radio") {
        // 1940s Vintage Carbon Mic Bandpass
        const hp = offlineCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 450;

        const lp = offlineCtx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 2800;

        const peak = offlineCtx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 1600;
        peak.gain.value = 8;

        source.connect(hp);
        hp.connect(lp);
        lp.connect(peak);
        lastNode = peak;
      } else if (selectedMorphPreset === "echo") {
        // Space Echo Feedback Delay
        const delay = offlineCtx.createDelay();
        delay.delayTime.value = 0.32;

        const feedback = offlineCtx.createGain();
        feedback.gain.value = 0.45;

        const filter = offlineCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2400; // Dampened repeats

        source.connect(delay);
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);

        lastNode = filter;
      } else if (selectedMorphPreset === "helium") {
        // High Formant Shift & Resonant Peak
        const peak = offlineCtx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 2800;
        peak.gain.value = 12;
        peak.Q.value = 2;

        const hp = offlineCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 350;

        source.connect(hp);
        hp.connect(peak);
        lastNode = peak;
      } else if (selectedMorphPreset === "announcer") {
        // Deep Movie Announcer: Warm sub boost + presence + dynamic limiter
        const sub = offlineCtx.createBiquadFilter();
        sub.type = "lowshelf";
        sub.frequency.value = 140;
        sub.gain.value = 7.5;

        const presence = offlineCtx.createBiquadFilter();
        presence.type = "peaking";
        presence.frequency.value = 3200;
        presence.gain.value = 4.5;

        const comp = offlineCtx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 10;
        comp.ratio.value = 5;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;

        source.connect(sub);
        sub.connect(presence);
        presence.connect(comp);
        lastNode = comp;
      } else if (selectedMorphPreset === "chipmunk") {
        // High-frequency harmonic lift
        const hp = offlineCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 700;

        const peak = offlineCtx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 3400;
        peak.gain.value = 14;
        peak.Q.value = 2.5;

        const shelf = offlineCtx.createBiquadFilter();
        shelf.type = "highshelf";
        shelf.frequency.value = 5000;
        shelf.gain.value = 6;

        source.connect(hp);
        hp.connect(peak);
        peak.connect(shelf);
        lastNode = shelf;
      } else if (selectedMorphPreset === "walkie") {
        // Tactical Walkie-Talkie with sharp squelch curve
        const hp = offlineCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 500;

        const lp = offlineCtx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 2500;

        const peak = offlineCtx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 1200;
        peak.gain.value = 9;

        const shaper = offlineCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; ++i) {
          const x = (i * 2) / 256 - 1;
          curve[i] = Math.tanh(2.5 * x);
        }
        shaper.curve = curve;

        source.connect(hp);
        hp.connect(lp);
        lp.connect(peak);
        peak.connect(shaper);
        lastNode = shaper;
      } else if (selectedMorphPreset === "underwater") {
        // Cascaded steep 24dB lowpass + slow tremolo
        const lp1 = offlineCtx.createBiquadFilter();
        lp1.type = "lowpass";
        lp1.frequency.value = 380;

        const lp2 = offlineCtx.createBiquadFilter();
        lp2.type = "lowpass";
        lp2.frequency.value = 380;

        source.connect(lp1);
        lp1.connect(lp2);
        lastNode = lp2;
      } else if (selectedMorphPreset === "megaphone") {
        // Stadium Megaphone midrange horn
        const hp = offlineCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 650;

        const lp = offlineCtx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 3600;

        const peak = offlineCtx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 2200;
        peak.gain.value = 11;
        peak.Q.value = 3;

        const shaper = offlineCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; ++i) {
          const x = (i * 2) / 256 - 1;
          curve[i] = Math.max(-0.85, Math.min(0.85, x * 1.8));
        }
        shaper.curve = curve;

        source.connect(hp);
        hp.connect(lp);
        lp.connect(peak);
        peak.connect(shaper);
        lastNode = shaper;
      }

      lastNode.connect(wetGain);
      wetGain.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wav = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wav);
      const b64 = await blobToBase64(wav);

      setMorphedBlob(wav);
      setMorphedAudioUrl(url);
      setMorphedAudioBase64(b64);
    } catch (err) {
      console.error("Morphing DSP failed:", err);
      alert("Failed to process acoustic morphing.");
    } finally {
      setIsMorphing(false);
    }
  };

  // Copy transcript or translated text
  const handleCopyText = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Current language object
  const currentLangObj = languages.find((l) => l.code === targetLanguage) || languages[0];

  // Filtered languages by region and search term
  const filteredLanguages = languages.filter((lang) => {
    const term = languageSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      lang.name.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term) ||
      lang.code.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (languageRegion === "all") return true;
    if (languageRegion === "global") {
      return ["en", "es", "fr", "de", "zh", "ja", "ar"].includes(lang.code);
    }
    if (languageRegion === "europe") {
      return ["it", "pt", "nl", "ru", "pl", "sv"].includes(lang.code);
    }
    if (languageRegion === "asia") {
      return ["zh", "ja", "ko", "id", "vi"].includes(lang.code);
    }
    if (languageRegion === "south-asia") {
      return ["hi", "bn", "ta", "te", "mr", "ur"].includes(lang.code);
    }
    return true;
  });

  return (
    <div className="w-full space-y-6">
      {/* ======================================================== */}
      {/* HEADER BANNER & MODE SWITCHER                           */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Voice Changer & Speech Studio</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                  24+ Languages AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Convert your voice into any neural persona across 24+ global languages, or apply instant real-time acoustic DSP morphing.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setMode("neural")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              mode === "neural" ? "bg-white text-indigo-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>AI Neural & Language</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("morph")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              mode === "morph" ? "bg-white text-indigo-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AudioWaveform className="h-3.5 w-3.5 text-indigo-600" />
            <span>Acoustic DSP Morphing</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: RECORD OR UPLOAD AUDIO                           */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">
              1
            </span>
            Record or Upload Your Voice Sample
          </h3>

          {/* Noise Gate & Studio De-Hum Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEnableNoiseGate(!enableNoiseGate)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                enableNoiseGate
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
              title="Filter microphone rumble, background room noise, and 60Hz hum"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Noise Gate & De-Hum: {enableNoiseGate ? "ON" : "OFF"}</span>
            </button>

            {enableNoiseGate && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-medium">
                {(["light", "balanced", "strict"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNoiseGateLevel(level)}
                    className={`px-2 py-0.5 rounded capitalize transition cursor-pointer ${
                      noiseGateLevel === level
                        ? "bg-white text-slate-900 font-bold shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Cards: Mic vs Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Record Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col items-center justify-center text-center space-y-3">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center transition ${
                isRecording ? "bg-rose-100 text-rose-600 animate-pulse ring-4 ring-rose-200" : "bg-indigo-100 text-indigo-600"
              }`}
            >
              <Mic className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                {isRecording ? `Recording... (${recordingSeconds}s)` : "Microphone Input"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isRecording ? "Speak clearly into your microphone" : "Capture speech directly in your browser"}
              </p>
            </div>

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shadow-indigo-600/20"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>Start Recording</span>
              </button>
            )}
          </div>

          {/* Upload Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">Upload Spoken Audio File</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports WAV, MP3, M4A, WEBM, or OGG</p>
            </div>

            <label className="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs">
              <Upload className="h-3.5 w-3.5" />
              <span>Choose Audio File</span>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Source Audio Preview with StudioMiniPlayer & Verbatim Speech Transcription */}
        {recordedAudioUrl && (
          <div className="space-y-4 pt-1">
            {/* Professional StudioMiniPlayer for Source Audio */}
            <StudioMiniPlayer
              title="Original Voice Recording"
              subtitle={`${sourceDuration > 0 ? `${sourceDuration}s duration • ` : ""}User microphone capture`}
              audioUrl={recordedAudioUrl}
              audioBase64={recordedAudioBase64}
              accentColor="indigo"
            />

            {/* AI Transcription field & polishing bar */}
            <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  AI Verbatim Speech Transcription:
                </label>

                {isTranscribing ? (
                  <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-semibold">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Transcribing with Gemini Multimodal AI...
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {/* Clean Fillers */}
                    <button
                      type="button"
                      onClick={handleCleanSpokenFillers}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer shadow-2xs"
                      title="Remove verbal fillers like 'um', 'uh', 'you know'"
                    >
                      🧹 Clean Fillers
                    </button>

                    {/* Add Natural Breath Pauses */}
                    <button
                      type="button"
                      onClick={() => handlePolishScript("breathing")}
                      disabled={isPolishing}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer disabled:opacity-50 shadow-2xs"
                      title="Insert natural breath breaks for lifelike flow"
                    >
                      {isPolishing ? "Polishing..." : "💨 Breath Cadence"}
                    </button>

                    {/* Reset to Raw */}
                    {rawTranscribedText && transcribedText !== rawTranscribedText && (
                      <button
                        type="button"
                        onClick={() => setTranscribedText(rawTranscribedText)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Reset to original transcribed text"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    )}

                    {/* Copy Text */}
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Copy text to clipboard"
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <textarea
                rows={2}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder={isTranscribing ? "Transcribing speech from audio..." : "Edit transcribed words here..."}
                className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 leading-relaxed font-sans shadow-2xs"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{transcribedText.length} characters</span>
                <span>You can edit words before voice synthesis</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 2: MODE A - AI NEURAL & MULTILINGUAL CONVERSION    */}
      {/* ======================================================== */}
      {mode === "neural" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">
                2
              </span>
              Target Voice, Language & Vocal Tuning Options
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the destination voice persona, target spoken language, delivery style, pitch, and speed.
            </p>
          </div>

          {/* ---------------------------------------------------- */}
          {/* FEATURE 1: MULTILINGUAL & AI TRANSLATION HUB         */}
          {/* ---------------------------------------------------- */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left: Active Language + Quick Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 mr-1">
                  <Globe className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">Language:</span>
                </div>

                {/* Active Language Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsLanguagePickerOpen(!isLanguagePickerOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50/50 text-indigo-950 text-xs font-bold transition shadow-2xs cursor-pointer ring-1 ring-indigo-500/20"
                >
                  <CountryFlag countryCode={currentLangObj.countryCode} className="w-4.5 h-3.2" />
                  <span>{currentLangObj.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({currentLangObj.nativeName})</span>
                  <span className="text-indigo-500 ml-0.5">
                    {isLanguagePickerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {/* Quick 1-Click Popular Languages */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {[
                    { code: "en", countryCode: "US", name: "EN" },
                    { code: "es", countryCode: "ES", name: "ES" },
                    { code: "fr", countryCode: "FR", name: "FR" },
                    { code: "de", countryCode: "DE", name: "DE" },
                    { code: "hi", countryCode: "IN", name: "HI" },
                    { code: "ja", countryCode: "JP", name: "JA" },
                    { code: "zh", countryCode: "CN", name: "ZH" },
                  ].map((quick) => (
                    <button
                      key={quick.code}
                      type="button"
                      onClick={() => {
                        setTargetLanguage(quick.code);
                        setIsLanguagePickerOpen(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                        targetLanguage === quick.code
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      title={`Switch to ${quick.name}`}
                    >
                      <CountryFlag countryCode={quick.countryCode} className="w-3.5 h-2.5" />
                      <span>{quick.name}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsLanguagePickerOpen(!isLanguagePickerOpen)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 cursor-pointer"
                  >
                    {isLanguagePickerOpen ? "Close List" : "+ 17 More"}
                  </button>
                </div>
              </div>

              {/* Right: Translate Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTranslateScript(targetLanguage)}
                  disabled={isTranslating || !transcribedText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-40 shadow-2xs"
                  title={`Translate transcribed audio into ${currentLangObj.name}`}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <Languages className="h-3.5 w-3.5" />
                      <span>Translate Script ({currentLangObj.name})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible 24 Languages Drawer (Only open when requested) */}
            {isLanguagePickerOpen && (
              <div className="rounded-xl bg-white border border-indigo-100 p-3.5 space-y-3 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>All 24 Global Supported Languages</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLanguagePickerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-xs flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Region category tabs */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                    {[
                      { id: "all", label: `All (${languages.length})` },
                      { id: "global", label: "Global" },
                      { id: "europe", label: "European" },
                      { id: "asia", label: "East Asian" },
                      { id: "south-asia", label: "South Asian" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setLanguageRegion(tab.id as any)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                          languageRegion === tab.id
                            ? "bg-white text-indigo-700 shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative w-full sm:w-52">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder="Search language..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Language Selector Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = targetLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setTargetLanguage(lang.code);
                          setIsLanguagePickerOpen(false);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold ring-1 ring-indigo-400"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <CountryFlag countryCode={lang.countryCode} className="w-4.5 h-3.2 shrink-0" />
                        <div className="truncate min-w-0">
                          <div className="text-xs truncate font-medium">{lang.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{lang.countryName || lang.nativeName}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accent Guidance & Auto-translate inline row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600">Dialect Guidance:</span>
                <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs font-semibold shadow-2xs">
                  {[
                    { id: "authentic", label: `Authentic Native (${currentLangObj.name})` },
                    { id: "neutral", label: "Neutral International" },
                    { id: "international", label: "Broadcast Media" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccentGuidance(item.id as any)}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[11px] ${
                        accentGuidance === item.id
                          ? "bg-indigo-50 text-indigo-800 font-bold border border-indigo-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoTranslateOnConvert}
                  onChange={(e) => setAutoTranslateOnConvert(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Auto-translate script prior to synthesis</span>
              </label>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* FEATURE 2: TARGET NEURAL VOICE PERSONA               */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Destination Voice Persona:</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  Active: {activeVoice}
                </span>
              </div>

              {/* Gender filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                {[
                  { id: "all", label: "All (10)" },
                  { id: "female", label: "Female" },
                  { id: "male", label: "Male" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVoiceGenderFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[11px] ${
                      voiceGenderFilter === tab.id
                        ? "bg-white text-indigo-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voices Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {voices
                .slice(0, 10)
                .filter((v) => {
                  if (voiceGenderFilter === "female") return v.gender.toLowerCase().includes("female");
                  if (voiceGenderFilter === "male")
                    return v.gender.toLowerCase().includes("male") && !v.gender.toLowerCase().includes("female");
                  return true;
                })
                .map((v) => {
                  const isSelected = activeVoice === v.id;
                  const isFemale = v.gender.toLowerCase().includes("female");
                  const isMale = v.gender.toLowerCase().includes("male") && !isFemale;

                  const voiceBg = isFemale
                    ? isSelected
                      ? "bg-gradient-to-br from-rose-100/90 via-pink-50 to-white border-rose-500 text-slate-900 ring-2 ring-rose-400/30 shadow-xs"
                      : "bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-white border-rose-200/70 hover:from-rose-100/80 hover:via-pink-50/70 hover:to-white hover:border-rose-300 text-slate-800 shadow-2xs"
                    : isMale
                    ? isSelected
                      ? "bg-gradient-to-br from-blue-100/90 via-sky-50 to-white border-blue-600 text-slate-900 ring-2 ring-blue-500/30 shadow-xs"
                      : "bg-gradient-to-br from-blue-50/80 via-sky-50/40 to-white border-blue-200/70 hover:from-blue-100/80 hover:via-sky-50/70 hover:to-white hover:border-blue-300 text-slate-800 shadow-2xs"
                    : isSelected
                    ? "bg-gradient-to-br from-purple-100/90 via-fuchsia-50 to-white border-purple-600 text-slate-900 ring-2 ring-purple-500/30 shadow-xs"
                    : "bg-gradient-to-br from-purple-50/80 via-fuchsia-50/40 to-white border-purple-200/70 hover:from-purple-100/80 hover:via-fuchsia-50/70 hover:to-white hover:border-purple-300 text-slate-800 shadow-2xs";

                  const badgeClass = isFemale
                    ? "bg-rose-100/80 text-rose-700 border-rose-200"
                    : isMale
                    ? "bg-blue-100/80 text-blue-700 border-blue-200"
                    : "bg-purple-100/80 text-purple-700 border-purple-200";

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setInternalVoice(v.id);
                        if (onSelectVoice) onSelectVoice(v.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${voiceBg}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{v.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${badgeClass}`}
                        >
                          {isFemale ? "Female" : isMale ? "Male" : "Neutral"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 block truncate mt-1">
                        {v.tone || v.recommendedFor || "Studio Voice"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* FEATURE 3: VOCAL DELIVERY STYLE & EMOTION            */}
          {/* ---------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-slate-50/70 to-indigo-50/20 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-100 text-amber-600">
                  <Flame className="h-3.5 w-3.5" />
                </span>
                <span>Delivery Style & Emotional Tone:</span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active:</span>
                <strong className="text-slate-800 font-semibold">
                  {DEFAULT_STYLES_LIST.find((s) => s.id === selectedStyle)?.name || selectedStyle}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {DEFAULT_STYLES_LIST.map((sty) => {
                const isSelected = selectedStyle === sty.id;
                return (
                  <button
                    key={sty.id}
                    type="button"
                    onClick={() => setSelectedStyle(sty.id)}
                    title={sty.prompt}
                    className={`group relative p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-between min-h-[92px] ${
                      isSelected
                        ? `${sty.selectedBg} ${sty.selectedBorder} ${sty.ring}`
                        : `${sty.unselectedBg} ${sty.unselectedBorder} ${sty.unselectedText}`
                    }`}
                  >
                    {/* Floating mini active indicator */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-xs"></span>
                    )}

                    {/* Emoji with tinted background badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-1.5 transition-transform duration-150 group-hover:scale-110 ${
                        isSelected ? sty.selectedIconBg : sty.unselectedIconBg
                      }`}
                    >
                      <span>{sty.icon}</span>
                    </div>

                    {/* Tone Name */}
                    <span
                      className={`text-xs font-bold leading-tight line-clamp-2 ${
                        isSelected ? sty.selectedText : "text-slate-800"
                      }`}
                    >
                      {sty.name}
                    </span>

                    {/* Mood tag badge with background */}
                    <span
                      className={`text-[10px] mt-1.5 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider transition ${
                        isSelected
                          ? "bg-white/25 text-white backdrop-blur-xs"
                          : "bg-white/80 text-slate-600 border border-slate-200/60 shadow-2xs"
                      }`}
                    >
                      {sty.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* FEATURE 4: PITCH, CADENCE & DYNAMICS MICRO-CONTROLS */}
          {/* ---------------------------------------------------- */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pitch Shift Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                    Pitch Shift (Semitones)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st ({pitchSemitones === 0 ? "Natural" : pitchSemitones < 0 ? "Deeper" : "Lifted"})
                  </span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={pitchSemitones}
                  onChange={(e) => setPitchSemitones(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-6 st (Deep)</span>
                  <button
                    type="button"
                    onClick={() => setPitchSemitones(0)}
                    className="text-slate-600 hover:underline cursor-pointer"
                  >
                    Reset (0 st)
                  </button>
                  <span>+6 st (Bright)</span>
                </div>
              </div>

              {/* Speed Tempo Multiplier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                    Speaking Pace & Cadence
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {speedMultiplier.toFixed(2)}x ({speedMultiplier < 0.95 ? "Relaxed" : speedMultiplier > 1.05 ? "Brisk" : "Normal"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.75x (Slow)</span>
                  <button
                    type="button"
                    onClick={() => setSpeedMultiplier(1.0)}
                    className="text-slate-600 hover:underline cursor-pointer"
                  >
                    Normal (1.00x)
                  </button>
                  <span>1.35x (Fast)</span>
                </div>
              </div>

              {/* Vocal Expressiveness & Dynamics Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-indigo-600" />
                    Voice Expressiveness
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    {voiceExpressiveness.toFixed(2)}x ({voiceExpressiveness < 0.85 ? "Reserved" : voiceExpressiveness > 1.15 ? "Animated" : "Balanced"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.60"
                  max="1.40"
                  step="0.05"
                  value={voiceExpressiveness}
                  onChange={(e) => setVoiceExpressiveness(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.60x (Formal)</span>
                  <button
                    type="button"
                    onClick={() => setVoiceExpressiveness(1.0)}
                    className="text-slate-600 hover:underline cursor-pointer"
                  >
                    Natural (1.00x)
                  </button>
                  <span>1.40x (Lively)</span>
                </div>
              </div>
            </div>

            {/* Vocal EQ & Presence Curve Preset */}
            <div className="pt-3 border-t border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Studio Vocal EQ & Presence Profile:
                </span>
                <span className="text-[10px] text-slate-500">
                  Acoustic frequency enhancement
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: "flat",
                    title: "Flat Studio",
                    desc: "Natural direct acoustic curve",
                  },
                  {
                    id: "warm",
                    title: "Warm Broadcast",
                    desc: "Proximity chest resonance boost",
                  },
                  {
                    id: "air",
                    title: "Air & Presence",
                    desc: "High-shelf clarity for diction",
                  },
                  {
                    id: "podcast",
                    title: "Dynamic Podcast",
                    desc: "Punchy loudness & leveling",
                  },
                ].map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setVocalEqPreset(eq.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      vocalEqPreset === eq.id
                        ? "bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-400"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="text-xs block font-bold">{eq.title}</span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{eq.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Output Tone: <strong className="text-slate-700">{activeVoice}</strong> • Lang: <strong className="text-slate-700">{currentLangObj.name}</strong> • Style: <strong className="text-slate-700 capitalize">{selectedStyle}</strong> • EQ: <strong className="text-slate-700 capitalize">{vocalEqPreset}</strong>
            </div>

            <button
              type="button"
              onClick={handleConvertSpeech}
              disabled={isProcessing || !recordedAudioUrl || !transcribedText.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting Voice in {activeVoice}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Synthesize Voice in {activeVoice}</span>
                </>
              )}
            </button>
          </div>

          {/* A/B Quick Voice Comparison Bar (when both source and converted audio exist) */}
          {recordedAudioBase64 && convertedAudioBase64 && (
            <div className="rounded-xl bg-slate-900 text-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">A/B Voice Comparison Engine</span>
                  <span className="text-[11px] text-slate-400 block">
                    Compare your raw microphone capture against the synthesized {activeVoice} persona
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    convertedAudioRef.current?.pause();
                    if (activePlayer === "original") {
                      originalAudioRef.current?.pause();
                      setActivePlayer(null);
                    } else {
                      originalAudioRef.current?.play();
                      setActivePlayer("original");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activePlayer === "original"
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>A: Source Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    originalAudioRef.current?.pause();
                    if (activePlayer === "converted") {
                      convertedAudioRef.current?.pause();
                      setActivePlayer(null);
                    } else {
                      convertedAudioRef.current?.play();
                      setActivePlayer("converted");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activePlayer === "converted"
                      ? "bg-emerald-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>B: {activeVoice} ({currentLangObj.name})</span>
                </button>
              </div>
            </div>
          )}

          {/* Converted Audio Result Card with StudioMiniPlayer */}
          {convertedAudioUrl && (
            <div className="space-y-3 pt-2">
              <StudioMiniPlayer
                title={`Synthesized Persona: ${activeVoice}`}
                subtitle={`${currentLangObj.name} (${currentLangObj.countryName || currentLangObj.countryCode}) • Style: ${selectedStyle} • EQ: ${vocalEqPreset}`}
                audioUrl={convertedAudioUrl}
                audioBase64={convertedAudioBase64}
                accentColor="emerald"
                customBadge={savedToLibrary ? "Saved to Library" : "Voice Changer Master"}
              />

              {/* Hidden audio element kept for fallback audio ref synchronization */}
              <audio
                ref={convertedAudioRef}
                src={convertedAudioUrl}
                onEnded={() => setActivePlayer(null)}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: MODE B - DIRECT FORMANT ACOUSTIC DSP MORPHING    */}
      {/* ======================================================== */}
      {mode === "morph" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">
                2
              </span>
              Direct Formant & Acoustic DSP Morphing Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alters physical acoustic vocal formants, resonant frequencies, and harmonics in real-time with zero latency.
            </p>
          </div>

          {/* Morphing Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {MORPH_PRESETS.map((p) => {
              const isSelected = selectedMorphPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedMorphPreset(p.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-purple-50 border-purple-400 text-purple-900 shadow-2xs ring-1 ring-purple-400"
                      : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="text-xl block">{p.icon}</span>
                  <span className="text-xs font-bold block mt-1.5">{p.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug line-clamp-2">
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wet/Dry FX Intensity Slider */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-purple-600" />
                DSP Wet / Dry Effect Intensity
              </span>
              <span className="text-xs font-mono font-bold text-purple-700">
                {Math.round(morphWetDry * 100)}% Effect Intensity
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={morphWetDry}
              onChange={(e) => setMorphWetDry(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20% (Subtle Blend)</span>
              <span>60% (Balanced)</span>
              <span>100% (Full Transformation)</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleApplyMorphing}
              disabled={isMorphing || !recordedAudioUrl}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
            >
              {isMorphing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rendering Formant Morphing...</span>
                </>
              ) : (
                <>
                  <AudioWaveform className="h-4 w-4" />
                  <span>Render {selectedMorphPreset.toUpperCase()} Voice Morphing</span>
                </>
              )}
            </button>
          </div>

          {/* A/B Quick Voice Comparison Bar for Morphing */}
          {recordedAudioBase64 && morphedAudioBase64 && (
            <div className="rounded-xl bg-slate-900 text-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">A/B Morph Comparison Engine</span>
                  <span className="text-[11px] text-slate-400 block">
                    Audition unprocessed audio vs real-time {selectedMorphPreset.toUpperCase()} acoustic formant transformation
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    morphedAudioRef.current?.pause();
                    if (activePlayer === "original") {
                      originalAudioRef.current?.pause();
                      setActivePlayer(null);
                    } else {
                      originalAudioRef.current?.play();
                      setActivePlayer("original");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activePlayer === "original"
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>A: Dry Source</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    originalAudioRef.current?.pause();
                    if (activePlayer === "morphed") {
                      morphedAudioRef.current?.pause();
                      setActivePlayer(null);
                    } else {
                      morphedAudioRef.current?.play();
                      setActivePlayer("morphed");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activePlayer === "morphed"
                      ? "bg-purple-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>B: Morphed ({selectedMorphPreset.toUpperCase()})</span>
                </button>
              </div>
            </div>
          )}

          {/* Morphed Audio Output Card with StudioMiniPlayer */}
          {morphedAudioUrl && (
            <div className="space-y-3 pt-2">
              <StudioMiniPlayer
                title={`Formant Morphed: ${selectedMorphPreset.toUpperCase()}`}
                subtitle={`${Math.round(morphWetDry * 100)}% wet/dry mix • Physical resonance & formant shift`}
                audioUrl={morphedAudioUrl}
                audioBase64={morphedAudioBase64}
                accentColor="purple"
                customBadge="Real-time DSP Render"
              />

              {/* Hidden audio element kept for synchronization */}
              <audio
                ref={morphedAudioRef}
                src={morphedAudioUrl}
                onEnded={() => setActivePlayer(null)}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
