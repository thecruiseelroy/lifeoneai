import type { Exercise } from '../../data/types'

interface ExerciseTileProps {
  exercise: Exercise
  onClick: () => void
}

export function ExerciseTile({ exercise, onClick }: ExerciseTileProps) {
  const primary = exercise.primary_muscles?.slice(0, 2).join(', ') || '—'
  const equip = exercise.equipment?.length
    ? exercise.equipment.slice(0, 2).join(', ')
    : 'None'
  const desc = exercise.description
    ? exercise.description.slice(0, 80) + (exercise.description.length > 80 ? '…' : '')
    : ''

  return (
    <button
      type="button"
      className="exercise-tile"
      onClick={onClick}
      aria-label={`View details for ${exercise.name}`}
    >
      <div className="exercise-tile-header">
        <span className="exercise-tile-category">{exercise.category}</span>
      </div>
      <h3 className="exercise-tile-name">{exercise.name}</h3>
      {desc && <p className="exercise-tile-desc">{desc}</p>}
      <div className="exercise-tile-meta">
        <span className="exercise-tile-muscles" title="Primary muscles">
          {primary}
        </span>
        <span className="exercise-tile-equipment" title="Equipment">
          {equip}
        </span>
      </div>
    </button>
  )
}
