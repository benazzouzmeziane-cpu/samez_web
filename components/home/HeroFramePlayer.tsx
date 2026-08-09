'use client'

import { useEffect, useRef } from 'react'

const FRAME_COUNT = 64
const FPS = 24

const frames = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(i).padStart(3, '0')
  return `/hero-animation_${n}.webp`
})

type HeroFramePlayerProps = {
  className?: string
  /** When true, fills the parent (object-cover style via canvas draw). */
  cover?: boolean
}

export default function HeroFramePlayer({ className = '', cover = false }: HeroFramePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const currentFrameRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { clientWidth, clientHeight } = container
      canvas.width = Math.max(1, Math.floor(clientWidth * dpr))
      canvas.height = Math.max(1, Math.floor(clientHeight * dpr))
      canvas.style.width = `${clientWidth}px`
      canvas.style.height = `${clientHeight}px`
      drawFrame(currentFrameRef.current)
    }

    const loadImage = (index: number): Promise<HTMLImageElement> =>
      new Promise((resolve) => {
        const img = new Image()
        img.src = frames[index]
        img.onload = () => resolve(img)
        img.onerror = () => resolve(img)
      })

    const drawFrame = (index: number) => {
      const img = imagesRef.current[index]
      if (!img?.complete || !img.naturalWidth) return

      const cw = canvas.width
      const ch = canvas.height
      ctx.clearRect(0, 0, cw, ch)

      if (cover) {
        const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
        const w = img.naturalWidth * scale
        const h = img.naturalHeight * scale
        const x = (cw - w) / 2
        const y = (ch - h) / 2
        ctx.drawImage(img, x, y, w, h)
      } else {
        const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight)
        const w = img.naturalWidth * scale
        const h = img.naturalHeight * scale
        const x = (cw - w) / 2
        const y = (ch - h) / 2
        ctx.drawImage(img, x, y, w, h)
      }
    }

    const loadAll = async () => {
      imagesRef.current = new Array(FRAME_COUNT)
      imagesRef.current[0] = await loadImage(0)
      resizeCanvas()
      for (let i = 1; i < FRAME_COUNT; i += 8) {
        const batch = Array.from({ length: Math.min(8, FRAME_COUNT - i) }, (_, j) => i + j)
        const results = await Promise.all(batch.map((idx) => loadImage(idx)))
        results.forEach((img, j) => {
          imagesRef.current[batch[j]] = img
        })
      }
    }

    loadAll()

    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return
      const elapsed = timestamp - lastFrameTimeRef.current
      if (elapsed >= 1000 / FPS) {
        lastFrameTimeRef.current = timestamp
        currentFrameRef.current = (currentFrameRef.current + 1) % FRAME_COUNT
        drawFrame(currentFrameRef.current)
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const startPlay = () => {
      if (isPlayingRef.current) return
      isPlayingRef.current = true
      lastFrameTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(animate)
    }

    const stopPlay = () => {
      isPlayingRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const handleScroll = () => {
      startPlay()
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        stopPlay()
      }, 150)
    }

    const ro = new ResizeObserver(resizeCanvas)
    ro.observe(container)
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Gentle autoplay once frames exist — marketing first-view delight
    const introTimer = setTimeout(() => {
      startPlay()
      setTimeout(stopPlay, 2400)
    }, 600)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      ro.disconnect()
      stopPlay()
      clearTimeout(introTimer)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [cover])

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
    </div>
  )
}
