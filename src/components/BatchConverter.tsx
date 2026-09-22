/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from "react";
import {
  Layers,
  Play,
  Pause,
  Download,
  Trash2,
  Sparkles,
  Split,
  CheckCircle2,
  Loader2,
  Volume2,
  FolderDown,
  RefreshCw,
  FileSpreadsheet,
  Archive,
  Upload,
  Sliders,
  FileText,
  Plus,
  Check,
  RotateCcw,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import JSZip from "jszip";
import { VoiceOption, StyleOption, PitchLevel, SpeedLevel } from "../types";
import {
  downloadWavFile,
  base64ToArrayBuffer,
  getAudioContext,
  ensureAudioContextRunning,
  decodeAudioDataSafe,
} from "../utils/audio";
import { parseCsvContent } from "../utils/fileParser";

export type SplitMode = "lines" | "sentences" | "paragraphs";

export function splitTextIntoSegments(text: string, mode: SplitMode): string[] {
  if (!text || !text.trim()) return [];

  if (mode === "lines") {
    return text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (mode === "paragraphs") {
    return text
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // mode === "sentences"
  // Try native Intl.Segmenter first for high-quality sentence boundary detection
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter("en", { granularity: "sentence" });
      const segments: string[] = [];
      for (const seg of segmenter.segment(text)) {
        const cleaned = (seg.segment || "").trim();
        // Discard pure punctuation/space fragments
        if (cleaned && cleaned.length > 0 && !/^[\s.,!?;:"'”’]+$/.test(cleaned)) {
          segments.push(cleaned);
        }
      }
      if (segments.length > 0) return segments;
    } catch {
      // Fall through to regex
    }
  }

  // Fallback regex: split on sentence-ending punctuation followed by whitespace or quotes
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.?!]["'”’]?)(?:\s+|\n+)/)
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && !/^[\s.,!?;:"'”’]+$/.test(s));
}

export interface BatchItem {
  id: string;
  filename?: string;
  text: string;
  voice: string;
  style: string;
  status: "idle" | "generating" | "ready" | "error";
  audioBase64?: string;
  duration?: number;
}

const DEFAULT_FALLBACK_STYLES: StyleOption[] = [
  { id: "natural", name: "Natural & Conversational", prompt: "Speak naturally and conversationally" },
  { id: "cheerful", name: "Cheerful & Upbeat", prompt: "Speak with cheerful enthusiasm and warm energy" },
  { id: "calm", name: "Calm & Meditative", prompt: "Speak slowly, peacefully, with a gentle and soothing cadence" },
  { id: "dramatic", name: "Dramatic & Storyteller", prompt: "Speak with dramatic emotional depth and narrative tension" },
  { id: "professional", name: "Professional & Articulate", prompt: "Speak clearly, authoritatively, and with polished newsroom articulation" },
  { id: "whisper", name: "Soft & Intimate", prompt: "Speak in a soft, gentle, intimate tone" },
];

function getVoiceGenderCategory(genderStr: string = ""): "Female" | "Male" | "Neutral" {
  const lower = genderStr.toLowerCase();
  if (lower.includes("female")) return "Female";
  if (lower.includes("male")) return "Male";
  return "Neutral";
}

function getVoiceToneSummary(tone: string = ""): string {
  if (!tone) return "";
  const parts = tone.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(", ");
  return `${parts[0]}, ${parts[1]}`;
}

interface BatchConverterProps {
  voices: VoiceOption[];
  styles?: StyleOption[];
  selectedVoice?: string;
  defaultVoice?: string;
  selectedStyle?: string;
  selectedLanguage?: string;
  onDeductCredits?: (chars: number) => boolean;
  onAddTake?: (take: any) => void;
}

export const BatchConverter: React.FC<BatchConverterProps> = ({
  voices,
  styles,
  selectedVoice: propSelectedVoice,
  defaultVoice,
  selectedStyle: propSelectedStyle,
  selectedLanguage = "en-US",
  onDeductCredits,
  onAddTake,
}) => {
  const availableStyles = useMemo(() => {
    return styles && styles.length > 0 ? styles : DEFAULT_FALLBACK_STYLES;
  }, [styles]);

  const activeVoice = propSelectedVoice || defaultVoice || (voices[0]?.id ?? "Kore");
  const activeStyle = propSelectedStyle || (availableStyles[0]?.id ?? "natural");

  const groupedVoices = useMemo(() => {
    const female: VoiceOption[] = [];
    const male: VoiceOption[] = [];
    const neutral: VoiceOption[] = [];

    voices.forEach((v) => {
      const cat = getVoiceGenderCategory(v.gender);
      if (cat === "Female") female.push(v);
      else if (cat === "Male") male.push(v);
      else neutral.push(v);
    });

    return { female, male, neutral };
  }, [voices]);

  const [rawText, setRawText] = useState(
    `Welcome to the Voxify Batch Audio Engine.\nConvert multiple paragraphs or lines in parallel with studio quality.\nEach segment can be assigned custom voices and exported as a ZIP archive.\nExport individual stems or concatenate all items into a single audiobook track.`
  );
  const [splitMode, setSplitMode] = useState<SplitMode>("lines");
  const [splitFeedback, setSplitFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<any>(null);

  const [items, setItems] = useState<BatchItem[]>([
    {
      id: "b1",
      filename: "intro_01.wav",
      text: "Welcome to the Voxify Batch Audio Engine.",
      voice: activeVoice,
      style: activeStyle,
      status: "idle",
    },
    {
      id: "b2",
      filename: "feature_02.wav",
      text: "Convert multiple paragraphs or lines in parallel with studio quality.",
      voice: "Puck",
      style: "cheerful",
      status: "idle",
    },
    {
      id: "b3",
      filename: "export_03.wav",
      text: "Each segment can be assigned custom voices and exported as a ZIP archive.",
      voice: "Charon",
      style: "professional",
      status: "idle",
    },
    {
      id: "b4",
      filename: "audiobook_04.wav",
      text: "Export individual stems or concatenate all items into a single audiobook track.",
      voice: "Zephyr",
      style: "natural",
      status: "idle",
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [bulkVoiceTarget, setBulkVoiceTarget] = useState(activeVoice);
  const [bulkStyleTarget, setBulkStyleTarget] = useState(activeStyle);

  const renderVoiceOptions = () => (
    <>
      {groupedVoices.female.length > 0 && (
        <optgroup label="👩 Female Voices">
          {groupedVoices.female.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} • Female ({getVoiceToneSummary(v.tone)})
            </option>
          ))}
        </optgroup>
      )}
      {groupedVoices.male.length > 0 && (
        <optgroup label="👨 Male Voices">
          {groupedVoices.male.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} • Male ({getVoiceToneSummary(v.tone)})
            </option>
          ))}
        </optgroup>
      )}
      {groupedVoices.neutral.length > 0 && (
        <optgroup label="✨ Neutral & Playful Voices">
          {groupedVoices.neutral.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} • {v.gender} ({getVoiceToneSummary(v.tone)})
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const segmentsListRef = useRef<HTMLDivElement | null>(null);

  // Live counts for detected segments by mode
  const lineCount = useMemo(() => splitTextIntoSegments(rawText, "lines").length, [rawText]);
  const sentenceCount = useMemo(() => splitTextIntoSegments(rawText, "sentences").length, [rawText]);
  const paragraphCount = useMemo(() => splitTextIntoSegments(rawText, "paragraphs").length, [rawText]);
  const detectedCount =
    splitMode === "sentences" ? sentenceCount : splitMode === "lines" ? lineCount : paragraphCount;

  // Split raw text into chunks
  const handleSplitText = (modeOverride?: SplitMode) => {
    const targetMode = modeOverride || splitMode;
    const rawChunks = splitTextIntoSegments(rawText, targetMode);

    if (rawChunks.length === 0) {
      setSplitFeedback("Please enter text above to split into audio clips.");
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setSplitFeedback(null), 3500);
      return;
    }

    setItems(
      rawChunks.map((text, idx) => ({
        id: `batch_${Date.now()}_${idx}`,
        filename: `clip_${String(idx + 1).padStart(2, "0")}.wav`,
        text,
        voice: activeVoice,
        style: activeStyle,
        status: "idle",
      }))
    );

    const modeLabels: Record<SplitMode, string> = {
      lines: "Line Breaks",
      sentences: "Sentences",
      paragraphs: "Paragraphs",
    };

    setSplitFeedback(`✓ Split into ${rawChunks.length} segments via ${modeLabels[targetMode]}`);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setSplitFeedback(null);
    }, 3000);
  };

  const handleSelectModeAndSplit = (mode: SplitMode) => {
    setSplitMode(mode);
    handleSplitText(mode);
  };

  const SAMPLE_SENTENCES =
    "Welcome to the Voxify batch audio engine. Convert multi-sentence paragraphs into distinct voice clips with crystal clarity. Each sentence can be assigned a unique character voice! Would you like to export your narration as a ZIP package? Start generating in one click.";

  const SAMPLE_DIALOGUE =
    "ALEX: Welcome to the Voxify audio masterclass!\nSARAH: Thanks Alex, delighted to be here testing multi-speaker batch synthesis.\nALEX: Notice how each line gets assigned its own file stem.\nSARAH: And we can download all clips individually or as a complete bundle!";

  // CSV Import handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const rows = parseCsvContent(content);
      if (rows.length === 0) {
        alert("No valid rows found in CSV. Expected columns: [Filename, Voice, Text]");
        return;
      }

      const newItems: BatchItem[] = rows.map((r, idx) => {
        // Validate if voice matches one of our available voices
        const matchedVoice = voices.find(
          (v) => v.id.toLowerCase() === (r.voice || "").toLowerCase()
        )?.id || activeVoice;

        const defaultFilename = `segment_${String(idx + 1).padStart(2, "0")}.wav`;

        return {
          id: `csv_${Date.now()}_${idx}`,
          filename: r.filename || defaultFilename,
          text: r.text,
          voice: matchedVoice,
          style: r.style || activeStyle,
          status: "idle",
        };
      });

      setItems(newItems);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  // Download sample CSV template
  const handleDownloadSampleCsv = () => {
    const sampleCsv = `Filename,Voice,Text,Style
quest_npc_01.wav,Charon,"Greetings traveler! Welcome to the ancient citadel.",dramatic
quest_npc_02.wav,Puck,"Keep your eyes open, danger lurks in the shadows!",cheerful
ivr_greeting.wav,Kore,"Thank you for calling customer support. Press one for sales.",professional
ivr_menu.wav,Zephyr,"All of our agents are currently assisting other callers.",calm`;

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voxify_batch_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert single item via API
  const convertSingleItem = async (item: BatchItem): Promise<BatchItem> => {
    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: item.text,
          voice: item.voice || activeVoice,
          pitch: "normal",
          speed: "normal",
          style: item.style || activeStyle,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error("Synthesis failed");
      const data = await response.json();

      return {
        ...item,
        status: "ready",
        audioBase64: data.audioBase64,
        duration: data.approximateDuration || 3,
      };
    } catch (err) {
      return {
        ...item,
        status: "error",
      };
    }
  };

  // Batch process all idle items
  const handleProcessAll = async () => {
    if (items.length === 0) return;

    const totalChars = items.reduce((acc, it) => acc + it.text.length, 0);
    if (onDeductCredits) {
      const allowed = onDeductCredits(totalChars);
      if (!allowed) return;
    }

    setIsProcessing(true);

    const updatedItems = [...items];
    for (let i = 0; i < updatedItems.length; i++) {
      if (updatedItems[i].status === "ready") continue;

      updatedItems[i] = { ...updatedItems[i], status: "generating" };
      setItems([...updatedItems]);

      const finishedItem = await convertSingleItem(updatedItems[i]);
      updatedItems[i] = finishedItem;
      setItems([...updatedItems]);

      if (onAddTake && finishedItem.status === "ready" && finishedItem.audioBase64) {
        onAddTake({
          id: finishedItem.id,
          text: finishedItem.text,
          audioBase64: finishedItem.audioBase64,
          audioUrl: `data:audio/wav;base64,${finishedItem.audioBase64}`,
          voice: finishedItem.voice,
          style: finishedItem.style,
          pitchLevel: "normal",
          speedLevel: "normal",
          playbackSpeed: 1.0,
          timestamp: Date.now(),
          duration: finishedItem.duration || 3,
        });
      }
    }

    setIsProcessing(false);
  };

  // Batch ZIP Export: Package all generated items into a single .zip
  const handleDownloadZip = async () => {
    const readyItems = items.filter((it) => it.status === "ready" && it.audioBase64);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const manifestEntries: any[] = [];

      readyItems.forEach((item, idx) => {
        const rawFilename = (item.filename || `track_${idx + 1}.wav`).replace(/[^\w.-]/g, "_");
        const safeName = rawFilename.endsWith(".wav") ? rawFilename : `${rawFilename}.wav`;

        // Decode base64 to binary
        const binaryString = atob(item.audioBase64!);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        zip.file(safeName, bytes);
        manifestEntries.push({
          index: idx + 1,
          filename: safeName,
          voice: item.voice,
          style: item.style,
          duration: item.duration || 0,
          text: item.text,
        });
      });

      // Add manifest.json and manifest.csv
      zip.file("manifest.json", JSON.stringify(manifestEntries, null, 2));

      let csvText = "Index,Filename,Voice,Style,Duration,Text\n";
      manifestEntries.forEach((m) => {
        csvText += `${m.index},"${m.filename}","${m.voice}","${m.style}",${m.duration},"${m.text.replace(/"/g, '""')}"\n`;
      });
      zip.file("manifest.csv", csvText);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voxify_batch_export_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip:", err);
      alert("Failed to build ZIP archive.");
    } finally {
      setIsZipping(false);
    }
  };

  const handlePlayItem = async (item: BatchItem) => {
    if (playingItemId === item.id) {
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
          currentSourceRef.current.disconnect();
        } catch {}
        currentSourceRef.current = null;
      }
      currentAudio?.pause();
      setPlayingItemId(null);
      return;
    }

    if (!item.audioBase64) return;

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    currentAudio?.pause();

    try {
      const ctx = await ensureAudioContextRunning();
      const buffer = await decodeAudioDataSafe(item.audioBase64, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setPlayingItemId(null);
        currentSourceRef.current = null;
      };
      source.start(0);
      currentSourceRef.current = source;
      setPlayingItemId(item.id);
    } catch (playErr) {
      console.warn("Web audio playback fallback to HTMLAudioElement:", playErr);
      const audio = new Audio(`data:audio/wav;base64,${item.audioBase64}`);
      audio.play().catch((e) => console.error("Audio playback error:", e));
      setCurrentAudio(audio);
      setPlayingItemId(item.id);
      audio.onended = () => {
        setPlayingItemId(null);
      };
    }
  };

  const handleDownloadItem = (item: BatchItem, idx: number) => {
    if (!item.audioBase64) return;
    const name = item.filename || `clip_${idx + 1}.wav`;
    downloadWavFile(item.audioBase64, name.endsWith(".wav") ? name : `${name}.wav`);
  };

  const handleSetAllVoices = (vId: string) => {
    setItems((prev) => prev.map((it) => ({ ...it, voice: vId, status: it.status === "ready" ? "idle" : it.status })));
  };

  const handleSetAllStyles = (sId: string) => {
    setItems((prev) => prev.map((it) => ({ ...it, style: sId, status: it.status === "ready" ? "idle" : it.status })));
  };

  const completedCount = items.filter((i) => i.status === "ready").length;

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Bulk Audio Generator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Batch synthesize dialogue, IVR menus, e-learning courses, and video game lines with per-row voice assignment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV / Spreadsheet Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Import CSV or spreadsheet with [Filename, Voice, Text]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleCsvUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline px-2 py-1 transition cursor-pointer"
          >
            Sample CSV
          </button>

          {/* Batch ZIP Export */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isZipping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              <span>Export ZIP ({completedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Splitter Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-2xs">
              1
            </span>
            <div>
              <label className="text-xs font-bold text-slate-900 block">
                Step 1: Write or Paste Your Text
              </label>
              <span className="text-[11px] text-slate-500">
                Type lines or dialogue, then click the purple button below to create audio clips.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Break into clips by:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSelectModeAndSplit("lines")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  splitMode === "lines"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Split by each line break"
              >
                <span>Line Breaks</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    splitMode === "lines"
                      ? "bg-purple-100 text-purple-700 font-bold"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {lineCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModeAndSplit("sentences")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  splitMode === "sentences"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Split by full sentences (. ! ?)"
              >
                <span>Sentences (.?!)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    splitMode === "sentences"
                      ? "bg-purple-100 text-purple-700 font-bold"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {sentenceCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModeAndSplit("paragraphs")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  splitMode === "paragraphs"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Split by paragraphs"
              >
                <span>Paragraphs</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    splitMode === "paragraphs"
                      ? "bg-purple-100 text-purple-700 font-bold"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {paragraphCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSplitText();
                setTimeout(() => {
                  segmentsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }
            }}
            placeholder="Type or paste your text here (e.g., dialogue lines, book chapter, podcast script)... Once typed, click 'Create Audio Clips' below to choose voices and generate!"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none transition resize-y font-mono leading-relaxed shadow-inner"
          />
        </div>

        {/* Clear Next Step Call-To-Action Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50 border-2 border-purple-200/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {rawText.trim()
                  ? `Ready: ${detectedCount} ${detectedCount === 1 ? "voice clip" : "voice clips"} detected`
                  : "Type text above to create clips"}
              </p>
              <p className="text-[11px] text-slate-500">
                {rawText.trim()
                  ? "Click the button to generate audio segments and pick voices below"
                  : "Or click a sample button below to try a demo script"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-create-segments-primary"
              type="button"
              onClick={() => {
                handleSplitText();
                setTimeout(() => {
                  segmentsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 60);
              }}
              disabled={!rawText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Split className="h-4 w-4" />
              <span>
                {items.length > 0 ? "Update Audio Clips" : "Create Audio Clips"}
                {detectedCount > 0 ? ` (${detectedCount})` : ""} ➔
              </span>
            </button>

            {items.length > 0 && (
              <button
                id="btn-jump-to-segments"
                type="button"
                onClick={() => {
                  segmentsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 text-xs font-semibold transition cursor-pointer"
                title="Jump down to view clips"
              >
                <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
                <span>View Clips</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Sample Presets & Status Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-semibold">Try Quick Sample:</span>
            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_SENTENCES);
                handleSelectModeAndSplit("sentences");
              }}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition cursor-pointer font-medium"
            >
              Paragraph (5 Sentences)
            </button>
            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_DIALOGUE);
                handleSelectModeAndSplit("lines");
              }}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-600 transition cursor-pointer font-medium"
            >
              Dialogue (4 Lines)
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => {
                  setRawText("");
                  setItems([]);
                  setSplitFeedback("Text cleared.");
                }}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear Text</span>
              </button>
            )}
          </div>

          {splitFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>{splitFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Batch Items List with Per-Row Voice & Style Assignment */}
      {items.length > 0 && (
        <div
          ref={segmentsListRef}
          id="batch-segments-section"
          className="rounded-2xl border-2 border-purple-200/80 bg-white p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-2xs">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Step 2: Assign Voices &amp; Generate Audio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    {completedCount}/{items.length} Ready
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select voice and speaking style for each line, then click "Generate All Clips" or convert individually.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Set all to voice */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-semibold">Set All Voice:</span>
                <select
                  id="select-bulk-voice"
                  value={bulkVoiceTarget}
                  onChange={(e) => {
                    setBulkVoiceTarget(e.target.value);
                    handleSetAllVoices(e.target.value);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:border-purple-400 focus:border-purple-600 focus:outline-none max-w-[200px]"
                >
                  {renderVoiceOptions()}
                </select>
              </div>

              {/* Set all to style */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-semibold">Set All Style:</span>
                <select
                  id="select-bulk-style"
                  value={bulkStyleTarget}
                  onChange={(e) => {
                    const newS = e.target.value;
                    setBulkStyleTarget(newS);
                    handleSetAllStyles(newS);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs hover:border-purple-400 focus:border-purple-600 focus:outline-none max-w-[160px]"
                >
                  {availableStyles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || (s as any).label || s.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate All Button */}
              <button
                type="button"
                onClick={handleProcessAll}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing All...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate All Clips</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setItems([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                title="Clear all batch items"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Rows List */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const currentVoice = voices.find((v) => v.id === item.voice) || voices[0];
              const currentStyle = availableStyles.find((s) => s.id === item.style) || availableStyles[0];
              const genderCat = currentVoice ? getVoiceGenderCategory(currentVoice.gender) : "Neutral";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
                    item.status === "ready"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : item.status === "generating"
                      ? "bg-purple-50/40 border-purple-200 animate-pulse"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  {/* File info & Text */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.filename || `clip_${idx + 1}.wav`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) =>
                            prev.map((it) => (it.id === item.id ? { ...it, filename: val } : it))
                          );
                        }}
                        className="text-[11px] font-mono text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:outline-none max-w-[160px]"
                        placeholder="filename.wav"
                      />
                      {item.duration && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {item.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {item.text}
                    </p>
                  </div>

                  {/* Controls & Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    {/* Per-Row Voice & Style Controls & Badges */}
                    <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        {/* Voice Selector */}
                        <div className="relative">
                          <select
                            id={`select-voice-${item.id}`}
                            value={item.voice}
                            onChange={(e) => {
                              const newV = e.target.value;
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, voice: newV, status: it.status === "ready" ? "idle" : it.status }
                                    : it
                                )
                              );
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-purple-400 focus:border-purple-600 focus:outline-none cursor-pointer min-w-[170px] max-w-[220px]"
                            title={currentVoice ? `${currentVoice.name} (${currentVoice.gender} • ${currentVoice.tone})` : item.voice}
                          >
                            {renderVoiceOptions()}
                          </select>
                        </div>

                        {/* Speaking Style Selector */}
                        <div className="relative">
                          <select
                            id={`select-style-${item.id}`}
                            value={item.style}
                            onChange={(e) => {
                              const newS = e.target.value;
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, style: newS, status: it.status === "ready" ? "idle" : it.status }
                                    : it
                                )
                              );
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-purple-400 focus:border-purple-600 focus:outline-none cursor-pointer min-w-[140px] max-w-[190px]"
                            title={currentStyle ? `Speaking Style: ${currentStyle.name || currentStyle.id}` : "Speaking Style"}
                          >
                            {availableStyles.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name || (s as any).label || s.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Informative Gender & Tone Chip so clients identify voice characteristics at a glance */}
                      {currentVoice && (
                        <div className="flex items-center gap-1.5 text-[10px] pl-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              genderCat === "Female"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : genderCat === "Male"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {currentVoice.gender}
                          </span>
                          <span
                            className="text-slate-500 font-medium truncate max-w-[220px]"
                            title={currentVoice.tone}
                          >
                            Tone: {getVoiceToneSummary(currentVoice.tone)}
                          </span>
                        </div>
                      )}
                    </div>

                  {/* Actions */}
                  {item.status === "ready" ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePlayItem(item)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          playingItemId === item.id
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50"
                        }`}
                        title="Play preview"
                      >
                        {playingItemId === item.id ? (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item, idx)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Download WAV clip"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : item.status === "generating" ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 px-2 py-1 rounded bg-purple-100">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Synthesizing...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, status: "generating" } : it))
                        );
                        const fin = await convertSingleItem(item);
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? fin : it))
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      Generate
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((it) => it.id !== item.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Split className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Segments in Queue</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Type or paste your text above and click <span className="font-semibold text-slate-700">Split Text</span>, switch split mode, or load a sample preset.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_SENTENCES);
                handleSelectModeAndSplit("sentences");
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Load Sample Sentences
            </button>
            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_DIALOGUE);
                handleSelectModeAndSplit("lines");
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Load Sample Dialogue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
