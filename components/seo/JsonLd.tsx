export default function JsonLd({ data }: { data: unknown }) {
  let json = ''
  try {
    json = JSON.stringify(data)
  } catch {
    return null
  }
  if (!json) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
