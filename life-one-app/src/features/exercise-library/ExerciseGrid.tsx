import type { Exercise } from '../../data/types'
import { ExerciseTile } from './ExerciseTile'

interface ExerciseGridProps {
  exercises: Exercise[]
  totalCount: number
  onSelectExercise: (exercise: Exercise) => void
  onClearFilters?: () => void
}

export function ExerciseGrid({
  exercises,
  totalCount,
  onSelectExercise,
  onClearFilters,
}: ExerciseGridProps) {
  if (exercises.length === 0) {
    return (
      <div className="exercise-grid-empty" role="status">
        <p>No exercises match your filters.</p>
        <p className="exercise-grid-empty-hint">
          Try clearing search and filters to see all {totalCount} exercises.
        </p>
        {onClearFilters && (
          <button
            type="button"
            className="exercise-grid-empty-btn"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="exercise-grid-wrapper">
      <p className="exercise-grid-count" aria-live="polite">
        Showing {exercises.length} of {totalCount} exercises
      </p>
      <div className="exercise-grid" role="list">
        {exercises.map((ex) => (
          <div key={ex.name} className="exercise-grid-item" role="listitem">
            <ExerciseTile
              exercise={ex}
              onClick={() => onSelectExercise(ex)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
