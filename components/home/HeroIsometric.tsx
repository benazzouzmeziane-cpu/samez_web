/**
 * Isometric system graphic for the hero — SVG only, CSS motion.
 * Ambient float is decorative (first-view marketing).
 */
export default function HeroIsometric() {
  return (
    <div className="hero-iso pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-y-0 right-0 w-full md:w-[62%] lg:w-[58%]">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent md:via-white/35 md:to-transparent z-[1]" />
        <div className="hero-iso__stage absolute right-[-8%] top-1/2 -translate-y-1/2 w-[120%] md:right-0 md:w-[110%] lg:w-full opacity-[0.5] md:opacity-90">
          <svg
            className="hero-iso__svg w-full h-auto"
            viewBox="0 0 720 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="400" cy="480" rx="260" ry="36" fill="#059669" fillOpacity="0.06" />

            <g className="hero-iso__flows" strokeLinecap="round" strokeLinejoin="round">
              <path
                className="hero-iso__flow hero-iso__flow--a"
                d="M168 210 L280 170 L390 210"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="6 10"
              />
              <path
                className="hero-iso__flow hero-iso__flow--b"
                d="M280 250 L390 290 L500 250"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="6 10"
              />
              <path
                className="hero-iso__flow hero-iso__flow--c"
                d="M390 210 L500 170 L580 210"
                stroke="#6ee7b7"
                strokeWidth="2"
                strokeDasharray="5 12"
              />
              <path
                className="hero-iso__flow hero-iso__flow--d"
                d="M280 170 L280 250"
                stroke="#a7f3d0"
                strokeWidth="2"
                strokeDasharray="4 8"
              />
              <path
                className="hero-iso__flow hero-iso__flow--e"
                d="M500 170 L500 250"
                stroke="#a7f3d0"
                strokeWidth="2"
                strokeDasharray="4 8"
              />
            </g>

            <g className="hero-iso__mod hero-iso__mod--1">
              <path d="M120 220 L200 180 L280 220 L200 260 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5" />
              <path d="M120 220 L120 268 L200 308 L200 260 Z" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
              <path d="M280 220 L280 268 L200 308 L200 260 Z" fill="#a7f3d0" stroke="#047857" strokeWidth="1.5" />
              <circle cx="200" cy="220" r="8" fill="#059669" />
              <rect x="176" y="198" width="20" height="3" rx="1" fill="#047857" fillOpacity="0.35" />
              <rect x="170" y="206" width="28" height="3" rx="1" fill="#047857" fillOpacity="0.25" />
            </g>

            <g className="hero-iso__mod hero-iso__mod--2">
              <path d="M310 150 L390 110 L470 150 L390 190 Z" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
              <path d="M310 150 L310 198 L390 238 L390 190 Z" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
              <path d="M470 150 L470 198 L390 238 L390 190 Z" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5" />
              <circle cx="390" cy="150" r="10" fill="#10b981" />
              <circle cx="390" cy="150" r="4" fill="#ecfdf5" />
            </g>

            <g className="hero-iso__mod hero-iso__mod--3">
              <path d="M460 220 L540 180 L620 220 L540 260 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5" />
              <path d="M460 220 L460 268 L540 308 L540 260 Z" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
              <path d="M620 220 L620 268 L540 308 L540 260 Z" fill="#34d399" stroke="#047857" strokeWidth="1.5" />
              <rect x="520" y="198" width="40" height="28" rx="3" fill="#fff" stroke="#059669" strokeWidth="1.2" />
              <rect x="526" y="206" width="16" height="2.5" rx="1" fill="#059669" fillOpacity="0.4" />
              <rect x="526" y="212" width="24" height="2.5" rx="1" fill="#059669" fillOpacity="0.25" />
            </g>

            <g className="hero-iso__mod hero-iso__mod--4">
              <path d="M310 290 L390 250 L470 290 L390 330 Z" fill="#f0fdf4" stroke="#047857" strokeWidth="1.5" />
              <path d="M310 290 L310 338 L390 378 L390 330 Z" fill="#a7f3d0" stroke="#047857" strokeWidth="1.5" />
              <path d="M470 290 L470 338 L390 378 L390 330 Z" fill="#6ee7b7" stroke="#047857" strokeWidth="1.5" />
              <ellipse cx="390" cy="300" rx="22" ry="10" fill="#059669" fillOpacity="0.15" stroke="#059669" strokeWidth="1.2" />
              <ellipse cx="390" cy="292" rx="22" ry="10" fill="#ecfdf5" stroke="#059669" strokeWidth="1.2" />
            </g>

            <g className="hero-iso__nodes" fill="#059669">
              <circle className="hero-iso__node hero-iso__node--1" cx="250" cy="140" r="4" fillOpacity="0.55" />
              <circle className="hero-iso__node hero-iso__node--2" cx="560" cy="140" r="3.5" fillOpacity="0.45" />
              <circle className="hero-iso__node hero-iso__node--3" cx="330" cy="360" r="3" fillOpacity="0.4" />
              <circle className="hero-iso__node hero-iso__node--4" cx="480" cy="360" r="3.5" fillOpacity="0.5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
