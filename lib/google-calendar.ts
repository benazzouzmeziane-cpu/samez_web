/**
 * Google Calendar + Meet via OAuth refresh token (compte perso / Workspace).
 *
 * Env requis:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 *   GOOGLE_CALENDAR_ID (défaut: primary)
 *
 * Obtenir un refresh token (une fois):
 * 1. Google Cloud Console → OAuth client (Web)
 * 2. Autoriser le scope https://www.googleapis.com/auth/calendar
 * 3. Échanger un code contre refresh_token (oauth2 playground ou script local)
 */

type CreateEventInput = {
  summary: string
  description: string
  startsAt: Date
  endsAt: Date
  attendeeEmail: string
  attendeeName: string
}

type CreateEventResult = {
  eventId: string
  meetLink?: string
  htmlLink?: string
}

function configured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  )
}

export function isGoogleCalendarConfigured(): boolean {
  return configured()
}

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google token error: ${text}`)
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || 'primary'
}

export async function createCalendarEventWithMeet(
  input: CreateEventInput
): Promise<CreateEventResult | null> {
  if (!configured()) return null

  const token = await getAccessToken()
  const requestId = `samez-${input.startsAt.getTime()}-${Math.random().toString(36).slice(2, 10)}`

  const body = {
    summary: input.summary,
    description: input.description,
    start: {
      dateTime: input.startsAt.toISOString(),
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: input.endsAt.toISOString(),
      timeZone: 'Europe/Paris',
    },
    attendees: [
      {
        email: input.attendeeEmail,
        displayName: input.attendeeName,
      },
    ],
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: true,
    },
  }

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`
  )
  url.searchParams.set('conferenceDataVersion', '1')
  url.searchParams.set('sendUpdates', 'all')

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Calendar create error: ${text}`)
  }

  const event = (await res.json()) as {
    id: string
    htmlLink?: string
    hangoutLink?: string
    conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] }
  }

  const meetFromEntry = event.conferenceData?.entryPoints?.find(
    e => e.entryPointType === 'video'
  )?.uri

  return {
    eventId: event.id,
    meetLink: event.hangoutLink || meetFromEntry,
    htmlLink: event.htmlLink,
  }
}

export async function cancelCalendarEvent(eventId: string): Promise<void> {
  if (!configured() || !eventId) return

  const token = await getAccessToken()
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`
  )
  url.searchParams.set('sendUpdates', 'all')

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  // 404/410 = déjà supprimé
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const text = await res.text()
    throw new Error(`Google Calendar delete error: ${text}`)
  }
}
