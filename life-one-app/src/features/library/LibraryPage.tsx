import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../../hooks/useExercises'
import { useFilterState } from '../filters/filterState'
import { SearchBar } from '../search/SearchBar'
import { FilterBar } from '../filters/FilterBar'
import { FilterDrawer } from '../../components/FilterDrawer'
import { CoachSidebar } from '../coach/CoachSidebar'
import { CoachChatBubble } from '../../components/CoachChatBubble'
import { ExerciseGrid } from '../exercise-library/ExerciseGrid'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { getBreadcrumbItems } from '../../utils/breadcrumbRoutes'
import { slugify } from '../../utils/slugify'

const LEFT_SIDEBAR_MIN = 200
const LEFT_SIDEBAR_MAX = 420
const RIGHT_SIDEBAR_MIN = 280
const RIGHT_SIDEBAR_MAX = 640

export function LibraryPage() {
  const navigate = useNavigate()
  const {
    search,
    setSearch,
    category,
    setCategory,
    equipment,
    setEquipment,
    muscleGroup,
    setMuscleGroup,
    clearFilters,
  } = useFilterState()
  const { data, filtered, loading, error } = useExercises(
    search,
    category,
    equipment,
    muscleGroup
  )

  const [leftSidebarWidth, setLeftSidebarWidth] = useState(260)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(420)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const resizeRef = useRef<'left' | 'right' | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizeRef.current === 'left') {
      const delta = e.clientX - startXRef.current
      setLeftSidebarWidth((w) =>
        Math.min(LEFT_SIDEBAR_MAX, Math.max(LEFT_SIDEBAR_MIN, w + delta))
      )
      startXRef.current = e.clientX
    } else if (resizeRef.current === 'right') {
      const delta = e.clientX - startXRef.current
      setRightSidebarWidth((w) =>
        Math.min(RIGHT_SIDEBAR_MAX, Math.max(RIGHT_SIDEBAR_MIN, w - delta))
      )
      startXRef.current = e.clientX
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    resizeRef.current = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const startResizeLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      resizeRef.current = 'left'
      startXRef.current = e.clientX
      startWidthRef.current = leftSidebarWidth
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [leftSidebarWidth, handleMouseMove, handleMouseUp]
  )

  const startResizeRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      resizeRef.current = 'right'
      startXRef.current = e.clientX
      startWidthRef.current = rightSidebarWidth
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [rightSidebarWidth, handleMouseMove, handleMouseUp]
  )

  return (
    <div
      className="app-body app-body-lib"
      style={
        {
          '--sidebar-left-width': `${leftSidebarWidth}px`,
          '--sidebar-right-width': `${rightSidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <aside className="filter-sidebar" aria-label="Filters">
        <h2 className="filter-sidebar-title">Filters</h2>
        <FilterBar
          categories={data?.categories ?? []}
          equipment={data?.equipment ?? []}
          muscleGroups={data?.muscle_groups ? Object.keys(data.muscle_groups) : []}
          category={category}
          setCategory={setCategory}
          equipmentSelected={equipment}
          setEquipment={setEquipment}
          muscleGroup={muscleGroup}
          setMuscleGroup={setMuscleGroup}
          onClear={clearFilters}
        />
      </aside>
      <div
        className="sidebar-resizer sidebar-resizer-left"
        role="separator"
        aria-label="Resize filters panel"
        onMouseDown={startResizeLeft}
      />
      <main className="main main-with-sidebars">
        <header className="library-page-header">
          <div className="page-header-breadcrumb-wrap">
            <Breadcrumbs items={getBreadcrumbItems('/library', {})} />
          </div>
          <h1 className="library-page-title">Library</h1>
        </header>
        <div className="library-page-search" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search exercises…"
          />
          <FilterDrawer
            open={filterDrawerOpen}
            onOpen={() => setFilterDrawerOpen(true)}
            onClose={() => setFilterDrawerOpen(false)}
            categories={data?.categories ?? []}
            equipment={data?.equipment ?? []}
            muscleGroups={data?.muscle_groups ? Object.keys(data.muscle_groups) : []}
            category={category}
            setCategory={setCategory}
            equipmentSelected={equipment}
            setEquipment={setEquipment}
            muscleGroup={muscleGroup}
            setMuscleGroup={setMuscleGroup}
            onClear={clearFilters}
          />
        </div>
        {error && (
          <div className="message message-error" role="alert">
            Failed to load exercises. Refresh the page.
          </div>
        )}
        {loading && (
          <div className="message" aria-live="polite">
            Loading library…
          </div>
        )}
        {!loading && !error && (
          <ExerciseGrid
            exercises={filtered}
            totalCount={data?.exercises.length ?? 0}
            onSelectExercise={(ex) => navigate(`/exercise/${slugify(ex.name)}`)}
            onClearFilters={clearFilters}
          />
        )}
      </main>
      <div
        className="sidebar-resizer sidebar-resizer-right"
        role="separator"
        aria-label="Resize coach panel"
        onMouseDown={startResizeRight}
      />
      <div className="coach-sidebar-wrap">
        <CoachSidebar />
      </div>
      <CoachChatBubble />
    </div>
  )
}
