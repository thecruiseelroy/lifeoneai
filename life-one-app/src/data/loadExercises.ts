import type { ExercisesData } from './types'

const EXERCISES_URL = '/exercises.json'

export async function loadExercises(): Promise<ExercisesData> {
  const res = await fetch(EXERCISES_URL)
  if (!res.ok) throw new Error(`Failed to load exercises: ${res.status}`)
  const data = (await res.json()) as ExercisesData
  if (!data.exercises || !Array.isArray(data.exercises)) {
    throw new Error('Invalid exercises data')
  }
  return data
}
