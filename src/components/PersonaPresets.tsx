/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Mic, BookOpen, HeartPulse, Zap, Briefcase, Moon, Radio, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { VocalPersonaPreset, AudioFilterPreset } from "../types";

export const VOCAL_PERSONAS: VocalPersonaPreset[] = [
  {
    id: "podcast-host",
    name: "Podcast Host",
    tagline: "Engaging, crisp dialogue with warm broadcast presence",
    voice: "Puck",
    pitch: "normal",
    speed: "normal",
    style: "natural",
    filter: "warm-radio",
    color: "amber",
  },
  {
    id: "audiobook-storyteller",
    name: "Audiobook Storyteller",
    tagline: "Resonant, immersive pacing with cinematic high air",
    voice: "Charon",
    pitch: "low",
    speed: "slow",
    style: "dramatic",
    filter: "cinematic-air",
    color: "indigo",
  },
  {
    id: "mindfulness-guide",
    name: "Meditation & Zen",
    tagline: "Soothing, gentle breathing cadence for wellness",
    voice: "Kore",
    pitch: "low",
    speed: "slow",
    style: "calm",
    filter: "none",
    color: "emerald",
  },
  {
    id: "commercial-hook",
    name: "Promo Commercial",
    tagline: "Punchy, dynamic, high-energy delivery for social ads",
    voice: "Zephyr",
    pitch: "high",
    speed: "fast",
    style: "cheerful",
    filter: "vocal-clarity",
    color: "purple",
  },
  {
    id: "executive-briefing",
    name: "Executive Briefing",
    tagline: "Crisp, authoritative presentation for business insights",
    voice: "Fenrir",
    pitch: "normal",
    speed: "normal",
    style: "professional",
    filter: "vocal-clarity",
    color: "blue",
  },
  {
    id: "late-night-whisper",
    name: "Intimate Whisper",
    tagline: "Soft, close-mic ASMR tone with mellow room resonance",
    voice: "Kore",
    pitch: "low",
    speed: "slow",
    style: "whisper",
    filter: "warm-radio",
    color: "rose",
  },
];

interface PersonaPresetsProps {
  onApplyPersona: (persona: VocalPersonaPreset) => void;
  activeVoice: string;
  activeFilter: AudioFilterPreset;
  activeStyle: string;
}

const PERSONA_STYLES: Record<
  string,
  {
    bgActive: string;
    borderActive: string;
    badgeBg: string;
    iconBg: string;
    glow: string;
  }
> = {
  "podcast-host": {
    bgActive: "bg-amber-50/90",
    borderActive: "border-amber-500 ring-2 ring-amber-400/30",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-400/30",
    glow: "shadow-amber-500/15",
  },
  "audiobook-storyteller": {
    bgActive: "bg-indigo-50/90",
    borderActive: "border-indigo-500 ring-2 ring-indigo-400/30",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-400/30",
    glow: "shadow-indigo-500/15",
  },
  "mindfulness-guide": {
    bgActive: "bg-emerald-50/90",
    borderActive: "border-emerald-500 ring-2 ring-emerald-400/30",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-400/30",
    glow: "shadow-emerald-500/15",
  },
  "commercial-hook": {
    bgActive: "bg-fuchsia-50/90",
    borderActive: "border-fuchsia-500 ring-2 ring-fuchsia-400/30",
    badgeBg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    iconBg: "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-fuchsia-400/30",
    glow: "shadow-fuchsia-500/15",
  },
  "executive-briefing": {
    bgActive: "bg-blue-50/90",
    borderActive: "border-blue-500 ring-2 ring-blue-400/30",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-400/30",
    glow: "shadow-blue-500/15",
  },
  "late-night-whisper": {
    bgActive: "bg-rose-50/90",
    borderActive: "border-rose-500 ring-2 ring-rose-400/30",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-rose-400/30",
    glow: "shadow-rose-500/15",
  },
};

export const PersonaPresets: React.FC<PersonaPresetsProps> = ({
  onApplyPersona,
  activeVoice,
  activeFilter,
  activeStyle,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case "podcast-host":
        return <Mic className="h-4 w-4" />;
      case "audiobook-storyteller":
        return <BookOpen className="h-4 w-4" />;
      case "mindfulness-guide":
        return <HeartPulse className="h-4 w-4" />;
      case "commercial-hook":
        return <Zap className="h-4 w-4" />;
      case "executive-briefing":
        return <Briefcase className="h-4 w-4" />;
      case "late-night-whisper":
        return <Moon className="h-4 w-4" />;
      default:
        return <Radio className="h-4 w-4" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1-Click Vocal Personas
              </h3>
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-[10px] font-black text-transparent uppercase tracking-wider">
                Instant Presets
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Quickly load matched Voice + Pitch + Speed + EQ DSP Filter
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {VOCAL_PERSONAS.map((persona) => {
          const isMatching =
            persona.voice === activeVoice &&
            persona.filter === activeFilter &&
            persona.style === activeStyle;

          const styling = PERSONA_STYLES[persona.id] || PERSONA_STYLES["podcast-host"];

          return (
            <motion.button
              key={persona.id}
              type="button"
              id={`persona-btn-${persona.id}`}
              onClick={() => onApplyPersona(persona)}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className={`flex flex-col items-start p-3 rounded-xl text-left border cursor-pointer select-none transition-all ${
                isMatching
                  ? `${styling.bgActive} ${styling.borderActive} shadow-md ${styling.glow}`
                  : "border-slate-200/90 bg-slate-50/70 hover:border-slate-300 hover:bg-white hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-1.5 rounded-lg shadow-xs transition-transform ${styling.iconBg}`}
                >
                  {getIcon(persona.id)}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                    isMatching
                      ? styling.badgeBg
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {persona.voice}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {persona.name}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                {persona.tagline}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
