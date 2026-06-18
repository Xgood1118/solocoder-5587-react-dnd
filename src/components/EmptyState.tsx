export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 select-none">
      <div className="relative mb-5">
        <svg
          width="140"
          height="120"
          viewBox="0 0 140 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="cardGrad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
            <linearGradient id="cardGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ede9fe" />
              <stop offset="100%" stopColor="#ddd6fe" />
            </linearGradient>
            <linearGradient id="cardGrad3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="100%" stopColor="#fbcfe8" />
            </linearGradient>
            <linearGradient id="plusGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          <rect
            x="8"
            y="30"
            width="90"
            height="70"
            rx="10"
            fill="url(#cardGrad1)"
            stroke="#a5b4fc"
            strokeWidth="1.5"
          />
          <rect x="20" y="44" width="44" height="6" rx="3" fill="#818cf8" opacity="0.6" />
          <rect x="20" y="58" width="60" height="4" rx="2" fill="#a5b4fc" opacity="0.8" />
          <rect x="20" y="68" width="52" height="4" rx="2" fill="#a5b4fc" opacity="0.6" />
          <rect x="20" y="78" width="32" height="4" rx="2" fill="#a5b4fc" opacity="0.5" />

          <rect
            x="24"
            y="16"
            width="90"
            height="70"
            rx="10"
            fill="url(#cardGrad2)"
            stroke="#c4b5fd"
            strokeWidth="1.5"
          />
          <rect x="36" y="30" width="44" height="6" rx="3" fill="#a78bfa" opacity="0.6" />
          <rect x="36" y="44" width="60" height="4" rx="2" fill="#c4b5fd" opacity="0.8" />
          <rect x="36" y="54" width="52" height="4" rx="2" fill="#c4b5fd" opacity="0.6" />
          <rect x="36" y="64" width="32" height="4" rx="2" fill="#c4b5fd" opacity="0.5" />

          <rect
            x="40"
            y="2"
            width="90"
            height="70"
            rx="10"
            fill="url(#cardGrad3)"
            stroke="#f9a8d4"
            strokeWidth="1.5"
          />
          <rect x="52" y="16" width="44" height="6" rx="3" fill="#f472b6" opacity="0.6" />
          <rect x="52" y="30" width="60" height="4" rx="2" fill="#f9a8d4" opacity="0.8" />
          <rect x="52" y="40" width="52" height="4" rx="2" fill="#f9a8d4" opacity="0.6" />
          <rect x="52" y="50" width="32" height="4" rx="2" fill="#f9a8d4" opacity="0.5" />

          <circle cx="108" cy="92" r="20" fill="url(#plusGrad)" className="drop-shadow-md" />
          <path
            d="M108 82 L108 102 M98 92 L118 92"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-sm text-slate-500 mb-1 font-medium">
        点击下方 <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold align-middle mx-0.5">+</span> 添加第一张卡片
      </p>
      <p className="text-xs text-slate-400">
        从想法开始，逐步构建你的看板
      </p>
    </div>
  );
};
