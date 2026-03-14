'use client'

import { useEffect, useRef } from 'react'

const FRAME_COUNT = 64
const FPS = 24

// Generate frame paths: hero-animation_000.webp … hero-animation_063.webp
const frames = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const n = String(i).padStart(3, '0')
  return `/hero-animation_${n}.webp`
})

export default function HeroFramePlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const currentFrameRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Preload frames progressively (first frame immediately, rest lazily)
    let loaded = 0
    const loadImage = (index: number): Promise<HTMLImageElement> =>
      new Promise((resolve) => {
        const img = new Image()
        img.src = frames[index]
        img.onload = () => {
          loaded++
          if (index === 0) {
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
          resolve(img)
        }
        img.onerror = () => resolve(img)
        return img
      })

    // Load first frame immediately, then load the rest in small batches
    const loadAll = async () => {
      imagesRef.current = new Array(FRAME_COUNT)
      imagesRef.current[0] = await loadImage(0)
      // Load remaining in batches of 8
      for (let i = 1; i < FRAME_COUNT; i += 8) {
        const batch = Array.from({ length: Math.min(8, FRAME_COUNT - i) }, (_, j) => i + j)
        const results = await Promise.all(batch.map((idx) => loadImage(idx)))
        results.forEach((img, j) => {
          imagesRef.current[batch[j]] = img
        })
      }
    }

    loadAll()

    const drawFrame = (index: number) => {
      const img = imagesRef.current[index]
      if (!img?.complete || !img.naturalWidth) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }

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

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      stopPlay()
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[420px] h-auto"
      style={{ maxHeight: '70vh', objectFit: 'contain' }}
    />
  )
}
