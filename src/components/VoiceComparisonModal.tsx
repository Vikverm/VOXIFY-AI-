/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  GitCompare,
  Play,
  Pause,
  Sparkles,
  Check,
  X,
  Volume2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { VoiceOption, StyleOption } from "../types";

interface VoiceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceOption[];
  currentText: string;
  onSelectVoice: (voiceId: string) => void;
}

interface VoiceSlot {
  voiceId: string;
  audioUrl?: string;
  isLoading: boolean;
  isPlaying: boolean;
}

export const VoiceComparisonModal: React.FC<VoiceComparisonModalProps> = ({
  isOpen,
  onClose,
  voices,
  currentText,
  onSelectVoice,
}) => {
  const initialSentence = currentText.trim()
    ? currentText.trim().split(/[.!?]\s+/)[0] + "."
    : "Welcome to AI Voice Studio. Experience lifelike speech with natural cadence and tone.";

  const [comparePhrase, setComparePhrase] = useState(initialSentence);
  const [slotCount, setSlotCount] = useState<2 | 3>(3);
  const [slots, setSlots] = useState<VoiceSlot[]>([
    { voiceId: "Kore", isLoading: false, isPlaying: false },
    { voiceId: "Puck", isLoading: false, isPlaying: false },
    { voiceId: "Charon", isLoading: false, isPlaying: false },
  ]);
  const [activePlayingIndex, setActivePlayingIndex] = useState<number | null>(null);

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  if (!isOpen) return null;

  const handleSynthesizeSlot = async (index: number) => {
    const slot = slots[index];
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isLoading: true };
      return next;
    });

    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: comparePhrase,
          voice: slot.voiceId,
          pitch: "normal",
          speed: "normal",
          style: "natural",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setSlots((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          isLoading: false,
          audioUrl: data.audioUrl,
        };
        return next;
      });
    } catch (err) {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], isLoading: false };
        return next;
      });
    }
  };

  const handleSynthesizeAll = async () => {
    const promises = slots.slice(0, slotCount).map((_, idx) => handleSynthesizeSlot(idx));
    await Promise.all(promises);
  };

  const handlePlaySlot = (index: number) => {
    // Stop all other slots
    audioRefs.current.forEach((aud, i) => {
      if (aud && i !== index) {
        aud.pause();
        aud.currentTime = 0;
      }
    });

    const aud = audioRefs.current[index];
    if (!aud) return;

    if (aud.paused) {
      aud.play();
      setActivePlayingIndex(index);
    } else {
      aud.pause();
      setActivePlayingIndex(null);
    }
  };

  const handleSelectSlotVoice = (index: number, newVoiceId: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        voiceId: newVoiceId,
        audioUrl: undefined,
      };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <GitCompare className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">A/B Voice Comparison</h3>
              <p className="text-xs text-slate-500">
                Audition the same sentence across 2 or 3 voices side-by-side to find the ideal match
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSlotCount(2)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  slotCount === 2 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                2 Voices
              </button>
              <button
                type="button"
                onClick={() => setSlotCount(3)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  slotCount === 3 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                3 Voices
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Comparison Sentence Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Test Sentence for Audition:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={comparePhrase}
              onChange={(e) => setComparePhrase(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 bg-slate-50"
              placeholder="Type or paste a sample sentence to compare..."
            />
            <button
              type="button"
              onClick={handleSynthesizeAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate All</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className={`grid gap-4 ${slotCount === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
          {slots.slice(0, slotCount).map((slot, idx) => {
            const voiceInfo = voices.find((v) => v.id === slot.voiceId);
            const isAuditioning = activePlayingIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      Voice {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {voiceInfo?.gender}
                    </span>
                  </div>

                  <select
                    value={slot.voiceId}
                    onChange={(e) => handleSelectSlotVoice(idx, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {voiceInfo?.tone}
                  </p>
                </div>

                {/* Audio Audition Element */}
                <div className="pt-2 border-t border-slate-200">
                  {slot.audioUrl ? (
                    <div className="space-y-2">
                      <audio
                        ref={(el) => (audioRefs.current[idx] = el)}
                        src={slot.audioUrl}
                        onEnded={() => setActivePlayingIndex(null)}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => handlePlaySlot(idx)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isAuditioning
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "bg-white border border-slate-200 text-slate-800 hover:bg-purple-50 hover:text-purple-700"
                        }`}
                      >
                        {isAuditioning ? (
                          <>
                            <Pause className="h-3.5 w-3.5 fill-current" />
                            <span>Playing Voice {String.fromCharCode(65 + idx)}</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Play Voice {String.fromCharCode(65 + idx)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSynthesizeSlot(idx)}
                      disabled={slot.isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {slot.isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>Generate Sample</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Pick this voice */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVoice(slot.voiceId);
                      onClose();
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    <span>Select for Studio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
