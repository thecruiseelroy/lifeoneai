import { useCallback, useEffect, useState } from 'react'
import type { MealLogEntry, MealFoodEntry } from '../../data/types'
import { useProfile } from '../../context/ProfileContext'
import {
  apiAddFoodToMealLog,
  apiCreateMealLog,
  apiDeleteMealFood,
  apiGetMealLogForDate,
  apiUpdateMealFood,
} from '../../api/client'

/** Today in YYYY-MM-DD */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function toMealFoodEntry(f: {
  id: string
  foodId?: number
  foodName?: string
  amountGrams: number
  note?: string | null
}): MealFoodEntry {
  return {
    id: f.id,
    foodId: f.foodId,
    foodName: f.foodName,
    amountGrams: f.amountGrams,
    note: f.note ?? undefined,
  }
}

function toMealLogEntry(res: { date: string; foods: Array<{ id: string; foodId?: number; foodName?: string; amountGrams: number; note?: string | null }> }): MealLogEntry {
  return {
    date: res.date,
    foods: res.foods.map(toMealFoodEntry),
  }
}

/** Hook for meal log state for one date. Uses API when profile is set. */
export function useMealLog(date: string) {
  const { profileName } = useProfile()
  const [mealLog, setMealLog] = useState<MealLogEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!profileName) {
      setMealLog(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      try {
        const res = await apiGetMealLogForDate(profileName, date)
        setMealLog(toMealLogEntry(res))
      } catch (e: unknown) {
        if (e instanceof Error && e.message?.includes('404')) {
          const created = await apiCreateMealLog(profileName, date)
          setMealLog(toMealLogEntry(created))
        } else {
          throw e
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meal log')
      setMealLog({ date, foods: [] })
    } finally {
      setLoading(false)
    }
  }, [profileName, date])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addFood = useCallback(
    async (body: { foodId?: number; foodName?: string; amountGrams?: number; note?: string }) => {
      if (!profileName) return
      try {
        const res = await apiAddFoodToMealLog(profileName, date, body)
        setMealLog(toMealLogEntry(res))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add food')
      }
    },
    [profileName, date]
  )

  const updateFood = useCallback(
    async (foodEntryId: string, body: { amountGrams?: number; note?: string }) => {
      if (!profileName) return
      try {
        const res = await apiUpdateMealFood(profileName, foodEntryId, body)
        setMealLog(toMealLogEntry(res))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update food')
      }
    },
    [profileName]
  )

  const removeFood = useCallback(
    async (foodEntryId: string) => {
      if (!profileName) return
      try {
        const res = await apiDeleteMealFood(profileName, foodEntryId)
        setMealLog(toMealLogEntry(res))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to remove food')
      }
    },
    [profileName]
  )

  return {
    mealLog,
    loading,
    error,
    addFood,
    updateFood,
    removeFood,
    refresh,
  }
}
