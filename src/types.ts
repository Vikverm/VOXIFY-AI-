export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  tone: string;
  recommendedFor: string;
  basePitch: string;
  sampleRate: number;
}

export interface StyleOption {
  id: string;
  name: string;
  prompt: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  countryCode: string;
  countryName: string;
  samplePhrase: string;
}

export type PitchLevel = "very-low" | "low" | "normal" | "high" | "very-high";
export type SpeedLevel = "very-slow" | "slow" | "normal" | "fast" | "very-fast";
export type VoiceEngineType = "neural" | "standard" | "turbo" | "high-res";

export type AudioFilterPreset =
  | "none"
  | "warm-radio"
  | "vocal-clarity"
  | "vintage-phone"
  | "cinematic-air";

export type PolishMode = "conversational" | "dramatic" | "concise" | "breathing";

export interface VocalPersonaPreset {
  id: string;
  name: string;
  tagline: string;
  voice: string;
  pitch: PitchLevel;
  speed: SpeedLevel;
  style: string;
  filter: AudioFilterPreset;
  color: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  language?: string;
  style?: string;
  pitch?: PitchLevel;
  speed?: SpeedLevel;
  pauseAfter?: number;
}

export interface AudioTake {
  id: string;
  text: string;
  audioUrl: string;
  audioBase64: string;
  voice: string;
  style: string;
  pitchLevel: PitchLevel;
  speedLevel: SpeedLevel;
  playbackSpeed: number;
  pitchSemitones: number;
  filterPreset?: AudioFilterPreset;
  approximateDuration: number;
  createdAt: number;
  isFavorite?: boolean;
  notes?: string;
  language?: string;
  isDialogue?: boolean;
  lineTimings?: Array<{
    id: string;
    speaker: string;
    text: string;
    startTime: number;
    duration: number;
    language?: string;
    style?: string;
  }>;
  srtSubtitles?: string;
  vttSubtitles?: string;
}

export interface CustomVoice {
  id: string;
  name: string;
  gender: string;
  age: "child" | "young-adult" | "mature" | "senior";
  accent: string;
  baseVoice: string;
  pitchSemitones: number;
  speedMultiplier: number;
  warmth: number; // 0 to 100
  clarity: number; // 0 to 100
  promptDescription: string;
  createdAt: number;
  isCustom: true;
  avatarIcon?: string;
  badgeColor?: string;
  tags?: string[];
  resonance?: number;
  breathiness?: number;
}

export interface TTSGenerateRequest {
  text: string;
  voice: string;
  pitch: PitchLevel;
  speed: SpeedLevel;
  style: string;
  pitchSemitones?: number;
  speedMultiplier?: number;
  language?: string;
}

export interface TTSGenerateResponse {
  audioUrl: string;
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  approximateDuration: number;
  voice: string;
  text: string;
  language?: string;
  error?: string;
  details?: string;
}
