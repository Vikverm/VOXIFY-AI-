import React, { useState } from "react";
import { X, Zap, Check, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  maxCredits: number;
  currentPlan: string;
  onAddCredits: (amount: number) => void;
  onUpgradePlan: (planId: string) => void;
  onCheckoutPack?: (pack: { id: string; credits: number; price: number; label: string; desc: string }) => void;
}

const TOPUP_PACKS = [
  { id: "pack-small", credits: 30000, price: 2.49, label: "30,000 Credits", desc: "~40 minutes audio • $2.49 Micro Booster" },
  { id: "pack-medium", credits: 100000, price: 6.99, popular: true, label: "100,000 Credits", desc: "~130 minutes audio • $6.99 (Best Value Booster)" },
  { id: "pack-large", credits: 300000, price: 16.99, label: "300,000 Credits", desc: "~400 minutes audio • $16.99 (Studio Pro Booster)" },
];

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  maxCredits,
  currentPlan,
  onAddCredits,
  onUpgradePlan,
  onCheckoutPack,
}) => {
  const [purchasedSuccess, setPurchasedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = (pack: typeof TOPUP_PACKS[0]) => {
    if (onCheckoutPack) {
      onClose();
      onCheckoutPack(pack);
      return;
    }
    onAddCredits(pack.credits);
    setPurchasedSuccess(`Successfully added ${pack.credits.toLocaleString()} credits to your account!`);
    setTimeout(() => {
      setPurchasedSuccess(null);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6"
      >
        {/* Header & Close */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Voxify Credit Wallet</h3>
              <p className="text-xs text-slate-500">Manage credits & top-ups</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600 font-medium">Available Balance:</span>
            <span className="font-extrabold text-blue-900 text-base font-mono">
              {currentCredits.toLocaleString()} Credits
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full bg-blue-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(5, (currentCredits / Math.max(maxCredits, currentCredits)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
            <span>
              Active: <strong className="uppercase font-bold text-slate-700">{currentPlan} Plan</strong>
              <span className="text-slate-400"> ({maxCredits.toLocaleString()} base quota)</span>
            </span>
            <span className="text-slate-600 font-medium">1 Char = 1 Credit</span>
          </div>
        </div>

        {/* Success Alert */}
        {purchasedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
          >
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{purchasedSuccess}</span>
          </motion.div>
        )}

        {/* Credit Booster Top-Up Packs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Credit Top-Up Packs (Never Expire)
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🇮🇳 UPI (GPay/PhonePe/Paytm) Accepted
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TOPUP_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => handleBuy(pack)}
                className={`relative rounded-xl p-3 border text-left transition cursor-pointer flex flex-col justify-between ${
                  pack.popular
                    ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30 hover:bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 right-2 text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                    Best Value
                  </span>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{pack.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{pack.desc}</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <strong className="font-extrabold text-slate-900 block">${pack.price}</strong>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      ≈ ₹{Math.round(pack.price * 86.5).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold hover:underline">Add &rarr;</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Instant balance credit activation</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpgradePlan("pro");
            }}
            className="text-blue-600 font-semibold hover:underline"
          >
            Upgrade Plan &rarr;
          </button>
        </div>
      </motion.div>
    </div>
  );
};
