import React from "react";
import {
  Sparkles,
  Radio,
  Sliders,
  Volume2,
  Mic2,
  Wand2,
  FileCode2,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

export const AudioEffectsGuide: React.FC = () => {
  return (
    <div className="space-y-10 py-4 w-full">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
          <Wand2 className="h-3.5 w-3.5" />
          <span>Voxify VoxFX™ & SSML Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Audio Effects, Neural Engines & SSML Guide
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Master realistic voice synthesis with custom pause tags, emotional delivery styles,
          and studio DSP audio effects inspired by broadcast production.
        </p>
      </div>

      {/* 1. SSML & Audio Tags */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileCode2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Voxify SSML & Punctuation Tags
            </h3>
            <p className="text-xs text-slate-500">
              Inject realistic pacing, pauses, and breath marks directly into your script.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                ... (Ellipsis Pause)
              </span>
              <span className="text-[11px] text-blue-600 font-semibold">~400ms Pause</span>
            </div>
            <p className="text-slate-600">
              Creates a subtle hesitation or natural thought pause between clauses.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              "We waited for what seemed like hours... but nobody came."
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                — (Em-Dash Breath)
              </span>
              <span className="text-[11px] text-purple-600 font-semibold">~750ms Dramatic Break</span>
            </div>
            <p className="text-slate-600">
              Creates a deliberate breath break, ideal for key reveals, headlines, and podcast hooks.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              "This changes everything — the future of AI voiceovers is here."
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                [whisper] ... [/whisper]
              </span>
              <span className="text-[11px] text-teal-600 font-semibold">Soft Vocal Register</span>
            </div>
            <p className="text-slate-600">
              Instructs the neural engine to lower vocal projection for intimate or secret storytelling.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              "[whisper] Don't make a sound, they're right outside. [/whisper]"
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                [emphasis] ... [/emphasis]
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">Vocal Punch & Stress</span>
            </div>
            <p className="text-slate-600">
              Applies higher intensity, pitch inflection, and micro-cadence stress to key words.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              "This is the [emphasis] absolute best [/emphasis] deal of the year."
            </div>
          </div>
        </div>
      </div>

      {/* 2. VoxFX DSP Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              VoxFX™ Studio Audio Mastering Presets
            </h3>
            <p className="text-xs text-slate-500">
              Real-time Web Audio API parametric EQ and dynamic filters applied on output.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Studio Clean (Direct)</span>
            </div>
            <p className="text-slate-600">
              Flat, pristine reference signal with zero post-processing. Best for general voiceovers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Warm Radio (Podcast)</span>
            </div>
            <p className="text-slate-600">
              Boosts low-end warmth (+4.5dB at 180Hz) and smooths high frequencies for FM broadcast quality.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Vocal Clarity</span>
            </div>
            <p className="text-slate-600">
              High-pass cuts mud below 95Hz and introduces a presence peak at 3.2kHz for clear speech.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Vintage Lo-Fi Telephone</span>
            </div>
            <p className="text-slate-600">
              Narrow bandpass filter centered around 1,600Hz mimicking landline phones and walkie-talkies.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Cinematic Air</span>
            </div>
            <p className="text-slate-600">
              Airy high shelf (+3.5dB at 7,500Hz) with gentle low-mid carve for movie trailer elegance.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Live DSP Bypass</span>
            </div>
            <p className="text-slate-600">
              Toggle "Direct Bypass" in the player deck anytime to A/B test raw vs mastered sound.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
