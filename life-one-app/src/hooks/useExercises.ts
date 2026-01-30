import { useEffect, useMemo, useState } from 'react'
import { loadExercises } from '../data/loadExercises'
import type { Exercise, ExercisesData } from '../data/types'

function matchesSearch(ex: Exercise, q: string): boolean {
  if (!q.trim()) return true
  const lower = q.toLowerCase().trim()
  const name = ex.name.toLowerCase()
  const desc = (ex.description ?? '').toLowerCase()
  const primary = (ex.primary_muscles ?? []).join(' ').toLowerCase()
  const secondary = (ex.secondary_muscles ?? []).join(' ').toLowerCase()
  const aliases = (ex.aliases ?? []).join(' ').toLowerCase()
  return (
    name.includes(lower) ||
    desc.includes(lower) ||
    primary.includes(lower) ||
    secondary.includes(lower) ||
    aliases.includes(lower)
  )
}

function filterExercises(
  exercises: Exercise[],
  data: ExercisesData | null,
  search: string,
  category: string,
  equipment: string[],
  muscleGroup: string
): Exercise[] {
  let list = exercises

  if (search.trim()) {
    list = list.filter((ex) => matchesSearch(ex, search))
  }

  if (category) {
    list = list.filter((ex) => ex.category === category)
  }

  if (equipment.length > 0) {
    list = list.filter((ex) =>
      ex.equipment.some((e) => equipment.includes(e))
    )
  }

  if (muscleGroup && data?.muscle_groups?.[muscleGroup]) {
    const muscles = data.muscle_groups[muscleGroup]
    list = list.filter(
      (ex) =>
        ex.primary_muscles.some((m) => muscles.includes(m)) ||
        ex.secondary_muscles.some((m) => muscles.includes(m))
    )
  }

  return list
}

export function useExercises(
  search: string,
  category: string,
  equipment: string[],
  muscleGroup: string
) {
  const [data, setData] = useState<ExercisesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadExercises()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return filterExercises(
      data.exercises,
      data,
      search,
      category,
      equipment,
      muscleGroup
    )
  }, [data, search, category, equipment, muscleGroup])

  return { data, filtered, loading, error }
}
