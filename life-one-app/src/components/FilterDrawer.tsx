import { Filter, X } from 'lucide-react'
import { FilterBar } from '../features/filters/FilterBar'

interface FilterBarProps {
  categories: string[]
  equipment: string[]
  muscleGroups: string[]
  category: string
  setCategory: (v: string) => void
  equipmentSelected: string[]
  setEquipment: (v: string[]) => void
  muscleGroup: string
  setMuscleGroup: (v: string) => void
  onClear: () => void
}

interface FilterDrawerProps extends FilterBarProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function FilterDrawer({
  open,
  onOpen,
  onClose,
  categories,
  equipment,
  muscleGroups,
  category,
  setCategory,
  equipmentSelected,
  setEquipment,
  muscleGroup,
  setMuscleGroup,
  onClear,
}: FilterDrawerProps) {
  return (
    <>
      <button
        type="button"
        className="filter-trigger-btn"
        onClick={onOpen}
        aria-label="Open filters"
        aria-expanded={open}
      >
        <Filter size={18} />
        Filters
        {!!category || equipmentSelected.length > 0 || !!muscleGroup ? (
          <span style={{ marginLeft: 4, color: 'var(--accent)' }}>•</span>
        ) : null}
      </button>

      <div
        className={`filter-drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="presentation"
      >
        <aside
          className="filter-drawer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Filters"
        >
          <div className="filter-drawer-header">
            <h2 className="filter-drawer-title">Filters</h2>
            <button
              type="button"
              className="filter-drawer-close"
              onClick={onClose}
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>
          <div className="filter-drawer-body">
            <FilterBar
              categories={categories}
              equipment={equipment}
              muscleGroups={muscleGroups}
              category={category}
              setCategory={setCategory}
              equipmentSelected={equipmentSelected}
              setEquipment={setEquipment}
              muscleGroup={muscleGroup}
              setMuscleGroup={setMuscleGroup}
              onClear={onClear}
            />
          </div>
        </aside>
      </div>
    </>
  )
}
