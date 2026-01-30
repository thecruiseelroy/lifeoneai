import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import type { Food } from '../../data/types'
import { useDiets } from './useDiets'
import { useFoods } from '../../hooks/useFoods'
import { formatDaysDisplay } from '../programs/formatDays'
import { AddFoodToSectionModal } from './AddFoodToSectionModal'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

function findFoodByName(foods: Food[], name: string): Food | undefined {
  const n = name.trim().toLowerCase()
  return foods.find((f) => f.name.toLowerCase() === n || f.name.trim().toLowerCase() === n)
}

function FoodTileSimple({ food, onRemove }: { food: Food; onRemove: () => void }) {
  const cal = typeof food.calories === 'number' ? food.calories.toFixed(0) : String(food.calories)
  return (
    <div className="programs-exercise-grid-item diet-section-food-tile">
      <div className="exercise-tile">
        <div className="exercise-tile-header">
          <span className="exercise-tile-category">per 100g</span>
        </div>
        <h3 className="exercise-tile-name">{food.name}</h3>
        <div className="exercise-tile-meta food-tile-meta">
          <span>{cal} kcal</span>
          <span>P:{food.proteins} F:{food.fat} C:{food.carbohydrates}</span>
        </div>
        <button
          type="button"
          className="diet-section-food-remove"
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          aria-label={`Remove ${food.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export function DietSectionDetailPage() {
  const { dietId, sectionId } = useParams<{ dietId: string; sectionId: string }>()
  const { getDiet, addFoodsToSection, removeFoodFromSection } = useDiets()
  const { foods } = useFoods('', 500, 0)

  const [addFoodOpen, setAddFoodOpen] = useState(false)

  const diet = dietId ? getDiet(dietId) : undefined
  const section = diet?.sections.find((s) => s.id === sectionId)

  const foodsByName = useMemo(() => {
    const map = new Map<string, Food>()
    if (!section) return map
    section.foodNames.forEach((name) => {
      const f = findFoodByName(foods, name)
      if (f) map.set(name, f)
    })
    return map
  }, [section, foods])

  if (!dietId || !sectionId) {
    return (
      <PageLayout title="Section" breadcrumbs={[{ label: 'Diets', href: '/diets' }]} backLink={{ to: '/diets', label: 'Back to Diets' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Invalid URL.</p>
            <Link to="/diets">Back to Diets</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  if (!diet) {
    return (
      <PageLayout title="Section" breadcrumbs={[{ label: 'Diets', href: '/diets' }]} backLink={{ to: '/diets', label: 'Back to Diets' }}>
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Diet not found.</p>
            <Link to="/diets">Back to Diets</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  if (!section) {
    return (
      <PageLayout
        title="Section"
        breadcrumbs={getBreadcrumbItems(`/diets/${dietId}`, { dietId }, { dietName: diet.name })}
        backLink={{ to: `/diets/${dietId}`, label: `Back to ${diet.name}` }}
      >
        <div className="programs-canvas-layout">
          <main className="programs-canvas-main">
            <p className="programs-not-found">Section not found.</p>
            <Link to={`/diets/${dietId}`}>Back to {diet.name}</Link>
          </main>
        </div>
      </PageLayout>
    )
  }

  const daysText = formatDaysDisplay(section.days)
  const breadcrumbs = getBreadcrumbItems(
    `/diets/${dietId}/sections/${sectionId}`,
    { dietId, sectionId },
    { dietName: diet.name, sectionName: section.name }
  )

  return (
    <PageLayout
      title={section.name}
      breadcrumbs={breadcrumbs}
      backLink={{ to: `/diets/${dietId}`, label: `Back to ${diet.name}` }}
      actions={
        <button
          type="button"
          className="programs-canvas-new-btn"
          onClick={() => setAddFoodOpen(true)}
          aria-label="Add food"
        >
          <Plus size={20} />
          Add food
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
                <h3 className="programs-exercise-grid-title">{section.name} — Foods</h3>
              </div>
              {section.foodNames.length === 0 ? (
                <p className="programs-exercise-grid-empty">
                  No foods in this section yet. Click &quot;Add food&quot; to add some.
                </p>
              ) : (
                <div className="programs-exercise-grid" role="list">
                  {section.foodNames.map((name) => {
                    const food = foodsByName.get(name)
                    if (food) {
                      return (
                        <FoodTileSimple
                          key={name}
                          food={food}
                          onRemove={() => void removeFoodFromSection(dietId, sectionId, name)}
                        />
                      )
                    }
                    return (
                      <div key={name} className="programs-exercise-grid-item programs-exercise-tile-fallback diet-section-food-tile">
                        <div className="exercise-tile">
                          <div className="exercise-tile-header">
                            <span className="exercise-tile-category">Custom</span>
                          </div>
                          <h3 className="exercise-tile-name">{name}</h3>
                          <button
                            type="button"
                            className="diet-section-food-remove"
                            onClick={() => void removeFoodFromSection(dietId, sectionId, name)}
                            aria-label={`Remove ${name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {addFoodOpen && (
        <AddFoodToSectionModal
          dietId={dietId}
          sectionId={sectionId}
          existingFoodNames={section.foodNames}
          onClose={() => setAddFoodOpen(false)}
          onAdd={async (names) => {
            await addFoodsToSection(dietId, sectionId, names, true)
            setAddFoodOpen(false)
          }}
        />
      )}
    </PageLayout>
  )
}
