import React from "react";
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, Sparkles, Scale } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 text-slate-800">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Scale className="h-3.5 w-3.5" />
          <span>Legal & Commercial Clearances</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service & Commercial Rights
        </h1>
        <p className="text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* Section 1 */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>1. Commercial Use & Copyright Clearances</span>
          </h3>
          <p className="text-slate-600">
            Audio synthesized under any paid plan (Basic, Pro, Business) or through purchased credit
            packs includes a <strong>worldwide, perpetual, royalty-free commercial license</strong>. You
            own all rights to the generated audio files and may use them in:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700 text-xs">
            <li>YouTube, TikTok, Instagram, and social media monetization</li>
            <li>Podcasts, audiobooks (Audible, Findaway), and radio broadcasting</li>
            <li>TV commercials, digital paid advertising, and video game voiceovers</li>
            <li>E-learning courses, software narration, and interactive IVR phone systems</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            2. Character Credit Usage & Balance Rollover
          </h3>
          <p className="text-slate-600">
            Voxify operates on a character-based accounting system where <strong>1 character = 1 credit</strong>.
            Credits are deducted only upon speech generation. Playing, editing playback speed, adjusting pitch,
            or downloading previously synthesized files incurs zero credit deduction.
          </p>
          <p className="text-slate-600">
            Unused monthly subscription credits roll over for one billing cycle on active Pro and Business
            accounts. One-time credit booster packs <strong>never expire</strong>.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            3. 14-Day Money-Back Satisfaction Guarantee
          </h3>
          <p className="text-slate-600">
            If you are unsatisfied with our neural voice quality or compatibility with your production
            pipeline within 14 days of your initial subscription purchase, simply email{" "}
            <a href="mailto:vikasverm48472@gmail.com" className="text-blue-600 underline font-medium">
              vikasverm48472@gmail.com
            </a>{" "}
            for a full 100% refund, provided you have consumed less than 20% of your plan's monthly credit
            quota.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            4. Voice Ethics, AI Safety & Privacy Policy
          </h3>
          <p className="text-slate-600">
            Voxify does not use your submitted text scripts to train public artificial intelligence
            models. Text scripts transmitted to our synthesis engines are processed securely via encrypted
            TLS connections and cached ephemerally for audio rendering only.
          </p>
        </div>
      </div>
    </div>
  );
};
