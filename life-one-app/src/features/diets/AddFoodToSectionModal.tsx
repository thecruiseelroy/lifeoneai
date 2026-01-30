import { useState, useEffect, useCallback } from 'react'
import { useFoods } from '../../hooks/useFoods'
import type { Food } from '../../data/types'

interface AddFoodToSectionModalProps {
  dietId: string
  sectionId: string
  existingFoodNames: string[]
  onClose: () => void
  onAdd: (foodNames: string[]) => void
}

const SEARCH_DEBOUNCE_MS = 300

export function AddFoodToSectionModal({
  dietId: _dietId,
  sectionId: _sectionId,
  existingFoodNames,
  onClose,
  onAdd,
}: AddFoodToSectionModalProps) {
  const [searchLocal, setSearchLocal] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(searchLocal), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchLocal])

  const { foods, loading } = useFoods(searchDebounced, 80, 0)
  const existingSet = new Set(existingFoodNames)

  const toggle = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const handleAdd = () => {
    const names = Array.from(selected).filter((n) => !existingSet.has(n))
    if (names.length > 0) onAdd(names)
    onClose()
  }

  return (
    <div className="program-modal-overlay add-exercise-modal-overlay" onClick={onClose}>
      <div
        className="program-modal add-exercise-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-food-modal-title"
        aria-modal="true"
      >
        <div className="add-exercise-modal-header">
          <h2 id="add-food-modal-title" className="program-modal-title">
            Add food to section
          </h2>
          <button
            type="button"
            className="add-exercise-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="add-exercise-modal-search">
          <input
            type="search"
            className="search-bar-input"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            placeholder="Search foods…"
            aria-label="Search foods"
            autoComplete="off"
          />
        </div>

        <ul className="add-exercise-modal-list" role="list">
          {loading && searchDebounced && (
            <li className="add-exercise-modal-list-item">Loading…</li>
          )}
          {!loading && foods.slice(0, 60).map((f: Food) => (
            <li key={`${f.id}-${f.name}`} className="add-exercise-modal-list-item">
              <label className="add-exercise-modal-list-label">
                <input
                  type="checkbox"
                  checked={selected.has(f.name)}
                  onChange={() => toggle(f.name)}
                  disabled={existingSet.has(f.name)}
                />
                <span className="add-exercise-modal-list-name">{f.name}</span>
                <span className="add-exercise-modal-list-meta">
                  {typeof f.calories === 'number' ? f.calories.toFixed(0) : f.calories} kcal · P:{f.proteins} F:{f.fat} C:{f.carbohydrates}
                </span>
                {existingSet.has(f.name) && (
                  <span className="add-exercise-modal-list-badge">Already in section</span>
                )}
              </label>
            </li>
          ))}
        </ul>
        {!loading && searchDebounced && foods.length === 0 && (
          <p className="add-exercise-modal-hint">No foods match your search.</p>
        )}
        {!searchDebounced && (
          <p className="add-exercise-modal-hint">Type to search foods from the library.</p>
        )}
        <div className="add-exercise-modal-actions">
          <button type="button" className="program-modal-btn program-modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="program-modal-btn program-modal-btn-primary"
            onClick={handleAdd}
            disabled={selected.size === 0}
          >
            Add selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}
