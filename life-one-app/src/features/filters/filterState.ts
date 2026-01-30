import { useCallback, useEffect, useState } from 'react'

const SEARCH_KEY = 'search'
const CATEGORY_KEY = 'category'
const EQUIPMENT_KEY = 'equipment'
const MUSCLE_KEY = 'muscle'

function getSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function readStringParam(params: URLSearchParams, key: string): string {
  return params.get(key) ?? ''
}

function readArrayParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key)
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function writeUrl(search: string, category: string, equipment: string[], muscleGroup: string) {
  const params = new URLSearchParams()
  if (search) params.set(SEARCH_KEY, search)
  if (category) params.set(CATEGORY_KEY, category)
  if (equipment.length) params.set(EQUIPMENT_KEY, equipment.join(','))
  if (muscleGroup) params.set(MUSCLE_KEY, muscleGroup)
  const qs = params.toString()
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  window.history.replaceState(null, '', url)
}

function getInitialState() {
  if (typeof window === 'undefined') {
    return { search: '', category: '', equipment: [] as string[], muscleGroup: '' }
  }
  const params = getSearchParams()
  return {
    search: readStringParam(params, SEARCH_KEY),
    category: readStringParam(params, CATEGORY_KEY),
    equipment: readArrayParam(params, EQUIPMENT_KEY),
    muscleGroup: readStringParam(params, MUSCLE_KEY),
  }
}

export function useFilterState() {
  const [search, setSearchState] = useState(() => getInitialState().search)
  const [category, setCategoryState] = useState(() => getInitialState().category)
  const [equipment, setEquipmentState] = useState<string[]>(() => getInitialState().equipment)
  const [muscleGroup, setMuscleGroupState] = useState(() => getInitialState().muscleGroup)

  const initFromUrl = useCallback(() => {
    const params = getSearchParams()
    setSearchState(readStringParam(params, SEARCH_KEY))
    setCategoryState(readStringParam(params, CATEGORY_KEY))
    setEquipmentState(readArrayParam(params, EQUIPMENT_KEY))
    setMuscleGroupState(readStringParam(params, MUSCLE_KEY))
  }, [])

  useEffect(() => {
    writeUrl(search, category, equipment, muscleGroup)
  }, [search, category, equipment, muscleGroup])

  useEffect(() => {
    const onPopState = () => initFromUrl()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [initFromUrl])

  const setSearch = useCallback((v: string) => setSearchState(v), [])
  const setCategory = useCallback((v: string) => setCategoryState(v), [])
  const setEquipment = useCallback((v: string[]) => setEquipmentState(v), [])
  const setMuscleGroup = useCallback((v: string) => setMuscleGroupState(v), [])

  const clearFilters = useCallback(() => {
    setSearchState('')
    setCategoryState('')
    setEquipmentState([])
    setMuscleGroupState('')
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  return {
    search,
    setSearch,
    category,
    setCategory,
    equipment,
    setEquipment,
    muscleGroup,
    setMuscleGroup,
    clearFilters,
  }
}
