/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Plus,
  Trash2,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Download,
  RotateCcw,
  Volume2,
  ArrowRight,
  MessageSquare,
  Globe,
  Languages,
  Wand2,
  FileText,
  Copy,
  Check,
  Clock,
  SlidersHorizontal,
  Subtitles,
  X,
  Volume1,
  Archive,
  Tag,
  Zap,
} from "lucide-react";
import JSZip from "jszip";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { DialogueLine, VoiceOption, StyleOption, AudioTake, PitchLevel, SpeedLevel } from "../types";
import { DEFAULT_LANGUAGES } from "./LanguageSelector";
import { CountryFlag } from "./CountryFlag";
import { downloadTextFile } from "../utils/subtitles";
import { getAudioContext, base64ToArrayBuffer, audioBufferToWav } from "../utils/audio";

interface DialogueStudioProps {
  voices: VoiceOption[];
  styles: StyleOption[];
  selectedLanguage: string;
  onDialogueGenerated: (take: AudioTake) => void;
}

const SAMPLE_DIALOGUES = [
  {
    title: "🎙️ Tech & AI Podcast Interview",
    language: "en",
    lines: [
      {
        id: "l1",
        speaker: "Puck",
        text: "Welcome back to Tech Horizons! Today I'm joined by Dr. Kore to discuss the breakthrough in neural voice synthesis.",
        style: "cheerful",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
      {
        id: "l2",
        speaker: "Kore",
        text: "Thanks for having me, Puck! It's truly exciting. The natural pacing and emotional cadence feel closer to real human conversation than ever before.",
        style: "natural",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.5,
      },
      {
        id: "l3",
        speaker: "Puck",
        text: "What makes this generation distinct from previous acoustic models?",
        style: "natural",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.3,
      },
      {
        id: "l4",
        speaker: "Kore",
        text: "The model adapts pitch inflection and subtle micro-pauses dynamically to fit the context of the sentence.",
        style: "professional",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.6,
      },
    ],
  },
  {
    title: "☕ Café Madrid (Spanish / English)",
    language: "es",
    lines: [
      {
        id: "s1",
        speaker: "Puck",
        text: "¡Buenos días! ¿Qué me recomiendas para empezar el día con energía?",
        style: "cheerful",
        language: "es",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
      {
        id: "s2",
        speaker: "Kore",
        text: "Te recomiendo nuestro café artesanal con un toque de canela y un croissant recién horneado.",
        style: "calm",
        language: "es",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.5,
      },
      {
        id: "s3",
        speaker: "Puck",
        text: "¡Suena perfecto! Por favor, prepárame uno para llevar. Thank you so much!",
        style: "cheerful",
        language: "es",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
    ],
  },
  {
    title: "🚀 Orbital Command Briefing",
    language: "en",
    lines: [
      {
        id: "d1",
        speaker: "Charon",
        text: "Control station, telemetry confirms we have cleared the atmospheric threshold. Initiating secondary thrusters.",
        style: "dramatic",
        language: "en",
        pitch: "low" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.8,
      },
      {
        id: "d2",
        speaker: "Zephyr",
        text: "Understood, Commander. Trajectory is nominal and all vector diagnostics report green. You are clear for orbital insertion.",
        style: "cheerful",
        language: "en",
        pitch: "high" as PitchLevel,
        speed: "fast" as SpeedLevel,
        pauseAfter: 0.5,
      },
    ],
  },
  {
    title: "🌍 Trilingual Polyglot Chat",
    language: "en",
    lines: [
      {
        id: "m1",
        speaker: "Puck",
        text: "Hello everyone! Can our studio seamlessly switch between languages line by line?",
        style: "cheerful",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
      {
        id: "m2",
        speaker: "Kore",
        text: "¡Por supuesto! Cada interlocutor puede hablar en su propio idioma con perfecta pronunciación nativa.",
        style: "natural",
        language: "es",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.5,
      },
      {
        id: "m3",
        speaker: "Zephyr",
        text: "C'est vraiment fantastique pour créer des conversations immersives et multilingues !",
        style: "cheerful",
        language: "fr",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
    ],
  },
  {
    title: "🧘 Morning Calm Mindfulness",
    language: "en",
    lines: [
      {
        id: "mc1",
        speaker: "Erinome",
        text: "Welcome to this quiet moment together. Take a slow, gentle breath in through your nose.",
        style: "calm",
        language: "en",
        pitch: "low" as PitchLevel,
        speed: "slow" as SpeedLevel,
        pauseAfter: 1.2,
      },
      {
        id: "mc2",
        speaker: "Sulafat",
        text: "And as you release the breath, let your shoulders drop and feel the stillness around you.",
        style: "calm",
        language: "en",
        pitch: "low" as PitchLevel,
        speed: "slow" as SpeedLevel,
        pauseAfter: 1.0,
      },
    ],
  },
  {
    title: "💼 Executive Strategy Q&A",
    language: "en",
    lines: [
      {
        id: "ex1",
        speaker: "Fenrir",
        text: "Looking at our Q3 performance, customer adoption has surpassed expectations across all regional hubs.",
        style: "professional",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.4,
      },
      {
        id: "ex2",
        speaker: "Leda",
        text: "Indeed. Our focus now must shift toward scaling technical infrastructure to support enterprise workloads seamlessly.",
        style: "professional",
        language: "en",
        pitch: "normal" as PitchLevel,
        speed: "normal" as SpeedLevel,
        pauseAfter: 0.5,
      },
    ],
  },
];

const SUGGESTED_AI_TOPICS = [
  { label: "🎙️ Tech & AI Breakthroughs", prompt: "A lively conversation debating the ethics and wonders of synthetic media and neural voices" },
  { label: "🚀 Deep Space Expedition", prompt: "Astronauts discovering an ancient mysterious transmission near Saturn's rings" },
  { label: "☕ Café Madrid Roleplay", prompt: "A friendly tourist ordering breakfast in Madrid with a welcoming barista" },
  { label: "💼 Startup Pitch & Q&A", prompt: "An ambitious founder pitching an AI audio engine to an analytical venture investor" },
  { label: "🧘 Mindful Reflection", prompt: "Two meditation guides co-hosting a calming evening breathing exercise" },
  { label: "🩺 Doctor Consultation", prompt: "A caring physician explaining a simple wellness routine to an attentive patient" },
];

export const DialogueStudio: React.FC<DialogueStudioProps> = ({
  voices,
  styles,
  selectedLanguage,
  onDialogueGenerated,
}) => {
  const [lines, setLines] = useState<DialogueLine[]>(SAMPLE_DIALOGUES[0].lines);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [dialogueProgress, setDialogueProgress] = useState(0);
  const [dialogueStage, setDialogueStage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogueAudioUrl, setDialogueAudioUrl] = useState<string | null>(null);
  const [dialogueBase64, setDialogueBase64] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);

  // Subtitles & Timings State
  const [lineTimings, setLineTimings] = useState<
    Array<{
      id: string;
      speaker: string;
      text: string;
      startTime: number;
      duration: number;
      language?: string;
      style?: string;
    }> | null
  >(null);
  const [srtSubtitles, setSrtSubtitles] = useState<string | null>(null);
  const [vttSubtitles, setVttSubtitles] = useState<string | null>(null);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState<boolean>(false);
  const [copiedSubtitles, setCopiedSubtitles] = useState<boolean>(false);

  // Line Fine-Tune Drawer / Expanded view
  const [expandedTuningLineId, setExpandedTuningLineId] = useState<string | null>(null);

  // Single-Line Auditioning State
  const [auditioningLineId, setAuditioningLineId] = useState<string | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-Track Stems State
  const [lineStems, setLineStems] = useState<string[] | null>(null);
  const [isExportingStems, setIsExportingStems] = useState<boolean>(false);

  // Custom Character Labels (Voice ID -> Role Name)
  const [speakerRoles, setSpeakerRoles] = useState<Record<string, string>>({
    Puck: "Host (Alex)",
    Kore: "Guest (Dr. Sarah)",
    Charon: "Narrator",
    Zephyr: "Expert",
    Fenrir: "Interviewee",
    Aoede: "Moderator",
  });
  const [showRolesModal, setShowRolesModal] = useState<boolean>(false);

  // Screenplay Script Import Modal State
  const [showScreenplayModal, setShowScreenplayModal] = useState<boolean>(false);
  const [screenplayText, setScreenplayText] = useState<string>(
    `SARAH: Welcome everyone to today's deep dive into neural audio!\nDR. CHEN: Thank you Sarah, it's wonderful to be here.\nSARAH: What excites you most about multi-track voice synthesis?\nDR. CHEN: The ability to export independent stems for studio DAW mixing.`
  );

  // AI Script Writer Modal State
  const [showAiWriter, setShowAiWriter] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>("");
  const [aiSpeaker1, setAiSpeaker1] = useState<string>("Puck");
  const [aiSpeaker2, setAiSpeaker2] = useState<string>("Kore");
  const [aiTurnsCount, setAiTurnsCount] = useState<number>(4);
  const [aiTone, setAiTone] = useState<string>("engaging");
  const [aiLanguage, setAiLanguage] = useState<string>(selectedLanguage);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MAX_DIALOGUE_TURNS = 24;

  const handleAddLine = () => {
    if (lines.length >= MAX_DIALOGUE_TURNS) return;
    const lastSpeaker = lines[lines.length - 1]?.speaker;
    const nextSpeaker = lastSpeaker === "Puck" ? "Kore" : "Puck";
    setLines([
      ...lines,
      {
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        speaker: nextSpeaker,
        text: "",
        style: "natural",
        language: selectedLanguage,
        pitch: "normal",
        speed: "normal",
        pauseAfter: 0.4,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, field: keyof DialogueLine, value: any) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const handleSetAllLanguages = (langCode: string) => {
    setLines(lines.map((l) => ({ ...l, language: langCode })));
  };

  const handleLoadSample = (sample: (typeof SAMPLE_DIALOGUES)[0]) => {
    setLines(
      sample.lines.map((l) => ({
        ...l,
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      }))
    );
    setDialogueAudioUrl(null);
    setDialogueBase64(null);
    setLineTimings(null);
    setSrtSubtitles(null);
    setVttSubtitles(null);
    setActiveLineIndex(null);
  };

  // Audition a single dialogue turn
  const handleAuditionLine = async (line: DialogueLine) => {
    if (!line.text.trim()) {
      setErrorMessage("Please enter text before auditioning this line.");
      return;
    }

    if (auditionAudioRef.current) {
      auditionAudioRef.current.pause();
      auditionAudioRef.current = null;
    }

    setAuditioningLineId(line.id);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: line.text.trim(),
          voice: line.speaker,
          pitch: line.pitch || "normal",
          speed: line.speed || "normal",
          style: line.style || "natural",
          language: line.language || selectedLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to audition turn");
      }

      const audio = new Audio(data.audioUrl);
      auditionAudioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setAuditioningLineId(null);
      };
    } catch (err: any) {
      console.error("Audition line error:", err);
      setErrorMessage(err.message || "Audition line failed.");
      setAuditioningLineId(null);
    }
  };

  // Generate Dialogue Script via AI
  const handleGenerateAiScript = async () => {
    const topicToUse = aiTopic.trim() || "A lively tech conversation on AI voice synthesis";
    setIsGeneratingScript(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/tts/dialogue/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicToUse,
          speakers: [aiSpeaker1, aiSpeaker2],
          numTurns: aiTurnsCount,
          tone: aiTone,
          language: aiLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate AI script");
      }

      if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
        setLines(data.lines);
        setDialogueAudioUrl(null);
        setDialogueBase64(null);
        setLineTimings(null);
        setSrtSubtitles(null);
        setVttSubtitles(null);
        setShowAiWriter(false);

        // Celebration confetti
        try {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      } else {
        throw new Error("Invalid script received from AI generator");
      }
    } catch (err: any) {
      console.error("Generate script error:", err);
      setErrorMessage(err.message || "Failed to generate dialogue script with AI.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Synthesize Full Dialogue Master Track
  const handleSynthesizeDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) {
      setErrorMessage("Please enter at least one line with dialogue text.");
      return;
    }

    setErrorMessage(null);
    setIsSynthesizing(true);
    setDialogueProgress(12);
    setDialogueStage("Synthesizing turns...");
    setDialogueAudioUrl(null);
    setLineTimings(null);
    setSrtSubtitles(null);
    setVttSubtitles(null);

    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        const p = Math.min(30, Math.round(12 + (elapsed / 800) * 18));
        setDialogueProgress(p);
        setDialogueStage("Synthesizing speaker turns...");
      } else if (elapsed < 2400) {
        const p = Math.min(75, Math.round(30 + ((elapsed - 800) / 1600) * 45));
        setDialogueProgress(p);
        setDialogueStage("Merging audio tracks & pauses...");
      } else {
        const p = Math.min(96, Math.round(75 + ((elapsed - 2400) / 1800) * 21));
        setDialogueProgress(p);
        setDialogueStage("Mastering WAV conversation & subtitles...");
      }
    }, 80);

    try {
      const response = await fetch("/api/tts/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: validLines,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to synthesize multi-speaker dialogue.");
      }

      clearInterval(progressTimer);
      setDialogueProgress(100);
      setDialogueStage("Dialogue Ready!");

      try {
        confetti({
          particleCount: 45,
          spread: 75,
          origin: { y: 0.8 },
          colors: ["#a855f7", "#ec4899", "#3b82f6", "#10b981"],
        });
      } catch {}

      await new Promise((r) => setTimeout(r, 350));

      setDialogueAudioUrl(data.audioUrl);
      setDialogueBase64(data.audioBase64);
      setAudioDuration(data.approximateDuration);
      setLineTimings(data.lineTimings || null);
      setSrtSubtitles(data.srtSubtitles || null);
      setVttSubtitles(data.vttSubtitles || null);
      setLineStems(data.lineStems || null);

      const previewText = validLines.map((l) => `${l.speaker}: ${l.text}`).join(" | ");

      const newTake: AudioTake = {
        id: `dialogue_${Date.now()}`,
        text: previewText,
        voice: `Multi-Speaker (${validLines.map((l) => l.speaker).filter((v, i, a) => a.indexOf(v) === i).join(", ")})`,
        pitchLevel: "normal",
        speedLevel: "normal",
        playbackSpeed: 1.0,
        pitchSemitones: 0,
        style: "natural",
        audioUrl: data.audioUrl,
        audioBase64: data.audioBase64,
        createdAt: Date.now(),
        approximateDuration: data.approximateDuration,
        language: selectedLanguage,
        isFavorite: false,
        isDialogue: true,
        lineTimings: data.lineTimings,
        srtSubtitles: data.srtSubtitles,
        vttSubtitles: data.vttSubtitles,
      };

      onDialogueGenerated(newTake);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error("Dialogue synthesis error:", err);
      setErrorMessage(err.message || "Failed to synthesize dialogue.");
      setDialogueProgress(0);
      setDialogueStage("");
    } finally {
      clearInterval(progressTimer);
      setIsSynthesizing(false);
      setTimeout(() => {
        setDialogueProgress(0);
        setDialogueStage("");
      }, 350);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !dialogueAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleJumpToLine = (index: number) => {
    if (!audioRef.current || !dialogueAudioUrl || !lineTimings || !lineTimings[index]) return;
    const target = lineTimings[index].startTime;
    audioRef.current.currentTime = target;
    setCurrentPlaybackTime(target);
    setActiveLineIndex(index);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Subtitle & Script Downloads
  const handleDownloadSrt = () => {
    if (!srtSubtitles) return;
    downloadTextFile(srtSubtitles, `dialogue_master_${Date.now()}.srt`, "application/x-subrip");
  };

  const handleDownloadVtt = () => {
    if (!vttSubtitles) return;
    downloadTextFile(vttSubtitles, `dialogue_master_${Date.now()}.vtt`, "text/vtt");
  };

  const handleDownloadScript = () => {
    const formatted = lines
      .map((l, i) => {
        const timing = lineTimings?.[i];
        const timeHeader = timing ? `[${timing.startTime.toFixed(1)}s - ${(timing.startTime + timing.duration).toFixed(1)}s] ` : "";
        return `${timeHeader}${l.speaker} (${l.language?.toUpperCase() || "EN"}): ${l.text}`;
      })
      .join("\n\n");
    downloadTextFile(formatted, `dialogue_script_${Date.now()}.txt`, "text/plain");
  };

  const handleCopySubtitles = () => {
    if (!srtSubtitles) return;
    navigator.clipboard.writeText(srtSubtitles);
    setCopiedSubtitles(true);
    setTimeout(() => setCopiedSubtitles(false), 2000);
  };

  // Screenplay Script Parsing
  const handleParseScreenplayScript = () => {
    if (!screenplayText.trim()) return;

    const rawLines = screenplayText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsedTurns: Array<{ speakerName: string; text: string }> = [];

    const regex = /^([A-Za-z0-9_.\s]+?)(?:\s*\([^)]*\))?\s*:\s*(.+)$/;

    for (const line of rawLines) {
      const match = line.match(regex);
      if (match) {
        parsedTurns.push({
          speakerName: match[1].trim(),
          text: match[2].trim(),
        });
      }
    }

    if (parsedTurns.length === 0) {
      alert("No valid lines found. Expected format:\nCHARACTER: dialogue text\nNEXT_CHARACTER: another line");
      return;
    }

    // Map unique characters to available voices
    const uniqueCharNames = Array.from(new Set(parsedTurns.map((p) => p.speakerName)));
    const assignedVoiceMap: Record<string, string> = {};
    const newRoles: Record<string, string> = { ...speakerRoles };

    uniqueCharNames.forEach((charName, idx) => {
      const voice = voices[idx % voices.length]?.id || "Puck";
      assignedVoiceMap[charName] = voice;
      newRoles[voice] = charName;
    });

    setSpeakerRoles(newRoles);

    const newDialogueLines: DialogueLine[] = parsedTurns.slice(0, MAX_DIALOGUE_TURNS).map((turn, idx) => ({
      id: `screenplay_${Date.now()}_${idx}`,
      speaker: assignedVoiceMap[turn.speakerName] || "Puck",
      text: turn.text,
      style: "natural",
      language: selectedLanguage,
      pitch: "normal",
      speed: "normal",
      pauseAfter: 0.4,
    }));

    setLines(newDialogueLines);
    setDialogueAudioUrl(null);
    setDialogueBase64(null);
    setLineTimings(null);
    setShowScreenplayModal(false);
  };

  // Multi-Track Stem Export Handler (Separate track for each speaker padded with silence for DAW mixing)
  const handleExportMultiTrackStems = async () => {
    if (!dialogueBase64) return;
    setIsExportingStems(true);

    try {
      const zip = new JSZip();
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();

      const distinctSpeakers = Array.from(new Set(lines.map((l) => l.speaker)));

      if (lineStems && lineStems.length > 0) {
        // 1. Export individual turns
        lines.forEach((line, idx) => {
          if (lineStems[idx]) {
            const roleName = speakerRoles[line.speaker] || line.speaker;
            const cleanRole = roleName.replace(/[^\w-]/g, "_");
            const turnFileName = `turns/Turn_${String(idx + 1).padStart(2, "0")}_${cleanRole}_${line.speaker}.wav`;
            const binary = atob(lineStems[idx]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            zip.file(turnFileName, bytes);
          }
        });

        // 2. Export timeline-aligned stems per speaker
        for (const speaker of distinctSpeakers) {
          const roleName = speakerRoles[speaker] || speaker;
          const cleanRole = roleName.replace(/[^\w-]/g, "_");

          const sampleRate = 24000;
          const totalSamples = Math.max(48000, Math.round((audioDuration || 10) * sampleRate));
          const stemBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
          const channelData = stemBuffer.getChannelData(0);

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].speaker === speaker && lineStems[i]) {
              const timing = lineTimings?.[i];
              const startSample = timing ? Math.round(timing.startTime * sampleRate) : 0;
              const ab = base64ToArrayBuffer(lineStems[i]);
              const dec = await ctx.decodeAudioData(ab);
              const decData = dec.getChannelData(0);

              for (let s = 0; s < decData.length && (startSample + s) < totalSamples; s++) {
                channelData[startSample + s] = decData[s];
              }
            }
          }

          const wavBlob = audioBufferToWav(stemBuffer);
          const arrayBuf = await wavBlob.arrayBuffer();
          zip.file(`stems/Stem_${cleanRole}_${speaker}.wav`, arrayBuf);
        }
      }

      // Add the master mix
      const masterBin = atob(dialogueBase64);
      const masterBytes = new Uint8Array(masterBin.length);
      for (let i = 0; i < masterBin.length; i++) masterBytes[i] = masterBin.charCodeAt(i);
      zip.file("Dialogue_Master_Mix.wav", masterBytes);

      // Add screenplay script & subtitles
      if (srtSubtitles) zip.file("Dialogue_Subtitles.srt", srtSubtitles);
      if (vttSubtitles) zip.file("Dialogue_Subtitles.vtt", vttSubtitles);

      const scriptText = lines
        .map((l, i) => {
          const timing = lineTimings?.[i];
          const time = timing ? `[${timing.startTime.toFixed(1)}s - ${(timing.startTime + timing.duration).toFixed(1)}s] ` : "";
          const role = speakerRoles[l.speaker] || l.speaker;
          return `${time}${role} (${l.speaker}): ${l.text}`;
        })
        .join("\n\n");
      zip.file("Screenplay_Script.txt", scriptText);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dialogue_MultiTrack_Stems_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Stem export error:", err);
      alert("Failed to package multi-track stems.");
    } finally {
      setIsExportingStems(false);
    }
  };

  const SPEAKER_COLOR_PALETTES = [
    {
      bg: "bg-cyan-50",
      text: "text-cyan-800",
      border: "border-cyan-200",
      avatarBg: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
    },
    {
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-200",
      avatarBg: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
    },
    {
      bg: "bg-purple-50",
      text: "text-purple-800",
      border: "border-purple-200",
      avatarBg: "bg-gradient-to-br from-purple-600 to-indigo-700 text-white",
    },
    {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      avatarBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    },
    {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    },
    {
      bg: "bg-teal-50",
      text: "text-teal-800",
      border: "border-teal-200",
      avatarBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
    },
    {
      bg: "bg-pink-50",
      text: "text-pink-800",
      border: "border-pink-200",
      avatarBg: "bg-gradient-to-br from-pink-500 to-rose-600 text-white",
    },
    {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
      avatarBg: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white",
    },
  ];

  const speakerColors: Record<
    string,
    { bg: string; text: string; border: string; avatarBg: string }
  > = {
    Puck: SPEAKER_COLOR_PALETTES[0],
    Kore: SPEAKER_COLOR_PALETTES[1],
    Charon: SPEAKER_COLOR_PALETTES[2],
    Fenrir: SPEAKER_COLOR_PALETTES[3],
    Zephyr: SPEAKER_COLOR_PALETTES[4],
    Aoede: SPEAKER_COLOR_PALETTES[5],
    Leda: SPEAKER_COLOR_PALETTES[6],
    Orus: SPEAKER_COLOR_PALETTES[7],
  };

  const getSpeakerColor = (speakerName: string) => {
    if (speakerColors[speakerName]) return speakerColors[speakerName];
    let hash = 0;
    for (let i = 0; i < speakerName.length; i++) {
      hash = (hash + speakerName.charCodeAt(i)) % SPEAKER_COLOR_PALETTES.length;
    }
    return SPEAKER_COLOR_PALETTES[hash];
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-5">
      {/* Dialogue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-md shadow-purple-500/25">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Multi-Speaker Dialogue Studio
              </h2>
              <span className="rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 border border-purple-200">
                Stitched Multi-Turn Audio
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Create podcasts, interviews, and multi-language conversations with tailored cadences
            </p>
          </div>
        </div>

        {/* Action Buttons: AI Script Writer, Screenplay Import, Speaker Roles, Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setShowAiWriter(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition"
          >
            <Wand2 className="h-3.5 w-3.5 text-pink-200" />
            <span>AI Script Writer</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setShowScreenplayModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer transition"
            title="Import screenplay format script (CHARACTER: Line...)"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Import Screenplay</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRolesModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer transition"
            title="Assign custom character names and roles"
          >
            <Tag className="h-3.5 w-3.5 text-purple-600" />
            <span>Character Roles</span>
          </button>

          <select
            onChange={(e) => {
              const selected = SAMPLE_DIALOGUES.find((s) => s.title === e.target.value);
              if (selected) handleLoadSample(selected);
            }}
            defaultValue=""
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-purple-300 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>Load Preset Scenario...</option>
            {SAMPLE_DIALOGUES.map((sample, idx) => (
              <option key={idx} value={sample.title}>
                {sample.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Dialogue Language Quick-Set & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-purple-50/60 border border-purple-100 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
            <Languages className="h-3.5 w-3.5" />
          </div>
          <div className="text-[11px] text-purple-900">
            <span className="font-bold">Dialogue Language:</span> Each turn can have its own language, or batch-apply one to all turns below.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-purple-700">Set all turns to:</span>
          <select
            value={lines.every((l) => (l.language || selectedLanguage) === (lines[0]?.language || selectedLanguage)) ? (lines[0]?.language || selectedLanguage) : ""}
            onChange={(e) => {
              if (e.target.value) handleSetAllLanguages(e.target.value);
            }}
            className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-purple-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="" disabled>-- Mixed / Select --</option>
            {DEFAULT_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.countryName})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handleSetAllLanguages(selectedLanguage)}
            className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition cursor-pointer"
            title={`Reset all turns to app language (${selectedLanguage})`}
          >
            Sync with App ({selectedLanguage.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-500 px-1 cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Dialogue Lines Editor */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {lines.map((line, idx) => {
            const color = getSpeakerColor(line.speaker);
            const isLineActive = activeLineIndex === idx;
            const isAuditioning = auditioningLineId === line.id;
            const isTuningExpanded = expandedTuningLineId === line.id;

            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border p-3.5 transition-all ${
                  isLineActive
                    ? "border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/40 shadow-md"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleJumpToLine(idx)}
                      title="Jump audio to this turn"
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold shadow-2xs cursor-pointer ${color.avatarBg}`}
                    >
                      {idx + 1}
                    </button>

                    {/* Active Speaking Indicator */}
                    {isLineActive && isPlaying && (
                      <span className="flex items-center gap-1 rounded-full bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse">
                        <Volume2 className="h-3 w-3" />
                        <span>Speaking now</span>
                      </span>
                    )}

                    {/* Speaker Voice Picker */}
                    <select
                      value={line.speaker}
                      onChange={(e) => handleUpdateLine(line.id, "speaker", e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${color.bg} ${color.text} ${color.border} focus:outline-none cursor-pointer`}
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>

                    {/* Custom Character Role / Label */}
                    {speakerRoles[line.speaker] && (
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {speakerRoles[line.speaker]}
                      </span>
                    )}

                    {/* Overlapping Speech / Interruption Indicator */}
                    {typeof line.pauseAfter === "number" && line.pauseAfter < 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-200">
                        <Zap className="h-3 w-3 text-amber-600" />
                        <span>Overlap ({line.pauseAfter}s)</span>
                      </span>
                    )}

                    {/* Delivery Style Picker */}
                    <select
                      value={line.style || "natural"}
                      onChange={(e) => handleUpdateLine(line.id, "style", e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300 transition"
                      title="Tone / Delivery style"
                    >
                      {styles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    {/* Per-Turn Language Selector */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 hover:border-slate-300 transition">
                      <CountryFlag
                        countryCode={
                          DEFAULT_LANGUAGES.find((l) => l.code === (line.language || selectedLanguage))?.countryCode
                        }
                        className="w-3.5 h-2.5 shrink-0"
                      />
                      <select
                        value={line.language || selectedLanguage}
                        onChange={(e) => handleUpdateLine(line.id, "language", e.target.value)}
                        className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        title="Language for this speaker turn"
                      >
                        {DEFAULT_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name} ({lang.countryName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Audition Single Line Button */}
                    <button
                      type="button"
                      onClick={() => handleAuditionLine(line)}
                      disabled={isAuditioning || !line.text.trim()}
                      className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 text-slate-600 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                      title="Audition only this single line"
                    >
                      {isAuditioning ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                          <span>Auditioning...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current text-purple-600" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>

                    {/* Toggle Fine-Tune Drawer */}
                    <button
                      type="button"
                      onClick={() => setExpandedTuningLineId(isTuningExpanded ? null : line.id)}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition cursor-pointer ${
                        isTuningExpanded
                          ? "bg-purple-100 border-purple-300 text-purple-900"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Adjust pitch, speed, and pause after this turn"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>Tune</span>
                    </button>

                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remove turn"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Input Text */}
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => handleUpdateLine(line.id, "text", e.target.value)}
                  placeholder={`What should ${line.speaker} say in this turn?`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition"
                />

                {/* Fine-Tune Expandable Bar (Pitch, Speed, Pause duration) */}
                {isTuningExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] bg-slate-50/70 p-2 rounded-xl"
                  >
                    {/* Pitch */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">Pitch:</span>
                      <select
                        value={line.pitch || "normal"}
                        onChange={(e) => handleUpdateLine(line.id, "pitch", e.target.value)}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-700 cursor-pointer"
                      >
                        <option value="very-low">Very Low (-5st)</option>
                        <option value="low">Low (-2st)</option>
                        <option value="normal">Normal (0st)</option>
                        <option value="high">High (+3st)</option>
                        <option value="very-high">Very High (+6st)</option>
                      </select>
                    </div>

                    {/* Speed */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">Speed:</span>
                      <select
                        value={line.speed || "normal"}
                        onChange={(e) => handleUpdateLine(line.id, "speed", e.target.value)}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-700 cursor-pointer"
                      >
                        <option value="slow">Slow (0.85x)</option>
                        <option value="normal">Normal (1.0x)</option>
                        <option value="fast">Fast (1.25x)</option>
                      </select>
                    </div>

                    {/* Pause after this turn */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-500">Pause after:</span>
                      <select
                        value={line.pauseAfter ?? 0.4}
                        onChange={(e) => handleUpdateLine(line.id, "pauseAfter", parseFloat(e.target.value))}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-700 cursor-pointer"
                      >
                        <option value="-0.6">⚡ -0.6s (Fast Interruption)</option>
                        <option value="-0.3">⚡ -0.3s (Overlapping Speech)</option>
                        <option value="0.1">0.1s (Immediate Turn)</option>
                        <option value="0.2">0.2s (Rapid reply)</option>
                        <option value="0.4">0.4s (Natural pause)</option>
                        <option value="0.8">0.8s (Thoughtful)</option>
                        <option value="1.2">1.2s (Long pause)</option>
                        <option value="2.0">2.0s (Dramatic pause)</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dialogue Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <motion.button
          type="button"
          onClick={handleAddLine}
          disabled={lines.length >= MAX_DIALOGUE_TURNS}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-2 text-xs font-bold text-purple-700 hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Turn Line ({lines.length}/{MAX_DIALOGUE_TURNS})</span>
        </motion.button>

        <motion.button
          type="button"
          id="synthesize-dialogue-btn"
          onClick={handleSynthesizeDialogue}
          disabled={isSynthesizing || lines.every((l) => !l.text.trim())}
          whileHover={{ scale: isSynthesizing ? 1 : 1.02 }}
          whileTap={{ scale: isSynthesizing ? 1 : 0.98 }}
          className="relative overflow-hidden w-full sm:w-auto min-w-[270px] flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-300 text-white px-7 py-3 font-bold text-xs shadow-md shadow-purple-600/25 transition cursor-pointer"
        >
          {!isSynthesizing && (
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          )}

          {isSynthesizing && (
            <div
              id="dialogue-progress-fill"
              className="absolute inset-0 bg-purple-900/90 transition-all duration-150 ease-out"
              style={{ width: `${dialogueProgress}%` }}
            />
          )}

          <div className="relative z-10 flex items-center justify-center gap-2">
            {isSynthesizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-white" />
                <span className="font-semibold text-white truncate max-w-[160px]">
                  {dialogueStage || "Synthesizing..."}
                </span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-mono font-black text-white border border-white/20">
                  {dialogueProgress}%
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-pink-200" />
                <span>Synthesize Full Dialogue Master</span>
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* Audio Player & Subtitle Export for Generated Dialogue */}
      {dialogueAudioUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/90 via-pink-50/40 to-blue-50/90 p-4 space-y-3 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Dialogue Master Track & Subtitles
                </span>
                <span className="text-[11px] text-slate-600">
                  {lines.length} conversational turns &bull; ~{audioDuration}s seamless duration &bull; Click turns to jump
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                type="button"
                onClick={togglePlayback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    <span>Play Conversation</span>
                  </>
                )}
              </motion.button>

              <a
                href={dialogueAudioUrl}
                download={`dialogue_master_${Date.now()}.wav`}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                title="Download Master WAV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Master WAV</span>
              </a>

              <button
                type="button"
                onClick={handleExportMultiTrackStems}
                disabled={isExportingStems}
                className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Export multi-track audio stems for each speaker and individual turns as .ZIP"
              >
                {isExportingStems ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Packaging Stems...</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    <span>Multi-Track Stems (.ZIP)</span>
                  </>
                )}
              </button>

              {srtSubtitles && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadSrt}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                    title="Download Subtitles (.SRT)"
                  >
                    <Subtitles className="h-3.5 w-3.5 text-purple-600" />
                    <span>.SRT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadVtt}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                    title="Download WebVTT Captions (.VTT)"
                  >
                    <Subtitles className="h-3.5 w-3.5 text-purple-600" />
                    <span>.VTT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadScript}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-xl border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                    title="Download Transcript Text (.TXT)"
                  >
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                    <span>Script</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSubtitlesModal(true)}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 transition cursor-pointer"
                    title="View Subtitle Timestamps"
                  >
                    <span>View Captions</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <audio
            ref={audioRef}
            src={dialogueAudioUrl}
            onTimeUpdate={(e) => {
              const time = e.currentTarget.currentTime;
              setCurrentPlaybackTime(time);
              if (lineTimings && lineTimings.length > 0) {
                const idx = lineTimings.findIndex(
                  (t) => time >= t.startTime && time < t.startTime + t.duration + 0.2
                );
                setActiveLineIndex(idx !== -1 ? idx : null);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setActiveLineIndex(null);
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Subtitles Preview & Copy Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showSubtitlesModal && srtSubtitles && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                        <Subtitles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Dialogue Subtitles & Timestamp Sync
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Millisecond-accurate timestamps for YouTube, TikTok, and Premiere
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSubtitlesModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs max-h-64 overflow-y-auto leading-relaxed select-text">
                    <pre className="whitespace-pre-wrap">{srtSubtitles}</pre>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleCopySubtitles}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                    >
                      {copiedSubtitles ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy SRT Subtitles</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSrt}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download .SRT</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* AI Dialogue Script Writer Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showAiWriter && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl max-w-xl sm:max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
                        <Wand2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          AI Dialogue Script Writer
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Generate authentic conversational scripts on any topic
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiWriter(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Topic Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Scenario or Topic:
                    </label>
                    <textarea
                      rows={2}
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. A podcast discussion about deep space exploration..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    />
                  </div>

                  {/* Quick Idea Chips */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Sample Prompts:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_AI_TOPICS.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAiTopic(item.prompt)}
                          className="text-[10px] font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 px-2 py-1 text-slate-600 transition cursor-pointer text-left"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speaker Selectors & Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Speaker 1</label>
                      <select
                        value={aiSpeaker1}
                        onChange={(e) => setAiSpeaker1(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Speaker 2</label>
                      <select
                        value={aiSpeaker2}
                        onChange={(e) => setAiSpeaker2(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Tone</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
                      >
                        <option value="engaging">Engaging</option>
                        <option value="casual">Casual / Banter</option>
                        <option value="dramatic">Dramatic</option>
                        <option value="professional">Professional</option>
                        <option value="humorous">Humorous</option>
                        <option value="educational">Educational</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Turns Count</label>
                      <select
                        value={aiTurnsCount}
                        onChange={(e) => setAiTurnsCount(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
                      >
                        <option value={4}>4 Turns</option>
                        <option value={6}>6 Turns</option>
                        <option value={8}>8 Turns</option>
                        <option value={12}>12 Turns</option>
                        <option value={16}>16 Turns</option>
                        <option value={20}>20 Turns</option>
                      </select>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Language</label>
                    <select
                      value={aiLanguage}
                      onChange={(e) => setAiLanguage(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
                    >
                      {DEFAULT_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name} ({l.countryName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAiWriter(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAiScript}
                      disabled={isGeneratingScript}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingScript ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Writing Script...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-pink-200" />
                          <span>Generate Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Screenplay Script Import Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showScreenplayModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Import Screenplay Script</h3>
                        <p className="text-xs text-slate-500">Paste standard script format (CHARACTER: Dialogue line...)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScreenplayModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Screenplay Text:
                    </label>
                    <textarea
                      value={screenplayText}
                      onChange={(e) => setScreenplayText(e.target.value)}
                      rows={8}
                      placeholder={`ALEX: Good morning everyone!\nSARAH: Great to be here Alex.\nALEX: Today we are testing multi-speaker voice synthesis.`}
                      className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:border-indigo-600 bg-slate-50"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Each unique character name will automatically be assigned an AI voice and labeled role.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowScreenplayModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleParseScreenplayScript}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Parse & Load Script</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Speaker Roles & Character Labels Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showRolesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Custom Character Roles & Labels</h3>
                        <p className="text-xs text-slate-500">Name your characters (e.g. Host, Guest, Narrator, Dr. Chen)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRolesModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {voices.map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{v.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">({v.gender})</span>
                        </div>

                        <input
                          type="text"
                          value={speakerRoles[v.id] || ""}
                          onChange={(e) =>
                            setSpeakerRoles({
                              ...speakerRoles,
                              [v.id]: e.target.value,
                            })
                          }
                          placeholder={`e.g. Character / Role`}
                          className="w-48 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRolesModal(false)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
