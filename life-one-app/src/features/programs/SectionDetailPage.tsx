import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { Exercise } from '../../data/types'
import { slugify } from '../../utils/slugify'
import { usePrograms } from './usePrograms'
import { useExercises } from '../../hooks/useExercises'
import { formatDaysDisplay } from './formatDays'
import { ExerciseTile } from '../exercise-library/ExerciseTile'
import { AddExerciseToSectionModal } from './AddExerciseToSectionModal'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const n = name.trim()
  return exercises.find((ex) => ex.name === n || ex.name.trim() === n)
}

export function SectionDetailPage() {
  const { programId, sectionId } = useParams<{ programId: string; sectionId: string }>()
  const navigate = useNavigate()
  const { getProgram, addExercisesToSection } = usePrograms()
  const { data: exercisesData } = useExercises('', '', [], '')
  const exercises = exercisesData?.exercises ?? []

  const [addExerciseOpen, setAddExerciseOpen] = useState(false)

  const program = programId ? getProgram(programId) : undefined
  const section = program?.sections.find((s) => s.id === sectionId)

  const exercisesByName = useMemo(() => {
    const map = new Map<string, Exercise>()
    if (!section) return map
    section.exerciseNames.forEach((name) => {
      const ex = findExerciseByName(exercises, name)
      if (ex) map.set(name, ex)
    })
    return map
  }, [section, exercises])

  if (!programId || !sectionId) {
    return (
      <PageLayout title="Section" breadcrumbs={[{ label: 'Programs', href: '/programs' }]} backLink={{ to: '/programs', label: 'Back to Programs' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Invalid URL.</p>
            <Link to="/programs">Back to Programs</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  if (!program) {
    return (
      <PageLayout title="Section" breadcrumbs={[{ label: 'Programs', href: '/programs' }]} backLink={{ to: '/programs', label: 'Back to Programs' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Program not found.</p>
            <Link to="/programs">Back to Programs</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  if (!section) {
    return (
      <PageLayout
        title="Section"
        breadcrumbs={getBreadcrumbItems(`/programs/${programId}`, { programId }, { programName: program.name })}
        backLink={{ to: `/programs/${programId}`, label: `Back to ${program.name}` }}
      >
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Section not found.</p>
            <Link to={`/programs/${programId}`}>Back to {program.name}</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  const daysText = formatDaysDisplay(section.days)
  const breadcrumbs = getBreadcrumbItems(
    `/programs/${programId}/sections/${sectionId}`,
    { programId, sectionId },
    { programName: program.name, sectionName: section.name }
  )

  return (
    <PageLayout
      title={section.name}
      breadcrumbs={breadcrumbs}
      backLink={{ to: `/programs/${programId}`, label: `Back to ${program.name}` }}
      actions={
        <button
          type="button"
          className="programs-canvas-new-btn"
          onClick={() => setAddExerciseOpen(true)}
          aria-label="Add exercise"
        >
          <Plus size={20} />
          Add exercise
        </button>
      }
    >
      <div className="programs-canvas-layout">
        <main className="programs-canvas-main">
          <div className="programs-detail-view">
            {daysText !== '—' && (
              <p className="programs-section-days-subtitle">Days: {daysText}</p>
            )}
            <div className="programs-exercise-grid-wrap">
              <div className="programs-exercise-grid-header">
                <h3 className="programs-exercise-grid-title">{section.name} — Exercises</h3>
              </div>
              {section.exerciseNames.length === 0 ? (
                <p className="programs-exercise-grid-empty">
                  No exercises in this section yet. Click &quot;Add exercise&quot; to add some.
                </p>
              ) : (
                <div className="programs-exercise-grid" role="list">
                  {section.exerciseNames.map((name) => {
                    const exercise = exercisesByName.get(name)
                    if (exercise) {
                      return (
                        <div key={name} className="programs-exercise-grid-item">
                          <ExerciseTile
                            exercise={exercise}
                            onClick={() => navigate(`/exercise/${slugify(exercise.name)}`)}
                          />
                        </div>
                      )
                    }
                    return (
                      <Link
                        key={name}
                        to={`/exercise/${slugify(name)}`}
                        className="programs-exercise-grid-item programs-exercise-tile-fallback"
                      >
                        <div className="exercise-tile">
                          <div className="exercise-tile-header">
                            <span className="exercise-tile-category">Custom</span>
                          </div>
                          <h3 className="exercise-tile-name">{name}</h3>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {addExerciseOpen && (
        <AddExerciseToSectionModal
          programId={programId}
          sectionId={sectionId}
          existingExerciseNames={section.exerciseNames}
          onClose={() => setAddExerciseOpen(false)}
          onAdd={async (names) => {
            await addExercisesToSection(programId, sectionId, names, true)
            setAddExerciseOpen(false)
          }}
        />
      )}
    </PageLayout>
  )
}
