import type { Exercise } from '../../data/types'

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

interface ExerciseDetailContentProps {
  exercise: Exercise
}

export function ExerciseDetailContent({ exercise }: ExerciseDetailContentProps) {
  const videoEmbed = exercise.video ? getVideoEmbedUrl(exercise.video) : null
  const variationList = exercise.variation_on ?? exercise.variations_on ?? []

  return (
    <div className="exercise-detail-body">
      {videoEmbed && (
        <section className="exercise-detail-section exercise-detail-tile exercise-detail-video-full">
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

      <div className="exercise-detail-grid">
        {exercise.description && (
          <section className="exercise-detail-section exercise-detail-grid-item">
            <h3 className="exercise-detail-section-title">Description</h3>
            <p className="exercise-detail-text">{exercise.description}</p>
          </section>
        )}

        <section className="exercise-detail-section exercise-detail-grid-item">
          <h3 className="exercise-detail-section-title">Equipment</h3>
          <div className="exercise-detail-chips">
            {(exercise.equipment?.length ? exercise.equipment : ['none']).map((e) => (
              <span key={e} className="exercise-detail-chip">
                {e}
              </span>
            ))}
          </div>
        </section>

        <section className="exercise-detail-section exercise-detail-grid-item">
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
      </div>

      {exercise.instructions?.length > 0 && (
        <section className="exercise-detail-section exercise-detail-tile">
          <h3 className="exercise-detail-section-title">Instructions</h3>
          <ol className="exercise-detail-list exercise-detail-list-ol">
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {(exercise.tips?.length ?? 0) > 0 && (
        <section className="exercise-detail-section exercise-detail-tile">
          <h3 className="exercise-detail-section-title">Tips</h3>
          <ul className="exercise-detail-list">
            {(exercise.tips ?? []).map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="exercise-detail-grid exercise-detail-grid-misc">
        {exercise.tempo && (
          <section className="exercise-detail-section exercise-detail-grid-item">
            <h3 className="exercise-detail-section-title">Tempo</h3>
            <p className="exercise-detail-text">{exercise.tempo}</p>
          </section>
        )}
        {variationList.length > 0 && (
          <section className="exercise-detail-section exercise-detail-grid-item">
            <h3 className="exercise-detail-section-title">Variation of</h3>
            <p className="exercise-detail-text">{variationList.join(', ')}</p>
          </section>
        )}
        {(exercise.aliases?.length ?? 0) > 0 && (
          <section className="exercise-detail-section exercise-detail-grid-item">
            <h3 className="exercise-detail-section-title">Also known as</h3>
            <p className="exercise-detail-text">{(exercise.aliases ?? []).join(', ')}</p>
          </section>
        )}
      </div>

      {(exercise.license_author || exercise.license?.url) && (
        <section className="exercise-detail-section exercise-detail-tile exercise-detail-license">
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
  )
}
