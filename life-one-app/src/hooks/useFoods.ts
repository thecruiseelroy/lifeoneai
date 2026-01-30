import { useCallback, useEffect, useState } from 'react'
import type { Food } from '../data/types'
import { apiGetFood, apiListFoods } from '../api/client'

export function useFoods(search: string, limit = 100, offset = 0) {
  const [foods, setFoods] = useState<Food[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFoods = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiListFoods(search.trim() || undefined, limit, offset)
      setFoods(res.foods as Food[])
      setTotalCount(res.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load foods')
      setFoods([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [search, limit, offset])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  const getFood = useCallback(async (id: string | number): Promise<Food | null> => {
    try {
      const res = await apiGetFood(id)
      return res.food as Food | null
    } catch {
      return null
    }
  }, [])

  return { foods, totalCount, loading, error, getFood, refresh: fetchFoods }
}
