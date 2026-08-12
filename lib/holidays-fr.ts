/** Jours fériés France métropolitaine (fixes + mobiles liés à Pâques). */

function easterSunday(year: number): Date {
  // Meeus/Jones/Butcher Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function frenchHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  const fixed = [
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-08`,
    `${year}-07-14`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
  ]
  const movable = [
    ymd(addDays(easter, 1)), // Lundi de Pâques
    ymd(addDays(easter, 39)), // Ascension
    ymd(addDays(easter, 50)), // Lundi de Pentecôte
  ]
  return new Set([...fixed, ...movable])
}

const cache = new Map<number, Set<string>>()

export function isFrenchHoliday(dateStr: string): boolean {
  const year = Number(dateStr.slice(0, 4))
  if (!cache.has(year)) cache.set(year, frenchHolidays(year))
  return cache.get(year)!.has(dateStr)
}
