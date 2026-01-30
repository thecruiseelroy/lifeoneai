import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import { useDiets } from './useDiets'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

export function DietsListPage() {
  const navigate = useNavigate()
  const {
    diets,
    addDiet,
    updateDiet,
    deleteDiet,
    duplicateDiet,
    loading,
    error,
  } = useDiets()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleNewDiet = async () => {
    setCreateError(null)
    setCreating(true)
    try {
      const p = await addDiet('New diet')
      navigate(`/diets/${p.id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create diet'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleRename = (p: { id: string; name: string }) => {
    const name = window.prompt('Rename diet', p.name)?.trim()
    if (name && name !== p.name) {
      const diet = diets.find((x) => x.id === p.id)
      if (diet) void updateDiet(p.id, { ...diet, name })
    }
    setMenuOpenId(null)
  }

  const handleDuplicate = async (p: { id: string; name: string }) => {
    const copy = await duplicateDiet(p.id)
    setMenuOpenId(null)
    if (copy) navigate(`/diets/${copy.id}`)
  }

  const handleDelete = (p: { id: string; name: string }) => {
    if (window.confirm(`Delete diet "${p.name}"? This cannot be undone.`)) {
      void deleteDiet(p.id)
    }
    setMenuOpenId(null)
  }

  const breadcrumbs = getBreadcrumbItems('/diets', {})

  return (
    <PageLayout
      title="Diets"
      breadcrumbs={breadcrumbs}
      actions={
        <button
          type="button"
          className="programs-canvas-new-btn"
          onClick={handleNewDiet}
          disabled={creating}
          aria-label="New diet"
        >
          <Plus size={20} />
          {creating ? 'Creating…' : 'New diet'}
        </button>
      }
    >
      <div className="programs-canvas-layout">
        <main className="programs-canvas-main">
          {(error || createError) && (
            <div className="message message-error" role="alert">
              {createError ?? error}
            </div>
          )}
          {loading && <p className="programs-canvas-loading">Loading diets…</p>}
          {!loading && diets.length === 0 && (
            <div className="programs-canvas-empty">
              <p>No diets yet.</p>
              <p className="programs-canvas-empty-hint">
                Create a diet to organize foods into sections.
              </p>
              <button
                type="button"
                className="programs-canvas-empty-btn"
                onClick={handleNewDiet}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create your first diet'}
              </button>
            </div>
          )}
          {!loading && diets.length > 0 && (
            <div className="programs-canvas-grid" role="list">
              {diets.map((p) => (
                <div
                  key={p.id}
                  className="programs-canvas-card-wrap"
                  role="listitem"
                >
                  <button
                    type="button"
                    className="programs-canvas-card"
                    onClick={() => navigate(`/diets/${p.id}`)}
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
                        aria-label="Diet options"
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
