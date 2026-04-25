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
import { getBinsByBrick, getBinsbyCategory, operateBin, getBinContents } from '../services/binService'

// =====================
// PAGE CONSTANTS
// =====================
// These define which top panel view is shown
const SELECT_PAGE = 1      // Shows a list of bricks to select from
const OPTION_CARDS = 2     // Shows the main menu with search, category filter, and camera options
const BRICK_INFO = 3       // Shows details of a selected brick with Add/Remove bin operations

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
      brick
    })

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
        const contents = await getBinContents(newBinId)
        console.log('Bin contents:', contents)
        setCurrentBinContents(contents)
        if (contents.length === 0) {
          setHelperText(`Bin ${newBinId} is empty`)
          setPage(OPTION_CARDS)
          return
        } 
        else {
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

  return (
    <div className='App w3-theme-light'>
      <div className='top-panel'>
        {getPage()}
      </div>
      <div className="helper-text">
        {helperText}
      </div>
      <Table
        onBinClick={onBinClicked}
        selectedBinId={selectedBinId}
        highlightedBinIds={highlightedBinIds}
        displayMode={binDisplayMode}
      />

    </div>
  )
}
export default App
