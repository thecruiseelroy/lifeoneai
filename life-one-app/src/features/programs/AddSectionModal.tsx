import { useState } from 'react'
import { DAY_ABBREVS } from './formatDays'

interface AddSectionModalProps {
  onSave: (name: string, description: string, days: string[]) => void
  onCancel: () => void
}

export function AddSectionModal({ onSave, onCancel }: AddSectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState<string[]>([])

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
    <div className="add-section-modal-overlay" onClick={onCancel}>
      <div
        className="add-section-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-section-modal-title"
      >
        <h2 id="add-section-modal-title" className="add-section-modal-title">
          Add section
        </h2>
        <form onSubmit={handleSubmit} className="add-section-modal-form">
          <label className="add-section-modal-label">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push"
              className="add-section-modal-input"
              autoFocus
            />
          </label>
          <label className="add-section-modal-label">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="add-section-modal-input add-section-modal-textarea"
              rows={2}
            />
          </label>
          <fieldset className="add-section-modal-fieldset">
            <legend className="add-section-modal-legend">Days</legend>
            <div className="add-section-modal-days" role="group" aria-label="Select days">
              {DAY_ABBREVS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`add-section-modal-day-tile ${days.includes(d) ? 'selected' : ''}`}
                  onClick={() => toggleDay(d)}
                  aria-pressed={days.includes(d)}
                  aria-label={`${d}${days.includes(d) ? ', selected' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="add-section-modal-actions">
            <button type="button" className="add-section-modal-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="add-section-modal-btn primary">
              Add section
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
