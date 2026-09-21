import React, { useState } from "react";
import { Mail, Copy, Check, Sparkles, Clock, ShieldCheck } from "lucide-react";

interface ContactPageProps {
  onNavigateTab?: (tab: any) => void;
}

// Official WhatsApp Brand Logo
const WhatsAppLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const ContactPage: React.FC<ContactPageProps> = () => {
  const PHONE_DISPLAY = "+91 97110 40665";
  const PHONE_RAW = "919711040665";
  const EMAIL_ADDRESS = "vikasverm48472@gmail.com";

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+919711040665");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(EMAIL_ADDRESS);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const whatsappUrl = `https://wa.me/${PHONE_RAW}?text=${encodeURIComponent(
    "Hi Vikas, I have an inquiry regarding Voxify AI."
  )}`;

  return (
    <div className="max-w-2xl mx-auto py-10 sm:py-16 px-4 space-y-8">
      {/* Top Pill Badge */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-blue-50/90 border border-blue-200 text-blue-600 text-xs sm:text-sm font-semibold shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>We're Here to Help 24/7</span>
        </div>
      </div>

      {/* Main Heading & Subtitle */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Contact Voxify Support &amp; Sales
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Have questions about voice synthesis, plan limits, UPI &amp; PayPal payments, or custom team subscriptions? Our team is ready to assist you directly.
        </p>
      </div>

      {/* Cards Container */}
      <div className="space-y-4">
        {/* 1. WhatsApp Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            {/* Green Circular Badge with WhatsApp Logo */}
            <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#25D366] shrink-0">
              <WhatsAppLogo className="h-6 w-6 text-[#25D366]" />
            </div>

            {/* Content info */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">WhatsApp</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Online
                </span>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-xl font-bold text-slate-900 hover:text-emerald-600 transition block tracking-tight"
              >
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <WhatsAppLogo className="h-4 w-4 text-white" />
              <span>Chat on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleCopyPhone}
              className="py-3 px-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
            >
              {copiedPhone ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Email Support Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            {/* Blue Circular Badge with Mail Logo */}
            <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>

            {/* Content info */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Email Support</h2>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-normal">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Replies &lt; 2–4 hrs
                </span>
              </div>
              <a
                href={`mailto:${EMAIL_ADDRESS}?subject=Voxify%20AI%20Inquiry`}
                className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition block tracking-tight break-all"
              >
                {EMAIL_ADDRESS}
              </a>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied Email Address</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy Email Address</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Assurance Row */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 pt-2">
        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
        <span>Direct assistance for all questions, invoices &amp; custom setups</span>
      </div>
    </div>
  );
};
