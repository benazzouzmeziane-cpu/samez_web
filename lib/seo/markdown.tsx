import { createElement, type ReactNode } from 'react'
import { markdownToPlainText } from './plain-text'

const MAX_INLINE_LEN = 4000

function safeHref(raw: string): string | null {
  const href = raw.trim()
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (href.startsWith('https://') || href.startsWith('http://')) {
    try {
      const url = new URL(href)
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
    } catch {
      return null
    }
  }
  if (href.startsWith('mailto:')) return href
  return null
}

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; value: string }

function tokenizeInline(input: string): InlineToken[] {
  const source = input.slice(0, MAX_INLINE_LEN)
  const tokens: InlineToken[] = []
  const pattern =
    /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source))) {
    if (match.index > last) {
      tokens.push({ type: 'text', value: source.slice(last, match.index) })
    }
    if (match[2] && match[3]) {
      const href = safeHref(match[3])
      if (href) tokens.push({ type: 'link', href, value: match[2] })
      else tokens.push({ type: 'text', value: match[2] })
    } else if (match[4]) {
      tokens.push({ type: 'strong', value: match[4] })
    } else if (match[5]) {
      tokens.push({ type: 'em', value: match[5] })
    } else if (match[6]) {
      tokens.push({ type: 'code', value: match[6] })
    }
    last = match.index + match[0].length
  }
  if (last < source.length) tokens.push({ type: 'text', value: source.slice(last) })
  return tokens
}

function renderInline(input: string, keyPrefix: string): ReactNode[] {
  return tokenizeInline(input).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'strong':
        return createElement('strong', { key }, token.value)
      case 'em':
        return createElement('em', { key }, token.value)
      case 'code':
        return createElement('code', { key }, token.value)
      case 'link':
        return createElement(
          'a',
          {
            key,
            href: token.href,
            className: 'text-[var(--accent)] underline underline-offset-2',
            ...(token.href.startsWith('http')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {}),
          },
          token.value
        )
      default:
        return createElement('span', { key }, token.value)
    }
  })
}

export function renderMarkdown(markdown: string): ReactNode {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let key = 0

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(' ').trim()
    paragraph = []
    if (!text) return
    nodes.push(
      createElement(
        'p',
        { key: `p-${key++}`, className: 'text-slate-300 leading-relaxed mb-5' },
        renderInline(text, `p-${key}`)
      )
    )
  }

  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    nodes.push(
      createElement(
        Tag,
        {
          key: `l-${key++}`,
          className: list.ordered
            ? 'list-decimal pl-5 space-y-2 text-slate-300 mb-6'
            : 'list-disc pl-5 space-y-2 text-slate-300 mb-6',
        },
        list.items.map((item, i) =>
          createElement('li', { key: i }, renderInline(item, `li-${key}-${i}`))
        )
      )
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = /^(#{2,3})\s+(.+)$/.exec(line)
    const unordered = /^[-*]\s+(.+)$/.exec(line)
    const ordered = /^\d+\.\s+(.+)$/.exec(line)

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const Tag = level === 2 ? 'h2' : 'h3'
      nodes.push(
        createElement(
          Tag,
          {
            key: `h-${key++}`,
            className:
              level === 2
                ? 'font-display text-2xl font-semibold tracking-tight mt-10 mb-4'
                : 'font-display text-xl font-semibold tracking-tight mt-8 mb-3',
          },
          heading[2]
        )
      )
      continue
    }
    if (unordered) {
      flushParagraph()
      if (!list || list.ordered) {
        flushList()
        list = { ordered: false, items: [] }
      }
      list.items.push(unordered[1])
      continue
    }
    if (ordered) {
      flushParagraph()
      if (!list || !list.ordered) {
        flushList()
        list = { ordered: true, items: [] }
      }
      list.items.push(ordered[1])
      continue
    }
    flushList()
    paragraph.push(line.trim())
  }
  flushParagraph()
  flushList()
  return nodes
}

export { markdownToPlainText }
