'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution/client'

export default function AttributionTracker() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
