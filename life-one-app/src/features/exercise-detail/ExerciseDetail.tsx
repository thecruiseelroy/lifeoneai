import React, { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import type { Exercise } from '../../data/types'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface ExerciseDetailProps {
  exercise: Exercise | null
  onClose: () => void
  open: boolean
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export function ExerciseDetail({ exercise, onClose, open }: ExerciseDetailProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus()
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return
      const el = drawerRef.current
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    },
    []
  )

  if (!exercise) return null

  const videoEmbed = exercise.video ? getVideoEmbedUrl(exercise.video) : null
  const variationList = exercise.variation_on ?? exercise.variations_on ?? []

  return (
    <div
      className={`exercise-detail-overlay ${open ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={drawerRef}
        className="exercise-detail-drawer"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="exercise-detail-header">
          <h2 id="exercise-detail-title" className="exercise-detail-name">
            {exercise.name}
          </h2>
          <span className="exercise-detail-badge">{exercise.category}</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="exercise-detail-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="exercise-detail-body">
          {videoEmbed && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Video</h3>
              <div className="exercise-detail-video-wrapper">
                <iframe
                  src={videoEmbed}
                  title={`Video for ${exercise.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="exercise-detail-video"
                />
              </div>
            </section>
          )}

          {exercise.description && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Description</h3>
              <p className="exercise-detail-text">{exercise.description}</p>
            </section>
          )}

          {exercise.instructions?.length > 0 && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Instructions</h3>
              <ol className="exercise-detail-list exercise-detail-list-ol">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {(exercise.tips?.length ?? 0) > 0 && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Tips</h3>
              <ul className="exercise-detail-list">
                {(exercise.tips ?? []).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="exercise-detail-section">
            <h3 className="exercise-detail-section-title">Equipment</h3>
            <div className="exercise-detail-chips">
              {(exercise.equipment?.length
                ? exercise.equipment
                : ['none']
              ).map((e) => (
                <span key={e} className="exercise-detail-chip">
                  {e}
                </span>
              ))}
            </div>
          </section>

          <section className="exercise-detail-section">
            <h3 className="exercise-detail-section-title">Muscles</h3>
            <div className="exercise-detail-muscles">
              <div>
                <span className="exercise-detail-muscle-label">Primary</span>
                <div className="exercise-detail-chips">
                  {(exercise.primary_muscles ?? []).map((m) => (
                    <span key={m} className="exercise-detail-chip primary">
                      {m}
                    </span>
                  ))}
                  {(!exercise.primary_muscles || exercise.primary_muscles.length === 0) && (
                    <span className="exercise-detail-chip">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="exercise-detail-muscle-label">Secondary</span>
                <div className="exercise-detail-chips">
                  {(exercise.secondary_muscles ?? []).map((m) => (
                    <span key={m} className="exercise-detail-chip secondary">
                      {m}
                    </span>
                  ))}
                  {(!exercise.secondary_muscles || exercise.secondary_muscles.length === 0) && (
                    <span className="exercise-detail-chip">—</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {exercise.tempo && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Tempo</h3>
              <p className="exercise-detail-text">{exercise.tempo}</p>
            </section>
          )}

          {variationList.length > 0 && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Variation of</h3>
              <p className="exercise-detail-text">
                {variationList.join(', ')}
              </p>
            </section>
          )}

          {(exercise.aliases?.length ?? 0) > 0 && (
            <section className="exercise-detail-section">
              <h3 className="exercise-detail-section-title">Also known as</h3>
              <p className="exercise-detail-text">{exercise.aliases?.join(', ') ?? ''}</p>
            </section>
          )}

          {(exercise.license_author || exercise.license?.url) && (
            <section className="exercise-detail-section exercise-detail-license">
              <h3 className="exercise-detail-section-title">License</h3>
              {exercise.license_author && (
                <p className="exercise-detail-text">Author: {exercise.license_author}</p>
              )}
              {exercise.license?.full_name && (
                <p className="exercise-detail-text">{exercise.license.full_name}</p>
              )}
              {exercise.license?.url && (
                <a
                  href={exercise.license.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="exercise-detail-link"
                >
                  License link
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
