/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  X,
  Volume2,
  Check,
  ZoomIn,
  ZoomOut,
  Clock,
} from "lucide-react";
import { AudioTake } from "../types";
import {
  getAudioContext,
  base64ToArrayBuffer,
  audioBufferToWav,
  downloadWavFile,
  formatTime,
} from "../utils/audio";

interface AudioTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  take: AudioTake | null;
  onSaveTrimmedTake?: (trimmedTake: AudioTake) => void;
}

export const AudioTrimmerModal: React.FC<AudioTrimmerModalProps> = ({
  isOpen,
  onClose,
  take,
  onSaveTrimmedTake,
}) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isAutoSilenceApplied, setIsAutoSilenceApplied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);

  // Decode audio on take change
  useEffect(() => {
    if (!take || !isOpen) return;

    let isCancelled = false;
    const ctx = getAudioContext();

    const decode = async () => {
      try {
        const ab = base64ToArrayBuffer(take.audioBase64);
        const decoded = await ctx.decodeAudioData(ab);
        if (isCancelled) return;

        setAudioBuffer(decoded);
        const dur = decoded.duration;
        setDuration(dur);
        setTrimStart(0);
        setTrimEnd(dur);
        setPlaybackTime(0);

        // Generate high-density waveform peaks (160 bins)
        const channel = decoded.getChannelData(0);
        const bins = 160;
        const step = Math.floor(channel.length / bins);
        const peaks: number[] = [];

        for (let i = 0; i < bins; i++) {
          const start = i * step;
          let max = 0;
          for (let j = 0; j < step; j++) {
            const val = Math.abs(channel[start + j]);
            if (val > max) max = val;
          }
          peaks.push(max);
        }
        setWaveformPeaks(peaks);
      } catch (err) {
        console.error("Failed to decode audio in trimmer:", err);
      }
    };

    decode();
    return () => {
      isCancelled = true;
      stopPlayback();
    };
  }, [take, isOpen]);

  // Stop playback when unmounting or paused
  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  // Play only trimmed section
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (!audioBuffer) return;
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);
    sourceNodeRef.current = src;

    const startOffset = playbackTime >= trimEnd || playbackTime < trimStart ? trimStart : playbackTime;
    const playDuration = Math.max(0.1, trimEnd - startOffset);

    src.start(0, startOffset, playDuration);
    playbackStartTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = startOffset;
    setIsPlaying(true);

    const updateLoop = () => {
      const now = ctx.currentTime;
      const elapsed = now - playbackStartTimeRef.current;
      const currentPos = playbackStartOffsetRef.current + elapsed;

      if (currentPos >= trimEnd) {
        setPlaybackTime(trimStart);
        setIsPlaying(false);
        stopPlayback();
        return;
      }

      setPlaybackTime(currentPos);
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    src.onended = () => {
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  };

  // Automatic silence detection (leading and trailing silence threshold -45dB)
  const handleAutoDetectSilence = () => {
    if (!audioBuffer) return;
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const threshold = 0.012; // ~-38dB

    let firstSoundIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) {
        firstSoundIndex = Math.max(0, i - Math.floor(sampleRate * 0.05)); // 50ms safety buffer
        break;
      }
    }

    let lastSoundIndex = data.length - 1;
    for (let i = data.length - 1; i >= 0; i--) {
      if (Math.abs(data[i]) > threshold) {
        lastSoundIndex = Math.min(data.length - 1, i + Math.floor(sampleRate * 0.05));
        break;
      }
    }

    const newStart = Number((firstSoundIndex / sampleRate).toFixed(2));
    const newEnd = Number((lastSoundIndex / sampleRate).toFixed(2));

    if (newEnd > newStart) {
      setTrimStart(newStart);
      setTrimEnd(newEnd);
      setPlaybackTime(newStart);
      setIsAutoSilenceApplied(true);
      setTimeout(() => setIsAutoSilenceApplied(false), 3000);
    }
  };

  // Crop and export trimmed audio
  const handleApplyTrim = async () => {
    if (!audioBuffer || !take) return;
    stopPlayback();

    const ctx = getAudioContext();
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.floor(trimEnd * sampleRate);
    const trimmedLength = Math.max(1, endSample - startSample);

    const trimmedBuffer = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      trimmedLength,
      sampleRate
    );

    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const srcChannel = audioBuffer.getChannelData(c);
      const dstChannel = trimmedBuffer.getChannelData(c);
      for (let i = 0; i < trimmedLength; i++) {
        dstChannel[i] = srcChannel[startSample + i];
      }
    }

    const wavBlob = audioBufferToWav(trimmedBuffer);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(",")[1];
      const trimmedTake: AudioTake = {
        ...take,
        id: `trimmed_${Date.now()}`,
        audioBase64: base64Data,
        duration: Number((trimmedLength / sampleRate).toFixed(2)),
        timestamp: Date.now(),
      };

      if (onSaveTrimmedTake) {
        onSaveTrimmedTake(trimmedTake);
      }
      downloadWavFile(base64Data, `${take.voice}_trimmed_${Math.round(trimStart * 10)}s_${Math.round(trimEnd * 10)}s.wav`);
      onClose();
    };
    reader.readAsDataURL(wavBlob);
  };

  if (!isOpen || !take) return null;

  const trimmedDuration = Math.max(0, trimEnd - trimStart);
  const startPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const playbackPercent = duration > 0 ? (playbackTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Scissors className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Audio Waveform Trimmer</h3>
              <p className="text-xs text-slate-500">
                Crop leading/trailing silence and export precise audio segments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Script excerpt preview */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 line-clamp-2 italic">
          "{take.text}"
        </div>

        {/* Waveform & Scrubber Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Trim Start: <strong>{formatTime(trimStart)}</strong></span>
            <span className="text-indigo-600 font-bold">Duration: {trimmedDuration.toFixed(2)}s</span>
            <span>Trim End: <strong>{formatTime(trimEnd)}</strong></span>
          </div>

          {/* Interactive Waveform Display */}
          <div className="relative h-28 w-full bg-slate-950 rounded-xl overflow-hidden select-none border border-slate-800">
            {/* Darkened unselected regions */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/60 z-10 pointer-events-none"
              style={{ width: `${startPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/60 z-10 pointer-events-none"
              style={{ width: `${100 - endPercent}%` }}
            />

            {/* Playhead indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-md pointer-events-none"
              style={{ left: `${playbackPercent}%` }}
            />

            {/* Waveform Bars */}
            <div className="absolute inset-0 flex items-center justify-between px-2 gap-0.5 pointer-events-none">
              {waveformPeaks.map((peak, idx) => {
                const barPercent = (idx / waveformPeaks.length) * 100;
                const isSelected = barPercent >= startPercent && barPercent <= endPercent;
                return (
                  <div
                    key={idx}
                    className={`w-full rounded-full transition-all duration-75 ${
                      isSelected ? "bg-indigo-400" : "bg-slate-700 opacity-40"
                    }`}
                    style={{
                      height: `${Math.max(8, peak * 90)}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Start Handle Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-30 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${startPercent}%` }}
            >
              <div className="h-6 w-3 bg-indigo-600 rounded-sm shadow-md flex items-center justify-center">
                <div className="w-0.5 h-3 bg-white" />
              </div>
            </div>

            {/* End Handle Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-indigo-500 z-30 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${endPercent}%` }}
            >
              <div className="h-6 w-3 bg-indigo-600 rounded-sm shadow-md flex items-center justify-center">
                <div className="w-0.5 h-3 bg-white" />
              </div>
            </div>
          </div>

          {/* Dual Range Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Start Position ({trimStart.toFixed(2)}s)
              </label>
              <input
                type="range"
                min="0"
                max={trimEnd - 0.1}
                step="0.05"
                value={trimStart}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrimStart(val);
                  setPlaybackTime(val);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                End Position ({trimEnd.toFixed(2)}s)
              </label>
              <input
                type="range"
                min={trimStart + 0.1}
                max={duration || 1}
                step="0.05"
                value={trimEnd}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrimEnd(val);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  <span>Audition Selection</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAutoDetectSilence}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
              title="Automatically trim silence at start & end"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>{isAutoSilenceApplied ? "Silence Trimmed!" : "Auto-Crop Silence"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTrimStart(0);
                setTrimEnd(duration);
                setPlaybackTime(0);
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              title="Reset Selection"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyTrim}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Apply Trim & Export WAV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
