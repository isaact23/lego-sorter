import { useEffect, useRef } from 'react'
import './SearchPanel.css'

export default function SearchPanel ({
  visible,
  onClose,
  triggerRef,
  exemptRefs = [],
  searchQuery,
  onSearchChange,
  onSearch,
  waiting,
  searchInputRef,
  onSearchFocus,
  searchError,
  disambig,
  onDisambigPart,
  onDisambigSet,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!visible) return
    function handleMouseDown (e) {
      if (panelRef.current?.contains(e.target)) return
      if (triggerRef?.current?.contains(e.target)) return
      if (exemptRefs.some(r => r?.current?.contains(e.target))) return
      onClose?.()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [visible, onClose, triggerRef, exemptRefs])

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

      {disambig && (
        <div className='search-disambig'>
          <div className='search-disambig-label'>"{disambig.query}" could be a part or a set — which were you looking for?</div>
          <div className='search-disambig-options'>
            <button className='ui-button green search-disambig-btn' onClick={onDisambigPart}>
              Part: {disambig.partName}
            </button>
            <button className='ui-button blue search-disambig-btn' onClick={onDisambigSet}>
              Set {disambig.query}
            </button>
          </div>
        </div>
      )}

      {searchError && !disambig && (
        <div className='search-panel-error'>{searchError}</div>
      )}
    </div>
  )
}
