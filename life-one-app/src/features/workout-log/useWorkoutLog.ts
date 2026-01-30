import { useCallback, useEffect, useState } from 'react'
import type { SetEntry, WorkoutLogEntry } from '../../data/types'
import { useProfile } from '../../context/ProfileContext'
import {
  apiAddSet,
  apiGetLastDate,
  apiGetLogForDate,
  apiGetOrCreateLog,
  apiGetWorkoutLogs,
  apiUpdateSet,
} from '../../api/client'
import {
  addSet as storageAddSet,
  getLogForDate,
  getLogsForExercise,
  getOrCreateLogForDate,
  getLastDate,
  todayString,
  updateSet as storageUpdateSet,
} from './workoutLogStorage'

/** Hook for workout log state for one exercise. Uses API when profile is set; localStorage otherwise. */
export function useWorkoutLog(exerciseName: string) {
  const { profileName } = useProfile()
  const [logsForExercise, setLogsForExercise] = useState<WorkoutLogEntry[]>([])
  const [todayLog, setTodayLog] = useState<WorkoutLogEntry>({
    exerciseName,
    date: todayString(),
    sets: [],
  })
  const [lastDate, setLastDate] = useState<string | null>(null)
  const [lastLog, setLastLog] = useState<WorkoutLogEntry | null>(null)
  const [loading, setLoading] = useState(false)

  const today = todayString()

  const refresh = useCallback(async () => {
    if (profileName) {
      setLoading(true)
      try {
        const logs = await apiGetWorkoutLogs(profileName, exerciseName)
        const entries: WorkoutLogEntry[] = logs.map((l) => ({
          exerciseName: l.exerciseName,
          date: l.date,
          sets: l.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            note: s.note,
          })),
        }))
        setLogsForExercise(entries)
        const todayEntry = entries.find((e) => e.date === today)
        if (todayEntry) {
          setTodayLog(todayEntry)
        } else {
          const created = await apiGetOrCreateLog(profileName, exerciseName, today)
          setTodayLog({
            exerciseName: created.exerciseName,
            date: created.date,
            sets: (created.sets || []).map((s) => ({ reps: s.reps, weight: s.weight, note: s.note })),
          })
        }
        const { date: last } = await apiGetLastDate(profileName, exerciseName)
        setLastDate(last)
        if (last && last !== today) {
          const lastEntry = await apiGetLogForDate(profileName, exerciseName, last)
          setLastLog({
            exerciseName: lastEntry.exerciseName,
            date: lastEntry.date,
            sets: (lastEntry.sets || []).map((s) => ({ reps: s.reps, weight: s.weight, note: s.note })),
          })
        } else {
          setLastLog(null)
        }
      } catch {
        setLogsForExercise([])
        setTodayLog({ exerciseName, date: today, sets: [] })
        setLastDate(null)
        setLastLog(null)
      } finally {
        setLoading(false)
      }
    } else {
      const logs = getLogsForExercise(exerciseName)
      setLogsForExercise(logs)
      const todayEntry = getLogForDate(exerciseName, today) ?? getOrCreateLogForDate(exerciseName, today)
      setTodayLog(todayEntry)
      const ld = getLastDate(exerciseName)
      setLastDate(ld)
      setLastLog(
        ld && ld !== today ? (getLogForDate(exerciseName, ld) ?? null) : null
      )
    }
  }, [profileName, exerciseName, today])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addSet = useCallback(
    async (date: string, set: SetEntry) => {
      if (profileName) {
        await apiAddSet(profileName, exerciseName, date, {
          reps: set.reps,
          weight: set.weight,
          note: set.note,
        })
        await refresh()
      } else {
        storageAddSet(exerciseName, date, set)
        refresh()
      }
    },
    [profileName, exerciseName, refresh]
  )

  const updateSet = useCallback(
    async (date: string, setIndex: number, set: Partial<SetEntry>) => {
      if (profileName) {
        await apiUpdateSet(profileName, exerciseName, date, setIndex, set)
        await refresh()
      } else {
        storageUpdateSet(exerciseName, date, setIndex, set)
        refresh()
      }
    },
    [profileName, exerciseName, refresh]
  )

  const entriesByDateDesc = [...logsForExercise].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return {
    logsForExercise,
    todayLog,
    today,
    lastDate,
    lastLog,
    entriesByDateDesc,
    addSet,
    updateSet,
    loading,
  }
}
