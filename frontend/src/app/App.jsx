import './App.css'
import './Button.css'

import Camera from '../components/Camera'
import Select from '../components/Select'
import Table from '../components/Table'
import BrickInfo from '../components/BrickInfo'
import OptionCard from '../components/OptionCard'
import CategoryCard from '../components/CategoryCard'
import OnScreenKeyboard from '../components/OnScreenKeyboard'

import { useState, useRef, useEffect, useCallback } from 'react'

import { fetchBrickData } from '../services/brickService'
import {
  getBinsByBrick,
  getBinsbyCategory,
  getAllBins,
  getBinContents,
  operateBin,
  updateBinProperties,
  emptyBin
} from '../services/binService'

// =====================
// PAGE CONSTANTS
// =====================
// These define which top panel view is shown
const SELECT_PAGE = 1      // Shows a list of bricks to select from
const OPTION_CARDS = 2     // Shows the main menu with search, category filter, and camera options
const BRICK_INFO = 3       // Shows details of a selected brick with Add/Remove bin operations

// BIN PROPERTY DEFINITIONS
// id: internal id, label: display, className: CSS class applied to bins with this property
const BIN_PROPERTIES = [
  { id: 'Empty', label: 'Empty', className: 'bin-empty' },
  { id: 'Full', label: 'Full', className: 'bin-full' },
  { id: 'Overwhelmed', label: 'Overwhelmed', className: 'bin-overwhelmed' },
  { id: 'Half Capacity', label: '1/2 Capacity', className: 'bin-half' }
]

function App () {
  // =====================
  // UI STATE
  // =====================
  const [page, setPage] = useState(2)                          // Which view to show (SELECT_PAGE, OPTION_CARDS, BRICK_INFO)
  const [waiting, setWaiting] = useState(false)                // Loading state for async operations
  const [helperText, setHelperText] = useState('Welcome! Select a bin or click an option above to get started')  // Helper message at bottom
  const [keyboardVisible, setKeyboardVisible] = useState(false)  // On-screen keyboard for part# search

  // =====================
  // BRICK DATA STATE
  // =====================
  const [brick, setBrick] = useState(null)                   // Currently selected brick (enriched with part_num, name, part_cat_id)
  const [brickList, setBrickList] = useState([])             // List of bricks to choose from (multiple identified from camera or bin contents)

  // =====================
  // BIN OPERATION STATE
  // =====================
  const [binOperation, setBinOperation] = useState(null)     // Current operation: 'add' or 'remove' (null = browsing only)
  const [selectedBinId, setSelectedBinId] = useState(null)   // Bin currently selected/highlighted
  const [highlightedBinIds, setHighlightedBinIds] = useState([])  // Bins to highlight (contains brick or category)
  const [currentBinContents, setCurrentBinContents] = useState([])  // Bricks in the currently selected bin
  const [binPropertyMap, setBinPropertyMap] = useState({})
  const [adminMode, setAdminMode] = useState(false)
  const [showPropertyHighlights, setShowPropertyHighlights] = useState(false)
  const [adminBinId, setAdminBinId] = useState(null)
  const [adminAction, setAdminAction] = useState(null)
  const [adminPropertySelection, setAdminPropertySelection] = useState([])
  const [swapSelection, setSwapSelection] = useState([])

  // =====================
  // SEARCH/FILTER STATE
  // =====================
  const [searchQuery, setSearchQuery] = useState('')                    // Text in the part# search box
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])    // Category IDs selected in filter
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([])  // Category labels (for display)
  const [dropdownResetTrigger, setDropdownResetTrigger] = useState(0)   // Used to reset category dropdowns

  // =====================
  // REFS
  // =====================
  const cameraRef = useRef()              // Reference to Camera component to trigger capture
  const searchInputRef = useRef(null)     // Reference to search input for keyboard focus
  const keyboardContainerRef = useRef(null)  // Reference to keyboard container for click-outside detection


  
  const handleCategorySelect = useCallback((payload) => {
    const ids = payload?.ids ?? []
    const labels = payload?.labels ?? []

    setSelectedCategoryIds(ids)
    setSelectedCategoryLabels(labels)
    setSearchQuery('')

    if (labels.length > 0) {
      setHelperText(
        `Showing bins containing Category: ${labels.join(' > ')}`
      )
    } else {
      setHelperText('Select a bin or click an option above to get started')
    }
  }, [])

  // When category selection changes, fetch bins for those categories and highlight them
  useEffect(() => {
    // No categories selected → clear highlights
    if (!selectedCategoryIds.length) {
      setHighlightedBinIds([])
      return
    }

    let cancelled = false

    async function loadCategoryBins () {
      try {
        // If multiple categories, union the bins
        const results = await Promise.all(
          selectedCategoryIds.map(catId => getBinsbyCategory(catId))
        )

        const merged = [...new Set(results.flat())]

        if (!cancelled) {
          setHighlightedBinIds(merged)
        }
      } catch (err) {
        console.error('Failed to fetch bins for category', err)
        if (!cancelled) setHighlightedBinIds([])
      }
    }

    loadCategoryBins()

    return () => {
      cancelled = true
    }
  }, [selectedCategoryIds])

  // Load full bin data on startup so properties are available to admin mode
  useEffect(() => {
    let cancelled = false

    async function loadAllBins () {
      try {
        const bins = await getAllBins()
        if (cancelled) return

        const mapped = Object.fromEntries(
          Object.entries(bins).map(([binId, bin]) => [
            binId,
            Array.isArray(bin.properties) ? bin.properties : []
          ])
        )

        setBinPropertyMap(mapped)
      } catch (err) {
        console.error('Failed to load all bin data', err)
      }
    }

    loadAllBins()

    return () => {
      cancelled = true
    }
  }, [])

  // Click outside handler to close keyboard
  useEffect(() => {
    if (!keyboardVisible) return

    function handleClickOutside(event) {
      if (
        searchInputRef.current?.contains(event.target) ||
        keyboardContainerRef.current?.contains(event.target)
      ) {
        return
      }
      setKeyboardVisible(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [keyboardVisible])

  // Handler for when a bin is clicked in the Table
  async function onBinClicked (newBinId) {
    console.log('onBinClicked', {
      newBinId,
      selectedBinId,
      binOperation,
      brick,
      adminMode,
      adminAction,
      adminBinId,
      swapSelection
    })

    if (adminMode) {
      // If swap mode is active, select the second bin and wait for confirm
      if (adminAction === 'swap-bins' && swapSelection.length === 1) {
        if (swapSelection[0] === newBinId) {
          return
        }
        setSwapSelection([swapSelection[0], newBinId])
        setHelperText(`Swap target selected: ${newBinId}. Confirm or cancel below.`)
        return
      }

      setAdminBinId(newBinId)
      setAdminAction(null)
      setAdminPropertySelection(binPropertyMap[newBinId] ?? [])
      setHelperText(`Admin selected bin ${newBinId}. Choose Modify Properties, Swap Bins, or Empty Bin.`)
      return
    }

    // If we're on the brick info page but no operation is selected, ignore bin clicks (force user to choose operation first)
    if (page === BRICK_INFO && !binOperation) {
      return
    }

    // Clicking the same bin again deselects it (only in browsing mode)
    const clickingSameBin = newBinId === selectedBinId

    // No brick, no operation → normal bin browsing
    if (!brick && !binOperation) {
      if (clickingSameBin) {
        console.log('Deselecting bin, returning home')
        resetToHome()
        return
      }

      console.log('Selecting bin for browsing')

      setSelectedBinId(newBinId)

      try {
        const res = await getBinContents(newBinId)
        const items = Array.isArray(res) ? res : (res.items ?? [])
        console.log('Bin contents:', items, 'properties:', res.properties)
        setCurrentBinContents(items)
        setBinPropertyMap(prev => ({ ...prev, [newBinId]: res.properties ?? [] }))
        if (items.length === 0) {
          setHelperText(`Bin ${newBinId} is empty`)
          setPage(OPTION_CARDS)
          return
        } else {
          setHelperText('')
        }
      } catch (err) {
        console.error('Failed to fetch bin contents', err)
        setCurrentBinContents([])
        setHelperText('Unable to load bin contents')
      }

      setHelperText(`Select a brick from bin ${newBinId} or click Close to return home.`)
      setPage(SELECT_PAGE)
      
      return
    }


    // Brick selected, no operation → visual select only
    if (brick && !binOperation) {
      console.log('Brick selected, no operation yet – selecting bin visually')
      setSelectedBinId(newBinId)
      return
    }

    // Brick + operation → perform add/remove
    if (brick && binOperation) {
      console.log(`Performing ${binOperation} on bin ${newBinId}`)

      try {
        await operateBin({
          operation: binOperation,
          binId: newBinId,
          partId: brick.part_num,
          categoryId: brick.part_cat_id
        })

        // Keep UI in sync
        setHighlightedBinIds(prev => {
          if (binOperation === 'add') {
            return prev.includes(newBinId) ? prev : [...prev, newBinId]
          }
          if (binOperation === 'remove') {
            return prev.filter(id => id !== newBinId)
          }
          return prev
        })
      } catch (err) {
        console.error('Bin operation failed:', err)
      }

      // Clear operation state
      setBinOperation(null)
      setSelectedBinId(null)
      return
    }
  }

  function brickCallback (bricks) {
    if (!bricks || bricks.length === 0) return
    setBrickList(bricks)
    setPage(SELECT_PAGE)
  }

  async function selectCallback (selectedBrick) {
    console.log('[selectCallback] Called with brick data:', selectedBrick)
    setSelectedBinId(null)
    setBrick(selectedBrick)
    setBinOperation(null)
    setBrickList([])
    setHelperText('')


    try {
      console.log('[selectCallback] Fetching bins for brick:', selectedBrick.part_num, 'name:', selectedBrick.name, 'cat_id:', selectedBrick.part_cat_id)

      const bins = await getBinsByBrick(selectedBrick.part_num)

      console.log('Brick found in bins:', bins)
      setHighlightedBinIds(bins)
    } catch (err) {
      console.error('Failed to fetch bins for brick', err)
      setHighlightedBinIds([])
    }
    setHelperText(`Choose an operation or click Close to return home.`)
    setPage(BRICK_INFO)
  }

  async function onBricksIdentified (bricks) {
    console.log('[onBricksIdentified] Called with', bricks?.length, 'bricks:', bricks)
    if (!bricks || bricks.length === 0) {
      console.log('[onBricksIdentified] No bricks provided')
      return
    }

    if (bricks.length > 1) {
      console.log('[onBricksIdentified] Multiple bricks detected, enriching each...')
      // For multiple bricks, enrich them with full data
      setWaiting(true)
      try {
        const enrichedBricks = await Promise.all(
          bricks.map(async (brick) => {
            console.log('[onBricksIdentified] Enriching brick:', brick.part_num)
            const fullData = await fetchBrickData(brick.part_num)
            console.log('[onBricksIdentified] Enrichment result for', brick.part_num, ':', fullData)
            return fullData || null // return null if not found (will be filtered out)
          })
        )
        
        // Filter out null values (parts not in database)
        const validBricks = enrichedBricks.filter(b => b !== null)
        
        if (validBricks.length === 0) {
          setHelperText('No identified parts found in database. Try again.')
          setPage(OPTION_CARDS)
          setWaiting(false)
          return
        }
        
        // Testing change - always show select page, even if only one valid brick, to let user confirm which one they want and see details
        //if (validBricks.length === 1) {
          // Only one valid brick - select it directly
        //  selectCallback(validBricks[0])
        //} else {
          // Multiple valid bricks - show selection
          setBrickList(validBricks)
          setPage(SELECT_PAGE)
        //}

      } catch (err) {
        console.error('Error enriching brick data:', err)
        setHelperText('Error loading brick data')
        setPage(OPTION_CARDS)
      } finally {
        setWaiting(false)
      }
    } 
    else {
      // For single brick, fetch full data then select
      console.log('[onBricksIdentified] Single brick detected:', bricks[0])
      setWaiting(true)
      try {
        const originalPart = bricks[0].part_num
        console.log('[onBricksIdentified] Enriching single brick:', originalPart)
        const fullData = await fetchBrickData(originalPart)
        console.log('[onBricksIdentified] Enrichment result:', fullData)
        
        if (fullData) {
          console.log('[onBricksIdentified] Valid data received, calling selectCallback')
          selectCallback(fullData)
        } else {
          console.warn(`[onBricksIdentified] Brick ${originalPart} enrichment returned null/empty`)
          setHelperText(`Part #${originalPart} not found in database. Try another brick.`)
          setPage(OPTION_CARDS)
        }
      } catch (err) {
        console.error('[onBricksIdentified] Error fetching brick data:', err)
        setHelperText(`Error loading part details`)
        setPage(OPTION_CARDS)
      } finally {
        setWaiting(false)
      }
    }
  }

  // Pass operationStatus to Table
  const getPage = () => {

    if (page === SELECT_PAGE)
      return (
        <Select
          initialBricks={brickList.length ? brickList : null}
          partIds={!brickList.length ? currentBinContents : []}
          selectCallback={selectCallback}
          onClose={resetToHome}
        />
      )
    if (page === BRICK_INFO)
      return (
        <BrickInfo
          brick={brick}
          selectedOperation={binOperation}
          onOperationSelect={setBinOperation}
          onClose={resetToHome}
        />
      )

    if (page === OPTION_CARDS)
      return (
        <div className='top-panel-row'>

          {/* Card 1: two dropdowns */}
          <CategoryCard
            resetTrigger={dropdownResetTrigger}
            onCategorySelect={handleCategorySelect}
          />
          
          {/* Card 2: part number search */}
          <OptionCard iconSrc='/icons/typewriter.png'>
            <form
              onSubmit={e => {
                e.preventDefault()       // prevent page reload
                handleExactPartSearch()  // trigger same logic as button
              }}
            >
              <input
                ref={searchInputRef}
                className='w3-input w3-border'
                placeholder='Enter part #'
                value={searchQuery}
                onFocus={() => setKeyboardVisible(true)}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <button
                type='submit'
                className='ui-button blue'
                disabled={waiting || !searchQuery.trim()}
                style={{ width: '100%', marginTop: '4px' }}
              >
                Search Part
              </button>
            </form>
          </OptionCard>

          <OnScreenKeyboard
            visible={keyboardVisible}
            inputRef={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onEnter={handleExactPartSearch}
            onClose={() => setKeyboardVisible(false)}
            containerRef={keyboardContainerRef}
          />

          {/* Card 3: action button */}
          <OptionCard
            iconSrc="/icons/cam.png"
            onClick={() => cameraRef.current?.triggerCapture()}
          >
            <strong>Find Brick</strong>
          </OptionCard>

          <Camera
            ref={cameraRef}
            onBricksIdentified={onBricksIdentified}
          />
        </div>
      )
  }

  // Search for exact part number and show like camera results
  async function handleExactPartSearch () {
    setDropdownResetTrigger(prev => prev + 1) 
    if (!searchQuery.trim()) {
      alert('Please enter a part number')
      return
    }

    setWaiting(true)

    try {
      const part = await fetchBrickData(searchQuery, 1.0)

      if (part) {
        // Funnel through Select logic like camera results
        brickCallback([part])
      } else {
        setHelperText(`Part #${searchQuery} not found`)
      }
    } catch (err) {
      console.error('Error searching part:', err)
      alert('Error searching for part')
    } finally {
      setWaiting(false)
    }
  }

  const binDisplayMode = (() => {
    if (brick && binOperation === 'remove') return 'REMOVE'
    if (brick && binOperation === 'add') return 'ADD'
    if (brick || selectedCategoryIds.length) return 'FILTER'
    if (selectedBinId) return 'SELECT'
    return 'DEFAULT'
  })()

  // Clear everything and start over, equivalent to page refresh
  function resetToHome () {
    setBrick(null)
    setHighlightedBinIds([])
    setBrickList([])
    setBinOperation(null)
    setSearchQuery('')
    setHelperText('Select a bin or click an option above to get started')
    setSelectedBinId(null)
    setPage(OPTION_CARDS)
    setCurrentBinContents([])
  }

  function toggleAdminMode () {
    setAdminMode(prev => {
      const next = !prev
      if (next) {
        setHelperText('Admin mode active. Click a bin to manage it.')
      } else {
        setHelperText('Select a bin or click an option above to get started')
        setAdminAction(null)
        setAdminBinId(null)
        setShowPropertyHighlights(false)
        setSwapSelection([])
      }
      return next
    })
  }

  function togglePropertyHighlights () {
    setShowPropertyHighlights(prev => !prev)
  }

  function setAdminActionMode (action) {
    setAdminAction(action)
    if (action === 'modify-properties') {
      setAdminPropertySelection(binPropertyMap[adminBinId] ?? [])
      setHelperText(`Modify properties on ${adminBinId}. Toggle options and apply.`)
    }
    if (action === 'swap-bins') {
      setSwapSelection([adminBinId])
      setHelperText(`Swap ${adminBinId} with another bin. Click a second bin to continue.`)
    }
  }

  function toggleAdminProperty (propertyId) {
    setAdminPropertySelection(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId)
      }
      return [...prev, propertyId]
    })
  }

  async function applyAdminProperties () {
    if (!adminBinId) return
    setWaiting(true)
    try {
      await updateBinProperties({ binId: adminBinId, properties: adminPropertySelection })
      await refreshBinProperties()
      setAdminAction(null)
      setHelperText(`Properties updated for ${adminBinId}`)
    } catch (err) {
      console.error('Failed to update properties', err)
      alert('Unable to save properties')
    } finally {
      setWaiting(false)
    }
  }

  async function cancelAdminAction () {
    setAdminAction(null)
    setSwapSelection([])
    if (adminBinId) {
      setHelperText(`Admin selected bin ${adminBinId}. Choose Modify Properties, Swap Bins, or Empty Bin.`)
    } else {
      setHelperText('Admin mode active. Click a bin to manage it.')
    }
  }

  async function refreshBinProperties () {
    try {
      const bins = await getAllBins()
      const mapped = Object.fromEntries(
        Object.entries(bins).map(([binId, bin]) => [binId, Array.isArray(bin.properties) ? bin.properties : []])
      )
      setBinPropertyMap(mapped)
    } catch (err) {
      console.error('Failed to refresh bin properties', err)
    }
  }

  async function confirmAdminSwap () {
    if (swapSelection.length !== 2) {
      alert('Select two bins to swap')
      return
    }

    const [a, b] = swapSelection
    const ok = window.confirm(`Swap contents of ${a} ⇄ ${b}?`)
    if (!ok) return

    setWaiting(true)
    try {
      const resA = await getBinContents(a)
      const resB = await getBinContents(b)
      const contentsA = Array.isArray(resA) ? resA : (resA.items ?? [])
      const contentsB = Array.isArray(resB) ? resB : (resB.items ?? [])

      for (const part of contentsA) {
        try { await operateBin({ operation: 'add', binId: b, partId: part }) } catch (err) { console.error('Add failed', err) }
      }
      for (const part of contentsB) {
        try { await operateBin({ operation: 'add', binId: a, partId: part }) } catch (err) { console.error('Add failed', err) }
      }
      for (const part of contentsA) {
        try { await operateBin({ operation: 'remove', binId: a, partId: part }) } catch (err) { console.error('Remove failed', err) }
      }
      for (const part of contentsB) {
        try { await operateBin({ operation: 'remove', binId: b, partId: part }) } catch (err) { console.error('Remove failed', err) }
      }

      await refreshBinProperties()
      alert('Swap complete')
      setSwapSelection([])
      setAdminAction(null)
      setHelperText(`Swapped ${a} and ${b}`)
    } catch (err) {
      console.error('Swap failed', err)
      alert('Swap failed — see console')
    } finally {
      setWaiting(false)
    }
  }

  async function handleEmptyBin () {
    if (!adminBinId) return
    const ok = window.confirm(`Empty bin ${adminBinId} and set property Empty?`)
    if (!ok) return

    setWaiting(true)
    try {
      await emptyBin(adminBinId)
      await refreshBinProperties()
      if (selectedBinId === adminBinId) {
        setCurrentBinContents([])
      }
      setAdminAction(null)
      setHelperText(`Bin ${adminBinId} emptied and marked Empty`)
    } catch (err) {
      console.error('Empty bin failed', err)
      alert('Unable to empty bin')
    } finally {
      setWaiting(false)
    }
  }

  return (
    <div className='App w3-theme-light'>
      <div className='top-panel'>
        {getPage()}
      </div>
      <div className="helper-text">
        {helperText}
      </div>
      {/* Bottom controls: property assignment and swap */}
      <div className="bottom-controls" style={{ padding: '8px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <button className={`ui-button ${adminMode ? 'blue' : ''}`} onClick={toggleAdminMode}>
          {adminMode ? 'Exit Admin Mode' : 'Enter Admin Mode'}
        </button>

        {adminMode && (
          <>
            <button className={`ui-button ${showPropertyHighlights ? 'blue' : ''}`} onClick={togglePropertyHighlights}>
              {showPropertyHighlights ? 'Hide Property Highlights' : 'Show Property Highlights'}
            </button>

            {adminBinId && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span><strong>Bin:</strong> {adminBinId}</span>
                <button className='ui-button' onClick={() => setAdminActionMode('modify-properties')}>Modify Properties</button>
                <button className='ui-button' onClick={() => setAdminActionMode('swap-bins')}>Swap Bins</button>
                <button className='ui-button' onClick={handleEmptyBin}>Empty Bin</button>
                <button className='ui-button' onClick={cancelAdminAction}>Clear</button>
              </div>
              <div style={{ width: '100%', marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <strong>Current Properties:</strong>
                {(binPropertyMap[adminBinId] ?? []).length === 0 ? (
                  <span>None</span>
                ) : (
                  (binPropertyMap[adminBinId] ?? []).map(propId => {
                    const prop = BIN_PROPERTIES.find(p => p.id === propId)
                    return (
                      <span key={propId} className='property-badge'>
                        {prop ? prop.label : propId}
                      </span>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {adminMode && adminAction === 'modify-properties' && adminBinId && (
        <div className='admin-panel' style={{ padding: '10px 20px', margin: '10px 20px', border: '1px solid #ccc', borderRadius: 12, background: '#fafafa' }}>
          <strong>Modify properties for {adminBinId}</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 10 }}>
            {BIN_PROPERTIES.map(prop => (
              <button
                key={prop.id}
                className={`ui-button ${adminPropertySelection.includes(prop.id) ? 'blue' : ''}`}
                onClick={() => toggleAdminProperty(prop.id)}
                style={{ padding: '6px 8px' }}
              >
                {prop.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: '8px' }}>
            <button className='ui-button blue' onClick={applyAdminProperties}>Apply Properties</button>
            <button className='ui-button' onClick={cancelAdminAction}>Cancel</button>
          </div>
        </div>
      )}

      {adminMode && adminAction === 'swap-bins' && (
        <div className='admin-panel' style={{ padding: '10px 20px', margin: '10px 20px', border: '1px solid #ccc', borderRadius: 12, background: '#fafafa' }}>
          <strong>Swap bins</strong>
          <div style={{ marginTop: 10 }}>
            {swapSelection.length === 1
              ? `Selected source: ${swapSelection[0]}. Click a second bin to choose the destination.`
              : `Selected bins: ${swapSelection.join(' ↔ ')}`}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {swapSelection.length === 2 && (
              <button className='ui-button blue' onClick={confirmAdminSwap}>Confirm Swap</button>
            )}
            <button className='ui-button' onClick={cancelAdminAction}>Cancel</button>
          </div>
        </div>
      )}

      <Table
        onBinClick={onBinClicked}
        selectedBinId={adminMode ? adminBinId : selectedBinId}
        highlightedBinIds={highlightedBinIds}
        displayMode={binDisplayMode}
        // pass property defs and assignments so Table can render extra classes
        propertyDefs={BIN_PROPERTIES}
        propertyMap={binPropertyMap}
        showPropertyClasses={adminMode && showPropertyHighlights}
      />

    </div>
  )
}
export default App
