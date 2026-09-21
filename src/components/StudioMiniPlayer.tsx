/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  FastForward,
  Rewind,
  AlertCircle,
  Headphones,
  Sliders,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  ensureAudioContextRunning,
  decodeAudioDataSafe,
  playSpeakerTestChime,
  formatTime,
  downloadWavFile,
} from "../utils/audio";

export interface StudioMiniPlayerProps {
  audioUrl?: string | null;
  audioBase64?: string | null;
  title: string;
  subtitle?: string;
  accentColor?: "indigo" | "emerald" | "purple" | "amber" | "blue";
  initialAutoPlay?: boolean;
  onDownload?: () => void;
  customBadge?: React.ReactNode;
  onEnded?: () => void;
  compact?: boolean;
}

export const StudioMiniPlayer: React.FC<StudioMiniPlayerProps> = ({
  audioUrl,
  audioBase64,
  title,
  subtitle,
  accentColor = "indigo",
  initialAutoPlay = false,
  onDownload,
  customBadge,
  onEnded,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [showNativeControls, setShowNativeControls] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [testTonePlayed, setTestTonePlayed] = useState(false);

  // Web Audio Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // HTML5 Fallback Audio Element
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const [usingHtmlFallback, setUsingHtmlFallback] = useState(false);

  // Color theme classes
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50/70 border-indigo-200",
      btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
      text: "text-indigo-900",
      accent: "text-indigo-600",
      track: "accent-indigo-600",
      waveBar: "bg-indigo-400",
      activeWaveBar: "bg-indigo-600",
      badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    emerald: {
      bg: "bg-emerald-50/70 border-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
      text: "text-emerald-900",
      accent: "text-emerald-600",
      track: "accent-emerald-600",
      waveBar: "bg-emerald-400",
      activeWaveBar: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    purple: {
      bg: "bg-purple-50/70 border-purple-200",
      btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20",
      text: "text-purple-900",
      accent: "text-purple-600",
      track: "accent-purple-600",
      waveBar: "bg-purple-400",
      activeWaveBar: "bg-purple-600",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
    },
    amber: {
      bg: "bg-amber-50/70 border-amber-200",
      btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
      text: "text-amber-900",
      accent: "text-amber-600",
      track: "accent-amber-600",
      waveBar: "bg-amber-400",
      activeWaveBar: "bg-amber-600",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
    },
    blue: {
      bg: "bg-blue-50/70 border-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
      text: "text-blue-900",
      accent: "text-blue-600",
      track: "accent-blue-600",
      waveBar: "bg-blue-400",
      activeWaveBar: "bg-blue-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
    },
  }[accentColor];

  // Stop active playback and cleanup
  const stopWebAudioPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore
      }
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  // Decode audio data whenever audioUrl or audioBase64 changes
  useEffect(() => {
    stopWebAudioPlayback();
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }
    setCurrentTime(0);
    pauseOffsetRef.current = 0;
    setPlaybackError(null);

    const sourceData = audioBase64 || audioUrl;
    if (!sourceData) {
      audioBufferRef.current = null;
      setDuration(0);
      setWaveformData([]);
      return;
    }

    let isMounted = true;

    const prepareAudio = async () => {
      setIsLoading(true);
      try {
        const ctx = await ensureAudioContextRunning();
        audioCtxRef.current = ctx;

        const buffer = await decodeAudioDataSafe(sourceData, ctx);
        if (!isMounted) return;

        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setUsingHtmlFallback(false);

        // Generate visual peak bars
        const rawPeaks: number[] = [];
        const channel = buffer.getChannelData(0);
        const steps = 36;
        const blockSize = Math.floor(channel.length / steps);
        for (let i = 0; i < steps; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channel[start + j] || 0);
          }
          const avg = sum / (blockSize || 1);
          rawPeaks.push(Math.max(0.12, Math.min(1.0, avg * 3.5)));
        }
        setWaveformData(rawPeaks);

        if (initialAutoPlay) {
          startWebAudioPlayback(0);
        }
      } catch (err: any) {
        console.warn("Web Audio decode error, falling back to HTML5 Audio element:", err);
        if (!isMounted) return;
        setUsingHtmlFallback(true);
        // Fallback: measure duration via HTML5 audio element
        if (htmlAudioRef.current && audioUrl) {
          htmlAudioRef.current.src = audioUrl;
          htmlAudioRef.current.load();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    prepareAudio();

    return () => {
      isMounted = false;
      stopWebAudioPlayback();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
    };
  }, [audioUrl, audioBase64]);

  // Handle live volume change
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle live speed changes
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackSpeed;
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Playback via Web Audio API
  const startWebAudioPlayback = async (offsetSeconds: number) => {
    if (!audioBufferRef.current) return;

    try {
      const ctx = await ensureAudioContextRunning();
      audioCtxRef.current = ctx;

      // Disconnect previous
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.onended = null;
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch {
          // Ignore
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = isLooping;
      source.playbackRate.value = playbackSpeed;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current = gain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserNodeRef.current = analyser;

      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      source.onended = () => {
        if (!isLooping) {
          setIsPlaying(false);
          setCurrentTime(0);
          pauseOffsetRef.current = 0;
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          if (onEnded) onEnded();
        }
      };

      const clampedOffset = Math.max(0, Math.min(offsetSeconds, audioBufferRef.current.duration - 0.05));
      startTimeRef.current = ctx.currentTime - clampedOffset / playbackSpeed;
      pauseOffsetRef.current = clampedOffset;

      source.start(0, clampedOffset);
      sourceNodeRef.current = source;
      setIsPlaying(true);
      setPlaybackError(null);

      // Animation loop for tracking time
      const updateProgress = () => {
        if (!audioCtxRef.current || !sourceNodeRef.current) return;
        const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackSpeed;
        const totalDur = audioBufferRef.current?.duration || 0;

        if (elapsed >= totalDur && !isLooping) {
          setIsPlaying(false);
          setCurrentTime(0);
          pauseOffsetRef.current = 0;
          return;
        }

        setCurrentTime(Math.min(elapsed % (totalDur || 1), totalDur));
        animFrameRef.current = requestAnimationFrame(updateProgress);
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } catch (err: any) {
      console.error("Web Audio playback failed:", err);
      setPlaybackError("Audio playback error. Attempting HTML5 fallback.");
      playHtmlAudioFallback(offsetSeconds);
    }
  };

  // Fallback Playback via HTML5 Audio Element
  const playHtmlAudioFallback = (offsetSeconds: number) => {
    if (!htmlAudioRef.current) return;
    try {
      htmlAudioRef.current.currentTime = offsetSeconds;
      htmlAudioRef.current.volume = isMuted ? 0 : volume;
      htmlAudioRef.current.playbackRate = playbackSpeed;
      htmlAudioRef.current.loop = isLooping;

      const playPromise = htmlAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setPlaybackError(null);
          })
          .catch((e) => {
            console.error("HTML5 Audio play rejected:", e);
            setPlaybackError("Playback was blocked by browser. Click 'Test Audio' to unlock sound.");
            setIsPlaying(false);
          });
      }
    } catch (e: any) {
      setPlaybackError(e.message || "Unable to play audio");
      setIsPlaying(false);
    }
  };

  // Master Play / Pause Toggle
  const togglePlay = async () => {
    if (isLoading) return;

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current && audioCtxRef.current) {
        pauseOffsetRef.current = currentTime;
        stopWebAudioPlayback();
      }
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // Play
      if (!usingHtmlFallback && audioBufferRef.current) {
        await startWebAudioPlayback(pauseOffsetRef.current);
      } else if (audioUrl && htmlAudioRef.current) {
        playHtmlAudioFallback(pauseOffsetRef.current);
      } else {
        setPlaybackError("No audio source loaded.");
      }
    }
  };

  // Scrub audio slider
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    pauseOffsetRef.current = targetTime;

    if (isPlaying) {
      if (!usingHtmlFallback && audioBufferRef.current) {
        startWebAudioPlayback(targetTime);
      } else if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = targetTime;
      }
    }
  };

  // Skip backwards / forwards
  const handleSkip = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(currentTime + seconds, duration || 1));
    setCurrentTime(nextTime);
    pauseOffsetRef.current = nextTime;
    if (isPlaying) {
      if (!usingHtmlFallback && audioBufferRef.current) {
        startWebAudioPlayback(nextTime);
      } else if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = nextTime;
      }
    }
  };

  // Replay from start
  const handleReplay = () => {
    setCurrentTime(0);
    pauseOffsetRef.current = 0;
    if (isPlaying) {
      if (!usingHtmlFallback && audioBufferRef.current) {
        startWebAudioPlayback(0);
      } else if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = 0;
      }
    }
  };

  // Sound Test Chime
  const handleTestSpeaker = async () => {
    try {
      await playSpeakerTestChime();
      setTestTonePlayed(true);
      setTimeout(() => setTestTonePlayed(false), 2000);
      setPlaybackError(null);
    } catch (e) {
      console.warn("Chime error:", e);
    }
  };

  // Download Lossless WAV
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (audioUrl) {
      downloadWavFile(audioUrl, `${title.toLowerCase().replace(/\s+/g, "_")}.wav`);
    }
  };

  return (
    <div
      className={`rounded-2xl border ${colorMap.bg} p-4 transition-all shadow-xs space-y-3`}
    >
      {/* HTML5 Audio hidden fallback element */}
      <audio
        ref={htmlAudioRef}
        src={audioUrl || undefined}
        onTimeUpdate={() => {
          if (usingHtmlFallback && htmlAudioRef.current) {
            setCurrentTime(htmlAudioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (htmlAudioRef.current) {
            setDuration(htmlAudioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          pauseOffsetRef.current = 0;
          if (onEnded) onEnded();
        }}
        className={showNativeControls ? "w-full my-2 block" : "hidden"}
        controls={showNativeControls}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center ${colorMap.accent} shadow-2xs font-bold text-xs`}
          >
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${colorMap.text}`}>{title}</span>
              {customBadge}
            </div>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Speaker Sound Test */}
          <button
            type="button"
            onClick={handleTestSpeaker}
            className={`px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 transition flex items-center gap-1 cursor-pointer shadow-2xs ${
              testTonePlayed ? "text-emerald-700 bg-emerald-50 border-emerald-300" : ""
            }`}
            title="Play a test tone to confirm your speakers or headphones work"
          >
            {testTonePlayed ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Speakers Active</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3 text-slate-500" />
                <span>Test Audio</span>
              </>
            )}
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!audioUrl && !audioBase64}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 shadow-2xs"
            title="Download Lossless WAV Audio"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Direct Native Player Switch */}
          <button
            type="button"
            onClick={() => setShowNativeControls((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] transition cursor-pointer shadow-2xs"
            title={showNativeControls ? "Hide Native Player" : "Show Browser Audio Controls"}
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Playback Error Warning Banner */}
      {playbackError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{playbackError}</span>
          </div>
          <button
            type="button"
            onClick={handleTestSpeaker}
            className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shrink-0 cursor-pointer"
          >
            Unlock Audio
          </button>
        </div>
      )}

      {/* Main Transport Scrubber & Waveform Bars */}
      <div className="space-y-1.5">
        {/* Waveform Visualizer Bar */}
        {waveformData.length > 0 && !compact && (
          <div className="flex items-end justify-between gap-0.5 h-7 px-1 py-1 rounded-lg bg-white/70 border border-slate-200/80">
            {waveformData.map((val, idx) => {
              const progressFraction = duration > 0 ? currentTime / duration : 0;
              const barFraction = idx / waveformData.length;
              const isPast = barFraction <= progressFraction;

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-75 ${
                    isPast ? colorMap.activeWaveBar : colorMap.waveBar
                  } ${isPlaying ? "opacity-100" : "opacity-70"}`}
                  style={{ height: `${Math.max(15, val * 100)}%` }}
                />
              );
            })}
          </div>
        )}

        {/* Audio Slider */}
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleScrub}
            disabled={!audioUrl && !audioBase64}
            className={`w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer ${colorMap.track} disabled:opacity-40`}
          />
        </div>

        {/* Time Stamp Display */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-0.5">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-sans font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Playing
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Play / Pause, Skips, Speed, Volume */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading || (!audioUrl && !audioBase64)}
            className={`h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-40 shadow-sm ${colorMap.btn}`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>Play Audio</span>
              </>
            )}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Replay from start"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Skip -5s */}
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Rewind 5 seconds"
          >
            <Rewind className="h-3.5 w-3.5" />
          </button>

          {/* Skip +5s */}
          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Skip forward 5 seconds"
          >
            <FastForward className="h-3.5 w-3.5" />
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping((prev) => !prev)}
            className={`p-2 rounded-lg border text-xs transition cursor-pointer shadow-2xs ${
              isLooping
                ? "bg-indigo-100 border-indigo-300 text-indigo-800 font-bold"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
            title={isLooping ? "Looping Enabled" : "Looping Disabled"}
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Speed & Volume Right Section */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] shadow-2xs">
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded cursor-pointer font-mono font-semibold transition ${
                  playbackSpeed === s
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Volume Slider & Mute */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-rose-500" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(val === 0);
              }}
              className="w-16 h-1 bg-slate-200 rounded cursor-pointer accent-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
