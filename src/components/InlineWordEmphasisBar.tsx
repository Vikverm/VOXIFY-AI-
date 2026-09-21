/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  FastForward,
  Hourglass,
  VolumeX,
  Clock,
  RemoveFormatting,
  X,
} from "lucide-react";

export type EmphasisType =
  | "strong"
  | "pitch-up"
  | "pitch-down"
  | "fast"
  | "slow"
  | "whisper"
  | "pause"
  | "clear";

interface InlineWordEmphasisBarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  text?: string;
  onUpdateText?: (newText: string) => void;
  selectedText?: string;
  onApplyEmphasis?: (type: EmphasisType) => void;
  onClose?: () => void;
}

export const InlineWordEmphasisBar: React.FC<InlineWordEmphasisBarProps> = ({
  textareaRef,
  text = "",
  onUpdateText,
  selectedText: externalSelectedText,
  onApplyEmphasis: externalOnApplyEmphasis,
  onClose,
}) => {
  const [internalSelection, setInternalSelection] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);

  const checkSelection = useCallback(() => {
    if (!textareaRef?.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    if (start !== end && end > start) {
      const sel = (text || el.value || "").slice(start, end);
      if (sel?.trim()) {
        setInternalSelection({ text: sel, start, end });
        return;
      }
    }
    setInternalSelection(null);
  }, [textareaRef, text]);

  useEffect(() => {
    const el = textareaRef?.current;
    if (!el) return;

    const handleSelectOrMouseUp = () => {
      // Small timeout to allow browser to settle cursor/selection
      setTimeout(checkSelection, 50);
    };

    el.addEventListener("select", handleSelectOrMouseUp);
    el.addEventListener("mouseup", handleSelectOrMouseUp);
    el.addEventListener("keyup", handleSelectOrMouseUp);

    return () => {
      el.removeEventListener("select", handleSelectOrMouseUp);
      el.removeEventListener("mouseup", handleSelectOrMouseUp);
      el.removeEventListener("keyup", handleSelectOrMouseUp);
    };
  }, [textareaRef, checkSelection]);

  const activeSelectedText = externalSelectedText ?? internalSelection?.text ?? "";

  // Guard safely against undefined or empty text
  if (!activeSelectedText || typeof activeSelectedText !== "string" || !activeSelectedText.trim()) {
    return null;
  }

  const handleApply = (type: EmphasisType) => {
    if (externalOnApplyEmphasis) {
      externalOnApplyEmphasis(type);
      return;
    }

    if (!onUpdateText || !internalSelection || !textareaRef?.current) return;

    const { start, end, text: word } = internalSelection;
    let replacement = word;

    switch (type) {
      case "strong":
        replacement = `<emphasis level="strong">${word}</emphasis>`;
        break;
      case "pitch-up":
        replacement = `<prosody pitch="+15%">${word}</prosody>`;
        break;
      case "pitch-down":
        replacement = `<prosody pitch="-15%">${word}</prosody>`;
        break;
      case "fast":
        replacement = `<prosody rate="130%">${word}</prosody>`;
        break;
      case "slow":
        replacement = `<prosody rate="75%">${word}</prosody>`;
        break;
      case "whisper":
        replacement = `<amazon:effect name="whispered">${word}</amazon:effect>`;
        break;
      case "pause":
        replacement = `${word} <break time="500ms"/>`;
        break;
      case "clear":
        replacement = word.replace(/<[^>]+>/g, "");
        break;
    }

    const currentFullText = text || textareaRef.current.value || "";
    const nextText = currentFullText.slice(0, start) + replacement + currentFullText.slice(end);
    onUpdateText(nextText);
    setInternalSelection(null);

    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + replacement.length);
      }
    }, 50);
  };

  const handleDismiss = () => {
    setInternalSelection(null);
    onClose?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 border-r border-slate-700 max-w-[140px] truncate">
        "{activeSelectedText}"
      </span>

      {/* Strong Emphasis */}
      <button
        type="button"
        onClick={() => handleApply("strong")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Apply Strong Emphasis"
      >
        <Zap className="h-3 w-3 text-amber-400" />
        <span className="text-[11px] font-semibold">Emphasis</span>
      </button>

      {/* Pitch Up */}
      <button
        type="button"
        onClick={() => handleApply("pitch-up")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Higher Pitch (+15%)"
      >
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        <span className="text-[11px] font-semibold">Pitch ↑</span>
      </button>

      {/* Pitch Down */}
      <button
        type="button"
        onClick={() => handleApply("pitch-down")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Lower Pitch (-15%)"
      >
        <TrendingDown className="h-3 w-3 text-sky-400" />
        <span className="text-[11px] font-semibold">Pitch ↓</span>
      </button>

      {/* Fast */}
      <button
        type="button"
        onClick={() => handleApply("fast")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Faster Speed (130%)"
      >
        <FastForward className="h-3 w-3 text-purple-400" />
        <span className="text-[11px] font-semibold">Fast</span>
      </button>

      {/* Slow */}
      <button
        type="button"
        onClick={() => handleApply("slow")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Slower Pace (75%)"
      >
        <Hourglass className="h-3 w-3 text-indigo-400" />
        <span className="text-[11px] font-semibold">Slow</span>
      </button>

      {/* Whisper */}
      <button
        type="button"
        onClick={() => handleApply("whisper")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Whisper Voice Effect"
      >
        <VolumeX className="h-3 w-3 text-rose-400" />
        <span className="text-[11px] font-semibold">Whisper</span>
      </button>

      {/* Insert Pause */}
      <button
        type="button"
        onClick={() => handleApply("pause")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
        title="Insert 500ms Pause after word"
      >
        <Clock className="h-3 w-3 text-cyan-400" />
        <span className="text-[11px] font-semibold">+Pause</span>
      </button>

      {/* Remove Tags */}
      <button
        type="button"
        onClick={() => handleApply("clear")}
        className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition cursor-pointer ml-1"
        title="Remove SSML tags from selection"
      >
        <RemoveFormatting className="h-3 w-3" />
      </button>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer ml-auto"
        title="Close quick bar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
