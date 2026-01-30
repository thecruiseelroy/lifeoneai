import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'
import type { Food, MealFoodEntry } from '../../data/types'
import { useMealLog, todayString } from './useMealLog'
import { useFoods } from '../../hooks/useFoods'
import { useProfile } from '../../context/ProfileContext'
import { apiGetFood } from '../../api/client'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const SEARCH_DEBOUNCE_MS = 300

function AddFoodToMealModal({
  date,
  onClose,
  onAdd,
}: {
  date: string
  onClose: () => void
  onAdd: (body: { foodId?: number; foodName?: string; amountGrams: number; note?: string }) => void
}) {
  const [searchLocal, setSearchLocal] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [amountGrams, setAmountGrams] = useState('100')
  const [note, setNote] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(searchLocal.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchLocal])

  const { foods, loading } = useFoods(searchDebounced, 50, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amountGrams)
    if (Number.isNaN(amt) || amt <= 0) return
    if (selectedFood) {
      onAdd({
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        amountGrams: amt,
        note: note.trim() || undefined,
      })
    }
    onClose()
  }

  return (
    <div className="program-modal-overlay add-exercise-modal-overlay" onClick={onClose}>
      <div
        className="program-modal add-exercise-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-meal-food-title"
        aria-modal="true"
      >
        <div className="add-exercise-modal-header">
          <h2 id="add-meal-food-title" className="program-modal-title">
            Log food for {formatDate(date)}
          </h2>
          <button type="button" className="add-exercise-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-exercise-modal-panel">
          <div className="add-exercise-modal-search">
            <input
              type="search"
              className="search-bar-input"
              value={searchLocal}
              onChange={(e) => {
                setSearchLocal(e.target.value)
                if (!e.target.value.trim()) setSelectedFood(null)
              }}
              placeholder="Search foods…"
              aria-label="Search foods"
              autoComplete="off"
            />
          </div>
          <ul className="add-exercise-modal-list" role="list">
            {loading && searchDebounced && <li className="add-exercise-modal-list-item">Loading…</li>}
            {!loading &&
              foods.slice(0, 30).map((f: Food) => (
                <li key={`${f.id}-${f.name}`} className="add-exercise-modal-list-item">
                  <button
                    type="button"
                    className={`add-exercise-modal-list-label add-exercise-modal-list-btn ${selectedFood?.id === f.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFood(f)}
                  >
                    <span className="add-exercise-modal-list-name">{f.name}</span>
                    <span className="add-exercise-modal-list-meta">
                      {typeof f.calories === 'number' ? f.calories.toFixed(0) : f.calories} kcal/100g
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          {selectedFood && (
            <>
              <p className="meals-add-selected">Selected: {selectedFood.name}</p>
              <label className="program-modal-label">
                Amount (grams)
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="program-modal-input"
                  value={amountGrams}
                  onChange={(e) => setAmountGrams(e.target.value)}
                  placeholder="100"
                />
              </label>
              <label className="program-modal-label">
                Note (optional)
                <input
                  type="text"
                  className="program-modal-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. breakfast"
                />
              </label>
            </>
          )}
          <div className="add-exercise-modal-actions">
            <button type="button" className="program-modal-btn program-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="program-modal-btn program-modal-btn-primary"
              disabled={!selectedFood}
            >
              Add to log
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MealFoodRow({
  entry,
  onRemove,
}: {
  entry: MealFoodEntry
  onRemove: () => void
}) {
  const [food, setFood] = useState<Food | null>(null)
  const displayName = entry.foodName ?? (food ? food.name : `Food #${entry.foodId}`)

  useEffect(() => {
    if (entry.foodId != null) {
      apiGetFood(entry.foodId).then((res) => res.food && setFood(res.food as Food))
    }
  }, [entry.foodId])

  return (
    <li className="meals-log-item">
      <span className="meals-log-item-name">{displayName}</span>
      <span className="meals-log-item-amount">{entry.amountGrams}g</span>
      {entry.note && <span className="meals-log-item-note">{entry.note}</span>}
      <button
        type="button"
        className="meals-log-item-remove"
        onClick={onRemove}
        aria-label={`Remove ${displayName}`}
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}

export function MealsPage() {
  const { profileName } = useProfile()
  const [date, setDate] = useState(todayString())
  const [addFoodOpen, setAddFoodOpen] = useState(false)

  const { mealLog, loading, error, addFood, removeFood } = useMealLog(date)

  const goPrev = useCallback(() => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().slice(0, 10))
  }, [date])

  const goNext = useCallback(() => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().slice(0, 10))
  }, [date])

  const goToday = useCallback(() => {
    setDate(todayString())
  }, [])

  const today = todayString()
  const isToday = date === today

  const breadcrumbs = getBreadcrumbItems('/meals', {})

  if (!profileName) {
    return (
      <PageLayout title="Meals" breadcrumbs={breadcrumbs}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <div className="programs-canvas-empty">
              <p>Select a profile to log meals.</p>
              <p className="programs-canvas-empty-hint">
                Use the profile selector in the header to choose or create a profile.
              </p>
            </div>
          </main>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Meals" breadcrumbs={breadcrumbs}>
      <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <div className="meals-detail-view">
              <div className="meals-date-bar">
                <button
                  type="button"
                  className="meals-date-btn"
                  onClick={goPrev}
                  aria-label="Previous day"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="meals-date-display">
                  <time dateTime={date}>{formatDate(date)}</time>
                  {!isToday && (
                    <button type="button" className="meals-date-today" onClick={goToday}>
                      Go to today
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="meals-date-btn"
                  onClick={goNext}
                  aria-label="Next day"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {error && (
                <div className="message message-error" role="alert">
                  {error}
                </div>
              )}
              {loading && <p className="programs-canvas-loading">Loading meal log…</p>}

              {!loading && (
                <>
                  <div className="meals-log-section">
                    <div className="meals-log-header">
                      <h2 className="meals-log-title">
                        <UtensilsCrossed size={20} />
                        What you ate
                      </h2>
                      <button
                        type="button"
                        className="programs-canvas-new-btn"
                        onClick={() => setAddFoodOpen(true)}
                        aria-label="Add food"
                      >
                        <Plus size={18} />
                        Add food
                      </button>
                    </div>
                    {mealLog && mealLog.foods.length === 0 && (
                      <p className="meals-log-empty">
                        No foods logged for this day. Click &quot;Add food&quot; to log what you ate.
                      </p>
                    )}
                    {mealLog && mealLog.foods.length > 0 && (
                      <ul className="meals-log-list" role="list">
                        {mealLog.foods.map((entry) => (
                          <MealFoodRow
                            key={entry.id}
                            entry={entry}
                            onRemove={() => void removeFood(entry.id)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

      {addFoodOpen && (
        <AddFoodToMealModal
          date={date}
          onClose={() => setAddFoodOpen(false)}
          onAdd={async (body) => {
            await addFood(body)
            setAddFoodOpen(false)
          }}
        />
      )}
    </PageLayout>
  )
}
