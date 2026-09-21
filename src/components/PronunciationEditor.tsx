/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Volume2,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
  Layers,
  Stethoscope,
  Terminal,
  Compass,
  FileSpreadsheet,
  FileJson,
  Languages,
} from "lucide-react";

export interface PronunciationRule {
  id: string;
  original: string;
  replacement: string;
  ipa?: string;
  category: "acronym" | "name" | "technical" | "medical" | "fantasy" | "custom";
  enabled: boolean;
}

export const DEFAULT_RULES: PronunciationRule[] = [
  { id: "1", original: "Voicemaker", replacement: "Voice Maker", category: "name", enabled: true },
  { id: "2", original: "SQL", replacement: "sequel", category: "technical", enabled: true },
  { id: "3", original: "API", replacement: "A-P-I", category: "acronym", enabled: true },
  { id: "4", original: "Gemini", replacement: "JEM-ih-nye", category: "name", enabled: true },
  { id: "5", original: "FAQ", replacement: "F-A-Q", category: "acronym", enabled: true },
  { id: "6", original: "TTS", replacement: "Text to Speech", category: "acronym", enabled: true },
  { id: "7", original: "AI", replacement: "A-I", category: "acronym", enabled: true },
  { id: "8", original: "SSML", replacement: "S-S-M-L", category: "technical", enabled: true },
];

export const INDUSTRY_GLOSSARIES = {
  medical: {
    label: "🩺 Medical & Pharma Pack",
    rules: [
      { original: "angina", replacement: "an-JY-nuh", ipa: "/ænˈdʒaɪnə/", category: "medical" as const },
      { original: "tinnitus", replacement: "TIN-ih-tus", ipa: "/ˈtɪnɪtəs/", category: "medical" as const },
      { original: "arrhythmia", replacement: "uh-RITH-mee-uh", ipa: "/əˈrɪðmiə/", category: "medical" as const },
      { original: "dyspnea", replacement: "DISP-nee-uh", ipa: "/dɪspˈniːə/", category: "medical" as const },
      { original: "omeprazole", replacement: "oh-MEP-ruh-zohl", ipa: "/oʊˈmɛprəzoʊl/", category: "medical" as const },
      { original: "hypertrophy", replacement: "hy-PER-truh-fee", ipa: "/haɪˈpɜːrtrəfi/", category: "medical" as const },
    ],
  },
  tech: {
    label: "💻 Tech & Dev Pack",
    rules: [
      { original: "Kubernetes", replacement: "koo-ber-NET-eez", ipa: "/ˌkuːbərˈnɛtiːz/", category: "technical" as const },
      { original: "OAuth", replacement: "OH-auth", ipa: "/ˈoʊˌɔːθ/", category: "technical" as const },
      { original: "Nginx", replacement: "ENGINE-ex", ipa: "/ˈɛndʒɪnˌɛks/", category: "technical" as const },
      { original: "PostgreSQL", replacement: "post-gres-Q-L", ipa: "/ˈpoʊstɡrɛsˌkjuːˈɛl/", category: "technical" as const },
      { original: "GUI", replacement: "GOO-ee", ipa: "/ˈɡuːi/", category: "technical" as const },
      { original: "SaaS", replacement: "SASS", ipa: "/sæs/", category: "technical" as const },
      { original: "JWT", replacement: "JOT", ipa: "/dʒɒt/", category: "technical" as const },
    ],
  },
  fantasy: {
    label: "🧙 Fantasy & Sci-Fi Pack",
    rules: [
      { original: "Cthulhu", replacement: "kuh-THOO-loo", ipa: "/kəˈθuːluː/", category: "fantasy" as const },
      { original: "Mjolnir", replacement: "MEE-yol-neer", ipa: "/ˈmjɔːlnɪər/", category: "fantasy" as const },
      { original: "Targaryen", replacement: "tar-GAIR-ee-un", ipa: "/tɑːrˈɡɛəriən/", category: "fantasy" as const },
      { original: "Smaug", replacement: "SMOWG", ipa: "/smaʊɡ/", category: "fantasy" as const },
      { original: "Excalibur", replacement: "ex-CAL-ih-bur", ipa: "/ɛkˈskælɪbər/", category: "fantasy" as const },
    ],
  },
};

// Common word to IPA dictionary mapping
const IPA_DATABASE: Record<string, { ipa: string; respell: string }> = {
  kubernetes: { ipa: "/ˌkuːbərˈnɛtiːz/", respell: "koo-ber-NET-eez" },
  oauth: { ipa: "/ˈoʊˌɔːθ/", respell: "OH-auth" },
  nginx: { ipa: "/ˈɛndʒɪnˌɛks/", respell: "ENGINE-ex" },
  sql: { ipa: "/ˈsiːkwəl/", respell: "SEE-kwul" },
  api: { ipa: "/ˌeɪ piː ˈaɪ/", respell: "A-P-I" },
  angina: { ipa: "/ænˈdʒaɪnə/", respell: "an-JY-nuh" },
  tinnitus: { ipa: "/ˈtɪnɪtəs/", respell: "TIN-ih-tus" },
  arrhythmia: { ipa: "/əˈrɪðmiə/", respell: "uh-RITH-mee-uh" },
  cthulhu: { ipa: "/kəˈθuːluː/", respell: "kuh-THOO-loo" },
  mjolnir: { ipa: "/ˈmjɔːlnɪər/", respell: "MEE-yol-neer" },
  gemini: { ipa: "/ˈdʒɛmɪnaɪ/", respell: "JEM-ih-nye" },
  voicemaker: { ipa: "/vɔɪs ˈmeɪkər/", respell: "Voice Maker" },
  algorithm: { ipa: "/ˈælɡərɪðəm/", respell: "AL-guh-rith-um" },
  epitome: { ipa: "/ɪˈpɪtəmi/", respell: "ih-PIT-uh-mee" },
  hyperbole: { ipa: "/haɪˈpɜːrbəli/", respell: "hy-PER-buh-lee" },
  cache: { ipa: "/kæʃ/", respell: "KASH" },
  colonel: { ipa: "/ˈkɜːrnəl/", respell: "KER-nul" },
};

interface PronunciationEditorProps {
  rules: PronunciationRule[];
  onUpdateRules: (rules: PronunciationRule[]) => void;
  onClose?: () => void;
}

export const PronunciationEditor: React.FC<PronunciationEditorProps> = ({
  rules,
  onUpdateRules,
  onClose,
}) => {
  const [newOriginal, setNewOriginal] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const [newIpa, setNewIpa] = useState("");
  const [newCategory, setNewCategory] = useState<PronunciationRule["category"]>("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [testText, setTestText] = useState("Voxify API converts text with Kubernetes, SQL, and OAuth.");

  // IPA Converter input
  const [ipaInputWord, setIpaInputWord] = useState("");
  const [ipaResult, setIpaResult] = useState<{ ipa: string; respell: string } | null>(null);

  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Quick lookup in IPA database or generate phonetic respelling
  const handleLookupIpa = () => {
    const clean = ipaInputWord.trim().toLowerCase();
    if (!clean) return;

    if (IPA_DATABASE[clean]) {
      setIpaResult(IPA_DATABASE[clean]);
    } else {
      // Heuristic syllable hyphenation
      const respellGuess = clean
        .replace(/ph/g, "f")
        .replace(/tion/g, "shun")
        .replace(/ough/g, "oh")
        .toUpperCase();
      setIpaResult({
        ipa: `/${clean}/`,
        respell: respellGuess,
      });
    }
  };

  const handleAddRuleFromIpa = () => {
    if (!ipaInputWord.trim() || !ipaResult) return;
    const rule: PronunciationRule = {
      id: "rule_" + Date.now(),
      original: ipaInputWord.trim(),
      replacement: ipaResult.respell,
      ipa: ipaResult.ipa,
      category: "custom",
      enabled: true,
    };
    onUpdateRules([rule, ...rules]);
    setIpaInputWord("");
    setIpaResult(null);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginal.trim() || !newReplacement.trim()) return;

    const newRule: PronunciationRule = {
      id: "rule_" + Date.now(),
      original: newOriginal.trim(),
      replacement: newReplacement.trim(),
      ipa: newIpa.trim() || undefined,
      category: newCategory,
      enabled: true,
    };

    onUpdateRules([newRule, ...rules]);
    setNewOriginal("");
    setNewReplacement("");
    setNewIpa("");
  };

  const handleToggleRule = (id: string) => {
    onUpdateRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteRule = (id: string) => {
    onUpdateRules(rules.filter((r) => r.id !== id));
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset pronunciation rules to default dictionary?")) {
      onUpdateRules(DEFAULT_RULES);
    }
  };

  // Import Industry Glossary Pack
  const handleImportGlossary = (packKey: keyof typeof INDUSTRY_GLOSSARIES) => {
    const pack = INDUSTRY_GLOSSARIES[packKey];
    const newItems: PronunciationRule[] = pack.rules.map((r, i) => ({
      id: `glossary_${packKey}_${Date.now()}_${i}`,
      original: r.original,
      replacement: r.replacement,
      ipa: r.ipa,
      category: r.category,
      enabled: true,
    }));

    // Filter out duplicates by original word
    const existingWords = new Set(rules.map((r) => r.original.toLowerCase()));
    const uniqueNew = newItems.filter((it) => !existingWords.has(it.original.toLowerCase()));

    onUpdateRules([...uniqueNew, ...rules]);
  };

  // Export rules to JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pronunciation_dictionary_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export rules to CSV
  const handleExportCsv = () => {
    let csv = "Original,Replacement,IPA,Category,Enabled\n";
    rules.forEach((r) => {
      csv += `"${r.original}","${r.replacement}","${r.ipa || ""}","${r.category}",${r.enabled}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pronunciation_dictionary_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import rules from JSON/CSV file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const formatted: PronunciationRule[] = parsed.map((item, idx) => ({
              id: item.id || `rule_imp_${Date.now()}_${idx}`,
              original: item.original || "",
              replacement: item.replacement || "",
              ipa: item.ipa,
              category: item.category || "custom",
              enabled: item.enabled !== false,
            })).filter((r) => r.original && r.replacement);

            onUpdateRules([...formatted, ...rules]);
          }
        } else {
          // Parse CSV
          const lines = content.split("\n").filter((l) => l.trim());
          const newRules: PronunciationRule[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            if (cols.length >= 2 && cols[0] && cols[1]) {
              newRules.push({
                id: `rule_csv_${Date.now()}_${i}`,
                original: cols[0],
                replacement: cols[1],
                ipa: cols[2] || undefined,
                category: (cols[3] as any) || "custom",
                enabled: cols[4] !== "false",
              });
            }
          }
          if (newRules.length > 0) {
            onUpdateRules([...newRules, ...rules]);
          }
        }
      } catch (err) {
        alert("Failed to parse dictionary file. Please check format.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  // Test replaced string
  const getSimulatedOutput = (source: string) => {
    let result = source;
    rules
      .filter((r) => r.enabled)
      .forEach((rule) => {
        const regex = new RegExp(`\\b${rule.original}\\b`, "gi");
        result = result.replace(regex, rule.replacement);
      });
    return result;
  };

  const handleAudition = (phrase: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(phrase);
      utt.rate = 1.0;
      window.speechSynthesis.speak(utt);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.replacement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pronunciation Dictionary & IPA</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardize brand names, medical terms, code acronyms, and phonetics across all studio voices.
          </p>
        </div>

        {/* Export / Import Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Export dictionary to JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Export dictionary to CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Import dictionary file"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import File</span>
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,.csv,.txt"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Industry Glossaries Pack Row */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            One-Click Industry Glossaries Pack
          </h3>
          <span className="text-[11px] text-slate-400">Click to import pre-configured phonetic pronunciations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleImportGlossary("medical")}
            className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <Stethoscope className="h-4 w-4 text-rose-600" />
              <span>Medical & Pharma Pack</span>
            </div>
            <p className="text-[11px] text-rose-600/80 mt-1">
              angina, tinnitus, arrhythmia, dyspnea, omeprazole
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleImportGlossary("tech")}
            className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>Tech & Developer Pack</span>
            </div>
            <p className="text-[11px] text-indigo-600/80 mt-1">
              Kubernetes, OAuth, Nginx, PostgreSQL, GUI, SaaS
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleImportGlossary("fantasy")}
            className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
              <Compass className="h-4 w-4 text-purple-600" />
              <span>Fantasy & Sci-Fi Pack</span>
            </div>
            <p className="text-[11px] text-purple-600/80 mt-1">
              Cthulhu, Mjolnir, Targaryen, Smaug, Excalibur
            </p>
          </button>
        </div>
      </div>

      {/* IPA & Phoneme Converter Tool */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5 text-purple-600" />
            IPA & Phoneme Assistant
          </h3>
          <span className="text-[11px] text-slate-400">Convert English terms to International Phonetic Alphabet</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={ipaInputWord}
            onChange={(e) => setIpaInputWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookupIpa()}
            placeholder="Type any word to convert (e.g. Kubernetes, angina, cache, colonel)..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600 bg-slate-50"
          />
          <button
            type="button"
            onClick={handleLookupIpa}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Lookup IPA
          </button>
        </div>

        {ipaResult && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-purple-900 block">
                Word: <span className="underline">{ipaInputWord}</span>
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  IPA: {ipaResult.ipa}
                </span>
                <span className="font-semibold text-slate-700">
                  Respell: <strong className="text-purple-900">{ipaResult.respell}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAudition(ipaResult.respell)}
                className="p-2 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                title="Audition phonetic pronunciation"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleAddRuleFromIpa}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Dictionary</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Rule Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5 text-blue-600" />
          Add Custom Pronunciation Rule
        </h3>

        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Original Word:
            </label>
            <input
              type="text"
              value={newOriginal}
              onChange={(e) => setNewOriginal(e.target.value)}
              placeholder="e.g. AWS"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Pronounce As:
            </label>
            <input
              type="text"
              value={newReplacement}
              onChange={(e) => setNewReplacement(e.target.value)}
              placeholder="e.g. A-W-S"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Category:
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="acronym">Acronym / Initialism</option>
              <option value="technical">Technical Term</option>
              <option value="medical">Medical / Scientific</option>
              <option value="name">Proper Name / Brand</option>
              <option value="fantasy">Fantasy / Gaming</option>
              <option value="custom">Custom / Slang</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Rule</span>
            </button>
          </div>
        </form>
      </div>

      {/* Simulator Test Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Live Dictionary Simulation Test:
          </label>
          <button
            type="button"
            onClick={() => handleAudition(getSimulatedOutput(testText))}
            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Audition Engine Output</span>
          </button>
        </div>

        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition"
        />

        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
          <span className="font-bold block text-[11px] text-blue-600 uppercase tracking-wider mb-1">
            Engine Output (What the neural voice speaks):
          </span>
          <p className="font-mono">{getSimulatedOutput(testText)}</p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Active Rules ({filteredRules.length})</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeCount} Enabled
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules..."
                className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 w-44"
              />
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Reset to default rules"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                rule.enabled ? "bg-white border-slate-200" : "bg-slate-50/60 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {rule.original}
                    </span>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="text-xs font-bold text-blue-600 font-mono">
                      {rule.replacement}
                    </span>
                    {rule.ipa && (
                      <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">
                        {rule.ipa}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {rule.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAudition(rule.replacement)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  title="Audition pronunciation"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
