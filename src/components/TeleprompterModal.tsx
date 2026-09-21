/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Maximize2,
  Minimize2,
  Type,
  Gauge,
  FlipHorizontal,
  Clock,
  Mic,
  AlignLeft,
  AlignCenter,
  ChevronUp,
  ChevronDown,
  Edit3,
  Check,
  FileText,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from "lucide-react";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  audioUrl?: string;
  voiceName?: string;
}

type ThemeMode = "studio-dark" | "high-contrast" | "amber-glow" | "clean-light";
type TextAlign = "left" | "center";
type EyelinePosition = "camera" | "high" | "center" | "off";

const EYELINE_PERCENT_MAP: Record<EyelinePosition, number> = {
  high: 25,
  camera: 35,
  center: 50,
  off: 0,
};

const DEFAULT_SAMPLE_SCRIPT = `Welcome to the Studio Teleprompter.

Hear your stories come alive with natural neural voice synthesis, nuanced pitch, cadence, and human warmth.

Look directly into your camera or teleprompter glass. Use the eye-level guide line to maintain confident eye contact with your audience.

Press the Spacebar or click anywhere on this screen to pause and resume scrolling at any time.

Use the speed slider at the top to adjust your words per minute reading pace. Adjust font size and theme to match your studio lighting.

Happy recording!`;

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  scriptText,
  audioUrl,
  voiceName,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedWpm, setSpeedWpm] = useState<number>(140);
  const [fontSize, setFontSize] = useState<number>(38);
  const [textAlign, setTextAlign] = useState<TextAlign>("center");
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>("studio-dark");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [eyelinePos, setEyelinePos] = useState<EyelinePosition>("camera");

  // Optional audio sync narration
  const [isVoiceSyncOn, setIsVoiceSyncOn] = useState<boolean>(false);

  // Script text editing support
  const [isEditingScript, setIsEditingScript] = useState<boolean>(false);
  const [editableScript, setEditableScript] = useState<string>("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scrollPosRef = useRef<number>(0);
  const isSettingScrollRef = useRef<boolean>(false);

  // Strip SSML tags (like <prosody>, <break>) and normalize spaces
  const cleanSourceText = (raw: string) => {
    if (!raw) return "";
    return raw
      .replace(/<[^>]+>/g, " ") // strip XML/SSML tags
      .replace(/&[a-z0-9]+;/gi, " ") // strip HTML entities
      .trim();
  };

  // Sync scriptText when modal opens or scriptText changes
  useEffect(() => {
    if (isOpen) {
      const cleaned = cleanSourceText(scriptText);
      setEditableScript(cleaned);
      setIsPlaying(false);
      setElapsedSeconds(0);
      scrollPosRef.current = 0;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setScrollProgress(0);
      setIsEditingScript(false);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isOpen, scriptText]);

  // Manage audio play/pause sync
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && isVoiceSyncOn) {
      audioRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isVoiceSyncOn]);

  // Active text to display
  const activeScript = editableScript.trim() || cleanSourceText(scriptText) || DEFAULT_SAMPLE_SCRIPT;

  // Word count and estimated reading time
  const words = activeScript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedMins = Math.max(1, Math.ceil(wordCount / Math.max(speedWpm, 60)));

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Timer counter
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && isOpen) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isOpen]);

  // Keyboard shortcuts with capturing & immediate propagation stop
  // This prevents Space from leaking to the background AudioPlayerCard!
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the edit script textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (isEditingScript) {
          setIsEditingScript(false);
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          onClose();
        }
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSpeedWpm((prev) => Math.min(260, prev + 10));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setSpeedWpm((prev) => Math.max(60, prev - 10));
      }
    };

    // Use capturing phase so we intercept before any background listeners
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen, onClose, isEditingScript]);

  // Update progress tracking
  const updateProgress = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100));
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }
  }, []);

  // Continuous auto-scroll loop with subpixel accumulator
  useEffect(() => {
    if (!isPlaying || !isOpen || isEditingScript) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const scrollLoop = (now: number) => {
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const el = scrollContainerRef.current;
      if (el) {
        // Natural reading speed calculation (approx 35-50 px/s at 140 WPM)
        const wordsPerSec = speedWpm / 60;
        const pxPerSecond = wordsPerSec * (fontSize * 0.45);

        scrollPosRef.current += pxPerSecond * delta;

        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0 && scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = maxScroll;
          isSettingScrollRef.current = true;
          el.scrollTop = maxScroll;
          isSettingScrollRef.current = false;
          setIsPlaying(false);
          updateProgress();
          return;
        }

        isSettingScrollRef.current = true;
        el.scrollTop = scrollPosRef.current;
        isSettingScrollRef.current = false;

        updateProgress();
      }

      animFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, isOpen, speedWpm, fontSize, isEditingScript, updateProgress]);

  // Sync scroll position when user manually scrolls or touches
  const handleUserScroll = () => {
    if (isSettingScrollRef.current) return;
    if (scrollContainerRef.current) {
      scrollPosRef.current = scrollContainerRef.current.scrollTop;
      updateProgress();
    }
  };

  // Reset to top
  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    scrollPosRef.current = 0;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setScrollProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const handleCloseModal = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen) return null;

  const themeClasses: Record<
    ThemeMode,
    { bg: string; text: string; bar: string; guide: string; guideBadge: string }
  > = {
    "studio-dark": {
      bg: "bg-slate-950",
      text: "text-slate-100",
      bar: "bg-slate-900/95 border-slate-800 text-slate-200",
      guide: "border-indigo-500/40",
      guideBadge: "bg-indigo-950/90 text-indigo-300 border-indigo-500/40",
    },
    "high-contrast": {
      bg: "bg-black",
      text: "text-yellow-300 font-bold",
      bar: "bg-neutral-900/95 border-neutral-800 text-yellow-300",
      guide: "border-yellow-400/50",
      guideBadge: "bg-neutral-900 text-yellow-300 border-yellow-400/50",
    },
    "amber-glow": {
      bg: "bg-stone-950",
      text: "text-amber-200",
      bar: "bg-stone-900/95 border-stone-800 text-amber-200",
      guide: "border-amber-500/40",
      guideBadge: "bg-stone-900 text-amber-300 border-amber-500/40",
    },
    "clean-light": {
      bg: "bg-white",
      text: "text-slate-900 font-medium",
      bar: "bg-slate-100/95 border-slate-300 text-slate-800",
      guide: "border-blue-500/40",
      guideBadge: "bg-blue-50 text-blue-700 border-blue-300",
    },
  };

  const currentTheme = themeClasses[theme];
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Split text into paragraphs for presentation
  const paragraphs = activeScript.split(/\n+/).filter(Boolean);

  return (
    <div
      ref={containerRef}
      data-teleprompter-modal="true"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black select-none overflow-hidden"
    >
      {/* Hidden synced audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onEnded={() => {
            setIsPlaying(false);
          }}
        />
      )}

      {/* Top Floating Teleprompter HUD Controls */}
      <div
        className={`flex items-center justify-between border-b px-4 sm:px-6 py-3 shadow-xl backdrop-blur-md z-30 transition-colors ${currentTheme.bar}`}
      >
        {/* Left info badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="text-sm font-bold tracking-tight hidden sm:inline">Studio Teleprompter</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg bg-black/20 border border-white/10">
            <Clock className="h-3 w-3 text-indigo-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <span className="text-xs text-slate-400 hidden md:inline">
            {wordCount} words (~{estimatedMins} min read)
          </span>
        </div>

        {/* Center/Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 rounded-xl text-white font-bold text-xs px-4 py-2 transition cursor-pointer shadow-md ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 ring-2 ring-amber-400/40"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 ring-2 ring-indigo-400/30"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>Start Scroll</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 transition cursor-pointer"
            title="Reset to Top"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Optional Voice Sync Toggle (plays generated voice along with scroll) */}
          {audioUrl && (
            <button
              type="button"
              onClick={() => setIsVoiceSyncOn(!isVoiceSyncOn)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isVoiceSyncOn
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/30"
                  : "border-white/10 text-slate-300 hover:bg-white/10"
              }`}
              title={
                isVoiceSyncOn
                  ? "Voice Audio Synced with Prompter (Click to mute/silent)"
                  : "Click to enable audio voice playback while scrolling"
              }
            >
              {isVoiceSyncOn ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Voice Sync: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Voice Sync: OFF</span>
                </>
              )}
            </button>
          )}

          {/* Edit / Paste Script Button */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setIsEditingScript(!isEditingScript);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isEditingScript
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title="Edit or Paste Script Text"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isEditingScript ? "Done Editing" : "Edit Script"}</span>
          </button>

          {/* Speed WPM Slider */}
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-black/20 px-2 py-1 rounded-xl border border-white/10">
            <Gauge className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => setSpeedWpm((p) => Math.max(60, p - 10))}
              className="px-1 text-slate-400 hover:text-white"
              title="Decrease speed"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            <input
              type="range"
              min="60"
              max="260"
              step="10"
              value={speedWpm}
              onChange={(e) => setSpeedWpm(parseInt(e.target.value, 10))}
              className="w-16 sm:w-24 accent-indigo-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setSpeedWpm((p) => Math.min(260, p + 10))}
              className="px-1 text-slate-400 hover:text-white"
              title="Increase speed"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <span className="font-mono text-[11px] w-14 text-right shrink-0">{speedWpm} WPM</span>
          </div>

          {/* Font Size */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-black/20 px-2 py-1 rounded-xl border border-white/10">
            <Type className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="range"
              min="24"
              max="64"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-16 sm:w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-slate-400">{fontSize}px</span>
          </div>

          {/* Text Align Toggle */}
          <button
            type="button"
            onClick={() => setTextAlign((prev) => (prev === "center" ? "left" : "center"))}
            className="hidden md:flex p-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 transition cursor-pointer"
            title={`Align: ${textAlign === "center" ? "Centered" : "Left-Aligned"}`}
          >
            {textAlign === "center" ? <AlignCenter className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
          </button>

          {/* Mirror Flip Toggle */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMirrored
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            title="Mirror Flip for Teleprompter Glass"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeMode)}
            className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="studio-dark">Studio Dark</option>
            <option value="amber-glow">Amber Glow</option>
            <option value="high-contrast">High Contrast</option>
            <option value="clean-light">Clean Light</option>
          </select>

          {/* Eye Level Guide Position */}
          <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300">
            {eyelinePos === "off" ? (
              <EyeOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            )}
            <select
              value={eyelinePos}
              onChange={(e) => setEyelinePos(e.target.value as EyelinePosition)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
              title="Adjust Eye Level Guide (Standard 35% Upper-Third keeps your eyes on the camera lens)"
            >
              <option value="camera" className="bg-slate-900 text-slate-100">
                Eye Level: 35% (Studio Camera)
              </option>
              <option value="high" className="bg-slate-900 text-slate-100">
                Eye Level: 25% (High / Laptop)
              </option>
              <option value="center" className="bg-slate-900 text-slate-100">
                Eye Level: 50% (Center)
              </option>
              <option value="off" className="bg-slate-900 text-slate-100">
                Eye Level: Off
              </option>
            </select>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
            title="Exit Teleprompter (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Reading Progress Indicator Bar */}
      <div className="w-full h-1 bg-black/40 overflow-hidden z-30">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Prompter Visual Target Guide line positioned at selected eye level */}
      {eyelinePos !== "off" && (
        <div
          style={{ top: `${EYELINE_PERCENT_MAP[eyelinePos]}%` }}
          className="absolute left-0 right-0 -translate-y-1/2 pointer-events-none z-20 transition-all duration-200"
        >
          {/* Subtle reading focus band */}
          <div className="absolute inset-0 -top-8 -bottom-8 bg-white/[0.02] pointer-events-none" />

          {/* Guide Line */}
          <div className={`w-full h-0.5 border-t border-dashed ${currentTheme.guide}`} />

          {/* Left & Right Badges */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-between px-3 sm:px-6">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-r-md border text-[9px] font-bold tracking-widest uppercase shadow-sm ${currentTheme.guideBadge}`}
            >
              <span>EYE LEVEL</span>
              <span>▶</span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-l-md border text-[9px] font-bold tracking-widest uppercase shadow-sm ${currentTheme.guideBadge}`}
            >
              <span>◀</span>
              <span>EYE LEVEL</span>
            </div>
          </div>
        </div>
      )}

      {/* Script Quick Editor Overlay (if active) */}
      {isEditingScript ? (
        <div className="flex-1 flex flex-col p-6 sm:p-12 max-w-4xl mx-auto w-full z-40 bg-slate-900 border border-slate-800 rounded-2xl my-6 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="font-bold text-sm">Teleprompter Script Editor</span>
            </div>
            <span className="text-xs text-slate-400">
              {editableScript.length} characters &bull; {editableScript.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={editableScript}
            onChange={(e) => setEditableScript(e.target.value)}
            placeholder="Type or paste your speech or script here..."
            className="flex-1 w-full p-4 rounded-xl bg-black/50 border border-slate-700 text-slate-100 font-mono text-base resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
          />

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setEditableScript(cleanSourceText(scriptText) || DEFAULT_SAMPLE_SCRIPT);
              }}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Reset to Studio Text
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingScript(false);
                handleReset();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save &amp; View in Prompter</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Scrolling Text Stage */
        <div
          ref={scrollContainerRef}
          onScroll={handleUserScroll}
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 overflow-y-auto px-6 sm:px-12 md:px-24 select-none cursor-pointer transition-colors duration-200 ${
            currentTheme.bg
          } ${isMirrored ? "-scale-x-100" : ""}`}
          title="Click anywhere to Play / Pause (or press Space)"
        >
          {/* Top padding aligns the first sentence right at the selected eye-level guide line */}
          <div
            style={{
              paddingTop:
                eyelinePos === "off"
                  ? "4rem"
                  : `calc(${EYELINE_PERCENT_MAP[eyelinePos]}vh - ${fontSize * 0.45}px)`,
              paddingBottom: "85vh",
            }}
            className="max-w-4xl mx-auto min-h-[140vh]"
          >
            <div
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.65,
                textAlign: textAlign,
              }}
              className={`font-sans tracking-normal transition-all duration-150 space-y-8 ${currentTheme.text}`}
            >
              {paragraphs.map((para, idx) => (
                <p key={idx} className="transition-all duration-150">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom status helper pill */}
      {!isEditingScript && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>
              {isPlaying ? "Scrolling Active" : "Paused"} &bull; Click anywhere or press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                Space
              </kbd>{" "}
              to {isPlaying ? "pause" : "start"}
              {audioUrl && (
                <>
                  {" "}&bull; Voice Sync:{" "}
                  <span className={isVoiceSyncOn ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                    {isVoiceSyncOn ? "ON" : "OFF"}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
