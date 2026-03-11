'use client'

import { useRef, useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion'
import ScrollReveal from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Échange',
    description: 'On discute de votre besoin, je comprends vos enjeux et je propose une solution adaptée. Devis gratuit sous 48h.',
    accent: 'Gratuit & sans engagement',
  },
  {
    number: '02',
    title: 'Développement',
    description: 'Je développe votre solution avec des points réguliers pour valider chaque étape. Vous gardez le contrôle.',
    accent: 'Suivi transparent',
  },
  {
    number: '03',
    title: 'Livraison & suivi',
    description: 'Mise en production, formation si nécessaire, et support post-livraison inclus. Votre outil est prêt à performer.',
    accent: 'Support inclus',
  },
]

// Spokes that rotate using SVG transform (works correctly with scaled SVGs)
function RotatingSpokes({
  cx, cy, r, count, angle, color,
}: {
  cx: number; cy: number; r: number; count: number
  angle: MotionValue<number>; color: string
}) {
  const [deg, setDeg] = useState(0)
  useMotionValueEvent(angle, 'change', setDeg)
  return (
    <g transform={`rotate(${deg}, ${cx}, ${cy})`}>
      {Array.from({ length: count }, (_, i) => {
        const rad = (i * Math.PI) / count
        const r1 = r - 1.5
        return (
          <line
            key={i}
            x1={Math.round((cx + Math.cos(rad) * r1) * 1000) / 1000}
            y1={Math.round((cy + Math.sin(rad) * r1) * 1000) / 1000}
            x2={Math.round((cx - Math.cos(rad) * r1) * 1000) / 1000}
            y2={Math.round((cy - Math.sin(rad) * r1) * 1000) / 1000}
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

function DriveWheel({ cx, cy, r, angle }: { cx: number; cy: number; r: number; angle: MotionValue<number> }) {
  return (
    <g>
      {/* Tyre */}
      <circle cx={cx} cy={cy} r={r} fill="#14532d" stroke="#059669" strokeWidth="2.5" />
      {/* Spokes */}
      <RotatingSpokes cx={cx} cy={cy} r={r} count={6} angle={angle} color="#86efac" />
      {/* Crank pin (offset from center for realism) */}
      <RotatingSpokes cx={cx} cy={cy} r={r * 0.55} count={1} angle={angle} color="#4ade80" />
      {/* Hub */}
      <circle cx={cx} cy={cy} r={4} fill="#059669" />
      <circle cx={cx} cy={cy} r={1.8} fill="#bbf7d0" />
    </g>
  )
}

function SmallWheel({ cx, cy, r, angle }: { cx: number; cy: number; r: number; angle: MotionValue<number> }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#374151" stroke="#6b7280" strokeWidth="1.5" />
      <RotatingSpokes cx={cx} cy={cy} r={r} count={4} angle={angle} color="#9ca3af" />
      <circle cx={cx} cy={cy} r={2.5} fill="#6b7280" />
    </g>
  )
}

function TrainSVG({ wheelAngle }: { wheelAngle: MotionValue<number> }) {
  const smallAngle = useTransform(wheelAngle, v => v * 1.45)
  return (
    <svg
      viewBox="0 0 215 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto' }}
    >
      {/* ═══ TENDER (coal car, left/rear) ═══ */}
      <rect x="1" y="33" width="54" height="35" rx="3" fill="#1e3a5f" />
      <rect x="4" y="36" width="48" height="21" rx="2" fill="#172a48" />
      {/* Coal lumps */}
      <ellipse cx="14" cy="43" rx="7" ry="4.5" fill="#0f172a" opacity="0.9" />
      <ellipse cx="29" cy="40" rx="9" ry="5.5" fill="#0f172a" opacity="0.9" />
      <ellipse cx="45" cy="43" rx="7" ry="4.5" fill="#0f172a" opacity="0.9" />
      {/* Tender frame rail */}
      <rect x="1" y="62" width="54" height="4" rx="1" fill="#152a45" />
      {/* Tender wheels */}
      <SmallWheel cx={17} cy={74} r={10} angle={smallAngle} />
      <SmallWheel cx={39} cy={74} r={10} angle={smallAngle} />
      {/* Coupler */}
      <rect x="53" y="56" width="10" height="5" rx="1.5" fill="#6b7280" />
      <rect x="55" y="57.5" width="6" height="2" rx="1" fill="#9ca3af" />

      {/* ═══ CAB ═══ */}
      <rect x="61" y="20" width="41" height="48" rx="3" fill="#166534" />
      {/* Roof */}
      <rect x="58" y="16" width="47" height="8" rx="3" fill="#14532d" />
      {/* Windows */}
      <rect x="65" y="27" width="13" height="11" rx="2" fill="#bae6fd" opacity="0.9" />
      <rect x="83" y="27" width="13" height="11" rx="2" fill="#bae6fd" opacity="0.9" />
      <rect x="65" y="27" width="13" height="11" rx="2" stroke="#0369a1" strokeWidth="1" fill="none" />
      <rect x="83" y="27" width="13" height="11" rx="2" stroke="#0369a1" strokeWidth="1" fill="none" />
      {/* Door */}
      <rect x="72" y="50" width="18" height="18" rx="1.5" fill="#14532d" />
      <circle cx="88" cy="59" r="1.5" fill="#6b7280" />
      {/* Vertical rivets */}
      {[63, 99].map(x => [28, 36, 44, 52, 60].map(y => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#14532d" opacity="0.8" />
      )))}

      {/* ═══ BOILER ═══ */}
      <rect x="100" y="28" width="77" height="39" rx="16" fill="#15803d" />
      {/* Boiler bands */}
      {[120, 140, 160].map(x => (
        <rect key={x} x={x} y="28" width="2" height="39" fill="#14532d" opacity="0.4" />
      ))}
      {/* Front nose */}
      <ellipse cx="176" cy="47" rx="5" ry="19.5" fill="#166534" />
      {/* Sand dome */}
      <ellipse cx="109" cy="27" rx="9" ry="6" fill="#059669" />
      {/* Steam dome */}
      <ellipse cx="126" cy="27" rx="13" ry="9" fill="#047857" />
      <ellipse cx="126" cy="22" rx="7" ry="3.5" fill="#065f46" />
      {/* Safety valve */}
      <rect x="141" y="20" width="5" height="10" rx="2" fill="#6b7280" />
      <ellipse cx="143.5" cy="20" rx="4.5" ry="2" fill="#9ca3af" />
      {/* Handrail */}
      <line x1="100" y1="27" x2="174" y2="27" stroke="#6b7280" strokeWidth="1.2" opacity="0.7" />
      {[100, 140, 174].map(x => (
        <line key={x} x1={x} y1="27" x2={x} y2="33" stroke="#6b7280" strokeWidth="1.2" opacity="0.7" />
      ))}

      {/* ═══ SMOKE STACK ═══ */}
      <rect x="159" y="9" width="14" height="20" rx="2" fill="#1f2937" />
      <ellipse cx="166" cy="9" rx="10.5" ry="4.5" fill="#374151" />
      <rect x="163" y="4" width="6" height="7" rx="1.5" fill="#374151" />
      {/* Stack inner dark */}
      <ellipse cx="166" cy="9" rx="5" ry="2" fill="#111827" />

      {/* ═══ HEADLIGHT ═══ */}
      <circle cx="172" cy="47" r="8" fill="#fef9c3" />
      <circle cx="172" cy="47" r="5" fill="#fde047" />
      <circle cx="172" cy="47" r="2.2" fill="#fbbf24" />

      {/* ═══ COWCATCHER ═══ */}
      <rect x="170" y="60" width="32" height="9" rx="1.5" fill="#374151" />
      {[175, 181, 187, 193, 199].map(x => (
        <line key={x} x1={x} y1="60" x2={x} y2="69" stroke="#1f2937" strokeWidth="1.2" />
      ))}
      {/* Front buffer */}
      <rect x="199" y="61" width="6" height="7" rx="1" fill="#4b5563" />

      {/* ═══ DRIVING WHEELS ═══ */}
      <DriveWheel cx={113} cy={74} r={13} angle={wheelAngle} />
      <DriveWheel cx={141} cy={74} r={13} angle={wheelAngle} />
      {/* Front pilot wheel */}
      <SmallWheel cx={164} cy={74} r={8} angle={smallAngle} />

      {/* ═══ CONNECTING RODS ═══ */}
      {/* Main rod between driving wheels */}
      <rect x="113" y="70.5" width="28" height="5" rx="2.5" fill="#94a3b8" />
      <circle cx="113" cy="73" r="3" fill="#64748b" />
      <circle cx="141" cy="73" r="3" fill="#64748b" />
      {/* Valve gear / piston rod */}
      <rect x="150" y="71" width="22" height="4" rx="2" fill="#94a3b8" />
      <rect x="156" y="67.5" width="10" height="9" rx="2" fill="#64748b" />
      {/* Slide bar */}
      <rect x="150" y="69" width="22" height="1.5" rx="0.75" fill="#cbd5e1" opacity="0.6" />
    </svg>
  )
}

function SmokeParticle({ index }: { index: number }) {
  const size = 5 + index * 4
  return (
    <motion.div
      className="absolute rounded-full bg-gray-300/60 blur-sm"
      style={{ width: size, height: size, left: -size / 2, top: -size / 2 }}
      animate={{
        y: [0, -(22 + index * 14)],
        opacity: [0.75, 0],
        scale: [0.4, 1.3 + index * 0.25],
        x: [0, index % 2 === 0 ? -7 : 7],
      }}
      transition={{
        duration: 1.4 + index * 0.3,
        delay: index * 0.45,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

const TRAIN_W = 224 // px

// Mini SVG clock mounted on station card
function StationClock({ hour, minute }: { hour: number; minute: number }) {
  const hDeg = (hour % 12) * 30 + minute * 0.5
  const mDeg = minute * 6
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" className="shrink-0">
      <circle cx="18" cy="18" r="16" fill="#1c1917" stroke="#78716c" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="13" fill="#1c1917" stroke="#44403c" strokeWidth="0.5" />
      {/* Hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const x1 = Math.round((18 + Math.sin(a) * 10.5) * 1000) / 1000
        const y1 = Math.round((18 - Math.cos(a) * 10.5) * 1000) / 1000
        const x2 = Math.round((18 + Math.sin(a) * 12.5) * 1000) / 1000
        const y2 = Math.round((18 - Math.cos(a) * 12.5) * 1000) / 1000
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#a8a29e"
            strokeWidth={i % 3 === 0 ? 1.8 : 0.8}
          />
        )
      })}
      {/* Hour hand */}
      <line
        x1="18" y1="18"
        x2={Math.round((18 + Math.sin((hDeg * Math.PI) / 180) * 6.5) * 1000) / 1000}
        y2={Math.round((18 - Math.cos((hDeg * Math.PI) / 180) * 6.5) * 1000) / 1000}
        stroke="#fafaf9" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1="18" y1="18"
        x2={Math.round((18 + Math.sin((mDeg * Math.PI) / 180) * 9.5) * 1000) / 1000}
        y2={Math.round((18 - Math.cos((mDeg * Math.PI) / 180) * 9.5) * 1000) / 1000}
        stroke="#fafaf9" strokeWidth="1.2" strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="1.5" fill="#059669" />
    </svg>
  )
}

// Railway signal lamp (green = go)
function SignalLamp() {
  return (
    <svg viewBox="0 0 20 48" width="14" height="34" className="shrink-0">
      {/* Post */}
      <rect x="9" y="24" width="2" height="22" rx="1" fill="#57534e" />
      {/* Housing */}
      <rect x="4" y="2" width="12" height="22" rx="3" fill="#1c1917" stroke="#44403c" strokeWidth="1" />
      {/* Red light (off) */}
      <circle cx="10" cy="8" r="3.5" fill="#7f1d1d" opacity="0.5" />
      {/* Green light (on) */}
      <circle cx="10" cy="18" r="3.5" fill="#16a34a" />
      <circle cx="10" cy="18" r="2" fill="#4ade80" opacity="0.8" />
    </svg>
  )
}

const stationClocks = [
  { hour: 9, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 17, minute: 0 },
]

export default function Process() {
  const sectionRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const [railWidth, setRailWidth] = useState(900)
  const hovered = useRef(false)

  const rawProgress = useMotionValue(0)
  const springProgress = useSpring(rawProgress, { stiffness: 55, damping: 22, restDelta: 0.0005 })

  // Scroll-driven (fallback when not hovering)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 90%', 'end 15%'],
  })
  useEffect(() => {
    return scrollYProgress.on('change', v => {
      if (!hovered.current) rawProgress.set(v)
    })
  }, [scrollYProgress, rawProgress])

  // Cursor-driven over the entire section
  useEffect(() => {
    const section = sectionRef.current
    const rail = railRef.current
    if (!section || !rail) return
    const onMove = (e: MouseEvent) => {
      const rect = rail.getBoundingClientRect()
      rawProgress.set(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
    }
    const onEnter = () => { hovered.current = true }
    const onLeave = () => { hovered.current = false }
    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseenter', onEnter)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseenter', onEnter)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [rawProgress])

  // Track rail container width
  useEffect(() => {
    const update = () => {
      if (railRef.current) setRailWidth(railRef.current.offsetWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    if (railRef.current) ro.observe(railRef.current)
    return () => ro.disconnect()
  }, [])

  const trainX = useTransform(springProgress, [0, 1], [0, Math.max(0, railWidth - TRAIN_W)])
  // 4 full rotations over the full track
  const wheelAngle = useTransform(springProgress, [0, 1], [0, 1440])

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f5f0eb 0%, #eef2ec 60%, #e8f5e9 100%)' }}
    >
      {/* Brick/stone texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #78716c 0px, #78716c 1px, transparent 1px, transparent 28px),
            repeating-linear-gradient(90deg, #78716c 0px, #78716c 1px, transparent 1px, transparent 40px)`,
        }}
      />
      {/* Ambient glow */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-100/30 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">

        {/* Header — style tableau des départs */}
        <ScrollReveal>
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
              <p className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-[0.2em]">
                Tableau des départs
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              Votre voyage avec same&apos;z
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-xl">
              Trois étapes, trois stations. De l&apos;idée à la destination finale.
            </p>
          </div>
        </ScrollReveal>

        {/* ═══ TRAIN TRACK — desktop only ═══ */}
        <div
          ref={railRef}
          className="hidden md:block relative mb-0 select-none cursor-ew-resize"
          style={{ height: 120 }}
          aria-hidden
        >
          <svg
            className="absolute bottom-0 left-0 w-full"
            height="28"
            viewBox="0 0 1000 28"
            preserveAspectRatio="none"
          >
            {Array.from({ length: 38 }).map((_, i) => (
              <rect key={i} x={i * 26.6 + 0.5} y="1" width="17" height="26" rx="2" fill="#78716c" opacity="0.3" />
            ))}
            <rect x="0" y="18" width="1000" height="5" rx="2.5" fill="#059669" />
            <rect x="0" y="18" width="1000" height="2" rx="1" fill="#34d399" opacity="0.55" />
            <rect x="0" y="5" width="1000" height="5" rx="2.5" fill="#059669" />
            <rect x="0" y="5" width="1000" height="2" rx="1" fill="#34d399" opacity="0.55" />
          </svg>

          <motion.div
            className="absolute pointer-events-none"
            style={{ x: trainX, bottom: 3, width: TRAIN_W, height: 95 }}
          >
            <div className="absolute" style={{ left: '77%', top: 3, width: 0, height: 0 }}>
              {[0, 1, 2].map(i => <SmokeParticle key={i} index={i} />)}
            </div>
            <TrainSVG wheelAngle={wheelAngle} />
          </motion.div>

          <p className="absolute top-0 right-0 text-[11px] text-stone-400 font-mono pointer-events-none">
            ← déplacez la souris →
          </p>
        </div>

        {/* ═══ STATION CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 relative">
          {/* Track line between cards — desktop */}
          <div className="hidden md:block absolute top-[72px] left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-[3px] z-0"
            style={{ background: 'repeating-linear-gradient(90deg, #059669 0px, #059669 12px, transparent 12px, transparent 20px)' }}
          />

          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.15} className="px-3 pb-6">
              <div className="relative group h-full flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(209,250,229,0.6)' }}
              >
                {/* Station nameplate — top dark board */}
                <div className="bg-[#1c1917] px-5 pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-0.5">
                      Quai {step.number}
                    </p>
                    <p className="text-white font-bold text-lg tracking-wide leading-none font-mono">
                      {step.title.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <SignalLamp />
                    <StationClock hour={stationClocks[i].hour} minute={stationClocks[i].minute} />
                  </div>
                </div>

                {/* Platform edge strip */}
                <div className="h-[5px]"
                  style={{ background: 'repeating-linear-gradient(90deg, #fbbf24 0px, #fbbf24 18px, #1c1917 18px, #1c1917 24px)' }}
                />

                {/* Content area — platform floor */}
                <div className="flex flex-col flex-1 p-6 relative">
                  {/* Subtle platform floor lines */}
                  <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'repeating-linear-gradient(90deg, #78716c 0px, #78716c 1px, transparent 1px, transparent 60px)' }}
                  />
                  <p className="text-gray-600 leading-relaxed mb-5 text-sm relative z-10 flex-1">
                    {step.description}
                  </p>
                  {/* Departure badge */}
                  <div className="mt-auto relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-[#1c1917] text-[#4ade80] rounded border border-[#2d2d2b]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] inline-block animate-pulse" />
                      {step.accent}
                    </span>
                  </div>
                </div>

                {/* Bottom platform edge */}
                <div className="h-[3px] bg-stone-300/60" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
