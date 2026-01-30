import { useCallback, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

const DEBOUNCE_MS = 300

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const t = window.setTimeout(() => {
      onChange(local)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [local, onChange])

  const handleClear = useCallback(() => {
    setLocal('')
    onChange('')
  }, [onChange])

  return (
    <div className="search-bar">
      <Search size={20} className="search-bar-icon" aria-hidden />
      <input
        type="search"
        className="search-bar-input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search exercises"
        autoComplete="off"
      />
      {local && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
