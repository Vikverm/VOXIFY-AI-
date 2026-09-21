/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Globe, Languages, Wand2, Loader2, Sparkles, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LanguageOption } from "../types";
import { CountryFlag } from "./CountryFlag";

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English (US)",
    flag: "🇺🇸",
    countryCode: "US",
    countryName: "United States",
    samplePhrase: "Welcome to Voxify Voice Studio. Hear your words come alive with natural pitch and cadence.",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español (España)",
    flag: "🇪🇸",
    countryCode: "ES",
    countryName: "Spain",
    samplePhrase: "¡Hola a todos! Bienvenidos a nuestro estudio de voz impulsado por inteligencia artificial con entonación natural.",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français (France)",
    flag: "🇫🇷",
    countryCode: "FR",
    countryName: "France",
    samplePhrase: "Bonjour et bienvenue dans notre studio vocal d'intelligence artificielle avec une diction fluide et naturelle.",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch (Deutschland)",
    flag: "🇩🇪",
    countryCode: "DE",
    countryName: "Germany",
    samplePhrase: "Willkommen im Sprachstudio. Erleben Sie lebendige, ausdrucksstarke Stimmen mit individueller Tonhöhe und Sprechgeschwindigkeit.",
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano (Italia)",
    flag: "🇮🇹",
    countryCode: "IT",
    countryName: "Italy",
    samplePhrase: "Benvenuti nel nostro studio vocale basato su intelligenza artificiale, con cadenza melodica e naturale.",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    countryCode: "BR",
    countryName: "Brazil",
    samplePhrase: "Olá e bem-vindo ao estúdio de voz com tecnologia de ponta, trazendo entonação suave e expressiva.",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語 (日本)",
    flag: "🇯🇵",
    countryCode: "JP",
    countryName: "Japan",
    samplePhrase: "AI音声スタジオへようこそ。自然なイントネーションと抑揚で、あなたのテキストを生き生きと読み上げます。",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文 (中国)",
    flag: "🇨🇳",
    countryCode: "CN",
    countryName: "China",
    samplePhrase: "欢迎使用智能语音工作室。体验自然流畅的语调与生动传神的语音合成。",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी (भारत)",
    flag: "🇮🇳",
    countryCode: "IN",
    countryName: "India",
    samplePhrase: "नमस्ते और एआई वॉइस स्टूडियो में आपका स्वागत है। अपनी आवाज़ को प्राकृतिक पिच और गति के साथ अनुभव करें।",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어 (대한민국)",
    flag: "🇰🇷",
    countryCode: "KR",
    countryName: "South Korea",
    samplePhrase: "AI 보이스 스튜디오에 오신 것을 환영합니다. 자연스러운 억양과 생생한 음성을 경험해보세요.",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية (السعودية)",
    flag: "🇸🇦",
    countryCode: "SA",
    countryName: "Saudi Arabia",
    samplePhrase: "أهلاً بكم في استوديو الصوت بالذكاء الاصطناعي، بنبرة طبيعية وإلقاء متقن ومميز.",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands (Nederland)",
    flag: "🇳🇱",
    countryCode: "NL",
    countryName: "Netherlands",
    samplePhrase: "Welkom bij de AI Voice Studio. Ervaar natuurlijke spraaksynthese met heldere uitspraak en intonatie.",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский (Россия)",
    flag: "🇷🇺",
    countryCode: "RU",
    countryName: "Russia",
    samplePhrase: "Добро пожаловать в студию искусственного интеллекта. Оцените выразительное и естественное звучание голоса.",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe (Türkiye)",
    flag: "🇹🇷",
    countryCode: "TR",
    countryName: "Turkey",
    samplePhrase: "Yapay zeka ses stüdyomuza hoş geldiniz. Doğal tonlama ve akıcı diksiyonla seslendirmenizi dinleyin.",
  },
  {
    code: "pl",
    name: "Polish",
    nativeName: "Polski (Polska)",
    flag: "🇵🇱",
    countryCode: "PL",
    countryName: "Poland",
    samplePhrase: "Witamy w studiu syntezy mowy AI. Odkryj czystą intonację i naturalny rytm ludzkiego głosu.",
  },
  {
    code: "sv",
    name: "Swedish",
    nativeName: "Svenska (Sverige)",
    flag: "🇸🇪",
    countryCode: "SE",
    countryName: "Sweden",
    samplePhrase: "Välkommen till AI Voice Studio. Upplev naturligt tal med personlig tonhöjd och rytm.",
  },
  {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    countryCode: "ID",
    countryName: "Indonesia",
    samplePhrase: "Selamat datang di AI Voice Studio. Nikmati sintesis suara yang jernih dan berintonasi alami.",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt (Việt Nam)",
    flag: "🇻🇳",
    countryCode: "VN",
    countryName: "Vietnam",
    samplePhrase: "Chào mừng bạn đến với phòng thu giọng nói AI. Trải nghiệm phát âm tự nhiên và truyền cảm.",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা (বাংলাদেশ)",
    flag: "🇧🇩",
    countryCode: "BD",
    countryName: "Bangladesh",
    samplePhrase: "এআই ভয়েস স্টুডিওতে স্বাগতম। স্বাভাবিক উচ্চারণ ও সুরের সাথে আপনার কণ্ঠ উপভোগ করুন।",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ் (இந்தியா)",
    flag: "🇮🇳",
    countryCode: "IN",
    countryName: "India",
    samplePhrase: "AI குரல் ஸ்டுடியோவிற்கு வரவேற்கிறோம். இயல்பான குரல் மற்றும் துல்லியமான உச்சரிப்பை உணருங்கள்.",
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు (భారతదేశం)",
    flag: "🇮🇳",
    countryCode: "IN",
    countryName: "India",
    samplePhrase: "AI వాయిస్ స్టూడియోకి స్వాగతం. స్పష్టమైన ఉచ్ఛారణ మరియు సహజమైన స్వరంతో వినండి.",
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी (भारत)",
    flag: "🇮🇳",
    countryCode: "IN",
    countryName: "India",
    samplePhrase: "एआय व्हॉईस स्टुडिओमध्ये आपले स्वागत आहे. नैसर्गिक उच्चार आणि स्पष्ट आवाजाचा अनुभव घ्या.",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو (پاکستان)",
    flag: "🇵🇰",
    countryCode: "PK",
    countryName: "Pakistan",
    samplePhrase: "اے آئی وائس اسٹوڈیو میں خوش آمدید۔ قدرتی لہجے اور شاندار تلفظ کے ساتھ آواز کا تجربہ کریں۔",
  },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onApplySamplePhrase: (phrase: string) => void;
  onTranslateText: () => void;
  isTranslating: boolean;
  canTranslate: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onApplySamplePhrase,
  onTranslateText,
  isTranslating,
  canTranslate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentLang =
    DEFAULT_LANGUAGES.find((l) => l.code === selectedLanguage) || DEFAULT_LANGUAGES[0];

  const filteredLanguages = DEFAULT_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Header Title & Current selection */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Language & Pronunciation
              </span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                {DEFAULT_LANGUAGES.length} Languages
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Synthesizes with native accent, authentic intonation, and vernacular rhythm
            </p>
          </div>
        </div>

        {/* Action Buttons: Instant Translation & Sample */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            id="translate-script-btn"
            disabled={isTranslating || !canTranslate}
            onClick={onTranslateText}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 hover:from-purple-100 hover:to-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            title={`Translate current script into ${currentLang.name}`}
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Languages className="h-3.5 w-3.5 text-purple-600" />
                <span>Translate Script to {currentLang.name}</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            id="use-sample-language-phrase-btn"
            onClick={() => onApplySamplePhrase(currentLang.samplePhrase)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
            title={`Insert native sample phrase for ${currentLang.name} (${currentLang.countryName})`}
          >
            <CountryFlag countryCode={currentLang.countryCode} className="w-3.5 h-2.5" />
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Load {currentLang.name} Sample</span>
          </motion.button>
        </div>
      </div>

      {/* Primary Language Buttons Grid */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          {DEFAULT_LANGUAGES.slice(0, 8).map((lang) => {
            const isSelected = lang.code === selectedLanguage;
            return (
              <motion.button
                key={lang.code}
                type="button"
                id={`lang-pill-${lang.code}`}
                onClick={() => onSelectLanguage(lang.code)}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                title={`${lang.name} (${lang.countryName})`}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer select-none ${
                  isSelected
                    ? "bg-slate-900 text-white font-bold shadow-xs ring-2 ring-slate-900/20"
                    : "bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-white hover:border-slate-300 font-medium"
                }`}
              >
                <CountryFlag countryCode={lang.countryCode} className="w-4 h-3" />
                <span>{lang.nativeName}</span>
                {isSelected && <Check className="h-3 w-3 text-emerald-400 ml-0.5" />}
              </motion.button>
            );
          })}

          {/* More Languages Dropdown Toggle */}
          <div className="relative inline-block">
            <motion.button
              type="button"
              id="more-languages-btn"
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                isOpen || !DEFAULT_LANGUAGES.slice(0, 8).some((l) => l.code === selectedLanguage)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-2xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CountryFlag countryCode={currentLang.countryCode} className="w-4 h-3" />
              <span>
                {DEFAULT_LANGUAGES.slice(0, 8).some((l) => l.code === selectedLanguage)
                  ? "More Languages"
                  : `${currentLang.name} (${currentLang.countryName})`}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 sm:left-0 top-full mt-1.5 z-30 w-76 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl"
                >
                  <input
                    type="text"
                    placeholder="Search language or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none mb-2"
                    autoFocus
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredLanguages.map((lang) => {
                      const isSelected = lang.code === selectedLanguage;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            onSelectLanguage(lang.code);
                            setIsOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                            isSelected
                              ? "bg-indigo-50 text-indigo-900 font-bold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CountryFlag countryCode={lang.countryCode} className="w-5 h-3.5" />
                            <div className="truncate">
                              <span className="block leading-snug font-medium truncate">{lang.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {lang.nativeName} &bull; {lang.countryName}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
