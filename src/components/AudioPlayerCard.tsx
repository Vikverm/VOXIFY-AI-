import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Repeat,
  FastForward,
  Rewind,
  Sparkles,
  SlidersHorizontal,
  Headphones,
  Radio,
  FileText,
  ChevronDown,
  Subtitles,
  FileDown,
  X,
  Music,
  Keyboard,
  Scissors,
  GitCompare,
  Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioTake, AudioFilterPreset } from "../types";
import { AudioVisualizer } from "./AudioVisualizer";
import { AudioTrimmerModal } from "./AudioTrimmerModal";
import {
  getAudioContext,
  base64ToArrayBuffer,
  extractWaveformPeaks,
  createFilterNodes,
  downloadWavFile,
  formatTime,
} from "../utils/audio";
import {
  generateSrtContent,
  generateVttContent,
  generateDialogueSrt,
  generateDialogueVtt,
  downloadTextFile,
} from "../utils/subtitles";
import { BgmTrackId, BGM_TRACKS, playBgmInContext } from "../utils/bgm";

interface AudioPlayerCardProps {
  currentTake: AudioTake | null;
  playbackSpeed: number;
  pitchSemitones: number;
  audioFilter: AudioFilterPreset;
  onSpeedChange: (speed: number) => void;
  onFilterChange: (filter: AudioFilterPreset) => void;
  bgmTrack?: BgmTrackId;
  bgmVolume?: number;
  onChangeBgmTrack?: (track: BgmTrackId) => void;
  onChangeBgmVolume?: (vol: number) => void;
  onSaveTrimmedTake?: (trimmedTake: AudioTake) => void;
  onOpenComparison?: () => void;
  onOpenTeleprompter?: () => void;
  disabledShortcuts?: boolean;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  currentTake,
  playbackSpeed,
  pitchSemitones,
  audioFilter,
  onSpeedChange,
  onFilterChange,
  bgmTrack = "none",
  bgmVolume = 0.15,
  onChangeBgmTrack,
  onChangeBgmVolume,
  onSaveTrimmedTake,
  onOpenComparison,
  onOpenTeleprompter,
  disabledShortcuts = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [bypassDSP, setBypassDSP] = useState(false); // A/B comparison toggle
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [showSrtPreview, setShowSrtPreview] = useState(false);
  const [showBgmMenu, setShowBgmMenu] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);

  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Close more actions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Web Audio Nodes refs
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const bgmSessionRef = useRef<{ stop: () => void; setVolume: (v: number) => void } | null>(null);

  // Decode audio when currentTake changes
  useEffect(() => {
    if (!currentTake) {
      audioBufferRef.current = null;
      setPeaks([]);
      setDuration(0);
      setCurrentTime(0);
      pauseOffsetRef.current = 0;
      setIsPlaying(false);
      return;
    }

    const loadAudio = async () => {
      try {
        const audioCtx = getAudioContext();
        const arrayBuffer = base64ToArrayBuffer(currentTake.audioBase64);
        const buffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setPeaks(extractWaveformPeaks(buffer, 80));
        setCurrentTime(0);
        pauseOffsetRef.current = 0;

        // Auto-play newly loaded take
        startPlayback(0);
      } catch (err) {
        console.error("Failed to decode audio buffer:", err);
      }
    };

    stopPlayback();
    loadAudio();

    return () => {
      stopPlayback();
    };
  }, [currentTake?.id]);

  // Handle live parameter changes without restarting playback
  useEffect(() => {
    if (!isPlaying || !sourceNodeRef.current) return;
    const effectiveSpeed = bypassDSP ? 1.0 : playbackSpeed;
    const effectivePitch = bypassDSP ? 0 : pitchSemitones;

    const pitchFactor = Math.pow(2, effectivePitch / 12);
    sourceNodeRef.current.playbackRate.value = effectiveSpeed * pitchFactor;
  }, [playbackSpeed, pitchSemitones, bypassDSP, isPlaying]);

  // Volume node adjustment
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync BGM volume if updated live
  useEffect(() => {
    if (bgmSessionRef.current) {
      bgmSessionRef.current.setVolume(isMuted ? 0 : bgmVolume);
    }
  }, [bgmVolume, isMuted]);

  // Keyboard shortcuts for studio playback
  useEffect(() => {
    if (disabledShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is in an input or if a modal is open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        document.querySelector("[data-teleprompter-modal='true']")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSkip(5);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsLooping((prev) => !prev);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReplay();
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, isPlaying]);

  const startPlayback = (offsetSeconds: number) => {
    if (!audioBufferRef.current) return;

    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // Disconnect existing source
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.onended = null;
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      // Start BGM loop if active
      if (bgmTrack && bgmTrack !== "none") {
        if (bgmSessionRef.current) {
          bgmSessionRef.current.stop();
        }
        bgmSessionRef.current = playBgmInContext(audioCtx, bgmTrack as BgmTrackId, isMuted ? 0 : bgmVolume);
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = isLooping;

      const effectiveSpeed = bypassDSP ? 1.0 : playbackSpeed;
      const effectivePitch = bypassDSP ? 0 : pitchSemitones;
      const pitchFactor = Math.pow(2, effectivePitch / 12);
      source.playbackRate.value = effectiveSpeed * pitchFactor;

      // Master Gain
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current = gainNode;

      // Fast Analyser Node for waveform reactive dance
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNodeRef.current = analyserNode;

      // Filter Nodes (if not bypassed)
      const effectiveFilter = bypassDSP ? "none" : audioFilter;
      const filterPair = createFilterNodes(audioCtx, effectiveFilter);

      // Connect nodes chain: Source -> Filter Pair -> Analyser -> Gain -> Destination
      source.connect(filterPair.input);
      filterPair.output.connect(analyserNode);
      analyserNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      sourceNodeRef.current = source;
      startTimeRef.current = audioCtx.currentTime - offsetSeconds / source.playbackRate.value;
      pauseOffsetRef.current = offsetSeconds;
      setIsPlaying(true);

      source.onended = () => {
        if (!source.loop) {
          setIsPlaying(false);
          pauseOffsetRef.current = 0;
          setCurrentTime(0);
          if (bgmSessionRef.current) {
            bgmSessionRef.current.stop();
            bgmSessionRef.current = null;
          }
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        }
      };

      // Safe start offset calculation
      const safeOffset = Math.max(0, Math.min(offsetSeconds, audioBufferRef.current.duration - 0.01));
      source.start(0, safeOffset);

      // Start animation loop for playhead and analyser
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      const updatePlayhead = () => {
        if (sourceNodeRef.current && audioBufferRef.current) {
          const elapsed = (audioCtx.currentTime - startTimeRef.current) * source.playbackRate.value;
          const currentDuration = audioBufferRef.current.duration;
          const loopTime = isLooping ? elapsed % currentDuration : Math.min(elapsed, currentDuration);
          setCurrentTime(loopTime);

          if (analyserNodeRef.current) {
            analyserNodeRef.current.getByteFrequencyData(dataArray);
            setAnalyserData(new Uint8Array(dataArray));
          }

          if (elapsed < currentDuration || isLooping) {
            animFrameRef.current = requestAnimationFrame(updatePlayhead);
          }
        }
      };
      animFrameRef.current = requestAnimationFrame(updatePlayhead);
    } catch (err) {
      console.error("Playback start error:", err);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (bgmSessionRef.current) {
      bgmSessionRef.current.stop();
      bgmSessionRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // Safe ignore
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioBufferRef.current) return;
    if (isPlaying) {
      const audioCtx = getAudioContext();
      pauseOffsetRef.current = currentTime;
      stopPlayback();
    } else {
      const offset = currentTime >= duration ? 0 : currentTime;
      startPlayback(offset);
    }
  };

  const handleSeek = (newProgress: number) => {
    if (!audioBufferRef.current) return;
    const newTime = newProgress * duration;
    setCurrentTime(newTime);
    pauseOffsetRef.current = newTime;
    if (isPlaying) {
      startPlayback(newTime);
    }
  };

  const handleReplay = () => {
    setCurrentTime(0);
    pauseOffsetRef.current = 0;
    startPlayback(0);
  };

  const handleSkip = (seconds: number) => {
    if (!audioBufferRef.current) return;
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(target);
    pauseOffsetRef.current = target;
    if (isPlaying) {
      startPlayback(target);
    }
  };

  const handleDownload = () => {
    if (!currentTake) return;
    const filename = `voxify_${currentTake.voice.toLowerCase()}_${Date.now()}.wav`;
    downloadWavFile(currentTake.audioBase64, filename);
  };

  const handleDownloadMp3 = () => {
    if (!currentTake) return;
    const filename = `voxify_${currentTake.voice.toLowerCase()}_${Date.now()}.mp3`;
    downloadWavFile(currentTake.audioBase64, filename);
    setDownloadMenuOpen(false);
  };

  const getEffectiveSrt = () => {
    if (!currentTake) return "";
    if (currentTake.srtSubtitles) return currentTake.srtSubtitles;
    if (currentTake.isDialogue && currentTake.lineTimings && currentTake.lineTimings.length > 0) {
      return generateDialogueSrt(currentTake.lineTimings);
    }
    return generateSrtContent(currentTake.text, duration || currentTake.approximateDuration || 5);
  };

  const getEffectiveVtt = () => {
    if (!currentTake) return "";
    if (currentTake.vttSubtitles) return currentTake.vttSubtitles;
    if (currentTake.isDialogue && currentTake.lineTimings && currentTake.lineTimings.length > 0) {
      return generateDialogueVtt(currentTake.lineTimings);
    }
    return generateVttContent(currentTake.text, duration || currentTake.approximateDuration || 5);
  };

  const handleDownloadSrt = () => {
    if (!currentTake) return;
    const srt = getEffectiveSrt();
    const safeVoice = currentTake.voice.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
    downloadTextFile(srt, `voxify_${safeVoice}_subtitles.srt`, "application/x-subrip");
    setDownloadMenuOpen(false);
  };

  const handleDownloadVtt = () => {
    if (!currentTake) return;
    const vtt = getEffectiveVtt();
    const safeVoice = currentTake.voice.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
    downloadTextFile(vtt, `voxify_${safeVoice}_captions.vtt`, "text/vtt");
    setDownloadMenuOpen(false);
  };

  const handleDownloadTxt = () => {
    if (!currentTake) return;
    const cleanText = currentTake.text.replace(/<[^>]+>/g, "").trim();
    downloadTextFile(cleanText, `voxify_transcript_${Date.now()}.txt`, "text/plain");
    setDownloadMenuOpen(false);
  };

  const handleCopyText = () => {
    if (!currentTake) return;
    navigator.clipboard.writeText(currentTake.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  if (!currentTake) {
    return (
      <div
        id="empty-player-state"
        className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-600">
          <Headphones className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Audio Studio Player Ready
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Select a voice personality, configure pitch and speaking speed, and click &ldquo;Generate Speech Audio&rdquo; to hear your spoken track.
        </p>
      </div>
    );
  }

  return (
    <div
      id="active-player-card"
      className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-5 shadow-sm space-y-4"
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xs">
            {currentTake.voice.charAt(0)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Voice: {currentTake.voice}
              </span>

              {/* Dynamic Equalizer Dance when playing */}
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3 px-1 py-0.5 rounded bg-blue-50">
                  <span className="w-1 bg-cyan-500 rounded-full animate-eq-1" />
                  <span className="w-1 bg-blue-600 rounded-full animate-eq-2" />
                  <span className="w-1 bg-purple-600 rounded-full animate-eq-3" />
                  <span className="w-1 bg-pink-500 rounded-full animate-eq-4" />
                </div>
              )}

              {currentTake.language && currentTake.language !== "en" && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                  {currentTake.language}
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                Style: {currentTake.style}
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Pitch: {currentTake.pitchLevel} &bull; Cadence: {currentTake.speedLevel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic max-w-xl">
              &ldquo;{currentTake.text}&rdquo;
            </p>
          </div>
        </div>

        {/* Action buttons - Clean and consolidated */}
        <div className="flex items-center gap-2">
          {/* Visual Waveform Audio Trimmer */}
          <motion.button
            type="button"
            onClick={() => setIsTrimmerOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Open Audio Trimmer (crop silence, trim start/end)"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition cursor-pointer shadow-2xs"
          >
            <Scissors className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Trim</span>
          </motion.button>

          {/* Fullscreen Teleprompter Quick Action */}
          {onOpenTeleprompter && (
            <motion.button
              type="button"
              onClick={onOpenTeleprompter}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Open Fullscreen Teleprompter to read along or record"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer shadow-2xs"
            >
              <Mic className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Teleprompter</span>
            </motion.button>
          )}

          {/* More Actions Menu */}
          <div className="relative" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                bypassDSP
                  ? "border-amber-400 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="More audio actions & comparison"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">{bypassDSP ? "A: Original" : "Options"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showMoreActions && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-40 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Audio Options
                </div>

                {/* A/B Compare Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setBypassDSP(!bypassDSP);
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
                    <div>
                      <div className="font-semibold">A/B Compare DSP</div>
                      <div className="text-[10px] text-slate-400">
                        {bypassDSP ? "Currently: Original Take" : "Currently: Tuned Effects"}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bypassDSP ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                    {bypassDSP ? "Take A" : "Tuned B"}
                  </span>
                </button>

                {/* A/B Voices Audition */}
                {onOpenComparison && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenComparison();
                      setShowMoreActions(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-purple-50 text-slate-700 hover:text-purple-800 transition flex items-center gap-2 cursor-pointer"
                  >
                    <GitCompare className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Audition Voices</div>
                      <div className="text-[10px] text-slate-400">Compare 2-3 voices side-by-side</div>
                    </div>
                  </button>
                )}

                {/* Copy Script Text */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyText();
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span className="font-semibold">{copied ? "Copied to Clipboard!" : "Copy Script Text"}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Voxify Background Music (BGM) Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBgmMenu(!showBgmMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                bgmTrack !== "none"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Voxify Background Music (BGM)"
            >
              <Music className={`h-3.5 w-3.5 ${bgmTrack !== "none" ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="hidden sm:inline">
                {bgmTrack !== "none"
                  ? BGM_TRACKS.find((b) => b.id === bgmTrack)?.name || "BGM"
                  : "BGM Track"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showBgmMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-40 space-y-2.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Background Music (BGM)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBgmMenu(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {BGM_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        onChangeBgmTrack?.(track.id);
                        if (isPlaying && audioBufferRef.current) {
                          startPlayback(currentTime);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                        bgmTrack === track.id
                          ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">{track.name}</span>
                        <span className="text-[10px] text-slate-400 block">{track.desc}</span>
                      </div>
                      {bgmTrack === track.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </div>

                {bgmTrack !== "none" && onChangeBgmVolume && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>BGM Ducking Level:</span>
                      <span className="font-mono font-bold text-slate-900">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.4}
                      step={0.02}
                      value={bgmVolume}
                      onChange={(e) => onChangeBgmVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Voicemaker Download Suite & Dropdown */}
          <div className="relative">
            <div className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xs">
              <motion.button
                type="button"
                id="download-wav-btn"
                onClick={handleDownload}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Direct Download Lossless WAV"
                className="flex items-center gap-1.5 text-white text-xs font-bold pl-3 pr-2 py-2 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download WAV</span>
              </motion.button>

              <button
                type="button"
                id="download-menu-toggle"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="text-white/90 hover:text-white px-2 py-2 border-l border-white/20 hover:bg-white/10 rounded-r-xl transition cursor-pointer"
                title="More formats (MP3, SRT, VTT, TXT)"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {downloadMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-40 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Audio Formats
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold">Lossless WAV (Studio)</span>
                  <span className="text-[10px] text-slate-400">24/48kHz</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMp3}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold">MP3 Audio</span>
                  <span className="text-[10px] text-slate-400">320kbps</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Subtitles & Captions
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Subtitles className="h-3 w-3 text-purple-600" />
                    <span>Subtitles (.SRT)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">YouTube</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVtt}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Subtitles className="h-3 w-3 text-purple-600" />
                    <span>WebVTT (.VTT)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Web Player</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-slate-500" />
                    <span>Transcript (.TXT)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Plain text</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowSrtPreview(true);
                    setDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-blue-600 font-bold hover:bg-blue-50 transition flex items-center justify-between cursor-pointer"
                >
                  <span>Preview Subtitle Timestamps</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Waveform Visualizer */}
      <div className="space-y-1.5">
        <AudioVisualizer
          peaks={peaks}
          progress={progress}
          isPlaying={isPlaying}
          duration={duration}
          onSeek={handleSeek}
          analyserData={analyserData}
        />

        {/* Time and duration indicators */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-600 px-1">
          <span className="font-bold text-slate-800">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-3 text-[11px] font-sans">
            <span className="text-slate-400">
              {playbackSpeed !== 1.0 && !bypassDSP ? `${playbackSpeed.toFixed(2)}x speed` : ""}
              {pitchSemitones !== 0 && !bypassDSP ? ` &bull; ${pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}st` : ""}
            </span>
            <span className="font-mono font-semibold text-slate-700">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play / Skip Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            id="replay-btn"
            onClick={handleReplay}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Replay from start"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </motion.button>

          <motion.button
            type="button"
            id="skip-back-5s-btn"
            onClick={() => handleSkip(-5)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Skip back 5 seconds"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Rewind className="h-4 w-4" />
          </motion.button>

          {/* Glowing Animated Play/Pause Button */}
          <motion.button
            type="button"
            id="play-pause-btn"
            onClick={togglePlay}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </motion.button>

          <motion.button
            type="button"
            id="skip-forward-5s-btn"
            onClick={() => handleSkip(5)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Skip forward 5 seconds"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <FastForward className="h-4 w-4" />
          </motion.button>

          <motion.button
            type="button"
            id="loop-toggle-btn"
            onClick={() => setIsLooping(!isLooping)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title={isLooping ? "Looping Enabled" : "Loop Playback"}
            className={`p-2 rounded-xl transition ${
              isLooping
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Repeat className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Quick Speed Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[0.8, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              id={`rate-pill-${rate}`}
              onClick={() => onSpeedChange(rate)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                playbackSpeed === rate && !bypassDSP
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Slider & Keyboard Help */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="mute-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-slate-600 hover:text-slate-900"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-slate-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-20 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <button
            type="button"
            id="audio-shortcuts-btn"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts (?)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-1"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Voicemaker Subtitle & Captions Preview Modal */}
      <AnimatePresence>
        {showSrtPreview && currentTake && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Subtitles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Subtitle & Caption Preview
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard SubRip (.SRT) cues with accurate duration timestamps
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSrtPreview(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs max-h-60 overflow-y-auto leading-relaxed select-text">
                <pre className="whitespace-pre-wrap">
                  {getEffectiveSrt()}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Ready for YouTube, Premiere Pro, CapCut, DaVinci Resolve
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSrt}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .SRT</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Voicemaker Keyboard Shortcuts Cheat Sheet Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Keyboard className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Studio Player Shortcuts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { key: "Space", desc: "Play / Pause playback" },
                  { key: "← / →", desc: "Skip backward / forward 5s" },
                  { key: "R", desc: "Replay audio from start" },
                  { key: "L", desc: "Toggle loop repeat" },
                  { key: "M", desc: "Mute / Unmute audio" },
                  { key: "?", desc: "Toggle this shortcuts guide" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="text-slate-600">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-mono font-bold text-slate-800 text-[11px]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio Waveform Trimmer Modal */}
      {isTrimmerOpen && currentTake && (
        <AudioTrimmerModal
          take={currentTake}
          onClose={() => setIsTrimmerOpen(false)}
          onSaveTrimmed={(trimmedTake) => {
            onSaveTrimmedTake?.(trimmedTake);
            setIsTrimmerOpen(false);
          }}
        />
      )}
    </div>
  );
};
