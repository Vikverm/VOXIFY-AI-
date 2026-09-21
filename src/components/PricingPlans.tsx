import React, { useState } from "react";
import {
  Check,
  Zap,
  HelpCircle,
  Calculator,
  Crown,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Headphones,
  Sliders,
  Globe,
  Radio,
  TrendingDown,
  Percent,
  DollarSign,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PricingPlansProps {
  currentPlan: string;
  onSelectPlan: (planId: string, billingCycle?: "monthly" | "annual") => void;
  onOpenCreditModal: () => void;
}

interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  credits: string;
  charLimitPerConvert: number;
  badge?: string;
  popular?: boolean;
  features: string[];
  notIncluded?: string[];
  ctaLabel: string;
  color: string;
}

const PLANS: PlanTier[] = [
  {
    id: "free",
    name: "Free Trial",
    tagline: "Test out Voxify's expressive neural studio with 10,000 free bonus credits upon registration.",
    priceMonthly: 0,
    priceAnnual: 0,
    credits: "10,000 Sign-Up + 5k/mo",
    charLimitPerConvert: 350,
    features: [
      "10,000 free starter credits upon sign-up",
      "5,000 bonus credits replenished monthly",
      "350 characters per conversion",
      "All 30 Expressive Studio voices (Audition & Test)",
      "Voice Changer & Speech-to-Speech (Quick 15s tests)",
      "Pronunciation Lexicon Editor (Up to 5 custom rules)",
      "Live Teleprompter & Recording Studio",
      "Standard 24,000 Hz WAV export",
      "Personal non-commercial license",
    ],
    notIncluded: [
      "Commercial YouTube / podcast / ad rights",
      "Multi-speaker Dialogue Studio",
      "Bulk / Batch Audio Converter",
      "High-Res 48,000 Hz Master exports",
    ],
    ctaLabel: "Current Free Plan",
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "basic",
    name: "Basic Starter",
    tagline: "Essential starter creator tier with nearly 3x more voice audio than ElevenLabs Starter.",
    priceMonthly: 4.99,
    priceAnnual: 3.99,
    credits: "80,000 credits/mo",
    charLimitPerConvert: 2000,
    features: [
      "2,000 characters per conversion",
      "80,000 credits renewed monthly (~1.8 hours audio)",
      "All 30 Studio Neural voices (Aoede, Puck, Charon, etc.)",
      "Full Commercial Rights (YouTube, Ads, Podcasts, Socials)",
      "AI Voice Changer & Speech-to-Speech (Full 24+ languages)",
      "Studio Vocal EQ Profiles (Flat, Warmth, Air, Podcast)",
      "Pronunciation Dictionary (Up to 50 custom phonetic rules)",
      "Audio Waveform Trimmer & In-App Studio Player",
      "High-Res 48,000 Hz Studio Export (WAV, MP3, OGG, AAC)",
      "Standard email support",
    ],
    ctaLabel: "Upgrade to Basic ($3.99/mo)",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "pro",
    name: "Pro Creator",
    tagline: "The #1 choice for creators & podcasters. 3x more audio than ElevenLabs Creator for half the price.",
    priceMonthly: 12.99,
    priceAnnual: 9.99,
    credits: "300,000 credits/mo",
    charLimitPerConvert: 5000,
    badge: "MOST POPULAR • BEST VALUE",
    popular: true,
    features: [
      "5,000 characters per conversion",
      "300,000 credits renewed monthly (~6.5 hours audio)",
      "Unused credits roll over for 1 billing cycle",
      "Full Multi-Speaker Dialogue Studio (Multi-character casting)",
      "Bulk / Batch Audio Converter (Up to 10 files with ZIP export)",
      "AI Voice Designer & Persona Cloner (Custom timbre & warmth)",
      "AI Voice Changer Pro + Acoustic Formant DSP Morphing",
      "Unlimited Pronunciation Dictionary rules & IPA symbols",
      "VoxFX™ Audio Mastering (Radio, Clarity, Phone, Air)",
      "Commercial rights for TV, Radio, Film & Video Games",
      "Priority fast-lane neural GPU synthesis queue",
      "Dedicated priority creator support",
    ],
    ctaLabel: "Get Pro Access ($9.99/mo)",
    color: "from-purple-600 via-indigo-600 to-blue-600",
  },
  {
    id: "business",
    name: "Business / Studio",
    tagline: "High-volume studio production, automated workflows & API at 75% below competitor scale tiers.",
    priceMonthly: 29.99,
    priceAnnual: 24.99,
    credits: "1,200,000 credits/mo",
    charLimitPerConvert: 10000,
    badge: "TEAMS & SCALE",
    features: [
      "10,000 characters per conversion",
      "1,200,000 credits renewed monthly (~26 hours audio)",
      "Unused credits roll over for up to 3 cycles",
      "High-Throughput Batch Studio (Bulk 50+ tracks & CSV imports)",
      "Full Developer REST API Access with key management",
      "Up to 5 team workspace seats included",
      "Everything in Pro (Dialogue, Voice Changer, Persona Cloner)",
      "Custom Brand Voice Presets & Persona Memory",
      "Studio De-Hum & Noise Gate mastering filters",
      "Dedicated account manager & 99.9% uptime SLA",
      "Custom invoice billing & security audit compliance",
    ],
    ctaLabel: "Get Business Plan ($24.99/mo)",
    color: "from-amber-600 to-rose-600",
  },
];

const COMPETITOR_BENCHMARKS = [
  {
    platform: "Voxify AI",
    isUs: true,
    startingAnnualPrice: "$3.99/mo",
    startingMonthlyPrice: "$4.99/mo",
    charsIncluded: "80,000 / mo",
    costPer100k: "$4.99",
    commercialRights: "Full Commercial Included (from $3.99)",
    dialogueStudio: "Full Multi-Voice Studio Included",
    savingsHighlight: "Nearly 3x more characters than ElevenLabs for lower price",
    statusBadge: "LOWEST ENTRY & HIGH VALUE",
  },
  {
    platform: "ElevenLabs",
    isUs: false,
    startingAnnualPrice: "$5.00/mo",
    startingMonthlyPrice: "$5.00/mo",
    charsIncluded: "30,000 / mo (Nearly 3x less)",
    costPer100k: "$16.60 (3.3x higher)",
    commercialRights: "Requires $22/mo Creator Plan",
    dialogueStudio: "Expensive API metered rate",
    savingsHighlight: "30,000 char cap ($5) / $22 for 100k",
    statusBadge: "VERY LOW LIMITS",
  },
  {
    platform: "Murf.ai",
    isUs: false,
    startingAnnualPrice: "$19.00/mo",
    startingMonthlyPrice: "$29.00/mo",
    charsIncluded: "~120,000 / mo (2h/mo limit)",
    costPer100k: "$24.10 (4.5x higher)",
    commercialRights: "Requires $29/mo Creator Plan",
    dialogueStudio: "Limited timeline blocks",
    savingsHighlight: "Steep $29/mo barrier",
    statusBadge: "HIGH BASE PRICING",
  },
  {
    platform: "Lovo.ai (Genny)",
    isUs: false,
    startingAnnualPrice: "$24.00/mo",
    startingMonthlyPrice: "$29.00/mo",
    charsIncluded: "~150,000 / mo (2h/mo limit)",
    costPer100k: "$19.30 (3.6x higher)",
    commercialRights: "Requires $29/mo Plan",
    dialogueStudio: "Single track editor only",
    savingsHighlight: "Starts at $24/mo annual ($29 monthly)",
    statusBadge: "HIGH PRICING",
  },
  {
    platform: "Play.ht",
    isUs: false,
    startingAnnualPrice: "$31.20/mo",
    startingMonthlyPrice: "$39.00/mo",
    charsIncluded: "250,000 / mo",
    costPer100k: "$15.60 (3x higher)",
    commercialRights: "Requires $39/mo Plan",
    dialogueStudio: "Basic multitrack editor",
    savingsHighlight: "Starts at $39/mo monthly",
    statusBadge: "HIGH PRICING",
  },
  {
    platform: "Speechify",
    isUs: false,
    startingAnnualPrice: "$11.58/mo",
    startingMonthlyPrice: "$19.00/mo",
    charsIncluded: "100,000 / mo (Reading app)",
    costPer100k: "$19.00 (3.5x higher)",
    commercialRights: "Requires Studio add-on ($29/mo)",
    dialogueStudio: "Not supported",
    savingsHighlight: "Consumer reading focus",
    statusBadge: "CONSUMER FOCUS",
  },
];

const FAQS = [
  {
    q: "Why is Voxify more affordable and reliable than ElevenLabs and Murf?",
    a: "Voxify pairs high-efficiency neural routing on Google's Expressive audio architecture with sustainable tier margins. Unlike older platforms that charge $22-$29 for only 100,000 characters, our architecture provides up to 5x more voice audio per dollar while ensuring 99.9% uptime and reliable API service.",
  },
  {
    q: "How does the Voxify credit system work?",
    a: "Credits are calculated per character converted into speech (1 character = 1 credit). Credits are only deducted when you synthesize or convert text into speech, not when you play, preview, or download your audio. Spaces and punctuation are counted at standard 1x rate.",
  },
  {
    q: "Are all 30 neural voices included in every plan without extra API costs?",
    a: "Yes! All 30 Studio Neural voices (including Aoede, Puck, Kore, Charon, Leda, Orus, Fenrir, Zephyr, Callirrhoe, and more) are fully available across our plans. There are no per-voice licensing surcharges or hidden fees—billing is strictly based on your standard character credit allowance.",
  },
  {
    q: "Do I own commercial rights to generated voices?",
    a: "Yes! All Basic, Pro, and Business tiers include full commercial licensing. You can monetize your voiceovers on YouTube, TikTok, Spotify podcasts, e-learning courses, commercial broadcasts, and audiobooks with no royalty obligations.",
  },
  {
    q: "What is the difference between Standard and Neural TTS?",
    a: "Neural TTS uses advanced deep learning neural networks (Google Gemini Expressive engine) trained on conversational speech. It reproduces human-like intonation, realistic breathing cadence, subtle pauses, and emotional emphasis, making it virtually indistinguishable from a human voice actor.",
  },
  {
    q: "Do unused monthly credits roll over?",
    a: "Yes! On our Pro plan, unused monthly credits automatically roll over for one billing cycle. On the Business/Teams plan, unused credits remain valid for up to 3 billing cycles.",
  },
  {
    q: "Can I download my audio in different formats?",
    a: "Yes. Voxify supports studio-grade 24kHz and 48kHz sampling in WAV (uncompressed master), MP3 (universal), OGG, and AAC formats.",
  },
];

export const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlan,
  onSelectPlan,
  onOpenCreditModal,
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Credit Usage Estimator Slider State
  const [estimatedChars, setEstimatedChars] = useState<number>(120000);

  // Calculate estimated minutes based on 150 words/min ~= 750 chars/min
  const estimatedMinutes = Math.round(estimatedChars / 750);
  const recommendedTier =
    estimatedChars <= 10000
      ? "free"
      : estimatedChars <= 80000
      ? "basic"
      : estimatedChars <= 300000
      ? "pro"
      : "business";

  return (
    <div className="space-y-12 py-4">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Transparent & Highly Affordable Voxify Pricing</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Super-Affordable Plans for Creators & Studios.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Get expressive studio AI voices starting at just $3.99/mo (~₹299/mo). 3x more audio characters
          than ElevenLabs for less than half their subscription fee.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg transition ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`relative px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  billingCycle === "annual"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Value Callout Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold shadow-2xs">
            <TrendingDown className="h-3.5 w-3.5 text-blue-600" />
            <strong>Impulse-Friendly Pricing:</strong> Starting at just $3.99/mo (Nearly 3x more audio than ElevenLabs with full commercial rights)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-2xs">
            🇮🇳 <strong>Indian Creators:</strong> Pay seamlessly with UPI (GPay, PhonePe, Paytm) from just ₹299/mo
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan.toLowerCase() === plan.id.toLowerCase();
          const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-2xl p-6 flex flex-col justify-between transition border ${
                plan.popular
                  ? "border-blue-500 bg-white shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
              }`}
            >
              {/* Badge if Popular or Enterprise */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none whitespace-nowrap">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-xs whitespace-nowrap leading-none ring-2 ring-white ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Card Top */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[38px] flex items-center leading-relaxed">{plan.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="border-y border-slate-100 py-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      / month {billingCycle === "annual" && price > 0 && "(billed yearly)"}
                    </span>
                  </div>

                  {price > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                      ≈ ₹{Math.round(price * 86.5).toLocaleString("en-IN")} INR via UPI
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                      ₹0 Free Forever
                    </span>
                  )}

                  <p className="text-xs text-blue-600 font-semibold mt-1.5 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{plan.credits}</span>
                  </p>
                </div>

                {/* Core Specs Highlights */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Char limit:</span>
                    <strong className="font-bold text-slate-900">
                      {plan.charLimitPerConvert.toLocaleString()} / convert
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">License:</span>
                    <strong className="font-bold text-slate-900">
                      {plan.id === "free" ? "Personal Only" : "Full Commercial"}
                    </strong>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2 pt-2 text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What's included
                  </p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}

                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="pt-2 space-y-1 opacity-50">
                      {plan.notIncluded.map((notFeat, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-500 text-[11px] line-through">
                          <span className="text-slate-400 shrink-0">&times;</span>
                          <span>{notFeat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card CTA Action */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectPlan(plan.id, billingCycle)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? "bg-slate-100 text-slate-500 cursor-default border border-slate-200"
                      : plan.popular
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Active Plan</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.ctaLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Credit Top-up Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Zap className="h-3 w-3" />
            <span>Need extra credits without upgrading?</span>
          </div>
          <h3 className="text-xl font-bold">On-Demand Credit Booster Packs</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Purchase flexible credit top-ups that never expire. Add 50,000, 200,000, or 500,000 characters
            directly to your balance anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreditModal}
          className="whitespace-nowrap px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          Buy Extra Credits
        </button>
      </div>

      {/* Interactive Usage Estimator Calculator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Voxify Credit & Savings Estimator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Slide to approximate your monthly script volume and discover your recommended tier and savings.
            </p>
          </div>

          {/* Recommended Tier Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <span className="text-slate-600">Recommended Tier:</span>
            <strong className="font-bold text-blue-700 capitalize">{recommendedTier} Plan</strong>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Production Volume:</span>
            <span className="text-blue-600 font-mono text-sm">
              {estimatedChars.toLocaleString()} characters / month
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={3000000}
            step={10000}
            value={estimatedChars}
            onChange={(e) => setEstimatedChars(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>10K (Sign-Up Free)</span>
            <span>80K (Basic Starter)</span>
            <span>300K (Pro Creator)</span>
            <span>1.2M+ (Studio Master)</span>
          </div>
        </div>

        {/* Calculated Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1">
            <span className="text-slate-500 font-medium">Speaking Time:</span>
            <p className="text-base font-extrabold text-slate-900">
              ~{estimatedMinutes} Minutes
            </p>
            <p className="text-[11px] text-slate-400">Around {Math.round(estimatedMinutes / 60 * 10) / 10} hours of spoken voice</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1">
            <span className="text-slate-500 font-medium">Word Equivalent:</span>
            <p className="text-base font-extrabold text-slate-900">
              ~{Math.round(estimatedChars / 5).toLocaleString()} Words
            </p>
            <p className="text-[11px] text-slate-400">Standard 5 chars per English word</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1">
            <span className="text-slate-500 font-medium">Voxify Plan Cost:</span>
            <p className="text-base font-extrabold text-emerald-600">
              {recommendedTier === "free"
                ? "$0 / month"
                : recommendedTier === "basic"
                ? "$3.99 / month"
                : recommendedTier === "pro"
                ? "$9.99 / month"
                : "$24.99 / month"}
            </p>
            <p className="text-[11px] text-slate-400">Billed annually with commercial rights</p>
          </div>
        </div>

        {/* Real-Time Competitor Cost Comparison for Selected Volume */}
        {(() => {
          const vmCost =
            estimatedChars <= 10000
              ? 0
              : estimatedChars <= 80000
              ? 3.99
              : estimatedChars <= 300000
              ? 9.99
              : 24.99;

          const elevenCost =
            estimatedChars <= 10000
              ? 0
              : estimatedChars <= 30000
              ? 5
              : estimatedChars <= 100000
              ? 22
              : estimatedChars <= 500000
              ? 99
              : estimatedChars <= 2000000
              ? 330
              : Math.round(330 + ((estimatedChars - 2000000) / 1000) * 0.16);

          const murfCost =
            estimatedChars <= 10000
              ? 0
              : estimatedChars <= 120000
              ? 29
              : estimatedChars <= 500000
              ? 99
              : 199;

          const lovoCost =
            estimatedChars <= 10000
              ? 0
              : estimatedChars <= 150000
              ? 29
              : estimatedChars <= 500000
              ? 48
              : 149;

          const monthlySavings = Math.max(0, elevenCost - vmCost);
          const annualSavings = Math.round(monthlySavings * 12);

          return (
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-4 sm:p-5 text-white space-y-4 border border-indigo-800/40 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-emerald-400" />
                    <span>Live Competitor Bill Comparison for {estimatedChars.toLocaleString()} Chars/Mo</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    See what the exact same voice volume costs you across different AI speech providers:
                  </p>
                </div>
                {monthlySavings > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold self-start sm:self-auto">
                    <span>Save ${monthlySavings}/mo (${annualSavings}/yr)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* Voxify */}
                <div className="rounded-lg bg-blue-600/30 border border-blue-400/40 p-2.5">
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Voxify AI</span>
                  <p className="text-lg font-black text-white mt-0.5">${vmCost}</p>
                  <span className="text-[10px] text-emerald-300 font-bold block mt-0.5">Lowest Creator Price</span>
                </div>

                {/* ElevenLabs */}
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">ElevenLabs</span>
                  <p className="text-lg font-bold text-rose-400 mt-0.5">${elevenCost}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {elevenCost > vmCost ? `+${Math.round(((elevenCost - vmCost) / (vmCost || 1)) * 100)}% more` : "Equal"}
                  </span>
                </div>

                {/* Murf.ai */}
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Murf.ai</span>
                  <p className="text-lg font-bold text-rose-400 mt-0.5">${murfCost}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {murfCost > vmCost ? `+${Math.round(((murfCost - vmCost) / (vmCost || 1)) * 100)}% more` : "Equal"}
                  </span>
                </div>

                {/* Lovo.ai */}
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Lovo.ai</span>
                  <p className="text-lg font-bold text-rose-400 mt-0.5">${lovoCost}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lovoCost > vmCost ? `+${Math.round(((lovoCost - vmCost) / (vmCost || 1)) * 100)}% more` : "Equal"}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Competitor Benchmark Comparison Card */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">
              <Award className="h-3 w-3 text-blue-600" />
              <span>MARKET BENCHMARK • PRICE TRANSPARENCY</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              How Voxify Compares with Competitors
            </h3>
            <p className="text-xs text-slate-600">
              We benchmarked standard creator tiers across ElevenLabs, Murf.ai, and Play.ht. See why Voxify delivers up to 25x more voice audio per dollar.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <span>Save up to 85% Every Month</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <th className="py-3.5 px-4 font-bold text-slate-900 w-1/4">TTS Platform</th>
                <th className="py-3.5 px-3 font-semibold">Annual Price</th>
                <th className="py-3.5 px-3 font-semibold">Monthly Price</th>
                <th className="py-3.5 px-3 font-semibold">Starter Characters</th>
                <th className="py-3.5 px-3 font-semibold">Cost / 100k Chars</th>
                <th className="py-3.5 px-3 font-semibold">Commercial Rights</th>
                <th className="py-3.5 px-3 font-semibold text-right pr-4">Creator Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {COMPETITOR_BENCHMARKS.map((item, idx) => (
                <tr
                  key={idx}
                  className={
                    item.isUs
                      ? "bg-blue-50/50 font-medium text-slate-900"
                      : "hover:bg-slate-50/40 transition"
                  }
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.platform}</span>
                      {item.isUs && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px] tracking-wide uppercase">
                          Our Platform
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={item.isUs ? "text-blue-700 font-extrabold text-sm" : "text-slate-700 font-semibold"}>
                      {item.startingAnnualPrice}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700">
                    {item.startingMonthlyPrice}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={item.isUs ? "text-emerald-700 font-bold" : "text-slate-600"}>
                      {item.charsIncluded}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={item.isUs ? "inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-xs" : "text-rose-600 font-semibold"}>
                      {item.costPer100k}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {item.isUs ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{item.commercialRights}</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 font-medium">
                        {item.commercialRights}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right pr-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.isUs
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item.statusBadge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-slate-500">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Voxify pricing includes 48kHz studio export, commercial rights, and SSML controls on all paid plans.
            </span>
          </p>
          <div className="text-[11px] text-slate-400 font-medium">
            *Public pricing data audited against competitor standard plans.
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-base font-bold text-slate-900">Detailed Feature Comparison</h3>
          <p className="text-xs text-slate-500 mt-0.5">Compare features across all Voxify tiers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500">
                <th className="py-3 px-4 font-bold text-slate-900 w-1/3">Feature</th>
                <th className="py-3 px-3 font-semibold">Free Trial</th>
                <th className="py-3 px-3 font-semibold">Basic ($3.99/mo)</th>
                <th className="py-3 px-3 font-bold text-blue-600">Pro ($9.99/mo)</th>
                <th className="py-3 px-3 font-semibold">Business ($24.99/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Sign-Up Bonus Credits</td>
                <td className="py-3 px-3 font-bold text-emerald-600">10,000 Free Credits</td>
                <td className="py-3 px-3">80,000 / mo</td>
                <td className="py-3 px-3 font-bold text-blue-700">300,000 / mo</td>
                <td className="py-3 px-3 font-bold text-slate-900">1,200,000 / mo</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Characters per convert</td>
                <td className="py-3 px-3">350</td>
                <td className="py-3 px-3 font-semibold">2,000</td>
                <td className="py-3 px-3 font-bold text-blue-700">5,000</td>
                <td className="py-3 px-3 font-bold text-slate-900">10,000</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Monthly Refill Credits</td>
                <td className="py-3 px-3">5,000 / mo</td>
                <td className="py-3 px-3">80,000 / mo</td>
                <td className="py-3 px-3 font-bold text-blue-700">300,000 / mo</td>
                <td className="py-3 px-3 font-bold text-slate-900">1,200,000 / mo</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Commercial Usage Rights</td>
                <td className="py-3 px-3 text-rose-500">&times; Personal Only</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Full Commercial</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Full Commercial</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Full Commercial</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">AI Voice Changer &amp; Speech-to-Speech</td>
                <td className="py-3 px-3 text-slate-500">15s Audition Test</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Full 24+ Languages</td>
                <td className="py-3 px-3 font-bold text-blue-700">&#10003; Unlimited + Formant DSP</td>
                <td className="py-3 px-3 font-bold text-slate-900">&#10003; Batch Voice Changer</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Multi-Speaker Dialogue Studio</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-slate-500">Up to 2 speakers</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Unlimited Conversations</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Unlimited + 5 Team Seats</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Bulk / Batch Audio Converter</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-slate-400">Preview only</td>
                <td className="py-3 px-3 font-bold text-blue-700">&#10003; Up to 10 files (ZIP export)</td>
                <td className="py-3 px-3 font-bold text-slate-900">&#10003; 50+ bulk tracks &amp; CSV</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Pronunciation Lexicon Editor</td>
                <td className="py-3 px-3">Up to 5 rules</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Up to 50 custom rules</td>
                <td className="py-3 px-3 font-bold text-blue-700">&#10003; Unlimited rules &amp; IPA</td>
                <td className="py-3 px-3 font-bold text-slate-900">&#10003; Team Shared Dictionary</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Studio Vocal EQ Profiles</td>
                <td className="py-3 px-3">Flat Studio</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; 4 Studio EQ curves</td>
                <td className="py-3 px-3 font-bold text-blue-700">&#10003; All Curves + Expressiveness</td>
                <td className="py-3 px-3 font-bold text-slate-900">&#10003; Full DSP + De-Hum Mastering</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Waveform Trimmer &amp; Teleprompter</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Included</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Included</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Included</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; Included</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Audio Formats &amp; Sample Rates</td>
                <td className="py-3 px-3">24kHz WAV</td>
                <td className="py-3 px-3">48kHz WAV / MP3</td>
                <td className="py-3 px-3 font-bold text-blue-700">48kHz WAV, MP3, OGG, AAC</td>
                <td className="py-3 px-3 font-bold text-slate-900">Studio Master (WAV, MP3, AAC)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Credit Rollover</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; 1 Month Rollover</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; 3 Months Rollover</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-900">Developer REST API</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-rose-500">&times;</td>
                <td className="py-3 px-3 text-slate-400">Available add-on</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">&#10003; High-Throughput Key</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </h3>
          <p className="text-xs text-slate-500">Everything you need to know about billing and credits.</p>
        </div>

        <div className="divide-y divide-slate-100 pt-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-blue-600 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-slate-600 pt-2 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
