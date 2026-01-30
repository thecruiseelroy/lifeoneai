import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import { usePrograms } from './usePrograms'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

export function ProgramsListPage() {
  const navigate = useNavigate()
  const {
    programs,
    addProgram,
    updateProgram,
    deleteProgram,
    duplicateProgram,
    loading,
    error,
  } = usePrograms()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleNewProgram = async () => {
    const p = await addProgram('New program')
    navigate(`/programs/${p.id}`)
  }

  const handleRename = (p: { id: string; name: string }) => {
    const name = window.prompt('Rename program', p.name)?.trim()
    if (name && name !== p.name) {
      const program = programs.find((x) => x.id === p.id)
      if (program) void updateProgram(p.id, { ...program, name })
    }
    setMenuOpenId(null)
  }

  const handleDuplicate = async (p: { id: string; name: string }) => {
    const copy = await duplicateProgram(p.id)
    setMenuOpenId(null)
    if (copy) navigate(`/programs/${copy.id}`)
  }

  const handleDelete = (p: { id: string; name: string }) => {
    if (window.confirm(`Delete program "${p.name}"? This cannot be undone.`)) {
      void deleteProgram(p.id)
    }
    setMenuOpenId(null)
  }

  const breadcrumbs = getBreadcrumbItems('/programs', {})

  return (
    <PageLayout
      title="Programs"
      breadcrumbs={breadcrumbs}
      actions={
        <button
          type="button"
          className="programs-canvas-new-btn"
          onClick={handleNewProgram}
          aria-label="New program"
        >
          <Plus size={20} />
          New program
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
          {loading && <p className="programs-canvas-loading">Loading programs…</p>}
          {!loading && programs.length === 0 && (
            <div className="programs-canvas-empty">
              <p>No programs yet.</p>
              <p className="programs-canvas-empty-hint">
                Create a program to organize exercises into sections.
              </p>
              <button
                type="button"
                className="programs-canvas-empty-btn"
                onClick={handleNewProgram}
              >
                Create your first program
              </button>
            </div>
          )}
          {!loading && programs.length > 0 && (
            <div className="programs-canvas-grid" role="list">
              {programs.map((p) => (
                <div
                  key={p.id}
                  className="programs-canvas-card-wrap"
                  role="listitem"
                >
                  <button
                    type="button"
                    className="programs-canvas-card"
                    onClick={() => navigate(`/programs/${p.id}`)}
                    aria-label={`Open ${p.name}`}
                  >
                    <span className="programs-canvas-card-name">{p.name}</span>
                    <span className="programs-canvas-card-meta">
                      {p.sections.length} section{p.sections.length !== 1 ? 's' : ''}
                    </span>
                    {p.sections.length > 0 && (
                      <span className="programs-canvas-card-preview">
                        {p.sections.slice(0, 3).map((s) => s.name).join(' · ')}
                      </span>
                    )}
                  </button>
                  <div
                    className="programs-canvas-card-actions"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="programs-canvas-card-menu-wrap">
                      <button
                        type="button"
                        className="programs-canvas-card-menu-btn"
                        onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                        aria-label="Program options"
                        aria-expanded={menuOpenId === p.id}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuOpenId === p.id && (
                        <>
                          <div
                            className="programs-panel-section-menu-backdrop"
                            onClick={() => setMenuOpenId(null)}
                            aria-hidden
                          />
                          <div className="programs-panel-section-menu program-card-menu" role="menu">
                            <button
                              type="button"
                              className="programs-panel-section-menu-item"
                              onClick={() => handleRename(p)}
                              role="menuitem"
                            >
                              <Pencil size={14} />
                              Edit name
                            </button>
                            <button
                              type="button"
                              className="programs-panel-section-menu-item"
                              onClick={() => void handleDuplicate(p)}
                              role="menuitem"
                            >
                              <Copy size={14} />
                              Duplicate
                            </button>
                            <button
                              type="button"
                              className="programs-panel-section-menu-item danger"
                              onClick={() => handleDelete(p)}
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
              ))}
            </div>
          )}
        </main>
      </div>
    </PageLayout>
  )
}
