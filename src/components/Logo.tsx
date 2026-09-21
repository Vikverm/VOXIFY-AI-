import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "dark" | "light" | "colored";
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  variant = "colored",
}) => {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  }[size];

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  }[size];

  const badgeSize = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-0.5",
    xl: "text-xs px-3 py-1",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Mark: Geometric Voice Waveform forming a modern 'V' icon */}
      <div
        className={`relative ${iconDimensions} rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0 p-1.5 transition-transform duration-200 hover:scale-105`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Dynamic Sound Wave bars shaping an energetic 'V' in crisp white & bright cyan */}
          <rect x="6" y="8" width="3.5" height="14" rx="1.75" fill="#ffffff" fillOpacity="0.88" />
          <rect x="13" y="14" width="3.5" height="15" rx="1.75" fill="#ffffff" fillOpacity="0.95" />
          <rect x="20" y="20" width="3.5" height="16" rx="1.75" fill="#67e8f9" />
          <rect x="27" y="14" width="3.5" height="15" rx="1.75" fill="#ffffff" fillOpacity="0.95" />
          <rect x="34" y="8" width="3.5" height="14" rx="1.75" fill="#ffffff" fillOpacity="0.88" />
        </svg>
      </div>

      {/* Typography: Voxify AI */}
      {showText && (
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight ${textSize} ${
              variant === "light"
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Voxify
          </span>
          <span
            className={`font-bold rounded-md uppercase tracking-wider bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 text-indigo-700 ${badgeSize}`}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
