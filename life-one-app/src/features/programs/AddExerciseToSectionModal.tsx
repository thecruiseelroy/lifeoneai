import { useState } from 'react'
import { SearchBar } from '../search/SearchBar'
import { useExercises } from '../../hooks/useExercises'
import { usePrograms } from './usePrograms'
import type { Exercise } from '../../data/types'

interface AddExerciseToSectionModalProps {
  programId: string
  sectionId: string
  existingExerciseNames: string[]
  onClose: () => void
  onAdd: (exerciseNames: string[]) => void
}

type Tab = 'library' | 'program'

export function AddExerciseToSectionModal({
  programId,
  sectionId: _sectionId,
  existingExerciseNames,
  onClose,
  onAdd,
}: AddExerciseToSectionModalProps) {
  const [tab, setTab] = useState<Tab>('library')
  const [librarySearch, setLibrarySearch] = useState('')
  const [selectedLibrary, setSelectedLibrary] = useState<Set<string>>(new Set())
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedFromProgram, setSelectedFromProgram] = useState<Set<string>>(new Set())

  const { filtered: libraryExercises } = useExercises(
    librarySearch,
    '',
    [],
    ''
  )
  const { programs, getProgram } = usePrograms()

  const selectedProgram = selectedProgramId ? getProgram(selectedProgramId) : null
  const selectedSection = selectedProgram?.sections.find((s) => s.id === selectedSectionId)
  const sectionExerciseNames = selectedSection?.exerciseNames ?? []
  const existingSet = new Set(existingExerciseNames)

  const toggleLibrary = (name: string) => {
    setSelectedLibrary((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleFromProgram = (name: string) => {
    setSelectedFromProgram((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleAddFromLibrary = () => {
    const names = Array.from(selectedLibrary).filter((n) => !existingSet.has(n))
    if (names.length > 0) onAdd(names)
    onClose()
  }

  const handleAddFromProgram = () => {
    const names = Array.from(selectedFromProgram).filter((n) => !existingSet.has(n))
    if (names.length > 0) onAdd(names)
    onClose()
  }

  const otherPrograms = programs.filter((p) => p.id !== programId)

  return (
    <div className="program-modal-overlay add-exercise-modal-overlay" onClick={onClose}>
      <div
        className="program-modal add-exercise-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-exercise-modal-title"
        aria-modal="true"
      >
        <div className="add-exercise-modal-header">
          <h2 id="add-exercise-modal-title" className="program-modal-title">
            Add exercise to section
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

        <div className="add-exercise-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'library'}
            aria-controls="add-exercise-library-panel"
            id="add-exercise-tab-library"
            className={`add-exercise-modal-tab ${tab === 'library' ? 'active' : ''}`}
            onClick={() => setTab('library')}
          >
            From library
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'program'}
            aria-controls="add-exercise-program-panel"
            id="add-exercise-tab-program"
            className={`add-exercise-modal-tab ${tab === 'program' ? 'active' : ''}`}
            onClick={() => setTab('program')}
          >
            From program
          </button>
        </div>

        {tab === 'library' && (
          <div
            id="add-exercise-library-panel"
            role="tabpanel"
            aria-labelledby="add-exercise-tab-library"
            className="add-exercise-modal-panel"
          >
            <div className="add-exercise-modal-search">
              <SearchBar
                value={librarySearch}
                onChange={setLibrarySearch}
                placeholder="Search exercises…"
              />
            </div>
            <ul className="add-exercise-modal-list" role="list">
              {libraryExercises.slice(0, 50).map((ex: Exercise) => (
                <li key={ex.name} className="add-exercise-modal-list-item">
                  <label className="add-exercise-modal-list-label">
                    <input
                      type="checkbox"
                      checked={selectedLibrary.has(ex.name)}
                      onChange={() => toggleLibrary(ex.name)}
                      disabled={existingSet.has(ex.name)}
                    />
                    <span className="add-exercise-modal-list-name">{ex.name}</span>
                    {existingSet.has(ex.name) && (
                      <span className="add-exercise-modal-list-badge">Already in section</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            {libraryExercises.length > 50 && (
              <p className="add-exercise-modal-hint">
                Showing first 50. Refine search to find more.
              </p>
            )}
            <div className="add-exercise-modal-actions">
              <button type="button" className="program-modal-btn program-modal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="program-modal-btn program-modal-btn-primary"
                onClick={handleAddFromLibrary}
                disabled={selectedLibrary.size === 0}
              >
                Add selected ({selectedLibrary.size})
              </button>
            </div>
          </div>
        )}

        {tab === 'program' && (
          <div
            id="add-exercise-program-panel"
            role="tabpanel"
            aria-labelledby="add-exercise-tab-program"
            className="add-exercise-modal-panel"
          >
            <div className="add-exercise-modal-fields">
              <label className="program-modal-label">
                Program
                <select
                  className="program-modal-input program-modal-select"
                  value={selectedProgramId ?? ''}
                  onChange={(e) => {
                    setSelectedProgramId(e.target.value || null)
                    setSelectedSectionId(null)
                    setSelectedFromProgram(new Set())
                  }}
                >
                  <option value="">Select program</option>
                  {otherPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="program-modal-label">
                Section
                <select
                  className="program-modal-input program-modal-select"
                  value={selectedSectionId ?? ''}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value || null)
                    setSelectedFromProgram(new Set())
                  }}
                  disabled={!selectedProgram}
                >
                  <option value="">Select section</option>
                  {selectedProgram?.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {sectionExerciseNames.length > 0 && (
              <ul className="add-exercise-modal-list" role="list">
                {sectionExerciseNames.map((name) => (
                  <li key={name} className="add-exercise-modal-list-item">
                    <label className="add-exercise-modal-list-label">
                      <input
                        type="checkbox"
                        checked={selectedFromProgram.has(name)}
                        onChange={() => toggleFromProgram(name)}
                        disabled={existingSet.has(name)}
                      />
                      <span className="add-exercise-modal-list-name">{name}</span>
                      {existingSet.has(name) && (
                        <span className="add-exercise-modal-list-badge">Already in section</span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {selectedSection && sectionExerciseNames.length === 0 && (
              <p className="add-exercise-modal-empty">This section has no exercises.</p>
            )}
            <div className="add-exercise-modal-actions">
              <button type="button" className="program-modal-btn program-modal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="program-modal-btn program-modal-btn-primary"
                onClick={handleAddFromProgram}
                disabled={selectedFromProgram.size === 0}
              >
                Add selected ({selectedFromProgram.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
