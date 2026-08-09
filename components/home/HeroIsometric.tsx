/**
 * Isometric system graphic — right-side composition, brand emerald.
 */
export default function HeroIsometric() {
  return (
    <div className="hero-iso pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-y-0 right-0 hidden sm:block w-[55%] lg:w-[50%]">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-[1]" />
        <div className="hero-iso__stage absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-[640px]">
          <svg
            className="hero-iso__svg w-full h-auto"
            viewBox="0 0 640 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Flows */}
            <g strokeLinecap="round" strokeLinejoin="round">
              <path className="hero-iso__flow hero-iso__flow--a" d="M140 200 L250 155 L360 200" stroke="#10b981" strokeWidth="2.5" strokeDasharray="7 9" />
              <path className="hero-iso__flow hero-iso__flow--b" d="M250 245 L360 290 L470 245" stroke="#059669" strokeWidth="2.5" strokeDasharray="7 9" />
              <path className="hero-iso__flow hero-iso__flow--c" d="M360 200 L470 155 L550 200" stroke="#34d399" strokeWidth="2.5" strokeDasharray="6 10" />
              <path className="hero-iso__flow hero-iso__flow--d" d="M250 155 L250 245" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="5 8" />
              <path className="hero-iso__flow hero-iso__flow--e" d="M470 155 L470 245" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="5 8" />
            </g>

            {/* Module A — API */}
            <g className="hero-iso__mod hero-iso__mod--1">
              <path d="M90 210 L180 165 L270 210 L180 255 Z" fill="#ecfdf5" stroke="#047857" strokeWidth="2" />
              <path d="M90 210 L90 268 L180 313 L180 255 Z" fill="#a7f3d0" stroke="#047857" strokeWidth="2" />
              <path d="M270 210 L270 268 L180 313 L180 255 Z" fill="#34d399" stroke="#047857" strokeWidth="2" />
              <circle cx="180" cy="210" r="9" fill="#059669" />
              <rect x="154" y="188" width="22" height="3.5" rx="1" fill="#047857" fillOpacity="0.45" />
              <rect x="148" y="197" width="32" height="3.5" rx="1" fill="#047857" fillOpacity="0.3" />
            </g>

            {/* Module B — Orchestrator */}
            <g className="hero-iso__mod hero-iso__mod--2">
              <path d="M280 140 L360 95 L440 140 L360 185 Z" fill="#f0fdf4" stroke="#059669" strokeWidth="2" />
              <path d="M280 140 L280 198 L360 243 L360 185 Z" fill="#d1fae5" stroke="#059669" strokeWidth="2" />
              <path d="M440 140 L440 198 L360 243 L360 185 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
              <circle cx="360" cy="140" r="11" fill="#059669" />
              <circle cx="360" cy="140" r="4.5" fill="#ecfdf5" />
            </g>

            {/* Module C — App */}
            <g className="hero-iso__mod hero-iso__mod--3">
              <path d="M430 210 L520 165 L610 210 L520 255 Z" fill="#ecfdf5" stroke="#047857" strokeWidth="2" />
              <path d="M430 210 L430 268 L520 313 L520 255 Z" fill="#a7f3d0" stroke="#047857" strokeWidth="2" />
              <path d="M610 210 L610 268 L520 313 L520 255 Z" fill="#059669" stroke="#047857" strokeWidth="2" />
              <rect x="498" y="188" width="44" height="32" rx="4" fill="#fff" stroke="#047857" strokeWidth="1.5" />
              <rect x="506" y="198" width="18" height="3" rx="1" fill="#059669" fillOpacity="0.5" />
              <rect x="506" y="206" width="28" height="3" rx="1" fill="#059669" fillOpacity="0.3" />
            </g>

            {/* Module D — Data */}
            <g className="hero-iso__mod hero-iso__mod--4">
              <path d="M280 300 L360 255 L440 300 L360 345 Z" fill="#f0fdf4" stroke="#047857" strokeWidth="2" />
              <path d="M280 300 L280 358 L360 403 L360 345 Z" fill="#6ee7b7" stroke="#047857" strokeWidth="2" />
              <path d="M440 300 L440 358 L360 403 L360 345 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
              <ellipse cx="360" cy="312" rx="24" ry="11" fill="#059669" fillOpacity="0.2" stroke="#047857" strokeWidth="1.5" />
              <ellipse cx="360" cy="302" rx="24" ry="11" fill="#ecfdf5" stroke="#047857" strokeWidth="1.5" />
            </g>

            {/* Nodes */}
            <g fill="#059669">
              <circle className="hero-iso__node hero-iso__node--1" cx="220" cy="120" r="5" />
              <circle className="hero-iso__node hero-iso__node--2" cx="520" cy="120" r="4.5" />
              <circle className="hero-iso__node hero-iso__node--3" cx="300" cy="390" r="4" />
              <circle className="hero-iso__node hero-iso__node--4" cx="440" cy="390" r="4.5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
