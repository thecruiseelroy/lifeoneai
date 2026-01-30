import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Dumbbell, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'
import type { ProgramSection } from '../../data/types'
import { usePrograms } from './usePrograms'
import { formatDaysDisplay, DAY_ABBREVS } from './formatDays'
import { AddSectionModal } from './AddSectionModal'

function EditSectionInline({
  section,
  onSave,
  onCancel,
}: {
  section: ProgramSection
  onSave: (name: string, description: string, days: string[]) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(section.name)
  const [description, setDescription] = useState(section.description)
  const [days, setDays] = useState<string[]>(section.days)

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed, description.trim(), days)
  }

  return (
    <form onSubmit={handleSubmit} className="program-panel-edit-section-form">
      <label className="program-panel-inline-label">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="program-panel-inline-input"
          autoFocus
        />
      </label>
      <label className="program-panel-inline-label">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="program-panel-inline-input program-panel-inline-textarea"
          rows={2}
        />
      </label>
      <fieldset className="program-panel-inline-fieldset">
        <legend className="program-panel-inline-legend">Days</legend>
        <div className="program-panel-inline-days" role="group" aria-label="Select days">
          {DAY_ABBREVS.map((d) => (
            <button
              key={d}
              type="button"
              className={`program-panel-inline-day-tile ${days.includes(d) ? 'selected' : ''}`}
              onClick={() => toggleDay(d)}
              aria-pressed={days.includes(d)}
              aria-label={`${d}${days.includes(d) ? ', selected' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="program-panel-inline-actions">
        <button type="button" className="program-panel-inline-btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="program-panel-inline-btn primary">
          Save
        </button>
      </div>
    </form>
  )
}

function SectionListRow({
  section,
  programId,
  onEdit,
  onDelete,
}: {
  section: ProgramSection
  programId: string
  onEdit: (s: ProgramSection) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const daysText = formatDaysDisplay(section.days)

  const handleRowClick = () => {
    navigate(`/programs/${programId}/sections/${section.id}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="program-section-list-item"
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRowClick()
        }
      }}
      aria-label={`${section.name}, ${section.exerciseNames.length} exercises. Click to view exercises.`}
    >
      <div className="program-section-list-item-info">
        <span className="program-section-list-item-name">{section.name}</span>
        <span className="program-section-list-item-days" title="Scheduled days">
          <span className="program-section-list-item-days-label">Days:</span> {daysText}
        </span>
        <span className="program-section-list-item-count" title="Exercises">
          <Dumbbell size={14} />
          {section.exerciseNames.length}
        </span>
      </div>
      <div
        className="program-section-list-item-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="program-section-list-item-menu-wrap">
          <button
            type="button"
            className="program-section-list-item-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Section options"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="program-panel-section-menu-backdrop"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="program-panel-section-menu" role="menu">
                <button
                  type="button"
                  className="program-panel-section-menu-item"
                  onClick={() => {
                    onEdit(section)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  className="program-panel-section-menu-item danger"
                  onClick={() => {
                    if (window.confirm(`Delete section "${section.name}"?`)) {
                      onDelete(section.id)
                    }
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>()
  const {
    getProgram,
    updateProgram,
    addSection,
    updateSection,
    deleteSection,
    createSection,
    loading,
    error,
  } = usePrograms()

  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ProgramSection | null>(null)
  const [nameEditing, setNameEditing] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const program = programId ? getProgram(programId) : undefined

  const handleSaveNewSection = async (name: string, description: string, days: string[]) => {
    if (!programId) return
    const section = createSection(name, description, days)
    await addSection(programId, section)
    setAddSectionOpen(false)
  }

  const handleSaveEditSection = async (name: string, description: string, days: string[]) => {
    if (!programId || !editingSection) return
    await updateSection(programId, editingSection.id, { name, description, days })
    setEditingSection(null)
  }

  const handleProgramNameSave = () => {
    const trimmed = nameValue.trim()
    if (programId && program && trimmed && trimmed !== program.name) {
      updateProgram(programId, { ...program, name: trimmed })
    }
    setNameEditing(false)
  }

  if (!programId) {
    return (
      <PageLayout title="Program" breadcrumbs={[{ label: 'Programs', href: '/programs' }, { label: 'Program' }]} backLink={{ to: '/programs', label: 'Back to Programs' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Invalid program.</p>
            <Link to="/programs">Back to Programs</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  if (!loading && !program) {
    return (
      <PageLayout title="Program" breadcrumbs={[{ label: 'Programs', href: '/programs' }, { label: 'Program' }]} backLink={{ to: '/programs', label: 'Back to Programs' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Program not found.</p>
            <Link to="/programs">Back to Programs</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  const breadcrumbs = getBreadcrumbItems(`/programs/${programId}`, { programId }, { programName: program?.name })

  return (
    <PageLayout
      title={program?.name ?? 'Program'}
      breadcrumbs={breadcrumbs}
      backLink={{ to: '/programs', label: 'Back to Programs' }}
      actions={
        <button
          type="button"
          className="programs-canvas-new-btn"
          onClick={() => setAddSectionOpen(true)}
          aria-label="Add section"
        >
          <Plus size={20} />
          Add section
        </button>
      }
    >
      <div className="programs-canvas-layout">
        <main className="programs-canvas-main">
          {error && (
            <div className="message message-error" role="alert">
              {error}
            </div>
          )}
          {loading && <p className="programs-canvas-loading">Loading…</p>}
          {!loading && program && (
            <div className="programs-detail-view">
              <div className="programs-detail-title-wrap programs-detail-title-wrap-standalone">
                {nameEditing ? (
                  <input
                    type="text"
                    className="programs-detail-title-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={handleProgramNameSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleProgramNameSave()
                      if (e.key === 'Escape') {
                        setNameValue(program.name)
                        setNameEditing(false)
                      }
                    }}
                    autoFocus
                    aria-label="Program name"
                  />
                ) : (
                  <h2
                    className="programs-detail-title"
                    onClick={() => {
                      setNameValue(program.name)
                      setNameEditing(true)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setNameValue(program.name)
                        setNameEditing(true)
                      }
                    }}
                    aria-label={`Program name: ${program.name}. Click to edit.`}
                  >
                    {program.name}
                  </h2>
                )}
              </div>

              <div className="programs-section-list-wrap">
                <h3 className="programs-section-list-title">Sections</h3>
                <ul className="programs-section-list" role="list">
                  {program.sections.map((s) =>
                    editingSection?.id === s.id ? (
                      <li key={s.id} className="programs-section-list-edit">
                        <EditSectionInline
                          section={editingSection}
                          onSave={handleSaveEditSection}
                          onCancel={() => setEditingSection(null)}
                        />
                      </li>
                    ) : (
                      <li key={s.id} className="programs-section-list-item-wrap">
                        <SectionListRow
                          section={s}
                          programId={programId}
                          onEdit={setEditingSection}
                          onDelete={(id) => void deleteSection(programId, id)}
                        />
                      </li>
                    )
                  )}
                </ul>
                <button
                  type="button"
                  className="programs-section-list-add-btn"
                  onClick={() => setAddSectionOpen(true)}
                >
                  <Plus size={18} />
                  Add section
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {addSectionOpen && (
        <AddSectionModal
          onSave={handleSaveNewSection}
          onCancel={() => setAddSectionOpen(false)}
        />
      )}
    </PageLayout>
  )
}
