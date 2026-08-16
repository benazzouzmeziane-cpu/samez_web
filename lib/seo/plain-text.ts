export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/[#*_`[\]]/g, '')
    .replace(/\((https?:\/\/[^)]+)\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
