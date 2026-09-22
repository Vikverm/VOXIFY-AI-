/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Sliders,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  Radio,
  CheckCircle2,
  Upload,
  Wand2,
  Undo2,
  Clock,
  Sparkles,
  Users,
  Mic,
  Library,
  Languages,
  BookOpen,
  Crown,
  Zap,
  HelpCircle,
  ChevronDown,
  Settings2,
  Download,
  Code2,
  Mail,
  Scale,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  VoiceOption,
  StyleOption,
  PitchLevel,
  SpeedLevel,
  AudioTake,
  AudioFilterPreset,
  TTSGenerateResponse,
  PolishMode,
  VocalPersonaPreset,
  VoiceEngineType,
  CustomVoice,
} from "./types";
import { AudioPlayerCard } from "./components/AudioPlayerCard";
import { TakesHistory } from "./components/TakesHistory";
import { DEFAULT_LANGUAGES } from "./components/LanguageSelector";
import { PersonaPresets, VOCAL_PERSONAS } from "./components/PersonaPresets";
import { DialogueStudio } from "./components/DialogueStudio";
import { StudioSidebar } from "./components/StudioSidebar";
import { PricingPlans } from "./components/PricingPlans";
import { AudioEffectsGuide } from "./components/AudioEffectsGuide";
import { CreditModal } from "./components/CreditModal";
import { PaymentModal, CheckoutItem } from "./components/PaymentModal";
import { ContactPage } from "./components/ContactPage";
import { ApiDocsPage } from "./components/ApiDocsPage";
import { TermsPage } from "./components/TermsPage";
import { SSMLToolbar } from "./components/SSMLToolbar";
import { PronunciationEditor, PronunciationRule } from "./components/PronunciationEditor";
import { BatchConverter } from "./components/BatchConverter";
import { SpeechToSpeech } from "./components/SpeechToSpeech";
import { VoiceDesigner } from "./components/VoiceDesigner";
import { TeleprompterModal } from "./components/TeleprompterModal";
import { AuthModal } from "./components/AuthModal";
import { UserProfileMenu } from "./components/UserProfileMenu";
import { VoiceComparisonModal } from "./components/VoiceComparisonModal";
import { InlineWordEmphasisBar } from "./components/InlineWordEmphasisBar";
import { Logo } from "./components/Logo";
import { CountryFlag } from "./components/CountryFlag";
import { parseDocumentFile } from "./utils/fileParser";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  UserProfile,
  testFirestoreConnection,
  fetchOrCreateProfile,
  syncUserCreditsToCloud,
  syncUserPlanToCloud,
  saveTakeToCloud,
} from "./lib/firebase";
import { getAudioContext, estimateReadingTime } from "./utils/audio";
import { BgmTrackId } from "./utils/bgm";

const DEFAULT_VOICES: VoiceOption[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Warm Female",
    tone: "Gentle, natural, melodious, and soothing",
    recommendedFor: "Storytelling, meditation, tutorials, warm greeting",
    basePitch: "Medium-High",
    sampleRate: 24000,
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Gender Neutral / Playful",
    tone: "Clear, crisp, lively, and energetic",
    recommendedFor: "Podcasts, narration, casual dialogue, assistant",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Deep Male",
    tone: "Resonant, calm, authoritative, and rich",
    recommendedFor: "Documentaries, news reading, audiobooks, deep focus",
    basePitch: "Low",
    sampleRate: 24000,
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Authoritative Male",
    tone: "Strong, commanding, articulate, and confident",
    recommendedFor: "Presentations, motivational speeches, announcements",
    basePitch: "Medium-Low",
    sampleRate: 24000,
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Soft / Bright Female",
    tone: "Airy, friendly, uplifting, and modern",
    recommendedFor: "Conversational UI, creative storytelling, education",
    basePitch: "Medium-High",
    sampleRate: 24000,
  },
  {
    id: "Aoede",
    name: "Aoede",
    gender: "Breezy Female",
    tone: "Breezy, natural, elegant, and effortless",
    recommendedFor: "Audiobooks, long-form narration, literature, travel vlogs",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Leda",
    name: "Leda",
    gender: "Graceful Female",
    tone: "Polished, expressive, warm, and poised",
    recommendedFor: "Documentaries, dramatic audio, education, brand storytelling",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Orus",
    name: "Orus",
    gender: "Bold Male",
    tone: "Crisp, bold, decisive, and energetic",
    recommendedFor: "Commercials, tech reviews, promos, gaming dialogue",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Callirrhoe",
    name: "Callirrhoe",
    gender: "Lyrical Female",
    tone: "Melodic, vibrant, evocative, and rhythmic",
    recommendedFor: "Poetry, children's books, fantasy, cultural stories",
    basePitch: "Medium-High",
    sampleRate: 24000,
  },
  {
    id: "Autonoe",
    name: "Autonoe",
    gender: "Articulate Female",
    tone: "Sophisticated, clear, intellectual, and professional",
    recommendedFor: "Keynotes, corporate training, news, scientific explainers",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Enceladus",
    name: "Enceladus",
    gender: "Cinematic Male",
    tone: "Deep, steady, cinematic, and grounded",
    recommendedFor: "Movie trailers, historical sagas, nature docs, broadcast",
    basePitch: "Low",
    sampleRate: 24000,
  },
  {
    id: "Despina",
    name: "Despina",
    gender: "Youthful Female",
    tone: "Bright, cheerful, enthusiastic, and approachable",
    recommendedFor: "Social media, explainer videos, youth culture, podcasts",
    basePitch: "High",
    sampleRate: 24000,
  },
  {
    id: "Erinome",
    name: "Erinome",
    gender: "Gentle Female",
    tone: "Soft, tranquil, reflective, and contemplative",
    recommendedFor: "Guided meditation, sleep stories, wellness apps, ASMR",
    basePitch: "Medium-Low",
    sampleRate: 24000,
  },
  {
    id: "Alnilam",
    name: "Alnilam",
    gender: "Commanding Male",
    tone: "Resonant, executive, prestigious, and clear",
    recommendedFor: "Corporate overviews, finance reports, leadership memos",
    basePitch: "Medium-Low",
    sampleRate: 24000,
  },
  {
    id: "Achernar",
    name: "Achernar",
    gender: "Modern Male",
    tone: "Upbeat, smart, tech-savvy, and conversational",
    recommendedFor: "SaaS tutorials, developer documentation, product walkthroughs",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Achird",
    name: "Achird",
    gender: "Versatile Male",
    tone: "Warm, relatable, everyman, and welcoming",
    recommendedFor: "Audio dramas, instructional guides, conversational assistants",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Algenib",
    name: "Algenib",
    gender: "Dynamic Male",
    tone: "Assertive, punchy, persuasive, and sharp",
    recommendedFor: "Direct-response ads, radio spots, fitness coaching, hype",
    basePitch: "Medium-High",
    sampleRate: 24000,
  },
  {
    id: "Algieba",
    name: "Algieba",
    gender: "Cultured Male",
    tone: "Refined, articulate, thoughtful, and scholarly",
    recommendedFor: "Museum audio tours, biographical essays, historical docs",
    basePitch: "Medium-Low",
    sampleRate: 24000,
  },
  {
    id: "Gacrux",
    name: "Gacrux",
    gender: "Deep Gravitas Male",
    tone: "Heavy, solemn, profound, and steady",
    recommendedFor: "Epic narratives, philosophical tracts, dark drama",
    basePitch: "Very Low",
    sampleRate: 24000,
  },
  {
    id: "Iapetus",
    name: "Iapetus",
    gender: "Friendly Male",
    tone: "Approachable, honest, hearty, and comforting",
    recommendedFor: "Customer service, friendly onboarding, family content",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Laomedeia",
    name: "Laomedeia",
    gender: "Spirited Female",
    tone: "Playful, charming, animated, and bright",
    recommendedFor: "Animation, gaming characters, interactive fiction, comedy",
    basePitch: "High",
    sampleRate: 24000,
  },
  {
    id: "Pulcherrima",
    name: "Pulcherrima",
    gender: "Velvety Female",
    tone: "Rich, sultry, velvety, and captivating",
    recommendedFor: "Luxury branding, dramatic readings, romance fiction",
    basePitch: "Medium-Low",
    sampleRate: 24000,
  },
  {
    id: "Rasalgethi",
    name: "Rasalgethi",
    gender: "Distinguished Male",
    tone: "Mature, seasoned, wise, and comforting",
    recommendedFor: "Memoirs, heritage brands, masterclass lectures, folklore",
    basePitch: "Low",
    sampleRate: 24000,
  },
  {
    id: "Sadachbia",
    name: "Sadachbia",
    gender: "Instructional Male",
    tone: "Calm, methodical, patient, and precise",
    recommendedFor: "E-learning, technical courses, medical explanations",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Sadaltager",
    name: "Sadaltager",
    gender: "Casual Male",
    tone: "Relaxed, genuine, conversational, and effortless",
    recommendedFor: "Casual talk shows, gaming streams, review vlogs",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Schedar",
    name: "Schedar",
    gender: "Executive Female",
    tone: "Confident, decisive, polished, and commanding",
    recommendedFor: "Business presentations, broadcast journalism, enterprise",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Sulafat",
    name: "Sulafat",
    gender: "Peaceful Female",
    tone: "Whisper-soft, soothing, warm, and gentle",
    recommendedFor: "Bedtime stories, relaxation therapy, spa ambience",
    basePitch: "Low",
    sampleRate: 24000,
  },
  {
    id: "Umbriel",
    name: "Umbriel",
    gender: "Neutral / Cyber",
    tone: "Sleek, futuristic, poised, and articulate",
    recommendedFor: "AI assistants, futuristic sci-fi, navigation systems",
    basePitch: "Medium",
    sampleRate: 24000,
  },
  {
    id: "Vindemiatrix",
    name: "Vindemiatrix",
    gender: "Persuasive Female",
    tone: "Vibrant, compelling, energetic, and engaging",
    recommendedFor: "Commercial voiceovers, event hosting, dynamic campaigns",
    basePitch: "Medium-High",
    sampleRate: 24000,
  },
  {
    id: "Zubenelgenubi",
    name: "Zubenelgenubi",
    gender: "Resonant Male",
    tone: "Theatrical, deep, dark, and expressive",
    recommendedFor: "Fantasy voice acting, villain monologue, game lore",
    basePitch: "Low",
    sampleRate: 24000,
  },
];

const DEFAULT_STYLES: StyleOption[] = [
  { id: "natural", name: "Natural & Conversational", prompt: "Speak naturally and conversationally" },
  { id: "cheerful", name: "Cheerful & Upbeat", prompt: "Speak with cheerful enthusiasm and warm energy" },
  { id: "calm", name: "Calm & Meditative", prompt: "Speak slowly, peacefully, with a gentle and soothing cadence" },
  { id: "dramatic", name: "Dramatic & Storyteller", prompt: "Speak with dramatic emotional depth and narrative tension" },
  { id: "professional", name: "Professional & Articulate", prompt: "Speak clearly, authoritatively, and with polished newsroom articulation" },
  { id: "whisper", name: "Soft & Intimate", prompt: "Speak in a soft, gentle, intimate tone" },
];

const SAMPLE_PROMPTS = [
  {
    label: "Mindfulness & Breathing",
    text: "Close your eyes, relax your shoulders, and take a deep, slow breath in... hold for a moment... and gently exhale.",
    voice: "Kore",
    style: "calm",
    pitch: "low" as PitchLevel,
    speed: "slow" as SpeedLevel,
  },
  {
    label: "Product Announcement",
    text: "We are thrilled to introduce our new generation of natural neural speech synthesis. Hear your stories come alive with nuanced pitch, cadence, and human warmth.",
    voice: "Puck",
    style: "cheerful",
    pitch: "normal" as PitchLevel,
    speed: "normal" as SpeedLevel,
  },
  {
    label: "Documentary Narration",
    text: "High above the ancient valley, the observatory telescope rotated silently under the midnight sky, gathering photons from galaxies billions of years away.",
    voice: "Charon",
    style: "dramatic",
    pitch: "very-low" as PitchLevel,
    speed: "slow" as SpeedLevel,
  },
  {
    label: "Motivational Briefing",
    text: "Every great milestone begins with the courage to start. Focus on the next single step with relentless clarity and conviction.",
    voice: "Fenrir",
    style: "professional",
    pitch: "normal" as PitchLevel,
    speed: "fast" as SpeedLevel,
  },
];

const PLAN_LIMITS: Record<string, { charLimit: number; maxCredits: number }> = {
  free: { charLimit: 350, maxCredits: 10000 },
  basic: { charLimit: 2000, maxCredits: 80000 },
  pro: { charLimit: 5000, maxCredits: 300000 },
  business: { charLimit: 10000, maxCredits: 1200000 },
};

type StudioTab =
  | "studio"
  | "batch"
  | "sts"
  | "dialogue"
  | "designer"
  | "pronunciation"
  | "library"
  | "pricing"
  | "effects"
  | "contact"
  | "api"
  | "terms";

export default function App() {
  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICES);
  const [styles, setStyles] = useState<StyleOption[]>(DEFAULT_STYLES);

  // Custom AI Voices roster (User-engineered personas)
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>(() => {
    try {
      const saved = localStorage.getItem("voicemaker_custom_voices");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Teleprompter Modal state
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState<boolean>(false);

  // Active studio mode tab
  const [activeTab, setActiveTab] = useState<StudioTab>("studio");

  // User Account & Plan State (Voxify model)
  const [userPlan, setUserPlan] = useState<string>(() => {
    return localStorage.getItem("voxify_user_plan") || localStorage.getItem("voicemaker_user_plan") || "pro";
  });
  const [userCredits, setUserCredits] = useState<number>(() => {
    const saved = localStorage.getItem("voxify_user_credits") || localStorage.getItem("voicemaker_user_credits");
    return saved ? Number(saved) : 1850000;
  });
  const [isCreditModalOpen, setIsCreditModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  // Client Firebase Auth & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Audio format and voice engine (Voxify 4 engines)
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngineType>("neural");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav" | "ogg" | "aac">("mp3");
  const [sampleRateKhz, setSampleRateKhz] = useState<"24" | "48">("48");
  const [bgmTrack, setBgmTrack] = useState<BgmTrackId>("none");
  const [bgmVolume, setBgmVolume] = useState<number>(0.15);

  // Voxify Pronunciation & Lexicon dictionary
  const [pronunciationRules, setPronunciationRules] = useState<PronunciationRule[]>(() => {
    try {
      const saved = localStorage.getItem("voxify_pronunciation_rules") || localStorage.getItem("voicemaker_pronunciation_rules");
      return saved
        ? JSON.parse(saved)
        : [
            { id: "1", original: "Voicemaker", replacement: "Voice Maker", category: "name", enabled: true },
            { id: "2", original: "SQL", replacement: "sequel", category: "technical", enabled: true },
            { id: "3", original: "API", replacement: "A-P-I", category: "acronym", enabled: true },
            { id: "4", original: "Gemini", replacement: "JEM-ih-nye", category: "name", enabled: true },
            { id: "5", original: "FAQ", replacement: "F-A-Q", category: "acronym", enabled: true },
            { id: "6", original: "TTS", replacement: "Text to Speech", category: "acronym", enabled: true },
          ];
    } catch {
      return [];
    }
  });

  // Multi-language state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Script text states
  const [text, setText] = useState<string>(SAMPLE_PROMPTS[1].text);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [selectedStyle, setSelectedStyle] = useState<string>("natural");

  // Model generation controls
  const [modelPitch, setModelPitch] = useState<PitchLevel>("normal");
  const [modelSpeed, setModelSpeed] = useState<SpeedLevel>("normal");

  // Real-time live playback DSP controls
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [pitchSemitones, setPitchSemitones] = useState<number>(0);
  const [audioFilter, setAudioFilter] = useState<AudioFilterPreset>("none");

  // Execution & takes state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [takes, setTakes] = useState<AudioTake[]>(() => {
    try {
      const saved = localStorage.getItem("ai_studio_voice_takes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentTakeId, setCurrentTakeId] = useState<string | null>(null);

  // Dropdowns & language modal state
  const [isExamplesOpen, setIsExamplesOpen] = useState<boolean>(false);
  const [isPolishOpen, setIsPolishOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isImportingDoc, setIsImportingDoc] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const polishRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setIsExamplesOpen(false);
      }
      if (polishRef.current && !polishRef.current.contains(e.target as Node)) {
        setIsPolishOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current plan specs
  const activePlanKey = userPlan.toLowerCase();
  const currentPlanSpecs = PLAN_LIMITS[activePlanKey] || PLAN_LIMITS.pro;
  const currentCharLimit = currentPlanSpecs.charLimit;

  // Sync custom voices into selectable voices roster
  useEffect(() => {
    const customVoiceOptions: VoiceOption[] = customVoices.map((cv) => ({
      id: cv.id,
      name: `★ ${cv.name}`,
      gender: cv.gender,
      tone: cv.promptDescription || `Custom tuned ${cv.baseVoice}`,
      recommendedFor: "Custom user-designed voice persona",
      basePitch: cv.pitchSemitones > 0 ? "High" : cv.pitchSemitones < 0 ? "Low" : "Medium",
      sampleRate: 24000,
    }));
    setVoices([...customVoiceOptions, ...DEFAULT_VOICES]);
  }, [customVoices]);

  const handleSaveCustomVoice = (voice: CustomVoice) => {
    setCustomVoices((prev) => {
      const next = [voice, ...prev.filter((v) => v.id !== voice.id)];
      localStorage.setItem("voicemaker_custom_voices", JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteCustomVoice = (id: string) => {
    setCustomVoices((prev) => {
      const next = prev.filter((v) => v.id !== id);
      localStorage.setItem("voicemaker_custom_voices", JSON.stringify(next));
      return next;
    });
    if (selectedVoice === id) {
      setSelectedVoice("Kore");
    }
  };

  // Sync takes to local storage
  useEffect(() => {
    try {
      localStorage.setItem("ai_studio_voice_takes", JSON.stringify(takes));
    } catch {
      // Storage quota exceeded or disabled
    }
  }, [takes]);

  // Fetch voice and style list from backend if available
  useEffect(() => {
    fetch("/api/voices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.voices?.length) setVoices(data.voices);
        if (data?.styles?.length) setStyles(data.styles);
      })
      .catch((err) => {
        console.warn("Using default voice definitions:", err);
      });
  }, []);

  // Listen to Firebase Auth state changes & trigger Google register/login popup for new visitors
  useEffect(() => {
    testFirestoreConnection();

    let hasCheckedAuth = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      hasCheckedAuth = true;
      if (firebaseUser) {
        try {
          const profile = await fetchOrCreateProfile(firebaseUser);
          setCurrentUser(profile);
          setUserPlan(profile.plan.toLowerCase());
          setUserCredits(profile.credits);
          localStorage.setItem("voicemaker_user_plan", profile.plan.toLowerCase());
          localStorage.setItem("voicemaker_user_credits", profile.credits.toString());
        } catch (err) {
          console.warn("Error resolving authenticated client profile:", err);
        }
      } else {
        setCurrentUser(null);
        // Automatically display Google register/login popup on initial visit for new/unauthenticated users
        try {
          const alreadyPrompted = sessionStorage.getItem("voxify_auth_prompt_shown");
          if (!alreadyPrompted) {
            sessionStorage.setItem("voxify_auth_prompt_shown", "true");
            setTimeout(() => {
              setAuthModalMode("register");
              setIsAuthModalOpen(true);
            }, 600);
          }
        } catch {
          setTimeout(() => {
            setAuthModalMode("register");
            setIsAuthModalOpen(true);
          }, 600);
        }
      }
    });

    // Fallback timer: if Firebase auth resolution is delayed, prompt unauthenticated new visitor
    const fallbackTimer = setTimeout(() => {
      if (!hasCheckedAuth && !auth.currentUser) {
        try {
          const alreadyPrompted = sessionStorage.getItem("voxify_auth_prompt_shown");
          if (!alreadyPrompted) {
            sessionStorage.setItem("voxify_auth_prompt_shown", "true");
            setAuthModalMode("register");
            setIsAuthModalOpen(true);
          }
        } catch {}
      }
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Handle returning from live Stripe checkout session
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("payment_success") === "true") {
        const itemType = urlParams.get("item_type");
        const itemId = urlParams.get("item_id");
        const credits = Number(urlParams.get("credits")) || 0;

        if (credits > 0) {
          setUserCredits((prev) => prev + credits);
        }
        if (itemType === "plan" && itemId) {
          const planName = itemId.charAt(0).toUpperCase() + itemId.slice(1);
          setUserPlan(planName);
        }

        const provider = urlParams.get("provider");
        const gatewayLabel = provider === "paypal" ? "PayPal" : "Payment";

        setPaymentSuccessToast(
          `🎉 ${gatewayLabel} Payment Approved! Added +${credits.toLocaleString()} character credits and updated plan status.`
        );

        // Clean query parameters from URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#2563eb", "#9333ea", "#10b981", "#f59e0b"],
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle Speech Generation
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter some text to convert into speech.");
      return;
    }

    if (text.length > currentCharLimit) {
      setErrorMessage(
        `Your script (${text.length} characters) exceeds the ${currentCharLimit} limit of your ${userPlan.toUpperCase()} plan. Please shorten your text or upgrade to a higher tier in Pricing Plans.`
      );
      return;
    }

    if (userCredits < text.length) {
      setErrorMessage(
        `Insufficient credits! You need ${text.length} credits but have ${userCredits.toLocaleString()}. Please buy top-up credits or upgrade.`
      );
      setIsCreditModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setGenerationProgress(10);
    setGenerationStage("Analyzing phrasing...");

    // Smooth progress counter matching neural synthesis lifecycle
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        const p = Math.min(26, Math.round(10 + (elapsed / 500) * 16));
        setGenerationProgress(p);
        setGenerationStage("Analyzing phrasing & cadence...");
      } else if (elapsed < 1600) {
        const p = Math.min(68, Math.round(26 + ((elapsed - 500) / 1100) * 42));
        setGenerationProgress(p);
        setGenerationStage("Synthesizing neural voice...");
      } else if (elapsed < 2800) {
        const p = Math.min(89, Math.round(68 + ((elapsed - 1600) / 1200) * 21));
        setGenerationProgress(p);
        setGenerationStage(`Mastering ${sampleRateKhz}kHz ${audioFormat.toUpperCase()} audio...`);
      } else {
        const p = Math.min(97, Math.round(89 + ((elapsed - 2800) / 1600) * 8));
        setGenerationProgress(p);
        setGenerationStage("Finalizing audio take...");
      }
    }, 60);

    try {
      getAudioContext();
    } catch {
      // Handled during playback
    }

    try {
      let textToSend = text.trim();
      // Apply active Pronunciation Rules before speech synthesis
      pronunciationRules.filter((r) => r.enabled).forEach((rule) => {
        if (!rule.original) return;
        const escaped = rule.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "gi");
        textToSend = textToSend.replace(regex, rule.replacement);
      });

      // Resolve custom-designed voices if selected
      let effectiveVoice = selectedVoice;
      let effectivePitchSemitones = pitchSemitones;
      let effectiveSpeedMultiplier = playbackSpeed;
      let effectiveStyle = selectedStyle;

      const customMatch = customVoices.find((cv) => cv.id === selectedVoice);
      if (customMatch) {
        effectiveVoice = customMatch.baseVoice;
        effectivePitchSemitones = customMatch.pitchSemitones;
        effectiveSpeedMultiplier = customMatch.speedMultiplier;
        if (customMatch.promptDescription) {
          effectiveStyle = `${selectedStyle}. ${customMatch.promptDescription}`;
        }
      }

      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          voice: effectiveVoice,
          pitch: modelPitch,
          speed: modelSpeed,
          style: effectiveStyle,
          pitchSemitones: effectivePitchSemitones,
          speedMultiplier: effectiveSpeedMultiplier,
          language: selectedLanguage,
          engine: voiceEngine,
        }),
      });

      const data: TTSGenerateResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Speech synthesis failed. Please try again.");
      }

      // Smoothly jump to 100% and show completion badge
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStage("Voice Mastered!");

      // Deduct used credits from balance
      setUserCredits((prev) => {
        const remaining = Math.max(0, prev - text.length);
        localStorage.setItem("voicemaker_user_credits", remaining.toString());
        if (currentUser) {
          syncUserCreditsToCloud(currentUser.id, remaining);
        }
        return remaining;
      });

      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.8 },
          colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"],
        });
      } catch {
        // Ignore in environments without canvas
      }

      await new Promise((resolve) => setTimeout(resolve, 350));

      const newTake: AudioTake = {
        id: `take_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: text.trim(),
        audioUrl: data.audioUrl,
        audioBase64: data.audioBase64,
        voice: data.voice || selectedVoice,
        style: selectedStyle,
        pitchLevel: modelPitch,
        speedLevel: modelSpeed,
        playbackSpeed: 1.0,
        pitchSemitones: 0,
        filterPreset: audioFilter,
        approximateDuration: data.approximateDuration,
        createdAt: Date.now(),
        isFavorite: false,
        language: selectedLanguage,
      };

      if (currentUser) {
        saveTakeToCloud(currentUser.id, {
          id: newTake.id,
          text: newTake.text,
          voice: newTake.voice,
          style: newTake.style,
          duration: newTake.approximateDuration,
          timestamp: newTake.createdAt,
        });
      }

      setTakes((prev) => [newTake, ...prev]);
      setCurrentTakeId(newTake.id);
      setPlaybackSpeed(1.0);
      setPitchSemitones(0);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error("Synthesis error:", err);
      setErrorMessage(err.message || "Failed to generate speech. Please verify input.");
      setGenerationProgress(0);
      setGenerationStage("");
    } finally {
      clearInterval(progressTimer);
      setIsLoading(false);
    }
  };

  // AI Script Polish
  const handlePolishText = async (mode: PolishMode) => {
    if (!text.trim()) return;

    setIsPolishing(true);
    setErrorMessage(null);
    setPreviousText(text);

    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), mode }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to polish script");
      }

      if (data.polishedText) {
        setText(data.polishedText);
      }
    } catch (err: any) {
      console.error("Polishing error:", err);
      setErrorMessage("Could not refine phrasing. Please check connection.");
    } finally {
      setIsPolishing(false);
    }
  };

  // Translate Script
  const handleTranslateScript = async (targetLangCode: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    setPreviousText(text);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          targetLanguage: targetLangCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Translation failed");
      }
      if (data.translatedText) {
        setText(data.translatedText);
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setErrorMessage("Failed to translate text. Keeping original version.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Inserters & SSML
  const handleInsertTag = (tag: string, endTag?: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + " " + tag + (endTag ? ` ${endTag}` : ""));
      return;
    }
    const area = textareaRef.current;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selectedText = text.substring(start, end);
    let insertion = "";
    if (endTag) {
      insertion = `${tag}${selectedText || "phrase"}${endTag}`;
    } else {
      insertion = tag;
    }
    const newText = text.substring(0, start) + insertion + text.substring(end);
    setText(newText);
    setTimeout(() => {
      area.focus();
      area.selectionStart = area.selectionEnd = start + insertion.length;
    }, 10);
  };

  const handleClearSSMLTags = () => {
    const cleaned = text.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, " ").trim();
    setText(cleaned);
  };

  const handleUpdatePronunciationRules = (newRules: PronunciationRule[]) => {
    setPronunciationRules(newRules);
    localStorage.setItem("voicemaker_pronunciation_rules", JSON.stringify(newRules));
  };

  const handleSelectSample = (sample: (typeof SAMPLE_PROMPTS)[0]) => {
    setText(sample.text);
    setSelectedVoice(sample.voice);
    setSelectedStyle(sample.style);
    setModelPitch(sample.pitch);
    setModelSpeed(sample.speed);
  };

  const handleApplyPersona = (persona: VocalPersonaPreset) => {
    setSelectedVoice(persona.voice);
    setModelPitch(persona.pitch);
    setModelSpeed(persona.speed);
    setSelectedStyle(persona.style);
    setAudioFilter(persona.filter);
  };

  const handleProcessFile = async (file: File) => {
    setIsImportingDoc(true);
    try {
      const extracted = await parseDocumentFile(file);
      if (extracted?.text && extracted.text.trim()) {
        setText(extracted.text.slice(0, currentCharLimit));
      } else {
        setErrorMessage("Could not extract readable text from this document.");
      }
    } catch (err: any) {
      console.error("Document import error:", err);
      setErrorMessage(err.message || "Failed to parse document file.");
    } finally {
      setIsImportingDoc(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleProcessFile(file);
    e.target.value = "";
  };

  const handleSaveTrimmedTake = (trimmedTake: AudioTake) => {
    setTakes((prev) => [trimmedTake, ...prev.filter((t) => t.id !== trimmedTake.id)]);
    setCurrentTakeId(trimmedTake.id);
  };

  const handleResetPlayback = () => {
    setPlaybackSpeed(1.0);
    setPitchSemitones(0);
    setAudioFilter("none");
  };

  const handleDeleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (currentTakeId === id) {
      setCurrentTakeId(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setTakes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleClearHistory = () => {
    setTakes([]);
    setCurrentTakeId(null);
    try {
      localStorage.removeItem("ai_studio_voice_takes");
    } catch {
      // ignore
    }
  };

  const handleSelectPlan = (planId: string, billingCycle: "monthly" | "annual" = "monthly") => {
    if (planId.toLowerCase() === "free") {
      setUserPlan("free");
      localStorage.setItem("voicemaker_user_plan", "free");
      const specs = PLAN_LIMITS.free;
      setUserCredits(specs.maxCredits);
      localStorage.setItem("voicemaker_user_credits", specs.maxCredits.toString());
      setActiveTab("studio");
      return;
    }

    const planData: Record<string, { name: string; monthly: number; annual: number; credits: number; desc: string }> = {
      basic: {
        name: "Basic Starter",
        monthly: 4.99,
        annual: 47.88,
        credits: 80000,
        desc: "80,000 characters/mo (~1.8 hrs audio) • Voice Changer (24+ Langs) • Vocal EQ • Commercial Rights • 48kHz WAV/MP3 • $3.99/mo yearly",
      },
      pro: {
        name: "Pro Creator",
        monthly: 12.99,
        annual: 119.88,
        credits: 300000,
        desc: "300,000 characters/mo (~6.5 hrs audio) • Multi-Speaker Dialogue • Batch Studio • Voice Changer Pro • Persona Cloner • $9.99/mo yearly",
      },
      business: {
        name: "Business / Studio",
        monthly: 29.99,
        annual: 299.88,
        credits: 1200000,
        desc: "1,200,000 characters/mo (~26 hrs audio) • 50+ Batch Tracks • REST API Access • 5 Team Seats • Custom DSP • $24.99/mo yearly",
      },
    };

    const target = planData[planId.toLowerCase()] || planData.pro;
    const isAnnual = billingCycle === "annual";
    const price = isAnnual ? target.annual : target.monthly;
    const originalPrice = isAnnual ? target.monthly * 12 : undefined;

    setCheckoutItem({
      type: "plan",
      id: planId,
      name: target.name,
      price,
      originalPrice,
      interval: isAnnual ? "annual" : "monthly",
      creditsAmount: target.credits,
      description: target.desc,
    });
    setIsPaymentModalOpen(true);
  };

  const handleCheckoutPack = (pack: { id: string; credits: number; price: number; label: string; desc: string }) => {
    setCheckoutItem({
      type: "credits",
      id: pack.id,
      name: pack.label,
      price: pack.price,
      creditsAmount: pack.credits,
      description: pack.desc,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (item: CheckoutItem) => {
    if (item.type === "plan") {
      setUserPlan(item.id);
      localStorage.setItem("voicemaker_user_plan", item.id);
      setUserCredits((prev) => {
        const updated = prev + item.creditsAmount;
        localStorage.setItem("voicemaker_user_credits", updated.toString());
        if (currentUser) {
          syncUserPlanToCloud(currentUser.id, (item.id.charAt(0).toUpperCase() + item.id.slice(1)) as any, updated);
        }
        return updated;
      });
    } else {
      setUserCredits((prev) => {
        const updated = prev + item.creditsAmount;
        localStorage.setItem("voicemaker_user_credits", updated.toString());
        if (currentUser) {
          syncUserCreditsToCloud(currentUser.id, updated);
        }
        return updated;
      });
    }
  };

  const handleAddCredits = (amount: number) => {
    setUserCredits((prev) => {
      const newVal = prev + amount;
      localStorage.setItem("voicemaker_user_credits", newVal.toString());
      if (currentUser) {
        syncUserCreditsToCloud(currentUser.id, newVal);
      }
      return newVal;
    });
  };

  const handleDeductCredits = (chars: number): boolean => {
    if (userCredits < chars) {
      setIsCreditModalOpen(true);
      return false;
    }
    setUserCredits((prev) => {
      const remaining = Math.max(0, prev - chars);
      localStorage.setItem("voicemaker_user_credits", remaining.toString());
      if (currentUser) {
        syncUserCreditsToCloud(currentUser.id, remaining);
      }
      return remaining;
    });
    return true;
  };

  // Keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  const currentTake = takes.find((t) => t.id === currentTakeId) || takes[0] || null;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedReading = estimateReadingTime(wordCount, 1.0);
  const currentLangObj = DEFAULT_LANGUAGES.find((l) => l.code === selectedLanguage) || DEFAULT_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo & Subtitle */}
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <Logo size="md" />
          </button>

          {/* Center Navigation Tabs - Clean, Streamlined & Intuitive */}
          <div className="hidden lg:flex items-center rounded-xl border border-slate-200/90 bg-slate-100/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                activeTab === "studio"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Text to Speech Studio"
            >
              <Mic className="h-3.5 w-3.5 text-blue-600" />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dialogue")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                activeTab === "dialogue"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Multi-speaker conversation & dialogue"
            >
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span>Dialogue</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                activeTab === "batch"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Generate multiple audio clips in bulk"
            >
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              <span>Bulk Audio</span>
            </button>

            {/* Tools Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                  ["designer", "sts", "pronunciation", "api", "contact"].includes(activeTab)
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {activeTab === "designer"
                    ? "Designer"
                    : activeTab === "sts"
                    ? "Voice Changer"
                    : activeTab === "pronunciation"
                    ? "Dictionary"
                    : activeTab === "api"
                    ? "API"
                    : activeTab === "contact"
                    ? "Contact"
                    : "Tools"}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-400 transition-transform ${
                    isToolsMenuOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {isToolsMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Audio Tools
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("sts");
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                      activeTab === "sts" ? "bg-rose-50 text-rose-800 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Voice Changer</div>
                      <div className="text-[10px] text-slate-400 font-normal">Speech-to-speech transform</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("designer");
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                      activeTab === "designer" ? "bg-indigo-50 text-indigo-800 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Voice Designer</div>
                      <div className="text-[10px] text-slate-400 font-normal">Custom tuned AI personas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("pronunciation");
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                      activeTab === "pronunciation" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Dictionary</div>
                      <div className="text-[10px] text-slate-400 font-normal">Phonetics & custom words</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Developer & More
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("api");
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                      activeTab === "api" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Developer API</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("contact");
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                      activeTab === "contact" ? "bg-slate-100 font-bold text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Contact & Support</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("pricing")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                activeTab === "pricing"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Pricing plans and upgrades"
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>Pricing</span>
            </button>
          </div>

          {/* Right Header: Library, Credit Status & Client Account */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                activeTab === "library"
                  ? "border-slate-300 bg-white text-slate-950 shadow-2xs font-bold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Library className="h-3.5 w-3.5 text-slate-500" />
              <span>Library</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                {takes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs text-xs"
              title="Click to view credits or upgrade plan"
            >
              <span className="rounded bg-blue-600 text-white font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide">
                {userPlan}
              </span>
              <span className="font-semibold text-slate-800 font-mono text-[11px]">
                {userCredits.toLocaleString()} credits
              </span>
              <span className="text-blue-600 hover:text-blue-700 font-semibold text-[11px] ml-0.5">
                + Top Up
              </span>
            </button>

            {/* Client Authentication / Profile */}
            {currentUser ? (
              <UserProfileMenu
                user={currentUser}
                currentCredits={userCredits}
                currentPlan={userPlan}
                onOpenCreditModal={() => setIsCreditModalOpen(true)}
                onOpenPricingTab={() => setActiveTab("pricing")}
                onLogout={() => {
                  setCurrentUser(null);
                }}
              />
            ) : (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                <button
                  id="btn-nav-signin"
                  type="button"
                  onClick={() => {
                    setAuthModalMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-register"
                  type="button"
                  onClick={() => {
                    setAuthModalMode("register");
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <span>Register</span>
                  <span className="text-[9px] px-1 py-0.2 bg-blue-500 rounded font-mono">+10k</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs - Clean Streamlined Strip */}
        <div className="flex md:hidden items-center gap-1.5 border-t border-slate-100 bg-slate-50/95 px-3 py-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "studio" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dialogue")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "dialogue" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Dialogue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "batch" ? "bg-white text-purple-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Bulk Audio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sts")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "sts" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Voice Changer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("designer")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "designer" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Designer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === "pricing" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            <Crown className="h-3 w-3 text-amber-500" />
            <span>Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === "library" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
            }`}
          >
            Library ({takes.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-[1720px] px-4 pt-4 sm:px-6 lg:px-8">
        {/* Payment Success Toast Banner */}
        {paymentSuccessToast && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{paymentSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 py-0.5 rounded cursor-pointer text-base"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            id="error-alert-banner"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm shadow-xs"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Notification</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: CLEAN VOICEMAKER 2-COLUMN STUDIO VIEW             */}
        {/* ======================================================== */}
        {activeTab === "studio" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Clean Script, Format Bar & Player */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* SCRIPT CARD */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                {/* Header Row: Title, Language & Clean Tools */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-slate-900">Script</h2>
                    <button
                      type="button"
                      onClick={() => setIsLangModalOpen(true)}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition cursor-pointer"
                      title={`Change language: ${currentLangObj.name} (${currentLangObj.countryName})`}
                    >
                      <CountryFlag countryCode={currentLangObj.countryCode} className="w-4.5 h-3.2 rounded-xs shadow-2xs" />
                      <span>{currentLangObj.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">({currentLangObj.countryCode})</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>

                  {/* Clean Tools: Examples, AI Polish, Upload, Clear */}
                  <div className="flex items-center gap-1.5 text-xs relative">
                    {/* Examples Dropdown */}
                    <div className="relative" ref={examplesRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExamplesOpen(!isExamplesOpen);
                          setIsPolishOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium cursor-pointer ${
                          isExamplesOpen
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                        <span>Examples</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExamplesOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
                      </button>

                      {isExamplesOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20 animate-fade-in space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Sample Scripts
                          </div>
                          {SAMPLE_PROMPTS.map((sample, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                handleSelectSample(sample);
                                setIsExamplesOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{sample.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Polish Dropdown */}
                    <div className="relative" ref={polishRef}>
                      <button
                        type="button"
                        disabled={isPolishing || !text.trim()}
                        onClick={() => {
                          setIsPolishOpen(!isPolishOpen);
                          setIsExamplesOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPolishOpen
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {isPolishing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                        )}
                        <span>{isPolishing ? "Polishing..." : "AI Polish"}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${isPolishOpen ? "rotate-180 text-purple-600" : "text-slate-400"}`} />
                      </button>

                      {isPolishOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20 animate-fade-in space-y-1">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Rewrite Tone
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handlePolishText("conversational");
                              setIsPolishOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition block cursor-pointer"
                          >
                            <span className="font-semibold block">Conversational</span>
                            <span className="text-[11px] text-slate-500">Natural podcast cadence</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handlePolishText("dramatic");
                              setIsPolishOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition block cursor-pointer"
                          >
                            <span className="font-semibold block">Dramatic</span>
                            <span className="text-[11px] text-slate-500">Expressive cinematic delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handlePolishText("concise");
                              setIsPolishOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition block cursor-pointer"
                          >
                            <span className="font-semibold block">Punchy Hook</span>
                            <span className="text-[11px] text-slate-500">Direct, crisp commercial style</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handlePolishText("breathing");
                              setIsPolishOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition block cursor-pointer"
                          >
                            <span className="font-semibold block">Breath Cadence</span>
                            <span className="text-[11px] text-slate-500">Inserts realistic pauses</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Upload Script File */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImportingDoc}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      title="Import text, PDF, Word docx, or CSV file"
                    >
                      {isImportingDoc ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>{isImportingDoc ? "Importing..." : "Import File"}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {/* Teleprompter Studio */}
                    <button
                      type="button"
                      onClick={() => setIsTeleprompterOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      title="Open Fullscreen Studio Teleprompter"
                    >
                      <Mic className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Teleprompter</span>
                    </button>

                    {/* Undo Button */}
                    {previousText && (
                      <button
                        type="button"
                        onClick={() => {
                          setText(previousText);
                          setPreviousText(null);
                        }}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs px-2 py-1 transition cursor-pointer"
                        title="Revert previous text"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Undo</span>
                      </button>
                    )}

                    {/* Clear Button */}
                    {text && (
                      <button
                        type="button"
                        onClick={() => setText("")}
                        className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Voxify SSML Tag Editor Bar */}
                <SSMLToolbar onInsertTag={handleInsertTag} onClearTags={handleClearSSMLTags} />

                {/* Inline Word Emphasis Quick Bar */}
                <InlineWordEmphasisBar
                  textareaRef={textareaRef}
                  text={text}
                  onUpdateText={setText}
                />

                {/* Text Area with Drag & Drop Document Import */}
                <div
                  className={`relative rounded-xl transition-all ${
                    isDraggingFile
                      ? "ring-2 ring-blue-500 bg-blue-50/60"
                      : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) {
                      handleProcessFile(droppedFile);
                    }
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    id="tts-text-input"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter or paste your text here. Drag & drop .txt, .docx, or .pdf files directly, or highlight words to add emphasis..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition resize-y min-h-[160px]"
                  />

                  {isDraggingFile && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-blue-600/90 text-white backdrop-blur-xs pointer-events-none space-y-1.5">
                      <Upload className="h-8 w-8 animate-bounce" />
                      <span className="text-sm font-bold">Drop your file here</span>
                      <span className="text-xs text-blue-100">Supports .txt, .docx, .pdf, .csv, .md</span>
                    </div>
                  )}

                  {isImportingDoc && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/80 text-slate-800 backdrop-blur-xs space-y-1.5">
                      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Extracting document text...</span>
                    </div>
                  )}
                </div>

                {/* Clean Bottom Bar: Quick Expression Pills & Script Metrics */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  {/* Subtle Expression Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
                      Tone:
                    </span>
                    {[
                      { label: "Cheerful", effect: "cheerful" },
                      { label: "Friendly", effect: "friendly" },
                      { label: "Excited", effect: "excited" },
                      { label: "Whisper", effect: "whisper" },
                      { label: "Calm", effect: "calm" },
                    ].map((eff) => (
                      <button
                        key={eff.effect}
                        type="button"
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            if (start !== end) {
                              const selected = text.slice(start, end);
                              const updated =
                                text.slice(0, start) +
                                `<voice effect="${eff.effect}">${selected}</voice>` +
                                text.slice(end);
                              setText(updated);
                            } else {
                              handleInsertTag(`<voice effect="${eff.effect}">expressive text</voice> `);
                            }
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium transition whitespace-nowrap cursor-pointer text-slate-600"
                        title={`Apply ${eff.label} tone`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>

                  {/* Clean Script Metrics */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                    <span className={text.length > currentCharLimit ? "text-rose-600 font-bold" : ""}>
                      <strong className="font-semibold text-slate-800">{text.length.toLocaleString()}</strong> / {currentCharLimit.toLocaleString()} chars
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong className="font-semibold text-slate-800">{wordCount}</strong> words
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      ~{estimatedReading.formatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Action Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Audio Format & Sample Rate */}
                <div className="flex items-center gap-2.5 text-xs w-full sm:w-auto">
                  <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    {(["mp3", "wav"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setAudioFormat(fmt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                          audioFormat === fmt
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSampleRateKhz("24")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        sampleRateKhz === "24"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      24 kHz
                    </button>
                    <button
                      type="button"
                      onClick={() => setSampleRateKhz("48")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        sampleRateKhz === "48"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      48 kHz HD
                    </button>
                  </div>
                </div>

                {/* Primary Convert to Speech Button & Quick Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {currentTake && (
                    <button
                      type="button"
                      id="action-bar-download-btn"
                      onClick={() => {
                        const binaryString = atob(currentTake.audioBase64);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: "audio/mpeg" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `voxify-${currentTake.voice}-${Date.now()}.mp3`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      title="Download MP3 directly"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>Download MP3</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="convert-to-speech-btn"
                    onClick={handleGenerate}
                    disabled={isLoading || !text.trim()}
                    className="w-full sm:w-auto min-w-[230px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-5 py-3 font-semibold text-sm shadow-xs transition cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                        <span className="font-medium text-white truncate max-w-[140px]">
                          {generationStage || "Converting..."}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-100">
                          {generationProgress}%
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Convert to Speech</span>
                        <span className="text-[11px] font-mono font-normal opacity-80">
                          ({text.length.toLocaleString()} Chars)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Audio Player Card & Waveform */}
              <AudioPlayerCard
                currentTake={currentTake}
                playbackSpeed={playbackSpeed}
                pitchSemitones={pitchSemitones}
                audioFilter={audioFilter}
                onSpeedChange={setPlaybackSpeed}
                onFilterChange={setAudioFilter}
                bgmTrack={bgmTrack}
                bgmVolume={bgmVolume}
                onChangeBgmTrack={setBgmTrack}
                onChangeBgmVolume={setBgmVolume}
                onSaveTrimmedTake={handleSaveTrimmedTake}
                onOpenComparison={() => setShowComparisonModal(true)}
                onOpenTeleprompter={() => setIsTeleprompterOpen(true)}
                disabledShortcuts={isTeleprompterOpen}
              />
            </div>

            {/* RIGHT COLUMN: Voice & Audio Settings Sidebar (Col 4) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <StudioSidebar
                voiceEngine={voiceEngine}
                onChangeVoiceEngine={setVoiceEngine}
                selectedLanguage={selectedLanguage}
                languages={DEFAULT_LANGUAGES}
                onSelectLanguage={setSelectedLanguage}
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                styles={styles}
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
                modelPitch={modelPitch}
                onChangeModelPitch={setModelPitch}
                modelSpeed={modelSpeed}
                onChangeModelSpeed={setModelSpeed}
                playbackSpeed={playbackSpeed}
                onChangePlaybackSpeed={setPlaybackSpeed}
                pitchSemitones={pitchSemitones}
                onChangePitchSemitones={setPitchSemitones}
                audioFilter={audioFilter}
                onChangeAudioFilter={setAudioFilter}
                onResetControls={handleResetPlayback}
                isLangModalOpen={isLangModalOpen}
                onToggleLangModal={setIsLangModalOpen}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: BATCH AUDIO CONVERTER (VOICEMAKER FEATURE)          */}
        {/* ======================================================== */}
        {activeTab === "batch" && (
          <BatchConverter
            voices={voices}
            styles={styles}
            selectedVoice={selectedVoice}
            defaultVoice={selectedVoice}
            selectedStyle={selectedStyle}
            selectedLanguage={selectedLanguage}
            onDeductCredits={handleDeductCredits}
            onAddTake={(batchTake) => {
              setTakes((prev) => [batchTake, ...prev]);
              setCurrentTakeId(batchTake.id);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* TAB: SPEECH TO SPEECH VOICE CHANGER                      */}
        {/* ======================================================== */}
        {activeTab === "sts" && (
          <SpeechToSpeech
            voices={voices}
            selectedVoice={selectedVoice}
            defaultVoice={selectedVoice}
            onSelectVoice={(voiceId) => setSelectedVoice(voiceId)}
            styles={styles}
            languages={DEFAULT_LANGUAGES}
            defaultLanguage={selectedLanguage}
            onDeductCredits={handleDeductCredits}
            onAddTake={(stsTake) => {
              setTakes((prev) => [stsTake, ...prev]);
              setCurrentTakeId(stsTake.id);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 2: MULTI-SPEAKER DIALOGUE STUDIO VIEW                */}
        {/* ======================================================== */}
        {activeTab === "dialogue" && (
          <DialogueStudio
            voices={voices}
            styles={styles}
            selectedLanguage={selectedLanguage}
            onDialogueGenerated={(dialogueTake) => {
              setTakes((prev) => [dialogueTake, ...prev]);
              setCurrentTakeId(dialogueTake.id);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* TAB: AI VOICE DESIGNER & CLONER                         */}
        {/* ======================================================== */}
        {activeTab === "designer" && (
          <VoiceDesigner
            baseVoices={DEFAULT_VOICES}
            customVoices={customVoices}
            onSaveCustomVoice={handleSaveCustomVoice}
            onDeleteCustomVoice={handleDeleteCustomVoice}
            onSelectForStudio={(voiceId) => {
              setSelectedVoice(voiceId);
              setActiveTab("studio");
            }}
            onDeductCredits={handleDeductCredits}
          />
        )}

        {/* ======================================================== */}
        {/* TAB: PRONUNCIATION LEXICON DICTIONARY                    */}
        {/* ======================================================== */}
        {activeTab === "pronunciation" && (
          <PronunciationEditor
            rules={pronunciationRules}
            onUpdateRules={handleUpdatePronunciationRules}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: AUDIO TAKES LIBRARY & ARCHIVE                     */}
        {/* ======================================================== */}
        {activeTab === "library" && (
          <TakesHistory
            takes={takes}
            activeTakeId={currentTake?.id || null}
            onSelectTake={(take) => {
              setCurrentTakeId(take.id);
              setPlaybackSpeed(take.playbackSpeed || 1.0);
              setPitchSemitones(take.pitchSemitones || 0);
              if (take.filterPreset) setAudioFilter(take.filterPreset);
              setActiveTab("studio");
            }}
            onDeleteTake={handleDeleteTake}
            onToggleFavorite={handleToggleFavorite}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 4: PRICING PLANS VIEW (VOICEMAKER FEATURE)           */}
        {/* ======================================================== */}
        {activeTab === "pricing" && (
          <PricingPlans
            currentPlan={userPlan}
            onSelectPlan={handleSelectPlan}
            onOpenCreditModal={() => setIsCreditModalOpen(true)}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 5: AUDIO EFFECTS & SSML GUIDE VIEW                   */}
        {/* ======================================================== */}
        {activeTab === "effects" && <AudioEffectsGuide />}

        {/* ======================================================== */}
        {/* TAB 6: CONTACT & SUPPORT VIEW                            */}
        {/* ======================================================== */}
        {activeTab === "contact" && (
          <ContactPage onNavigateTab={(tab) => setActiveTab(tab as StudioTab)} />
        )}

        {/* ======================================================== */}
        {/* TAB 7: DEVELOPER REST API DOCUMENTATION                  */}
        {/* ======================================================== */}
        {activeTab === "api" && <ApiDocsPage />}

        {/* ======================================================== */}
        {/* TAB 8: COMMERCIAL LICENSE & TERMS OF SERVICE             */}
        {/* ======================================================== */}
        {activeTab === "terms" && <TermsPage />}

        {/* ======================================================== */}
        {/* STUDIO TELEPROMPTER FULLSCREEN MODAL                     */}
        {/* ======================================================== */}
        <TeleprompterModal
          isOpen={isTeleprompterOpen}
          onClose={() => setIsTeleprompterOpen(false)}
          scriptText={text || currentTake?.text || ""}
          audioUrl={currentTake?.audioUrl}
          voiceName={currentTake?.voice}
        />
      </main>

      {/* Modern, Clean Voxify Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1720px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            {/* Column 1: Brand & Overview */}
            <div className="space-y-3">
              <Logo size="md" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Next-generation neural AI voice generator for creators, podcasters, marketers, and
                enterprise developers worldwide.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  <span>99.9% Uptime</span>
                </span>
                <span>&bull;</span>
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {/* Column 2: Studio Tools */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Studio Tools
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("studio")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Neural Speech Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("dialogue")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Multi-Speaker Dialogue
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("library")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Audio Takes Archive
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("effects")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    VoxFX™ Audio Mastering
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Plans & Developer API */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Commercial & Developers
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pricing")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Pricing Plans & Top-ups
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("api")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Developer REST API Reference
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("terms")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Commercial Rights & License
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsCreditModalOpen(true)}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Character Booster Packs
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Help & Contact */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Support & Contact
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Contact Support Team
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("terms")}
                    className="hover:text-blue-600 transition cursor-pointer"
                  >
                    Privacy Policy & Security
                  </button>
                </li>
                <li className="pt-1 text-[11px] text-slate-400 space-y-1">
                  <div>
                    <span>WhatsApp / Call:</span>
                    <a
                      href="https://wa.me/919711040665"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-medium text-emerald-600 hover:text-emerald-700 transition"
                    >
                      +91 97110 40665
                    </a>
                  </div>
                  <div>
                    <span>Support Email:</span>
                    <a
                      href="mailto:vikasverm48472@gmail.com"
                      className="block font-medium text-slate-700 hover:text-blue-600 transition truncate"
                    >
                      vikasverm48472@gmail.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright line */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Voxify AI Technologies Inc. All commercial audio rights reserved.</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className="hover:text-slate-600 transition cursor-pointer"
              >
                Terms
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className="hover:text-slate-600 transition cursor-pointer"
              >
                Privacy
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className="hover:text-slate-600 transition cursor-pointer"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Credit Wallet & Top-up Modal */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        currentCredits={userCredits}
        maxCredits={currentPlanSpecs.maxCredits}
        currentPlan={userPlan}
        onAddCredits={handleAddCredits}
        onUpgradePlan={handleSelectPlan}
        onCheckoutPack={handleCheckoutPack}
      />

      {/* Payment System Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        item={checkoutItem}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Client Authentication Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          try {
            sessionStorage.setItem("voxify_auth_prompt_shown", "true");
          } catch {}
        }}
        initialMode={authModalMode}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          setUserPlan(profile.plan.toLowerCase());
          setUserCredits(profile.credits);
          localStorage.setItem("voicemaker_user_plan", profile.plan.toLowerCase());
          localStorage.setItem("voicemaker_user_credits", profile.credits.toString());
        }}
      />

      {/* A/B Voice Comparison Modal */}
      {showComparisonModal && (
        <VoiceComparisonModal
          text={text || "The quick brown fox jumps over the lazy dog."}
          voices={voices}
          style={selectedStyle}
          language={selectedLanguage}
          onClose={() => setShowComparisonModal(false)}
          onSelectVoice={(voiceId) => {
            setSelectedVoice(voiceId);
            setShowComparisonModal(false);
          }}
        />
      )}
    </div>
  );
}
