
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

export function FilterBar({
  categories,
  equipment: equipmentList,
  muscleGroups,
  category,
  setCategory,
  equipmentSelected,
  setEquipment,
  muscleGroup,
  setMuscleGroup,
  onClear,
}: FilterBarProps) {
  const hasActive =
    !!category || equipmentSelected.length > 0 || !!muscleGroup

  const toggleEquipment = (item: string) => {
    if (equipmentSelected.includes(item)) {
      setEquipment(equipmentSelected.filter((e) => e !== item))
    } else {
      setEquipment([...equipmentSelected, item])
    }
  }

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <label className="filter-label">Category</label>
        <select
          className="filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-row">
        <label className="filter-label">Muscle group</label>
        <select
          className="filter-select"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          aria-label="Filter by muscle group"
        >
          <option value="">All</option>
          {muscleGroups.map((mg) => (
            <option key={mg} value={mg}>
              {mg}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-row filter-equipment">
        <span className="filter-label">Equipment</span>
        <div className="filter-chips" role="group" aria-label="Filter by equipment">
          {equipmentList.map((e) => (
            <button
              key={e}
              type="button"
              className={`filter-chip ${equipmentSelected.includes(e) ? 'active' : ''}`}
              onClick={() => toggleEquipment(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {hasActive && (
        <button
          type="button"
          className="filter-clear"
          onClick={onClear}
          aria-label="Clear all filters"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
