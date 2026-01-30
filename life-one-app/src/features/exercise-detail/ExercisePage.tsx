import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { SetEntry } from '../../data/types'
import { findExerciseBySlug } from '../../utils/slugify'
import { useExercises } from '../../hooks/useExercises'
import { useWorkoutLog } from '../workout-log/useWorkoutLog'
import { ExerciseDetailContent } from './ExerciseDetailContent'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ExerciseTabContent({
  exercise,
  todayLog,
  today,
  lastLog,
  addSet,
}: {
  exercise: import('../../data/types').Exercise
  todayLog: { sets: SetEntry[] }
  today: string
  lastLog: { date: string; sets: SetEntry[] } | null
  addSet: (date: string, set: SetEntry) => void
}) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault()
    const r = parseInt(reps, 10)
    if (Number.isNaN(r) || r < 1) return
    addSet(today, {
      reps: r,
      weight: weight.trim() ? parseFloat(weight) : undefined,
      note: note.trim() || undefined,
    })
    setReps('')
    setWeight('')
    setNote('')
  }

  return (
    <div className="exercise-page-content-inner">
      <div className="exercise-page-main">
        <ExerciseDetailContent exercise={exercise} />
      </div>
      <aside className="exercise-page-sidebar">
        <section className="exercise-page-section">
          <h3 className="exercise-detail-section-title">Today</h3>
          <div className="exercise-page-tile">
            <form className="exercise-page-add-set" onSubmit={handleAddSet}>
              <div className="exercise-page-add-set-row">
                <label>
                  Reps
                  <input
                    type="number"
                    min={1}
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="10"
                  />
                </label>
                <label>
                  Weight (kg)
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="—"
                  />
                </label>
              </div>
              <label className="exercise-page-note-label">
                Note
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for this set"
                  rows={2}
                />
              </label>
              <button type="submit" className="exercise-page-add-set-btn">
                Add set
              </button>
            </form>
            {todayLog.sets.length > 0 ? (
              <ul className="exercise-page-sets-list">
                {todayLog.sets.map((s, i) => (
                  <li key={i} className="exercise-page-set-item">
                    Set {i + 1}: {s.reps} reps
                    {s.weight != null && ` · ${s.weight} kg`}
                    {s.note && ` · ${s.note}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="exercise-page-empty-hint">No sets logged today yet.</p>
            )}
          </div>
        </section>

        {lastLog && (
          <section className="exercise-page-section">
            <h3 className="exercise-detail-section-title">Last time ({formatDate(lastLog.date)})</h3>
            <div className="exercise-page-tile">
              <ul className="exercise-page-sets-list">
                {lastLog.sets.map((s, i) => (
                  <li key={i} className="exercise-page-set-item">
                    Set {i + 1}: {s.reps} reps
                    {s.weight != null && ` · ${s.weight} kg`}
                    {s.note && ` · ${s.note}`}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}

function HistoryTabContent({
  entriesByDateDesc,
}: {
  entriesByDateDesc: { date: string; sets: SetEntry[] }[]
}) {
  if (entriesByDateDesc.length === 0) {
    return (
      <div className="exercise-page-history-empty">
        <p>No history yet.</p>
        <p className="exercise-page-empty-hint">Use the Exercise tab to log today&apos;s sets.</p>
      </div>
    )
  }
  return (
    <div className="exercise-page-history-list">
      {entriesByDateDesc.map((entry) => (
        <section key={entry.date} className="exercise-page-history-date-block">
          <h3 className="exercise-page-history-date">{formatDate(entry.date)}</h3>
          <ul className="exercise-page-sets-list">
            {entry.sets.map((s, i) => (
              <li key={i} className="exercise-page-set-item">
                Set {i + 1}: {s.reps} reps
                {s.weight != null && ` · ${s.weight} kg`}
                {s.note && ` · ${s.note}`}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function ExercisePage() {
  const { exerciseSlug } = useParams<{ exerciseSlug: string }>()
  const { data } = useExercises('', '', [], '')
  const [tab, setTab] = useState<'exercise' | 'history'>('exercise')

  const exercises = data?.exercises ?? []
  const exercise = exerciseSlug ? findExerciseBySlug(exercises, exerciseSlug) : undefined
  const workoutLog = useWorkoutLog(exercise?.name ?? '')

  const fallbackBreadcrumbs = getBreadcrumbItems(
    `/exercise/${exerciseSlug ?? ''}`,
    { exerciseSlug },
    {}
  )

  if (!exerciseSlug) {
    return (
      <PageLayout title="Exercise" breadcrumbs={fallbackBreadcrumbs} backLink={{ to: '/library', label: 'Back to Library' }}>
        <p>Missing exercise.</p>
        <Link to="/library">Back to Library</Link>
      </PageLayout>
    )
  }

  if (!data) {
    return (
      <PageLayout title="Exercise" breadcrumbs={fallbackBreadcrumbs} backLink={{ to: '/library', label: 'Back to Library' }}>
        <p>Loading…</p>
      </PageLayout>
    )
  }

  if (!exercise) {
    return (
      <PageLayout title="Exercise" breadcrumbs={fallbackBreadcrumbs} backLink={{ to: '/library', label: 'Back to Library' }}>
        <p>Exercise not found.</p>
        <Link to="/library">Back to Library</Link>
      </PageLayout>
    )
  }

  const breadcrumbs = getBreadcrumbItems(`/exercise/${exerciseSlug}`, { exerciseSlug }, { exerciseName: exercise.name })

  return (
    <PageLayout
      title={exercise.name}
      breadcrumbs={breadcrumbs}
      backLink={{ to: '/library', label: 'Back to Library' }}
      actions={<span className="exercise-detail-badge">{exercise.category}</span>}
    >
      <div className="exercise-page-tabs" role="tablist" aria-label="Exercise and history">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'exercise'}
          aria-controls="exercise-tab-panel"
          id="exercise-tab"
          className={`exercise-page-tab ${tab === 'exercise' ? 'active' : ''}`}
          onClick={() => setTab('exercise')}
        >
          Exercise
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          aria-controls="history-tab-panel"
          id="history-tab"
          className={`exercise-page-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>

      <div className="exercise-page-content">
        {tab === 'exercise' && workoutLog && (
          <div id="exercise-tab-panel" role="tabpanel" aria-labelledby="exercise-tab">
            <ExerciseTabContent
              exercise={exercise}
              todayLog={workoutLog.todayLog}
              today={workoutLog.today}
              lastLog={workoutLog.lastLog}
              addSet={workoutLog.addSet}
            />
          </div>
        )}
        {tab === 'history' && workoutLog && (
          <div id="history-tab-panel" role="tabpanel" aria-labelledby="history-tab">
            <HistoryTabContent entriesByDateDesc={workoutLog.entriesByDateDesc} />
          </div>
        )}
      </div>
    </PageLayout>
  )
}
