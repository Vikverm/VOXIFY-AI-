/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Download,
  Upload,
  UserCheck,
  Flame,
  Globe,
  Loader2,
  ShieldCheck,
  Star,
  Activity,
  AudioWaveform,
  Radio,
  SlidersHorizontal,
  RefreshCw,
  Layers,
  Wand2,
  CheckCircle2,
  Hash,
  Share2,
  Headphones,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { CustomVoice, VoiceOption, PitchLevel, SpeedLevel } from "../types";
import {
  downloadWavFile,
  ensureAudioContextRunning,
  decodeAudioDataSafe,
  playSpeakerTestChime,
} from "../utils/audio";
import { StudioMiniPlayer } from "./StudioMiniPlayer";

interface VoiceDesignerProps {
  baseVoices: VoiceOption[];
  customVoices: CustomVoice[];
  onSaveCustomVoice: (voice: CustomVoice) => void;
  onDeleteCustomVoice: (id: string) => void;
  onSelectForStudio: (voiceId: string) => void;
  onDeductCredits?: (chars: number) => boolean;
}

interface ArchetypePreset {
  id: string;
  name: string;
  category: "broadcast" | "cinema" | "corporate" | "zen" | "gaming" | "general";
  gender: string;
  age: "child" | "young-adult" | "mature" | "senior";
  accent: string;
  baseVoice: string;
  pitchSemitones: number;
  speedMultiplier: number;
  warmth: number;
  clarity: number;
  resonance: number;
  breathiness: number;
  avatarIcon: string;
  badgeColor: string;
  tags: string[];
  prompt: string;
}

export interface LanguageAndAccentOption {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  category: string;
  langCode: string;
  samplePhrase: string;
  dialectPrompt?: string;
}

export const LANGUAGE_AND_ACCENT_OPTIONS: LanguageAndAccentOption[] = [
  // 🌐 English Regional Accents & Dialects
  {
    id: "in",
    name: "Indian English",
    nativeName: "Indian English",
    flag: "🇮🇳",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "Welcome to the studio! Here is a natural preview of this custom voice profile with authentic Indian cadence.",
    dialectPrompt: "with authentic, clear Indian English cadence and natural inflection",
  },
  {
    id: "us",
    name: "American English",
    nativeName: "English (US)",
    flag: "🇺🇸",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "Welcome to the studio! This is a real-time preview of my custom vocal profile. How does my tone sound?",
    dialectPrompt: "with clear American English pronunciation",
  },
  {
    id: "uk",
    name: "British English (RP)",
    nativeName: "British English",
    flag: "🇬🇧",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "Welcome to the voice laboratory. Listen closely to the crisp diction and natural cadence of this voice.",
    dialectPrompt: "with authentic British RP accent and refined diction",
  },
  {
    id: "au",
    name: "Australian English",
    nativeName: "Australian English",
    flag: "🇦🇺",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "G'day and welcome to the studio! Check out the natural tone and warm acoustics of this voice.",
    dialectPrompt: "with natural Australian English accent and friendly cadence",
  },
  {
    id: "ca",
    name: "Canadian English",
    nativeName: "Canadian English",
    flag: "🇨🇦",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "Welcome to the voice designer. Hear your words come alive with clear, warm articulation.",
    dialectPrompt: "with natural Canadian English accent",
  },
  {
    id: "ie",
    name: "Irish English",
    nativeName: "Irish English",
    flag: "🇮🇪",
    category: "English Accents & Dialects",
    langCode: "en",
    samplePhrase: "Welcome to the sound studio. Listen to the melodic rhythm and warmth of this vocal persona.",
    dialectPrompt: "with warm Irish English melodic cadence",
  },

  // 🇮🇳 Indian Languages (भारतीय भाषाएं)
  {
    id: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "hi",
    samplePhrase: "नमस्ते और एआई वॉइस स्टूडियो में आपका स्वागत है। अपनी आवाज़ को प्राकृतिक पिच और गति के साथ अनुभव करें।",
  },
  {
    id: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "bn",
    samplePhrase: "এআই ভয়েস স্টুডিওতে স্বাগতম। স্বাভাবিক উচ্চারণ ও সুরের সাথে আপনার কণ্ঠ উপভোগ করুন।",
  },
  {
    id: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "ta",
    samplePhrase: "AI குரல் ஸ்டுடியோவிற்கு வரவேற்கிறோம். இயல்பான குரல் மற்றும் துல்லியமான உச்சரிப்பை உணருங்கள்.",
  },
  {
    id: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "te",
    samplePhrase: "AI వాయిస్ స్టూడియోకి స్వాగతం. స్పష్టమైన ఉచ్ఛారణ మరియు సహజమైన స్వరంతో వినండి.",
  },
  {
    id: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "mr",
    samplePhrase: "एआय व्हॉईस स्टुडिओमध्ये आपले स्वागत आहे. नैसर्गिक उच्चार आणि स्पष्ट आवाजाचा अनुभव घ्या.",
  },
  {
    id: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    category: "Indian Languages (भारतीय भाषाएं)",
    langCode: "ur",
    samplePhrase: "اے آئی وائس اسٹوڈیو میں خوش آمدید۔ قدرتی لہجے اور شاندار تلفظ کے ساتھ آواز کا تجربہ کریں۔",
  },

  // 🇪🇺 European Languages
  {
    id: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    category: "European Languages",
    langCode: "es",
    samplePhrase: "¡Hola a todos! Bienvenidos a nuestro estudio de voz impulsado por inteligencia artificial con entonación natural.",
  },
  {
    id: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    category: "European Languages",
    langCode: "fr",
    samplePhrase: "Bonjour et bienvenue dans notre studio vocal d'intelligence artificielle avec une diction fluide et naturelle.",
  },
  {
    id: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    category: "European Languages",
    langCode: "de",
    samplePhrase: "Willkommen im Sprachstudio. Erleben Sie lebendige, ausdrucksstarke Stimmen mit individueller Tonhöhe und Sprechgeschwindigkeit.",
  },
  {
    id: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    category: "European Languages",
    langCode: "it",
    samplePhrase: "Benvenuti nel nostro studio vocale basato su intelligenza artificiale, con cadenza melodica e naturale.",
  },
  {
    id: "pt",
    name: "Portuguese",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    category: "European Languages",
    langCode: "pt",
    samplePhrase: "Olá e bem-vindo ao estúdio de voz com tecnologia de ponta, trazendo entonação suave e expressiva.",
  },
  {
    id: "br",
    name: "Brazilian Portuguese",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    category: "European Languages",
    langCode: "pt",
    samplePhrase: "Olá e bem-vindo ao estúdio de voz com tecnologia de ponta, trazendo entonação suave e expressiva.",
  },
  {
    id: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    category: "European Languages",
    langCode: "nl",
    samplePhrase: "Welkom bij de AI Voice Studio. Ervaar natuurlijke spraaksynthese met heldere uitspraak en intonatie.",
  },
  {
    id: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    category: "European Languages",
    langCode: "ru",
    samplePhrase: "Добро пожаловать в студию искусственного интеллекта. Оцените выразительное и естественное звучание голоса.",
  },
  {
    id: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    category: "European Languages",
    langCode: "tr",
    samplePhrase: "Yapay zeka ses stüdyomuza hoş geldiniz. Doğal tonlama ve akıcı diksiyonla seslendirmenizi dinleyin.",
  },
  {
    id: "pl",
    name: "Polish",
    nativeName: "Polski",
    flag: "🇵🇱",
    category: "European Languages",
    langCode: "pl",
    samplePhrase: "Witamy w studiu syntezy mowy AI. Odkryj czystą intonację i naturalny rytm ludzkiego głosu.",
  },
  {
    id: "sv",
    name: "Swedish",
    nativeName: "Svenska",
    flag: "🇸🇪",
    category: "European Languages",
    langCode: "sv",
    samplePhrase: "Välkommen till AI Voice Studio. Upplev naturligt tal med personlig tonhöjd och rytm.",
  },

  // 🌏 Asian & Middle Eastern Languages
  {
    id: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    category: "Asian & Middle Eastern Languages",
    langCode: "ja",
    samplePhrase: "AI音声スタジオへようこそ。自然なイントネーションと抑揚で、あなたのテキストを生き生きと読み上げます。",
  },
  {
    id: "jp",
    name: "Japanese English",
    nativeName: "Japanese English",
    flag: "🇯🇵",
    category: "Asian & Middle Eastern Languages",
    langCode: "ja",
    samplePhrase: "AI音声スタジオへようこそ。自然なイントネーションと抑揚で、あなたのテキストを生き生きと読み上げます。",
  },
  {
    id: "zh",
    name: "Chinese Mandarin",
    nativeName: "中文 (普通话)",
    flag: "🇨🇳",
    category: "Asian & Middle Eastern Languages",
    langCode: "zh",
    samplePhrase: "欢迎使用智能语音工作室。体验自然流畅的语调与生动传神的语音合成。",
  },
  {
    id: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    category: "Asian & Middle Eastern Languages",
    langCode: "ko",
    samplePhrase: "AI 보이스 스튜디오에 오신 것을 환영합니다. 자연스러운 억양과 생생한 음성을 경험해보세요.",
  },
  {
    id: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    category: "Asian & Middle Eastern Languages",
    langCode: "ar",
    samplePhrase: "أهلاً بكم في استودیو الصوت بالذكاء الاصطناعي، بنبرة طبيعية وإلقاء متقن ومميز.",
  },
  {
    id: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    category: "Asian & Middle Eastern Languages",
    langCode: "vi",
    samplePhrase: "Chào mừng bạn đến với phòng thu giọng nói AI. Trải nghiệm phát âm tự nhiên và truyền cảm.",
  },
  {
    id: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    category: "Asian & Middle Eastern Languages",
    langCode: "id",
    samplePhrase: "Selamat datang di AI Voice Studio. Nikmati sintesis suara yang jernih dan berintonasi alami.",
  },
];

export const ACCENT_OPTIONS = LANGUAGE_AND_ACCENT_OPTIONS;

export const GROUPED_LANGUAGES_AND_ACCENTS = LANGUAGE_AND_ACCENT_OPTIONS.reduce(
  (acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  },
  {} as Record<string, LanguageAndAccentOption[]>
);

const ARCHETYPE_PRESETS: ArchetypePreset[] = [
  {
    id: "midnight-narrator",
    name: "Midnight Narrator",
    category: "cinema",
    gender: "Deep Male",
    age: "mature",
    accent: "us",
    baseVoice: "Charon",
    pitchSemitones: -3,
    speedMultiplier: 0.9,
    warmth: 90,
    clarity: 82,
    resonance: 85,
    breathiness: 25,
    avatarIcon: "🎙️",
    badgeColor: "indigo",
    tags: ["Cinematic", "Late Night", "Baritone"],
    prompt: "A soothing, cinematic late-night radio storyteller with gravelly warmth and profound cadence.",
  },
  {
    id: "energetic-tech-host",
    name: "Energetic Tech Host",
    category: "broadcast",
    gender: "Playful Neutral",
    age: "young-adult",
    accent: "us",
    baseVoice: "Puck",
    pitchSemitones: 2,
    speedMultiplier: 1.15,
    warmth: 65,
    clarity: 95,
    resonance: 70,
    breathiness: 15,
    avatarIcon: "⚡",
    badgeColor: "amber",
    tags: ["Tech", "Podcast", "Upbeat"],
    prompt: "A snappy, bright, dynamic tech podcast creator with upbeat inflection and sharp pronunciation.",
  },
  {
    id: "royal-audio-dramatist",
    name: "Royal Audio Dramatist",
    category: "cinema",
    gender: "Graceful Female",
    age: "mature",
    accent: "uk",
    baseVoice: "Leda",
    pitchSemitones: 0,
    speedMultiplier: 0.95,
    warmth: 82,
    clarity: 92,
    resonance: 80,
    breathiness: 20,
    avatarIcon: "👑",
    badgeColor: "purple",
    tags: ["Classical", "Audiobook", "Aristocratic"],
    prompt: "An elegant, theatrical British Shakespearean performer with aristocratic poise and crisp diction.",
  },
  {
    id: "mindfulness-zen-guide",
    name: "Mindfulness Zen Guide",
    category: "zen",
    gender: "Warm Female",
    age: "young-adult",
    accent: "in",
    baseVoice: "Kore",
    pitchSemitones: -1,
    speedMultiplier: 0.85,
    warmth: 95,
    clarity: 75,
    resonance: 90,
    breathiness: 45,
    avatarIcon: "🧘",
    badgeColor: "emerald",
    tags: ["Meditation", "Calm", "Intimate"],
    prompt: "A peaceful, breathy, compassionate meditation guide speaking with soft cadence and intimate presence.",
  },
  {
    id: "executive-keynote-speaker",
    name: "Executive Keynote Speaker",
    category: "corporate",
    gender: "Commanding Male",
    age: "senior",
    accent: "us",
    baseVoice: "Fenrir",
    pitchSemitones: -2,
    speedMultiplier: 1.05,
    warmth: 78,
    clarity: 94,
    resonance: 85,
    breathiness: 10,
    avatarIcon: "💼",
    badgeColor: "cyan",
    tags: ["Leadership", "Summit", "Authoritative"],
    prompt: "An authoritative Fortune 500 CEO addressing a global summit with persuasive, steady gravitas.",
  },
  {
    id: "cyberpunk-ai-synth",
    name: "Cyberpunk AI Operator",
    category: "gaming",
    gender: "Playful Neutral",
    age: "young-adult",
    accent: "us",
    baseVoice: "Zephyr",
    pitchSemitones: 3,
    speedMultiplier: 1.1,
    warmth: 50,
    clarity: 98,
    resonance: 65,
    breathiness: 5,
    avatarIcon: "🤖",
    badgeColor: "rose",
    tags: ["Sci-Fi", "Synth", "Futuristic"],
    prompt: "A futuristic tactical AI interface with immaculate precision, analytical cadence, and bright timbre.",
  },
  {
    id: "friendly-storyteller",
    name: "Cozy Storyteller",
    category: "cinema",
    gender: "Warm Female",
    age: "mature",
    accent: "in",
    baseVoice: "Aoede",
    pitchSemitones: 1,
    speedMultiplier: 0.95,
    warmth: 88,
    clarity: 86,
    resonance: 80,
    breathiness: 30,
    avatarIcon: "🌟",
    badgeColor: "amber",
    tags: ["Folklore", "Gentle", "Warm"],
    prompt: "A delightfully heartwarming narrator reciting enchanting stories with expressive character cadences.",
  },
  {
    id: "hardboiled-investigator",
    name: "Hard-Boiled Detective",
    category: "cinema",
    gender: "Deep Male",
    age: "mature",
    accent: "us",
    baseVoice: "Charon",
    pitchSemitones: -4,
    speedMultiplier: 0.88,
    warmth: 92,
    clarity: 78,
    resonance: 90,
    breathiness: 35,
    avatarIcon: "🕵️",
    badgeColor: "indigo",
    tags: ["Noir", "Gravelly", "Moody"],
    prompt: "A gritty 1950s noir private investigator murmuring inner monologues in rainy neon alleyways.",
  },
];

const AVATAR_GLYPHS = ["🎙️", "🎧", "⚡", "🌟", "🤖", "🎭", "👑", "🌊", "🦉", "💎", "🔥", "🔮"];

const BADGE_COLOR_MAP: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-400", dot: "bg-indigo-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-400", dot: "bg-purple-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-400", dot: "bg-emerald-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-400", dot: "bg-rose-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-400", dot: "bg-amber-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-400", dot: "bg-cyan-500" },
};

const AUDITION_SCRIPTS = [
  {
    id: "welcome",
    label: "Studio Greeting",
    icon: "🎙️",
    text: "Welcome to the studio! This is a real-time preview of my custom vocal profile. How does my tone sound?",
  },
  {
    id: "cinema",
    label: "Cinematic Trailer",
    icon: "🎬",
    text: "In a world shrouded by silence, one singular voice arose to reshape the destiny of civilizations.",
  },
  {
    id: "executive",
    label: "Corporate Keynote",
    icon: "💼",
    text: "Over the past fiscal quarter, our teams accelerated transformative breakthroughs across every core initiative.",
  },
  {
    id: "meditation",
    label: "Zen Mindfulness",
    icon: "🧘",
    text: "Allow yourself to breathe slowly and gently... notice the calm settling into this present moment.",
  },
  {
    id: "tech",
    label: "Podcast Host",
    icon: "📱",
    text: "Hey everyone! Welcome back to today's episode. Today we're diving deep into the next wave of neural audio synthesis.",
  },
];

const NAME_SUGGESTIONS = [
  "Vikas Prime",
  "Aria Sterling",
  "Dr. Elena Vance",
  "Marcus Blackwood",
  "Maya Sol",
  "Captain Orion",
  "Zephyr Nova",
  "Aiden Cross",
  "Serena Frost",
  "Kaelen Drake",
];

export const VoiceDesigner: React.FC<VoiceDesignerProps> = ({
  baseVoices,
  customVoices,
  onSaveCustomVoice,
  onDeleteCustomVoice,
  onSelectForStudio,
  onDeductCredits,
}) => {
  // Mode switcher: Blueprint Sculpting vs Audio Reference Cloning
  const [designerMode, setDesignerMode] = useState<"blueprint" | "clone">("blueprint");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Core Voice Blueprint States
  const [voiceName, setVoiceName] = useState("Vikas");
  const [avatarIcon, setAvatarIcon] = useState("🎙️");
  const [badgeColor, setBadgeColor] = useState("indigo");
  const [gender, setGender] = useState("Deep Male");
  const [age, setAge] = useState<"child" | "young-adult" | "mature" | "senior">("young-adult");
  const [accent, setAccent] = useState("in");
  const currentAccentOption =
    LANGUAGE_AND_ACCENT_OPTIONS.find((a) => a.id === accent) || LANGUAGE_AND_ACCENT_OPTIONS[0];
  const [baseVoice, setBaseVoice] = useState("Charon");
  const [pitchSemitones, setPitchSemitones] = useState<number>(-3);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [warmth, setWarmth] = useState<number>(85);
  const [clarity, setClarity] = useState<number>(80);
  const [resonance, setResonance] = useState<number>(80);
  const [breathiness, setBreathiness] = useState<number>(20);
  const [tags, setTags] = useState<string[]>(["Custom", "Deep"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [promptDescription, setPromptDescription] = useState(
    "A deep, warm conversational speaker with rich resonance, confident cadence, and authentic articulation."
  );

  // Reference Cloning States
  const [cloneInputMode, setCloneInputMode] = useState<"mic" | "upload">("mic");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [cloneExtractSummary, setCloneExtractSummary] = useState<string | null>(null);

  // Audition & Audio Transport States
  const [testPhrase, setTestPhrase] = useState(
    "Welcome to the studio! This is a real-time preview of my custom vocal profile. How does my tone sound?"
  );
  const [selectedScriptId, setSelectedScriptId] = useState("welcome");
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [auditionAudioUrl, setAuditionAudioUrl] = useState<string | null>(null);
  const [auditionAudioBase64, setAuditionAudioBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // Roster Management States
  const [rosterSearch, setRosterSearch] = useState("");
  const [playingRosterVoiceId, setPlayingRosterVoiceId] = useState<string | null>(null);

  // References
  const rosterAudioRef = useRef<HTMLAudioElement | null>(null);
  const rosterSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Handle Recording Timer
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

  // Apply Preset Archetype
  const handleApplyPreset = (preset: ArchetypePreset) => {
    setVoiceName(preset.name);
    setGender(preset.gender);
    setAge(preset.age);
    setAccent(preset.accent);
    setBaseVoice(preset.baseVoice);
    setPitchSemitones(preset.pitchSemitones);
    setSpeedMultiplier(preset.speedMultiplier);
    setWarmth(preset.warmth);
    setClarity(preset.clarity);
    setResonance(preset.resonance);
    setBreathiness(preset.breathiness);
    setAvatarIcon(preset.avatarIcon);
    setBadgeColor(preset.badgeColor);
    setTags(preset.tags);
    setPromptDescription(preset.prompt);
  };

  // Quick Name Generator
  const handleRandomizeName = () => {
    const randomName = NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)];
    setVoiceName(randomName);
  };

  // Tag Management
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^#/, "");
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Convert Blob to Base64
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

  // Audio Recording for Cloning
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCloneExtractSummary(null);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access was denied or is unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedAudioUrl(url);
    setCloneExtractSummary(null);
  };

  // AI Acoustic Feature Extraction & Voice Cloning
  const handleAnalyzeAndExtractClone = async () => {
    if (!recordedBlob) {
      alert("Please record speech or upload an audio file first.");
      return;
    }

    setIsAnalyzingClone(true);
    setAnalysisStep("Extracting acoustic pitch contour...");

    try {
      const b64 = await blobToBase64(recordedBlob);

      setTimeout(() => setAnalysisStep("Analyzing formant resonance and vocal tract..."), 700);
      setTimeout(() => setAnalysisStep("Detecting regional cadence and timbre..."), 1400);

      const res = await fetch("/api/voice-designer/clone-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: b64,
          mimeType: recordedBlob.type || "audio/wav",
        }),
      });

      if (!res.ok) throw new Error("Acoustic analysis failed");
      const data = await res.json();

      if (data.profile) {
        const p = data.profile;
        if (p.voiceName) setVoiceName(p.voiceName);
        if (p.gender) setGender(p.gender);
        if (p.age) setAge(p.age);
        if (p.accent) setAccent(p.accent);
        if (p.baseVoice) setBaseVoice(p.baseVoice);
        if (typeof p.pitchSemitones === "number") setPitchSemitones(p.pitchSemitones);
        if (typeof p.speedMultiplier === "number") setSpeedMultiplier(p.speedMultiplier);
        if (typeof p.warmth === "number") setWarmth(p.warmth);
        if (typeof p.clarity === "number") setClarity(p.clarity);
        if (typeof p.resonance === "number") setResonance(p.resonance);
        if (typeof p.breathiness === "number") setBreathiness(p.breathiness);
        if (p.promptDescription) setPromptDescription(p.promptDescription);

        setCloneExtractSummary(
          `Extracted Profile: ${p.voiceName} (${p.gender}, ${p.accent.toUpperCase()}) • Pitch: ${p.pitchSemitones > 0 ? `+${p.pitchSemitones}` : p.pitchSemitones}st • Cadence: ${p.speedMultiplier}x`
        );

        // Auto-switch to blueprint tab to show the populated controls
        setTimeout(() => {
          setDesignerMode("blueprint");
        }, 1200);
      }
    } catch (err: any) {
      console.error("Clone extraction error:", err);
      // Fallback
      setVoiceName("Acoustic Clone");
      setPitchSemitones(-2);
      setWarmth(85);
      setClarity(80);
      setCloneExtractSummary("Acoustic profile extracted from audio sample.");
    } finally {
      setIsAnalyzingClone(false);
      setAnalysisStep("");
    }
  };

  // Perform Live Audition Synthesis
  const handleAudition = async () => {
    if (!testPhrase.trim()) {
      setErrorMessage("Please enter a test phrase to audition.");
      return;
    }

    if (onDeductCredits) {
      const allowed = onDeductCredits(testPhrase.length);
      if (!allowed) return;
    }

    setErrorMessage(null);
    setIsAuditioning(true);

    try {
      let mappedPitch: PitchLevel = "normal";
      if (pitchSemitones <= -3) mappedPitch = "very-low";
      else if (pitchSemitones < 0) mappedPitch = "low";
      else if (pitchSemitones >= 3) mappedPitch = "very-high";
      else if (pitchSemitones > 0) mappedPitch = "high";

      let mappedSpeed: SpeedLevel = "normal";
      if (speedMultiplier <= 0.8) mappedSpeed = "very-slow";
      else if (speedMultiplier < 1.0) mappedSpeed = "slow";
      else if (speedMultiplier >= 1.3) mappedSpeed = "very-fast";
      else if (speedMultiplier > 1.05) mappedSpeed = "fast";

      const selectedOption =
        LANGUAGE_AND_ACCENT_OPTIONS.find((o) => o.id === accent) || LANGUAGE_AND_ACCENT_OPTIONS[0];
      const effectiveLanguage = selectedOption ? selectedOption.langCode : "en";
      const dialectInstruction = selectedOption?.dialectPrompt || "";

      let stylePrompt = promptDescription
        ? `${promptDescription}. Deliver with ${warmth > 75 ? "deep acoustic warmth and chest resonance" : "modern neutral clarity"}, ${clarity > 80 ? "pristine studio articulation" : "conversational flow"}, and ${breathiness > 30 ? "soft breath airiness" : "confident projection"}.`
        : `Deliver with ${warmth > 75 ? "warm, resonant chest tone" : "crisp modern clarity"} and ${breathiness > 30 ? "soft intimate breath" : "focused projection"}.`;

      if (dialectInstruction) {
        stylePrompt = `${stylePrompt} Speak ${dialectInstruction}.`;
      }

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testPhrase.trim(),
          voice: baseVoice,
          pitch: mappedPitch,
          speed: mappedSpeed,
          pitchSemitones,
          speedMultiplier,
          style: stylePrompt,
          language: effectiveLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Audition synthesis failed.");
      }

      setAuditionAudioUrl(data.audioUrl);
      setAuditionAudioBase64(data.audioBase64 || null);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("Audition voice error:", err);
      setErrorMessage(err.message || "Failed to audition custom voice.");
    } finally {
      setIsAuditioning(false);
    }
  };

  // Save to Custom Voice Roster
  const handleSave = () => {
    const finalName = voiceName.trim() || `Custom Voice ${customVoices.length + 1}`;
    const newCustomVoice: CustomVoice = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      gender,
      age,
      accent,
      baseVoice,
      pitchSemitones,
      speedMultiplier,
      warmth,
      clarity,
      resonance,
      breathiness,
      promptDescription: promptDescription.trim(),
      createdAt: Date.now(),
      isCustom: true,
      avatarIcon,
      badgeColor,
      tags,
    };

    onSaveCustomVoice(newCustomVoice);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3000);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
      });
    } catch {}
  };

  // Play preview in Roster card
  const handlePlayRosterPreview = async (voice: CustomVoice) => {
    if (playingRosterVoiceId === voice.id) {
      if (rosterSourceRef.current) {
        try {
          rosterSourceRef.current.stop();
          rosterSourceRef.current.disconnect();
        } catch {}
        rosterSourceRef.current = null;
      }
      if (rosterAudioRef.current) {
        rosterAudioRef.current.pause();
      }
      setPlayingRosterVoiceId(null);
      return;
    }

    if (rosterSourceRef.current) {
      try {
        rosterSourceRef.current.stop();
        rosterSourceRef.current.disconnect();
      } catch {}
      rosterSourceRef.current = null;
    }
    if (rosterAudioRef.current) {
      rosterAudioRef.current.pause();
    }

    setPlayingRosterVoiceId(voice.id);

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hello! I am ${voice.name}, ready for your studio production.`,
          voice: voice.baseVoice,
          pitchSemitones: voice.pitchSemitones,
          speedMultiplier: voice.speedMultiplier,
          style: voice.promptDescription || "natural",
        }),
      });
      const data = await res.json();
      const sourceAudio = data.audioBase64 || data.audioUrl;
      if (sourceAudio) {
        const ctx = await ensureAudioContextRunning();
        const buffer = await decodeAudioDataSafe(sourceAudio, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setPlayingRosterVoiceId(null);
          rosterSourceRef.current = null;
        };
        source.start(0);
        rosterSourceRef.current = source;
      } else {
        setPlayingRosterVoiceId(null);
      }
    } catch (e) {
      console.error("Failed to play roster sample:", e);
      setPlayingRosterVoiceId(null);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Pitch Semitone Musical Note Estimate
  const getPitchMusicalNote = (st: number) => {
    if (st === 0) return "A3 (Natural Base)";
    if (st <= -5) return "C2 (Sub-Bass Baritone)";
    if (st <= -3) return "D2 (Deep Bass)";
    if (st < 0) return "F2 (Rich Lows)";
    if (st <= 2) return "C3 (Warm Highs)";
    if (st <= 4) return "E3 (Bright Tenor/Alto)";
    return "G3 (Airy Soprano)";
  };

  // Filter presets
  const filteredPresets =
    selectedCategory === "all"
      ? ARCHETYPE_PRESETS
      : ARCHETYPE_PRESETS.filter((p) => p.category === selectedCategory);

  // Filter custom voices
  const filteredRoster = customVoices.filter((v) =>
    v.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    v.gender.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    (v.tags && v.tags.some((t) => t.toLowerCase().includes(rosterSearch.toLowerCase())))
  );

  const activeBadge = BADGE_COLOR_MAP[badgeColor] || BADGE_COLOR_MAP.indigo;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* TOP BROADCAST CONSOLE HEADER & MODE SWITCHER            */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  AI Voice Designer & Vocal Cloner
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neural Synthesizer v2.4 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Sculpt bespoke synthetic voice personas with parametric timbre, acoustic resonance, and regional dialect, or clone directly from an audio sample.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1.5 text-xs font-bold shrink-0 self-start lg:self-center border border-slate-200/80">
            <button
              type="button"
              onClick={() => setDesignerMode("blueprint")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
                designerMode === "blueprint"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <span>Acoustic Blueprint Sculptor</span>
            </button>
            <button
              type="button"
              onClick={() => setDesignerMode("clone")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
                designerMode === "clone"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mic className="h-4 w-4 text-indigo-600" />
              <span>Reference Sample Voice Cloner</span>
            </button>
          </div>
        </div>

        {/* Quick Archetypes Drawer */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>Studio Archetype Presets</span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Click any preset to load its full acoustic profile)
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              {[
                { id: "all", label: "All" },
                { id: "cinema", label: "🎬 Cinema" },
                { id: "broadcast", label: "🎙️ Broadcast" },
                { id: "corporate", label: "💼 Corporate" },
                { id: "zen", label: "🧘 Zen" },
                { id: "gaming", label: "🤖 Sci-Fi" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {filteredPresets.map((preset) => {
              const colorObj = BADGE_COLOR_MAP[preset.badgeColor] || BADGE_COLOR_MAP.indigo;
              const isSelected = voiceName === preset.name;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400 shadow-2xs"
                      : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{preset.avatarIcon}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${colorObj.bg} ${colorObj.text}`}>
                      {LANGUAGE_AND_ACCENT_OPTIONS.find((a) => a.id === preset.accent)?.flag || ""} {preset.accent.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 truncate">{preset.name}</div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {preset.pitchSemitones > 0 ? `+${preset.pitchSemitones}` : preset.pitchSemitones}st • {preset.speedMultiplier}x
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN TWO-COLUMN STUDIO WORKBENCH                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ====================================================== */}
        {/* LEFT COLUMN: BLUEPRINT OR CLONER (7 COLS)              */}
        {/* ====================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* ---------------------------------------------------- */}
          {/* MODE A: ACOUSTIC BLUEPRINT SCULPTOR                  */}
          {/* ---------------------------------------------------- */}
          {designerMode === "blueprint" && (
            <div className="space-y-5">
              {/* Card 1: Identity & Persona Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    <span>Voice Identity & Persona Details</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Suggest Name</span>
                  </button>
                </div>

                {/* Voice Name Input & Avatar Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Voice Persona Name / Handle
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        placeholder="e.g. Vikas Prime, Captain Orion, Dr. Vance..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-8 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition shadow-2xs"
                      />
                      {voiceName && (
                        <button
                          type="button"
                          onClick={() => setVoiceName("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Avatar Glyph Picker */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Persona Icon Glyph
                    </label>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 bg-slate-50/60">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                        {avatarIcon}
                      </div>
                      <div className="flex flex-wrap gap-1 overflow-x-auto py-0.5">
                        {AVATAR_GLYPHS.slice(0, 7).map((glyph) => (
                          <button
                            key={glyph}
                            type="button"
                            onClick={() => setAvatarIcon(glyph)}
                            className={`h-7 w-7 rounded-md text-xs flex items-center justify-center transition cursor-pointer ${
                              avatarIcon === glyph
                                ? "bg-white shadow-2xs font-bold ring-1 ring-indigo-500"
                                : "hover:bg-slate-200/70 text-slate-600"
                            }`}
                          >
                            {glyph}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags & Genre Chips */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-indigo-500" />
                      Persona Tags & Context
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Press enter to add custom tags
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50/40 min-h-[38px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 transition"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="+ Add tag..."
                      className="text-xs bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 px-1.5 min-w-[70px]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Neural Core, Dialect & Demographics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span>Neural Core, Dialect & Vocal Registers</span>
                </h3>

                {/* Base Model & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Base Neural Acoustic Model
                    </label>
                    <select
                      value={baseVoice}
                      onChange={(e) => setBaseVoice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      {baseVoices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender}) - {v.tone || v.recommendedFor || "Studio Voice"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gender & Tonal Character
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      <option value="Deep Male">Deep Male (Resonant Baritone)</option>
                      <option value="Authoritative Male">Authoritative Male (Broadcast)</option>
                      <option value="Warm Female">Warm Female (Conversational)</option>
                      <option value="Crisp Female">Crisp Female (Clear Studio)</option>
                      <option value="Playful Neutral">Playful Neutral / Non-Binary</option>
                      <option value="Child / Animated">Youthful / Animated Character</option>
                    </select>
                  </div>
                </div>

                {/* Age Demographic & Accent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Age Demographic
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["child", "young-adult", "mature", "senior"] as const).map((a) => {
                        const labels = {
                          child: "🧸 Child",
                          "young-adult": "⚡ Young",
                          mature: "🎙️ Mature",
                          senior: "📜 Senior",
                        };
                        const isSelected = age === a;
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAge(a)}
                            className={`rounded-xl py-2 text-[11px] font-bold transition cursor-pointer border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {labels[a]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Language & Regional Dialect
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {LANGUAGE_AND_ACCENT_OPTIONS.length} Languages & Accents
                      </span>
                    </div>
                    <select
                      id="voice-designer-language-select"
                      value={accent}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setAccent(nextId);
                        const selectedOpt = LANGUAGE_AND_ACCENT_OPTIONS.find((a) => a.id === nextId);
                        if (
                          selectedOpt &&
                          selectedOpt.samplePhrase &&
                          (selectedScriptId.startsWith("lang_") || selectedScriptId === "welcome")
                        ) {
                          setTestPhrase(selectedOpt.samplePhrase);
                          setSelectedScriptId(`lang_${selectedOpt.id}`);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none cursor-pointer transition shadow-2xs"
                    >
                      {Object.entries(GROUPED_LANGUAGES_AND_ACCENTS).map(([groupCategory, options]) => (
                        <optgroup key={groupCategory} label={groupCategory} className="font-bold text-slate-800 bg-slate-100">
                          {options.map((acc) => (
                            <option key={acc.id} value={acc.id} className="font-medium text-slate-800 bg-white">
                              {acc.flag} {acc.name} ({acc.nativeName})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {/* Selected Dialect details & 1-click test phrase button */}
                    {currentAccentOption && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600 bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{currentAccentOption.flag}</span>
                          <span className="font-bold text-slate-900">{currentAccentOption.name}</span>
                          <span className="text-slate-500 font-medium">({currentAccentOption.nativeName})</span>
                        </div>
                        {currentAccentOption.samplePhrase && (
                          <button
                            type="button"
                            onClick={() => {
                              setTestPhrase(currentAccentOption.samplePhrase);
                              setSelectedScriptId(`lang_${currentAccentOption.id}`);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline decoration-indigo-300 hover:decoration-indigo-600 text-[11px] flex items-center gap-1"
                          >
                            <span>Load {currentAccentOption.name} test phrase</span>
                            <span>➔</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Parametric Acoustic Sculptor */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-600" />
                      <span>Parametric Acoustic Sculptor</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Micro-adjust vocal tract formants, semitone shift, pacing tempo, and chest resonance.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPitchSemitones(0);
                      setSpeedMultiplier(1.0);
                      setWarmth(75);
                      setClarity(85);
                      setResonance(75);
                      setBreathiness(20);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Tuning</span>
                  </button>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span>Vocal Pitch Shift</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({getPitchMusicalNote(pitchSemitones)})
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-extrabold text-[11px]">
                      {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} semitones
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="1"
                    value={pitchSemitones}
                    onChange={(e) => setPitchSemitones(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>-6st (Heavy Baritone)</span>
                    <span className="font-bold text-slate-600">0st (Natural Base)</span>
                    <span>+6st (Airy Soprano)</span>
                  </div>
                </div>

                {/* Tempo Slider */}
                <div className="space-y-1.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span>Speaking Cadence & Tempo</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        (~{Math.round(145 * speedMultiplier)} words/min)
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-extrabold text-[11px]">
                      {speedMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.45"
                    step="0.05"
                    value={speedMultiplier}
                    onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>0.70x (Meditative Pacing)</span>
                    <span className="font-bold text-slate-600">1.00x (Conversational)</span>
                    <span>1.45x (High-Speed Narration)</span>
                  </div>
                </div>

                {/* 2x2 Acoustic Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Acoustic Warmth */}
                  <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Acoustic Warmth</span>
                      <span className="font-mono text-indigo-600 font-bold">{warmth}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={warmth}
                      onChange={(e) => setWarmth(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[9px] text-slate-400 block">
                      Sub-bass chest resonance & proximity
                    </span>
                  </div>

                  {/* Clarity */}
                  <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Studio Articulation</span>
                      <span className="font-mono text-indigo-600 font-bold">{clarity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={clarity}
                      onChange={(e) => setClarity(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[9px] text-slate-400 block">
                      High-frequency consonants & presence
                    </span>
                  </div>

                  {/* Vocal Tract Resonance */}
                  <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Vocal Tract Resonance</span>
                      <span className="font-mono text-indigo-600 font-bold">{resonance}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={resonance}
                      onChange={(e) => setResonance(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[9px] text-slate-400 block">
                      Formant cavern depth & fullness
                    </span>
                  </div>

                  {/* Breathiness */}
                  <div className="space-y-1 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Breathiness & Airiness</span>
                      <span className="font-mono text-indigo-600 font-bold">{breathiness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={breathiness}
                      onChange={(e) => setBreathiness(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[9px] text-slate-400 block">
                      Soft intimate whisper & ASMR breath
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Directorial Prompt */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Directorial Stylistic Prompt</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Guiding neural prosody & emotional nuance
                  </span>
                </div>

                <textarea
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Speak with engaging cinematic delivery. Use gentle breath pauses and an inviting, conversational rhythm."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition leading-relaxed shadow-2xs"
                />

                {/* Quick Directive Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Deep cinematic radio tone",
                    "Authoritative newsroom diction",
                    "Warm intimate whisper",
                    "Snappy upbeat enthusiasm",
                    "Empathetic gentle cadence",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setPromptDescription((prev) =>
                          prev ? `${prev.trim().replace(/\.$/, "")}, with ${chip.toLowerCase()}.` : `${chip}.`
                        )
                      }
                      className="text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition cursor-pointer border border-slate-200/80"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* MODE B: REFERENCE SAMPLE VOICE CLONER                */}
          {/* ---------------------------------------------------- */}
          {designerMode === "clone" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Mic className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sample-Based Voice Cloning & Acoustic Matching
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record 5-15 seconds of speaking or upload an audio file. Gemini AI will analyze the timbre, formants, and cadence to synthesize a matching clone profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Mode Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold max-w-xs">
                <button
                  type="button"
                  onClick={() => setCloneInputMode("mic")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    cloneInputMode === "mic" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Microphone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCloneInputMode("upload")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    cloneInputMode === "upload" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>File Upload</span>
                </button>
              </div>

              {/* Input Area: Mic or File */}
              {cloneInputMode === "mic" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col items-center justify-center text-center space-y-3.5">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition ${
                      isRecording
                        ? "bg-rose-100 text-rose-600 animate-pulse ring-4 ring-rose-200"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <Mic className="h-7 w-7" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {isRecording ? `Recording Sample... (${recordingSeconds}s)` : "Record Reference Voice"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                      Speak a natural sentence like: &quot;Hello, I am recording this sample to create my custom AI voice clone.&quot;
                    </p>
                  </div>

                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Square className="h-4 w-4 fill-current" />
                      <span>Stop & Capture Sample</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/25 cursor-pointer"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Start Recording</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Upload Reference Audio Sample</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Supports WAV, MP3, M4A, or WEBM (5-30 seconds)</p>
                  </div>
                  <label className="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Choose Audio File</span>
                    <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Sample Preview & Extract Action */}
              {recordedAudioUrl && (
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-3">
                  <StudioMiniPlayer
                    audioUrl={recordedAudioUrl}
                    title="Reference Audio Sample"
                    subtitle="Acoustic Source Ready for Timbre Cloning"
                    accentColor="indigo"
                    compact={true}
                  />

                  {/* Extract Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAnalyzeAndExtractClone}
                      disabled={isAnalyzingClone}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      {isAnalyzingClone ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{analysisStep || "Analyzing vocal harmonics..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>⚡ Analyze & Auto-Extract Voice Blueprint</span>
                        </>
                      )}
                    </button>
                  </div>

                  {cloneExtractSummary && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{cloneExtractSummary}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: AUDITION & CUSTOM ROSTER (5 COLS)        */}
        {/* ====================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Audition Testing Studio Box */}
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Headphones className="h-4 w-4 text-indigo-600" />
                <span>Live Test Phrase Audition</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-bold">
                {baseVoice} • {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}st
              </span>
            </div>

            {/* Quick Test Script Presets */}
            <div className="flex flex-wrap gap-1.5">
              {AUDITION_SCRIPTS.map((script) => (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => {
                    setSelectedScriptId(script.id);
                    setTestPhrase(script.text);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                    selectedScriptId === script.id
                      ? "bg-indigo-600 text-white shadow-2xs font-bold"
                      : "bg-white text-slate-700 border border-indigo-100 hover:bg-indigo-50"
                  }`}
                >
                  <span>{script.icon}</span>
                  <span>{script.label}</span>
                </button>
              ))}
            </div>

            {/* Test Script Textarea */}
            <div className="relative">
              <textarea
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                rows={3}
                placeholder="Type anything to test this designed voice persona..."
                className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none transition leading-relaxed shadow-2xs"
              />
              <div className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-400 font-mono">
                {testPhrase.length} chars
              </div>
            </div>

            {/* Studio Web Audio Player & Visualizer */}
            <StudioMiniPlayer
              audioUrl={auditionAudioUrl}
              audioBase64={auditionAudioBase64}
              title={`Audition: ${voiceName.trim() || "Custom Persona"}`}
              subtitle={`${baseVoice} • ${gender} • ${currentAccentOption.flag} ${currentAccentOption.name} • ${pitchSemitones >= 0 ? `+${pitchSemitones}` : pitchSemitones}st pitch • ${speedMultiplier}x speed`}
              accentColor="indigo"
              initialAutoPlay={true}
            />

            {errorMessage && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <motion.button
                type="button"
                onClick={handleAudition}
                disabled={isAuditioning}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs py-3 px-4 shadow-sm shadow-indigo-600/20 transition cursor-pointer"
              >
                {isAuditioning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Audition Designed Voice</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleSave}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Save to Roster</span>
              </motion.button>
            </div>

            {savedSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs"
              >
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Custom Voice Saved! It is now selectable across all studio modules.</span>
              </motion.div>
            )}
          </div>

          {/* Custom Voice Roster Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">My Custom Voice Roster</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {customVoices.length} Saved
              </span>
            </div>

            {/* Search filter if voices exist */}
            {customVoices.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Filter saved voices by name or tag..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            )}

            {customVoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                <Sparkles className="h-7 w-7 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">No custom voices saved yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Design a persona on the left and click &quot;Save to Roster&quot; to make it available for one-click studio speech generation.
                </p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No custom voices match your search query.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredRoster.map((cv) => {
                  const colorObj = BADGE_COLOR_MAP[cv.badgeColor || "indigo"] || BADGE_COLOR_MAP.indigo;
                  const isPlaying = playingRosterVoiceId === cv.id;
                  return (
                    <div
                      key={cv.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 border ${colorObj.bg} ${colorObj.text} border-slate-200 shadow-2xs`}
                          >
                            {cv.avatarIcon || "🎙️"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{cv.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                                {cv.gender}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Base: {cv.baseVoice} • {LANGUAGE_AND_ACCENT_OPTIONS.find((a) => a.id === cv.accent)?.flag || "🌐"} {LANGUAGE_AND_ACCENT_OPTIONS.find((a) => a.id === cv.accent)?.name || cv.accent.toUpperCase()} • {cv.pitchSemitones > 0 ? `+${cv.pitchSemitones}` : cv.pitchSemitones}st • {cv.speedMultiplier}x
                            </div>
                          </div>
                        </div>

                        {/* Audition Button directly in Roster */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePlayRosterPreview(cv)}
                            className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="Audition Voice"
                          >
                            {isPlaying ? (
                              <Pause className="h-3 w-3 fill-current text-indigo-600" />
                            ) : (
                              <Play className="h-3 w-3 fill-current ml-0.5 text-slate-700" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectForStudio(cv.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                            title="Select this persona for Text-to-Speech Studio"
                          >
                            <span>Use</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete custom voice "${cv.name}"?`)) {
                                onDeleteCustomVoice(cv.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete voice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Prompt description snippet */}
                      {cv.promptDescription && (
                        <p className="text-[10px] text-slate-500 italic bg-white/70 p-1.5 rounded-lg border border-slate-200/50 line-clamp-1">
                          &quot;{cv.promptDescription}&quot;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
