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

function TGVWheel({ cx, cy, r, angle }: { cx: number; cy: number; r: number; angle: MotionValue<number> }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#475569" strokeWidth="2" />
      <RotatingSpokes cx={cx} cy={cy} r={r} count={5} angle={angle} color="#64748b" />
      <circle cx={cx} cy={cy} r={3} fill="#94a3b8" />
      <circle cx={cx} cy={cy} r={1.2} fill="#e2e8f0" />
    </g>
  )
}

function TrainSVG({ wheelAngle }: { wheelAngle: MotionValue<number> }) {
  return (
    <svg
      viewBox="0 0 260 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto' }}
    >
      {/* ═══ REAR PASSENGER CAR ═══ */}
      <rect x="2" y="18" width="68" height="32" rx="4" fill="#1e3a5f" />
      <rect x="2" y="18" width="68" height="6" rx="4" fill="#1e40af" />
      {/* Windows */}
      {[8, 22, 36, 50].map(x => (
        <rect key={x} x={x} y="26" width="11" height="9" rx="2" fill="#bae6fd" opacity="0.85" />
      ))}
      {/* Green stripe */}
      <rect x="2" y="38" width="68" height="3" fill="#059669" opacity="0.7" />
      {/* Bogies */}
      <rect x="8" y="48" width="18" height="4" rx="1" fill="#0f172a" />
      <rect x="44" y="48" width="18" height="4" rx="1" fill="#0f172a" />
      <TGVWheel cx={14} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={30} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={50} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={64} cy={57} r={8} angle={wheelAngle} />

      {/* ═══ COUPLER ═══ */}
      <rect x="68" y="30" width="8" height="6" rx="1" fill="#475569" />

      {/* ═══ POWER CAR (locomotive) ═══ */}
      {/* Body */}
      <rect x="74" y="14" width="120" height="36" rx="5" fill="#1e3a8a" />
      {/* Roof */}
      <rect x="74" y="14" width="120" height="7" rx="5" fill="#1e40af" />
      {/* Green accent stripe */}
      <rect x="74" y="35" width="120" height="4" fill="#059669" />
      {/* Windows on cab area */}
      {[80, 98, 116, 134, 152].map(x => (
        <rect key={x} x={x} y="22" width="14" height="10" rx="2" fill="#bae6fd" opacity="0.8" />
      ))}
      {/* Pantograph (current collector on roof) */}
      <line x1="130" y1="14" x2="118" y2="3" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="130" y1="14" x2="142" y2="3" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="110" y1="3" x2="150" y2="3" stroke="#94a3b8" strokeWidth="1.8" />
      <line x1="110" y1="3" x2="118" y2="3" stroke="#94a3b8" strokeWidth="1.2" />
      <line x1="142" y1="3" x2="150" y2="3" stroke="#94a3b8" strokeWidth="1.2" />
      {/* Bogies */}
      <rect x="82" y="48" width="24" height="4" rx="1" fill="#0f172a" />
      <rect x="154" y="48" width="24" height="4" rx="1" fill="#0f172a" />
      <TGVWheel cx={88} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={104} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={160} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={174} cy={57} r={8} angle={wheelAngle} />

      {/* ═══ AERODYNAMIC NOSE ═══ */}
      {/* Nose body */}
      <path d="M194 14 Q230 14 254 32 Q258 35 258 38 Q258 42 254 45 Q230 55 194 50 L194 14Z" fill="#1e3a8a" />
      {/* Nose accent stripe */}
      <path d="M194 35 Q220 35 250 40 Q220 42 194 39Z" fill="#059669" opacity="0.8" />
      {/* Headlights */}
      <ellipse cx="248" cy="32" rx="5" ry="4" fill="#fef9c3" />
      <ellipse cx="248" cy="32" rx="3" ry="2.5" fill="#fde047" />
      <ellipse cx="248" cy="44" rx="3" ry="2.5" fill="#fde047" opacity="0.5" />
      {/* Front bogie */}
      <TGVWheel cx={216} cy={57} r={8} angle={wheelAngle} />
      <TGVWheel cx={232} cy={57} r={8} angle={wheelAngle} />
      <rect x="210" y="48" width="28" height="4" rx="1" fill="#0f172a" />

      {/* ═══ UNDERCARRIAGE RAILS ═══ */}
      <rect x="2" y="64" width="256" height="2.5" rx="1" fill="#334155" opacity="0.5" />
    </svg>
  )
}

function SpeedLine({ delay, y, width }: { delay: number; y: number; width: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        height: 1.5,
        width,
        right: 0,
        top: y,
        background: 'linear-gradient(90deg, transparent, rgba(5,150,105,0.5))',
      }}
      animate={{ opacity: [0, 0.8, 0], scaleX: [0.3, 1, 0.3], x: [8, 0, 8] }}
      transition={{ duration: 0.9, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

const TRAIN_W = 270 // px — TGV

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
          style={{ height: 110 }}
          aria-hidden
        >
          {/* Single sleek rail */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            height="16"
            viewBox="0 0 1000 16"
            preserveAspectRatio="none"
          >
            {/* Rail bed */}
            <rect x="0" y="8" width="1000" height="8" fill="#e2e8f0" rx="1" />
            {/* Single rail — top */}
            <rect x="0" y="4" width="1000" height="5" rx="2" fill="#059669" />
            <rect x="0" y="4" width="1000" height="2" rx="1" fill="#34d399" opacity="0.6" />
          </svg>

          <motion.div
            className="absolute pointer-events-none"
            style={{ x: trainX, bottom: 8, width: TRAIN_W, height: 90 }}
          >
            {/* Speed lines behind the train */}
            <SpeedLine delay={0}    y={28} width={40} />
            <SpeedLine delay={0.2}  y={36} width={28} />
            <SpeedLine delay={0.4}  y={22} width={20} />
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
