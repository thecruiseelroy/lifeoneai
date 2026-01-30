export const DAY_ABBREVS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function formatDaysDisplay(days: string[]): string {
  if (days.length === 0) return '—'
  const cleaned = days
    .map((d) => {
      try {
        return decodeURIComponent(String(d).trim())
      } catch {
        return String(d).trim()
      }
    })
    .filter(Boolean)
  const validDays = cleaned.filter((d) => DAY_ABBREVS.includes(d))
  if (validDays.length === 0) return '—'
  return validDays.join(', ')
}
