import { useCallback, useState } from 'react'
import type { Exercise } from '../../data/types'

export function useDetailState() {
  const [selected, setSelected] = useState<Exercise | null>(null)

  const open = useCallback((exercise: Exercise) => {
    setSelected(exercise)
  }, [])

  const close = useCallback(() => {
    setSelected(null)
  }, [])

  return { selected, open, close }
}
