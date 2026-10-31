import React from 'react';

interface TrustHRLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

export const TrustHRLogo: React.FC<TrustHRLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-8 h-8', text: 'text-base' },
    lg: { icon: 'w-10 h-10', text: 'text-lg' },
    xl: { icon: 'w-12 h-12', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Precision Dual-Shield & Verifiable Lattice Emblem */}
      <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Primary Shield Gradient */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="60%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Inner Cryptographic Lattice Gradient */}
            <linearGradient id="coreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.85" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Outer Security Shield Body */}
          <path
            d="M24 4L7 11V23.5C7 34.2 14.3 43.8 24 46.5C33.7 43.8 41 34.2 41 23.5V11L24 4Z"
            fill="url(#shieldGrad)"
            filter="url(#shieldGlow)"
          />

          {/* Inner Geometric Shield Accent */}
          <path
            d="M24 7.5L10 13.7V23.5C10 32.3 16 40.2 24 42.6C32 40.2 38 32.3 38 23.5V13.7L24 7.5Z"
            fill="#1e1b4b"
            fillOpacity="0.35"
          />

          {/* Human-in-the-Loop Verifiable Lattice Node (Action Gateway Emblem) */}
          <g transform="translate(14, 15)">
            {/* Lattice interconnect lines */}
            <line x1="10" y1="2" x2="3" y2="8" stroke="url(#coreGrad)" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="10" y1="2" x2="17" y2="8" stroke="url(#coreGrad)" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="3" y1="8" x2="10" y2="15" stroke="url(#coreGrad)" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="17" y1="8" x2="10" y2="15" stroke="url(#coreGrad)" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="10" y1="2" x2="10" y2="15" stroke="url(#coreGrad)" strokeWidth="1.6" strokeDasharray="1.5 2" />

            {/* Verification Nodes */}
            <circle cx="10" cy="2" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="3" cy="8" r="2" fill="#ffffff" />
            <circle cx="17" cy="8" r="2" fill="#ffffff" />
            
            {/* Central Anchor Node (Human Approval Gateway) */}
            <circle cx="10" cy="8.5" r="2.8" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.4" />
            <circle cx="10" cy="15" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Styled Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.text} ${textClassName}`}>
              Trust<span className="text-indigo-600 dark:text-indigo-400">HR</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider">
              AI
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-0.5">
            Evidence Gateway
          </span>
        </div>
      )}
    </div>
  );
};
