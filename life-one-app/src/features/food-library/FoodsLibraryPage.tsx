import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import type { Food } from '../../data/types'
import { useFoods } from '../../hooks/useFoods'
import { PageLayout } from '../../components/layout/PageLayout'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'

const DEBOUNCE_MS = 300
const PAGE_SIZE = 50

function FoodTile({
  food,
  onClick,
}: {
  food: Food
  onClick: () => void
}) {
  const p = food.proteins
  const f = food.fat
  const c = food.carbohydrates
  const cal = typeof food.calories === 'number' ? food.calories.toFixed(0) : String(food.calories)

  return (
    <button
      type="button"
      className="exercise-tile food-tile"
      onClick={onClick}
      aria-label={`View details for ${food.name}`}
    >
      <div className="exercise-tile-header">
        <span className="exercise-tile-category">per 100g</span>
      </div>
      <h3 className="exercise-tile-name">{food.name}</h3>
      <div className="exercise-tile-meta food-tile-meta">
        <span title="Calories">{cal} kcal</span>
        <span title="Protein">P: {p}</span>
        <span title="Fat">F: {f}</span>
        <span title="Carbs">C: {c}</span>
      </div>
      {food.serving !== 100 && (
        <p className="food-tile-serving">Serving: {food.serving}g</p>
      )}
    </button>
  )
}

function FoodDetailPanel({
  food,
  onClose,
}: {
  food: Food | null
  onClose: () => void
}) {
  if (!food) return null

  const nutrients = food.nutrients && typeof food.nutrients === 'object' ? food.nutrients : {}
  const nutrientEntries = Object.entries(nutrients).slice(0, 24)

  return (
    <aside className="foods-detail-panel" aria-label="Food details">
      <div className="foods-detail-panel-inner">
        <div className="foods-detail-panel-header">
          <h2 className="foods-detail-panel-title">{food.name}</h2>
          <button
            type="button"
            className="foods-detail-panel-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="foods-detail-panel-body">
          <section className="foods-detail-section">
            <h3 className="foods-detail-section-title">Macros (per 100g)</h3>
            <ul className="foods-detail-macros">
              <li><strong>Calories</strong> {typeof food.calories === 'number' ? food.calories.toFixed(1) : food.calories} kcal</li>
              <li><strong>Protein</strong> {food.proteins} mg</li>
              <li><strong>Fat</strong> {food.fat} mg</li>
              <li><strong>Carbohydrates</strong> {food.carbohydrates} mg</li>
            </ul>
            <p className="foods-detail-serving">Serving size: {food.serving}g</p>
          </section>
          {nutrientEntries.length > 0 && (
            <section className="foods-detail-section">
              <h3 className="foods-detail-section-title">Nutrients</h3>
              <ul className="foods-detail-nutrients">
                {nutrientEntries.map(([name, value]) => (
                  <li key={name}>
                    <span className="foods-detail-nutrient-name">{name}</span>
                    <span className="foods-detail-nutrient-value">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </aside>
  )
}

export function FoodsLibraryPage() {
  const [searchLocal, setSearchLocal] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [detailFood, setDetailFood] = useState<Food | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchDebounced(searchLocal)
      setLimit(PAGE_SIZE)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchLocal])

  const { foods, totalCount, loading, error } = useFoods(
    searchDebounced,
    limit,
    0
  )

  const handleSelectFood = useCallback((food: Food) => {
    setDetailFood(food)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailFood(null)
  }, [])

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE)
  }, [])

  const hasMore = foods.length < totalCount
  const breadcrumbs = getBreadcrumbItems('/foods', {})

  return (
    <PageLayout
      title="Foods"
      breadcrumbs={breadcrumbs}
      actions={
        <nav className="foods-library-nav page-header-actions-inline" aria-label="Nutrition">
          <Link to="/diets" className="page-header-nav-link">
            Diets
          </Link>
          <Link to="/meals" className="page-header-nav-link">
            Meals
          </Link>
        </nav>
      }
    >
      <div className="programs-canvas-layout foods-library-layout">
        <main className={`programs-canvas-main foods-library-main ${detailFood ? 'foods-library-has-detail' : ''}`}>
          <div className="foods-library-toolbar">
            <div className="search-bar foods-library-search">
              <Search size={20} className="search-bar-icon" aria-hidden />
              <input
                type="search"
                className="search-bar-input"
                value={searchLocal}
                onChange={(e) => setSearchLocal(e.target.value)}
                placeholder="Search foods…"
                aria-label="Search foods"
                autoComplete="off"
              />
              {searchLocal && (
                <button
                  type="button"
                  className="search-bar-clear"
                  onClick={() => setSearchLocal('')}
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="foods-library-count" aria-live="polite">
              {loading && limit === PAGE_SIZE
                ? 'Loading…'
                : `${foods.length} of ${totalCount} foods`}
            </p>
          </div>

          {error && (
            <div className="message message-error" role="alert">
              {error}
            </div>
          )}

            {!loading && foods.length === 0 && !error && (
            <div className="programs-canvas-empty">
              <p>No foods match your search.</p>
              <p className="programs-canvas-empty-hint">
                Try a different search or clear the search box.
              </p>
            </div>
          )}

          {foods.length > 0 && (
            <>
              <div className="exercise-grid-wrapper foods-grid-wrapper">
                <div className="exercise-grid food-grid" role="list">
                  {foods.map((f) => (
                    <div
                      key={`${f.id}-${f.name}`}
                      className="exercise-grid-item food-grid-item"
                      role="listitem"
                    >
                      <FoodTile
                        food={f}
                        onClick={() => handleSelectFood(f)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {hasMore && (
                <div className="foods-library-load-more">
                  <button
                    type="button"
                    className="programs-canvas-empty-btn"
                    onClick={handleLoadMore}
                    disabled={loading || foods.length >= totalCount}
                  >
                    {loading ? 'Loading…' : `Load more (${foods.length} of ${totalCount})`}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        {detailFood && (
          <>
            <div
              className="foods-detail-backdrop"
              onClick={handleCloseDetail}
              onKeyDown={(e) => e.key === 'Escape' && handleCloseDetail()}
              role="button"
              tabIndex={-1}
              aria-label="Close detail"
            />
            <FoodDetailPanel food={detailFood} onClose={handleCloseDetail} />
          </>
        )}
      </div>
    </PageLayout>
  )
}
