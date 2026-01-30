import type { WorkoutLogEntry, SetEntry } from '../../data/types'

const STORAGE_KEY = 'life-one-workout-logs'

function loadAll(): WorkoutLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WorkoutLogEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAll(entries: WorkoutLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getLogsForExercise(exerciseName: string): WorkoutLogEntry[] {
  return loadAll().filter((e) => e.exerciseName === exerciseName)
}

export function getLogForDate(exerciseName: string, date: string): WorkoutLogEntry | undefined {
  return loadAll().find((e) => e.exerciseName === exerciseName && e.date === date)
}

export function getOrCreateLogForDate(exerciseName: string, date: string): WorkoutLogEntry {
  const all = loadAll()
  const existing = all.find((e) => e.exerciseName === exerciseName && e.date === date)
  if (existing) return existing
  const entry: WorkoutLogEntry = { exerciseName, date, sets: [] }
  all.push(entry)
  saveAll(all)
  return entry
}

export function addSet(exerciseName: string, date: string, set: SetEntry): void {
  const all = loadAll()
  let entry = all.find((e) => e.exerciseName === exerciseName && e.date === date)
  if (!entry) {
    entry = { exerciseName, date, sets: [] }
    all.push(entry)
  }
  entry.sets.push({ ...set })
  saveAll(all)
}

export function updateSet(
  exerciseName: string,
  date: string,
  setIndex: number,
  set: Partial<SetEntry>
): void {
  const all = loadAll()
  const entry = all.find((e) => e.exerciseName === exerciseName && e.date === date)
  if (!entry || setIndex < 0 || setIndex >= entry.sets.length) return
  entry.sets[setIndex] = { ...entry.sets[setIndex], ...set }
  saveAll(all)
}

export function getLastDate(exerciseName: string): string | null {
  const logs = getLogsForExercise(exerciseName)
  if (logs.length === 0) return null
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  return sorted[0].date
}

/** Today in YYYY-MM-DD */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}
