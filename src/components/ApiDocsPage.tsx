import React, { useState } from "react";
import {
  Code2,
  Terminal,
  Key,
  Copy,
  Check,
  Zap,
  Globe,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Server,
  Play,
  Layers,
} from "lucide-react";
import { motion } from "motion/react";

export const ApiDocsPage: React.FC = () => {
  const [activeLang, setActiveLang] = useState<"curl" | "js" | "python">("curl");
  const [copiedCode, setCopiedCode] = useState(false);
  const [apiKey, setApiKey] = useState("vm_live_948f20b38c29184a77d1");
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `vm_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    setApiKey(newKey);
  };

  const CODE_SNIPPETS = {
    curl: `curl -X POST "https://api.voxify.ai/v1/tts/synthesize" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello world! This audio was generated through Voxify REST API.",
    "voice_id": "Kore",
    "engine": "neural",
    "style": "conversational",
    "output_format": "mp3",
    "sample_rate": 48000
  }' \\
  --output voiceover.mp3`,

    js: `import fs from 'fs';

const response = await fetch("https://api.voxify.ai/v1/tts/synthesize", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Hello world! This audio was generated through Voxify REST API.",
    voice_id: "Kore",
    engine: "neural",
    style: "conversational",
    output_format: "mp3",
    sample_rate: 48000
  })
});

const audioBuffer = await response.arrayBuffer();
fs.writeFileSync("output.mp3", Buffer.from(audioBuffer));
console.log("Audio file saved successfully!");`,

    python: `import requests

url = "https://api.voxify.ai/v1/tts/synthesize"
headers = {
    "Authorization": f"Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "text": "Hello world! This audio was generated through Voxify REST API.",
    "voice_id": "Kore",
    "engine": "neural",
    "style": "conversational",
    "output_format": "mp3",
    "sample_rate": 48000
}

response = requests.post(url, json=payload, headers=headers)
with open("speech.mp3", "wb") as f:
    f.write(response.content)

print("Speech synthesis completed!")`,
  };

  return (
    <div className="w-full py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Code2 className="h-3.5 w-3.5" />
          <span>Voxify Developer Platform</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          REST API & Integration Guide
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Embed realistic neural voice synthesis directly into your web applications, mobile apps,
          automated video rendering pipelines, and customer support bots.
        </p>
      </div>

      {/* API Key Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Sandbox API Secret Key
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Send this key in the <code className="text-blue-700 font-mono">Authorization: Bearer &lt;key&gt;</code> HTTP header.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 tracking-wide select-all truncate">
            {apiKey}
          </div>
          <button
            type="button"
            onClick={handleCopyKey}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
            title="Copy API key"
          >
            {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleRegenerateKey}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Quick Code Example Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xl">
        {/* Code Bar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-400" />
            <span className="font-bold text-slate-300">Synthesize Speech (POST /v1/tts/synthesize)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
            {(["curl", "js", "python"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition cursor-pointer ${
                  activeLang === lang
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lang === "js" ? "Node.js" : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative p-5">
          <button
            type="button"
            onClick={() => handleCopyCode(CODE_SNIPPETS[activeLang])}
            className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer border border-slate-700"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedCode ? "Copied" : "Copy"}</span>
          </button>
          <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto pr-16">
            <code>{CODE_SNIPPETS[activeLang]}</code>
          </pre>
        </div>
      </div>

      {/* API Endpoints Reference Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Endpoints Reference</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint Path</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Authentication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">POST</span>
                </td>
                <td className="py-3 px-3 text-slate-900 font-bold">/v1/tts/synthesize</td>
                <td className="py-3 px-3 font-sans text-slate-600">
                  Synthesize text into raw MP3/WAV audio stream or base64.
                </td>
                <td className="py-3 px-3 font-sans text-slate-600">Bearer Token</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span>
                </td>
                <td className="py-3 px-3 text-slate-900 font-bold">/v1/voices</td>
                <td className="py-3 px-3 font-sans text-slate-600">
                  Retrieve list of 800+ available neural voices and dialects.
                </td>
                <td className="py-3 px-3 font-sans text-slate-600">Bearer Token</td>
              </tr>
              <tr>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span>
                </td>
                <td className="py-3 px-3 text-slate-900 font-bold">/v1/user/credits</td>
                <td className="py-3 px-3 font-sans text-slate-600">
                  Check current character credit balance and subscription tier.
                </td>
                <td className="py-3 px-3 font-sans text-slate-600">Bearer Token</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
