import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Espace client — same'z",
}

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  return children
}
