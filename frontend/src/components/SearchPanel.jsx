import { useEffect, useRef } from 'react'
import './SearchPanel.css'

export default function SearchPanel ({
  visible,
  onClose,
  triggerRef,
  searchQuery,
  onSearchChange,
  onSearch,
  waiting,
  searchInputRef,
  onSearchFocus,
  searchError,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!visible) return
    function handleMouseDown (e) {
      if (
        panelRef.current?.contains(e.target) ||
        triggerRef?.current?.contains(e.target)
      ) return
      onClose?.()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [visible, onClose, triggerRef])

  if (!visible) return null

  return (
    <div ref={panelRef} className='search-panel'>
      <form className='search-panel-row' onSubmit={e => { e.preventDefault(); onSearch() }}>
        <input
          ref={searchInputRef}
          className='search-panel-input'
          placeholder='Enter part or set #'
          value={searchQuery}
          onFocus={onSearchFocus}
          onChange={e => onSearchChange(e.target.value)}
        />
        <button
          type='submit'
          className='ui-button blue search-panel-btn'
          disabled={waiting || !searchQuery.trim()}
        >
          Search
        </button>
      </form>

      {searchError && (
        <div className='search-panel-error'>{searchError}</div>
      )}
    </div>
  )
}
