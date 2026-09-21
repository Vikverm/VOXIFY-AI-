import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Crown,
  Coins,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UserProfile, logoutClient } from "../lib/firebase";

interface UserProfileMenuProps {
  user: UserProfile;
  currentCredits: number;
  currentPlan: string;
  onOpenCreditModal: () => void;
  onOpenPricingTab: () => void;
  onLogout: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  currentCredits,
  currentPlan,
  onOpenCreditModal,
  onOpenPricingTab,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await logoutClient();
    onLogout();
  };

  const initials = (user.displayName || user.email || "C")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs text-left"
        aria-label="User Account Menu"
      >
        <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <div className="hidden lg:block leading-tight">
          <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
            {user.displayName || "Client"}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5" />
            <span>{currentPlan}</span>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-3 space-y-3 animate-fade-in">
          {/* Header Info */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user.displayName || "Client Account"}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                  Verified
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate" title={user.email}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-blue-600" />
                <span>Voice Credits</span>
              </span>
              <span className="font-bold text-slate-900">
                {currentCredits.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Active Tier</span>
              </span>
              <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                {currentPlan} Plan
              </span>
            </div>
            <div className="pt-1 flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreditModal();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition cursor-pointer shadow-xs"
              >
                Top Up Credits
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPricingTab();
                }}
                className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                Plans
              </button>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Client Cloud Session Active</span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
