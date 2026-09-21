import React from "react";

interface CountryFlagProps {
  countryCode?: string;
  className?: string;
  title?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  className = "w-5 h-3.5",
  title,
}) => {
  const code = (countryCode || "").toUpperCase().trim();

  // Helper wrapper for 3:2 flag rectangle
  const renderSvg = (content: React.ReactNode) => (
    <svg
      viewBox="0 0 640 480"
      className={`inline-block rounded-xs overflow-hidden shadow-2xs shrink-0 border border-slate-300/60 align-middle ${className}`}
      aria-label={title || `${code} Flag`}
      role="img"
    >
      {content}
    </svg>
  );

  switch (code) {
    case "US": // United States
      return renderSvg(
        <g fillRule="evenodd">
          <path fill="#bd3d44" d="M0 0h640v480H0z" />
          <path
            stroke="#fff"
            strokeWidth="37"
            d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"
          />
          <path fill="#192f5d" d="M0 0h260v259H0z" />
          {/* Stylized stars constellation */}
          <g fill="#fff">
            {[30, 70, 110, 150, 190, 230].map((x) =>
              [28, 68, 108, 148, 188, 228].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
              ))
            )}
          </g>
        </g>
      );

    case "GB": // United Kingdom
      return renderSvg(
        <g>
          <path fill="#012169" d="M0 0h640v480H0z" />
          <path stroke="#fff" strokeWidth="60" d="m0 0 640 480M640 0 0 480" />
          <path stroke="#c8102e" strokeWidth="40" d="m0 0 640 480M640 0 0 480" />
          <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640" />
          <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
        </g>
      );

    case "ES": // Spain
      return renderSvg(
        <g>
          <path fill="#aa151b" d="M0 0h640v480H0z" />
          <path fill="#f1bf00" d="M0 120h640v240H0z" />
          {/* Subtle coat of arms emblem */}
          <circle cx="180" cy="240" r="45" fill="#aa151b" />
          <circle cx="180" cy="240" r="32" fill="#f1bf00" />
          <rect x="172" y="222" width="16" height="36" rx="3" fill="#aa151b" />
        </g>
      );

    case "FR": // France
      return renderSvg(
        <g>
          <path fill="#002654" d="M0 0h213.3v480H0z" />
          <path fill="#ce1126" d="M426.7 0H640v480H426.7z" />
          <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        </g>
      );

    case "DE": // Germany
      return renderSvg(
        <g>
          <path fill="#000" d="M0 0h640v160H0z" />
          <path fill="#dd0000" d="M0 160h640v160H0z" />
          <path fill="#ffce00" d="M0 320h640v160H0z" />
        </g>
      );

    case "IT": // Italy
      return renderSvg(
        <g>
          <path fill="#009246" d="M0 0h213.3v480H0z" />
          <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
          <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
        </g>
      );

    case "BR": // Brazil
      return renderSvg(
        <g>
          <path fill="#009c3b" d="M0 0h640v480H0z" />
          <path fill="#ffdf00" d="m320 50 260 190-260 190L60 240z" />
          <circle cx="320" cy="240" r="110" fill="#002776" />
          <path fill="#fff" d="M220 250a115 115 0 0 1 200-25 110 110 0 0 0-200 25z" />
        </g>
      );

    case "JP": // Japan
      return renderSvg(
        <g>
          <path fill="#fff" d="M0 0h640v480H0z" />
          <circle cx="320" cy="240" r="140" fill="#bc002d" />
        </g>
      );

    case "CN": // China
      return renderSvg(
        <g>
          <path fill="#de2910" d="M0 0h640v480H0z" />
          <polygon
            fill="#ffde00"
            points="100,50 115,95 160,95 125,120 140,165 100,140 60,165 75,120 40,95 85,95"
          />
          <circle cx="190" cy="50" r="12" fill="#ffde00" />
          <circle cx="230" cy="90" r="12" fill="#ffde00" />
          <circle cx="230" cy="150" r="12" fill="#ffde00" />
          <circle cx="190" cy="190" r="12" fill="#ffde00" />
        </g>
      );

    case "IN": // India
      return renderSvg(
        <g>
          <path fill="#ff9933" d="M0 0h640v160H0z" />
          <path fill="#fff" d="M0 160h640v160H0z" />
          <path fill="#138808" d="M0 320h640v160H0z" />
          <circle cx="320" cy="240" r="50" fill="none" stroke="#000080" strokeWidth="7" />
          <circle cx="320" cy="240" r="10" fill="#000080" />
          {/* Stylized 24 spokes */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="320"
              y1="195"
              x2="320"
              y2="285"
              stroke="#000080"
              strokeWidth="3.5"
              transform={`rotate(${deg} 320 240)`}
            />
          ))}
        </g>
      );

    case "KR": // South Korea
      return renderSvg(
        <g>
          <path fill="#fff" d="M0 0h640v480H0z" />
          {/* Taegeuk yin-yang */}
          <path d="M320 130a110 110 0 0 1 0 220 55 55 0 0 0 0-110 55 55 0 0 1 0-110z" fill="#cd2e3a" />
          <path d="M320 350a110 110 0 0 1 0-220 55 55 0 0 0 0 110 55 55 0 0 1 0 110z" fill="#0047a0" />
          {/* Trigram bars */}
          <g fill="#000">
            <rect x="90" y="80" width="60" height="12" transform="rotate(35 120 86)" />
            <rect x="90" y="102" width="60" height="12" transform="rotate(35 120 108)" />
            <rect x="90" y="124" width="60" height="12" transform="rotate(35 120 130)" />

            <rect x="490" y="340" width="60" height="12" transform="rotate(35 520 346)" />
            <rect x="490" y="362" width="60" height="12" transform="rotate(35 520 368)" />
            <rect x="490" y="384" width="60" height="12" transform="rotate(35 520 390)" />
          </g>
        </g>
      );

    case "SA": // Saudi Arabia
      return renderSvg(
        <g>
          <path fill="#006c35" d="M0 0h640v480H0z" />
          {/* Stylized Arabic Shahada script & sword */}
          <rect x="140" y="320" width="360" height="16" rx="8" fill="#fff" />
          <polygon points="120,328 150,312 150,344" fill="#fff" />
          <rect x="160" y="180" width="320" height="70" rx="10" fill="#fff" fillOpacity="0.85" />
          <text
            x="320"
            y="235"
            fill="#006c35"
            fontSize="52"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            العربية
          </text>
        </g>
      );

    case "NL": // Netherlands
      return renderSvg(
        <g>
          <path fill="#ae1c28" d="M0 0h640v160H0z" />
          <path fill="#fff" d="M0 160h640v160H0z" />
          <path fill="#21468b" d="M0 320h640v160H0z" />
        </g>
      );

    case "RU": // Russia
      return renderSvg(
        <g>
          <path fill="#fff" d="M0 0h640v160H0z" />
          <path fill="#0039a6" d="M0 160h640v160H0z" />
          <path fill="#d52b1e" d="M0 320h640v160H0z" />
        </g>
      );

    case "TR": // Turkey
      return renderSvg(
        <g>
          <path fill="#e30a17" d="M0 0h640v480H0z" />
          <circle cx="280" cy="240" r="110" fill="#fff" />
          <circle cx="310" cy="240" r="88" fill="#e30a17" />
          <polygon
            fill="#fff"
            points="420,240 460,253 445,215 470,185 430,195 405,160 405,205 375,230 415,230"
            transform="scale(0.8) translate(80, 50)"
          />
        </g>
      );

    case "PL": // Poland
      return renderSvg(
        <g>
          <path fill="#fff" d="M0 0h640v240H0z" />
          <path fill="#dc143c" d="M0 240h640v240H0z" />
        </g>
      );

    case "SE": // Sweden
      return renderSvg(
        <g>
          <path fill="#006aa7" d="M0 0h640v480H0z" />
          <path fill="#fecc00" d="M0 190h640v100H0z" />
          <path fill="#fecc00" d="M190 0h100v480H190z" />
        </g>
      );

    case "ID": // Indonesia
      return renderSvg(
        <g>
          <path fill="#e70011" d="M0 0h640v240H0z" />
          <path fill="#fff" d="M0 240h640v240H0z" />
        </g>
      );

    case "VN": // Vietnam
      return renderSvg(
        <g>
          <path fill="#da251d" d="M0 0h640v480H0z" />
          <polygon
            fill="#ff0"
            points="320,110 348,198 440,198 366,252 394,340 320,286 246,340 274,252 200,198 292,198"
          />
        </g>
      );

    case "BD": // Bangladesh
      return renderSvg(
        <g>
          <path fill="#006a4e" d="M0 0h640v480H0z" />
          <circle cx="280" cy="240" r="140" fill="#f42a41" />
        </g>
      );

    case "PK": // Pakistan
      return renderSvg(
        <g>
          <path fill="#fff" d="M0 0h160v480H0z" />
          <path fill="#01411c" d="M160 0h480v480H160z" />
          <circle cx="410" cy="240" r="100" fill="#fff" />
          <circle cx="435" cy="220" r="90" fill="#01411c" />
          <polygon
            fill="#fff"
            points="460,190 472,212 496,212 477,226 484,248 460,234 436,248 443,226 424,212 448,212"
          />
        </g>
      );

    default: // Generic or fallback globe
      return (
        <span
          className={`inline-flex items-center justify-center font-bold text-[9px] uppercase bg-slate-100 border border-slate-300 text-slate-700 rounded-xs ${className}`}
        >
          {code.slice(0, 2) || "🌐"}
        </span>
      );
  }
};

export default CountryFlag;
