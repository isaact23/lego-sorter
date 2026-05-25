import './App.css'
import './Button.css'
import brick2x2 from '../assets/brick-loading-transparent.png'

import Camera from '../components/Camera'
import Select from '../components/Select'
import Table from '../components/Table'
import BrickInfo from '../components/BrickInfo'
import SearchPanel from '../components/SearchPanel'
import FilterPanel from '../components/FilterPanel'
import OnScreenKeyboard from '../components/OnScreenKeyboard'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

import SetBinPanel from '../components/SetBinPanel'
import RecentDrawer from '../components/RecentDrawer'

import { fetchBrickData } from '../services/brickService'
import { getSetBins } from '../services/setService'
import {
  getBinsByBrick,
  getBinsbyCategory,
  getAllBins,
  getBinContents,
  operateBin,
  updateBinProperties,
  emptyBin
} from '../services/binService'
import { fetchSystems } from '../services/systemsService'

// ─── Toolbar icons (consistent stroke-based linework) ───────────────────────
const IC = { strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none', stroke: 'currentColor' }
const IconCamera   = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><rect x="1" y="7" width="22" height="15" rx="2"/><path d="M16 7l-1.5-4h-5L8 7"/><circle cx="12" cy="14.5" r="3.5"/></svg>
const IconSearch   = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><circle cx="11" cy="11" r="7.5"/><line x1="17" y1="17" x2="22" y2="22"/></svg>
const IconFilter   = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const IconHelp     = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a3 3 0 015.5 1c0 2.5-3 3-3 3"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/></svg>
const IconSettings = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const IconChevron  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const IconRefresh  = () => <svg width="22" height="22" viewBox="0 0 24 24" {...IC}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IconChevronLeft  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>

// ─── Set progress + recent searches (localStorage) ─────────────────────────
function saveSetProgress (setNum, keys) {
  try { localStorage.setItem(`lego_prog_${setNum}`, JSON.stringify(keys)) } catch {}
}
function loadSetProgress (setNum) {
  try { return JSON.parse(localStorage.getItem(`lego_prog_${setNum}`)) ?? [] } catch { return [] }
}
function clearSetProgress (setNum) {
  try { localStorage.removeItem(`lego_prog_${setNum}`) } catch {}
}
function addRecentItem (item) {
  try {
    const prev = getRecentItems()
    const deduped = prev.filter(i => !(i.type === item.type && i.id === item.id))
    localStorage.setItem('lego_recent', JSON.stringify([item, ...deduped].slice(0, 5)))
  } catch {}
}
function getRecentItems () {
  try { return JSON.parse(localStorage.getItem('lego_recent')) ?? [] } catch { return [] }
}

// Drop the system prefix (first segment) from any bin ID:
//   "A-B-1" → "B-1"   (unit-mode, 3 segments)
//   "B-L1"  → "L1"    (direct-bin mode, 2 segments)
function displayBinId (binId) {
  if (!binId) return binId
  const dash = binId.indexOf('-')
  return dash === -1 ? binId : binId.slice(dash + 1)
}

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
  const [helperText, setHelperText] = useState('Tap a bin to see what\'s inside, or use the buttons above to find a piece!')
  const [showHelperPopup, setShowHelperPopup] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)  // On-screen keyboard for part# search
  const [toolbarOpen, setToolbarOpen] = useState(true)           // Whether toolbar drawer is expanded
  const [activeSystemIndex, setActiveSystemIndex] = useState(0)  // Which storage system is shown
  const [systems, setSystems] = useState([])
  const [unitTypes, setUnitTypes] = useState({})

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
  const [adminBinId, setAdminBinId] = useState(null)
  const [adminAction, setAdminAction] = useState(null)
  const [adminPropertySelection, setAdminPropertySelection] = useState([])
  const [swapSelection, setSwapSelection] = useState([])

  // =====================
  // SEARCH/FILTER STATE
  // =====================
  const [searchQuery, setSearchQuery] = useState('')                    // Text in the part# search box
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])    // Category IDs selected in filter
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([])  // Human-readable labels for active filter
  const [dropdownResetTrigger, setDropdownResetTrigger] = useState(0)   // Used to reset category dropdowns
  const [showSearchPanel, setShowSearchPanel] = useState(false)         // Toggle search panel visibility
  const [emptyBinMsg, setEmptyBinMsg] = useState(null)                  // Message shown when an empty bin is clicked
  const [showFilterPanel, setShowFilterPanel] = useState(false)         // Toggle category filter panel visibility
  const [searchError, setSearchError] = useState(null)                  // Inline error shown in SearchPanel
  const [searchDisambig, setSearchDisambig] = useState(null)            // { query, part } when both part+set match

  // =====================
  // SET BROWSE STATE
  // =====================
  const [setMode, setSetMode] = useState(false)                         // Whether we're in set browse mode
  const [setInfo, setSetInfo] = useState(null)                          // { name, set_img_url } for the active set
  const [setBinPartsMap, setSetBinPartsMap] = useState({})              // { binId: [{part_num, name, quantity, colorId, ...}] }
  const [pulledPartKeys, setPulledPartKeys] = useState([])              // "${part_num}-${colorId}" for each pulled part
  const [activeSetNum, setActiveSetNum] = useState(null)                // Canonical set number (e.g. "2064-1") while in set mode
  const [recentItems, setRecentItems] = useState(() => getRecentItems())
  const [toast, setToast] = useState(null)
  const [cameraNotice, setCameraNotice] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // =====================
  // REFS
  // =====================
  const cameraRef = useRef()
  const searchInputRef = useRef(null)
  const keyboardContainerRef = useRef(null)
  const searchToggleRef = useRef(null)
  const filterToggleRef = useRef(null)
  const searchExemptRefs = useMemo(() => [keyboardContainerRef], [])
  const toastTimerRef = useRef(null)
  const touchStartXRef = useRef(null)


  
  const handleCategorySelect = useCallback((payload) => {
    const ids = payload?.ids ?? []
    const labels = payload?.labels ?? []

    if (ids.length > 0) {
      setBrick(null)
      setBrickList([])
      setBinOperation(null)
      setSelectedBinId(null)
      setCurrentBinContents([])
      setHighlightedBinIds([])
      setPage(OPTION_CARDS)
      setSearchQuery('')
      setHelperText(`Showing bins with ${labels.join(' › ')} pieces — tap a glowing bin!`)
      setSelectedCategoryLabels(labels)
    } else {
      setHelperText('Tap a bin to see what\'s inside, or use the buttons above to find a piece!')
      setSelectedCategoryLabels([])
    }

    setSelectedCategoryIds(ids)
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

  // Load systems config from API on mount; fall back to static defaults if unavailable
  useEffect(() => {
    fetchSystems()
      .then(data => {
        if (data.systems)   setSystems(data.systems)
        if (data.unitTypes) setUnitTypes(data.unitTypes)
      })
      .catch(err => console.warn('[App] Using default systems (API unavailable):', err.message))
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

  // Auto-save set progress whenever pulled parts change
  useEffect(() => {
    if (setMode && activeSetNum) {
      saveSetProgress(activeSetNum, pulledPartKeys)
    }
  }, [pulledPartKeys, setMode, activeSetNum])

  // Handler for when a bin is clicked in the Table
  async function onBinClicked (newBinId) {
    setToolbarOpen(false)

    // Set browse mode — clicking a highlighted bin opens its parts panel
    if (setMode) {
      if (!highlightedBinIds.includes(newBinId)) return
      if (newBinId === selectedBinId) {
        setSelectedBinId(null)
        return
      }
      setSelectedBinId(newBinId)
      return
    }

    if (adminMode) {
        // If swap mode is active, select the first or second bin and wait for confirm
        if (adminAction === 'swap-bins') {
          if (swapSelection.length === 1) {
            if (swapSelection[0] === newBinId) {
              return
            }
            setSwapSelection([swapSelection[0], newBinId])
            setHelperText(`Swap target selected: ${newBinId}. Confirm or cancel below.`)
            return
          }

          setAdminBinId(newBinId)
          setSwapSelection([newBinId])
          setHelperText(`Swap source selected: ${newBinId}. Click a second bin to swap with.`)
      }

      // Clicking the currently selected admin bin deselects it (mirrors Clear button)
      if (newBinId === adminBinId) {
        cancelAdminAction()
        setSelectedBinId(null)
        setPage(OPTION_CARDS)
        setCurrentBinContents([])
        return
      }

      setAdminBinId(newBinId)
      setAdminAction(null)
      setAdminPropertySelection(binPropertyMap[newBinId] ?? [])
      setHelperText(`Admin selected bin ${newBinId}. Choose Modify Properties, Swap Bins, or Empty Bin.`)
      // allow normal bin browsing and operations to continue below
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
        resetToHome()
        return
      }

      setSelectedBinId(newBinId)

      try {
        const res = await getBinContents(newBinId)
        const items = Array.isArray(res) ? res : (res.items ?? [])
        setCurrentBinContents(items)
        setBinPropertyMap(prev => ({ ...prev, [newBinId]: res.properties ?? [] }))
        if (items.length === 0) {
          setHelperText('That bin is empty — nothing here yet!')
          setEmptyBinMsg(`Bin ${newBinId} is empty`)
          setPage(OPTION_CARDS)
          return
        } else {
          setHelperText('')
          setEmptyBinMsg(null)
        }
      } catch (err) {
        console.error('Failed to fetch bin contents', err)
        setCurrentBinContents([])
        setHelperText('Couldn\'t open that bin. Try tapping it again!')
      }

      setHelperText('Pick the piece you\'re looking for, or tap Close!')
      setPage(SELECT_PAGE)
      
      return
    }


    // Brick selected, no operation → visual select only
    if (brick && !binOperation) {
      setSelectedBinId(newBinId)
      return
    }

    // Brick + operation → perform add/remove
    if (brick && binOperation) {

      try {
        await operateBin({
          operation: binOperation,
          binId: newBinId,
          partId: brick.part_num,
          categoryId: brick.part_cat_id
        })

        showToast(binOperation === 'add' ? `Added to bin ${displayBinId(newBinId)}!` : `Removed from bin ${displayBinId(newBinId)}!`)

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
        showToast('Something went wrong — try again', 'error')
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

  const selectCallback = useCallback(async (selectedBrick) => {
    setToolbarOpen(false)
    setSelectedBinId(null)
    setBrick(selectedBrick)
    setBinOperation(null)
    setBrickList([])
    setHelperText('')

    try {
      const bins = await getBinsByBrick(selectedBrick.part_num)
      setHighlightedBinIds(bins)
    } catch (err) {
      console.error('Failed to fetch bins for brick', err)
      setHighlightedBinIds([])
    }
    setHelperText('Found it! Tap Add to Bin or Remove from Bin, or tap Close.')
    setPage(BRICK_INFO)
  }, [])

  async function onBricksIdentified (bricks) {
    setCameraNotice(null)
    if (!bricks || bricks.length === 0) return

    if (bricks.length > 1) {
      setWaiting(true)
      try {
        const enrichedBricks = await Promise.all(
          bricks.map(async (brick) => fetchBrickData(brick.part_num).catch(() => null))
        )
        const validBricks = enrichedBricks.filter(Boolean)

        if (validBricks.length === 0) {
          setCameraNotice({ message: "Couldn't find those pieces in the collection — try again!" })
          setPage(OPTION_CARDS)
          return
        }

        setBrickList(validBricks)
        setPage(SELECT_PAGE)
      } catch (err) {
        console.error('Error enriching brick data:', err)
        setCameraNotice({ message: 'Something went wrong loading that — try again!' })
        setPage(OPTION_CARDS)
      } finally {
        setWaiting(false)
      }
    } else {
      setWaiting(true)
      try {
        const fullData = await fetchBrickData(bricks[0].part_num)
        if (fullData) {
          selectCallback(fullData)
        } else {
          setCameraNotice({ message: `Part #${bricks[0].part_num} isn't in our collection — try a different brick!` })
          setPage(OPTION_CARDS)
        }
      } catch (err) {
        console.error('Error fetching brick data:', err)
        setCameraNotice({ message: 'Couldn\'t load piece info — try again!' })
        setPage(OPTION_CARDS)
      } finally {
        setWaiting(false)
      }
    }
  }

  // Pass operationStatus to Table
  const getPage = () => {

    if (setMode)
      return (
        <div className='top-panel-row'>
          <div className='Top-Panel-BrickInfo'>
            {setInfo?.set_img_url && (
              <div className='BrickImageFrame'>
                <img src={setInfo.set_img_url} alt={setInfo.name} />
              </div>
            )}
            <div className='BrickText'>
              <h2 style={{ fontSize: '1rem', marginBottom: 4 }}>Building Set {setInfo ? setInfo.name : ''}</h2>
              <p>{Object.keys(setBinPartsMap).length} bins &nbsp;·&nbsp; {pulledBinIds.length} done</p>
            </div>
            <div className='BrickActions'>
              <button className='ui-button red' onClick={handleResetSet}>Reset</button>
              <button className='ui-button blue' onClick={resetToHome}>Done</button>
            </div>
          </div>
        </div>
      )

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
      return <div className='top-panel-row' />
  }

  // Shared helper: open a set that has already been fetched
  function openSetData (query, setData) {
    setToolbarOpen(false)
    const canonical = query.includes('-') ? query : `${query}-1`
    const savedProgress = loadSetProgress(canonical)
    addRecentItem({ type: 'set', id: canonical, name: setData.setInfo?.name, img_url: setData.setInfo?.set_img_url, timestamp: Date.now() })
    setRecentItems(getRecentItems())
    setSetMode(true)
    setActiveSetNum(canonical)
    setSetInfo(setData.setInfo ?? null)
    setSetBinPartsMap(setData.binPartsMap)
    setHighlightedBinIds(setData.binIds)
    setPulledPartKeys(savedProgress)
    setSelectedBinId(null)
    setShowSearchPanel(false)
    setSearchDisambig(null)
  }

  // Search for exact part or set number. queryOverride bypasses the input (used by recent drawer).
  async function handleExactPartSearch (queryOverride) {
    const query = (queryOverride !== undefined ? queryOverride : searchQuery).trim()
    setDropdownResetTrigger(prev => prev + 1)
    if (!query) return

    setWaiting(true)
    setSearchError(null)
    setSearchDisambig(null)

    try {
      const part = await fetchBrickData(query, 1.0)
      const couldBeSet = /^\d+$/.test(query)  // pure digits are ambiguous

      if (part && couldBeSet) {
        // Run set lookup in parallel — if it succeeds, ask the user which they meant
        try {
          const setData = await getSetBins(query)
          if (setData?.binIds?.length > 0) {
            setSearchDisambig({ query, partName: part.name, part, setData })
            return
          }
        } catch { /* set 404 or error — fall through to part */ }
        // Set lookup failed — safe to commit to part
        setShowSearchPanel(false)
        setKeyboardVisible(false)
        setToolbarOpen(false)
        brickCallback([part])
        return
      }

      if (part) {
        setShowSearchPanel(false)
        setKeyboardVisible(false)
        setToolbarOpen(false)
        brickCallback([part])
        return
      }

      // Not a part — try as set number
      try {
        const setData = await getSetBins(query)
        if (setData?.binIds?.length > 0) {
          openSetData(query, setData)
        } else {
          setSearchError(`Set ${query} found, but none of those pieces are in your bins yet.`)
        }
      } catch (setErr) {
        const status = setErr.response?.status
        if (status === 404) {
          setSearchError(`"${query}" isn't a part number or set number we know.`)
        } else {
          setSearchError('Couldn\'t look that up — check your connection!')
        }
      }
    } catch (err) {
      console.error('Error searching:', err)
      setSearchError('Something went wrong. Try again!')
    } finally {
      setWaiting(false)
    }
  }

  // Disambiguation: user chose the part result
  function handleDisambigPart () {
    const { part } = searchDisambig
    setSearchDisambig(null)
    setShowSearchPanel(false)
    brickCallback([part])
  }

  // Disambiguation: user chose the set result
  function handleDisambigSet () {
    const { query, setData } = searchDisambig
    openSetData(query, setData)
  }

  // Derive per-bin completion state from pulled parts
  const { pulledBinIds, partialBinIds } = useMemo(() => {
    const pulledSet = new Set(pulledPartKeys)
    const pulled = [], partial = []
    for (const [binId, parts] of Object.entries(setBinPartsMap)) {
      const count = parts.filter(p => pulledSet.has(`${p.part_num}-${p.colorId}`)).length
      if (count === parts.length) pulled.push(binId)
      else if (count > 0) partial.push(binId)
    }
    return { pulledBinIds: pulled, partialBinIds: partial }
  }, [pulledPartKeys, setBinPartsMap])

  const binDisplayMode = (() => {
    if (setMode) return 'SET_BROWSE'
    if (brick && binOperation === 'remove') return 'REMOVE'
    if (brick && binOperation === 'add') return 'ADD'
    if (brick || selectedCategoryIds.length) return 'FILTER'
    if (selectedBinId) return 'SELECT'
    return 'DEFAULT'
  })()

  // Navigate between storage systems (circular)
  function navigateSystem (direction) {
    setActiveSystemIndex(prev =>
      direction === 'left'
        ? (prev - 1 + systems.length) % systems.length
        : (prev + 1) % systems.length
    )
    setSelectedBinId(null)
    setEmptyBinMsg(null)
  }

  function showToast (message, type = 'success') {
    clearTimeout(toastTimerRef.current)
    setToast({ message, type, id: Date.now() })
    toastTimerRef.current = setTimeout(() => setToast(null), 2500)
  }

  function showConfirm (message, onConfirm, opts = {}) {
    setConfirmModal({ message, onConfirm, ...opts })
  }

  function handleTouchStart (e) {
    touchStartXRef.current = e.touches[0].clientX
  }

  function handleTouchEnd (e) {
    if (touchStartXRef.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null
    if (Math.abs(delta) < 50) return
    navigateSystem(delta < 0 ? 'right' : 'left')
  }

  // Clear everything and start over. Progress stays in localStorage so it can be resumed.
  function resetToHome () {
    setBrick(null)
    setHighlightedBinIds([])
    setBrickList([])
    setBinOperation(null)
    setSearchQuery('')
    setHelperText('Tap a bin to see what\'s inside, or use the buttons above to find a piece!')
    setSelectedBinId(null)
    setPage(OPTION_CARDS)
    setCurrentBinContents([])
    setSelectedCategoryIds([])
    setSelectedCategoryLabels([])
    setDropdownResetTrigger(prev => prev + 1)
    setShowFilterPanel(false)
    setSetMode(false)
    setActiveSetNum(null)
    setSetInfo(null)
    setSetBinPartsMap({})
    setPulledPartKeys([])
    setSearchError(null)
    setEmptyBinMsg(null)
    setCameraNotice(null)
    setShowSearchPanel(false)
    setToolbarOpen(true)
  }

  // Reset set progress (clears localStorage) and restart from zero
  function handleResetSet () {
    if (activeSetNum) clearSetProgress(activeSetNum)
    setPulledPartKeys([])
  }

  function toggleAdminMode () {
    setAdminMode(prev => {
      const next = !prev
      if (next) {
        setHelperText('Admin mode active. Click a bin to manage it.')
      } else {
        setHelperText('Tap a bin to see what\'s inside, or use the buttons above to find a piece!')
        setAdminAction(null)
        setAdminBinId(null)
        setSwapSelection([])
      }
      return next
    })
  }

  function toggleHelperPopup () {
    setShowHelperPopup(prev => !prev)
  }

  function closeHelperPopup () {
    setShowHelperPopup(false)
  }

  function setAdminActionMode (action) {
    setAdminAction(action)
    if (action === 'modify-properties') {
      setAdminPropertySelection(binPropertyMap[adminBinId] ?? [])
      setHelperText(`Modify properties on ${adminBinId}. Toggle options and apply.`)
    }
    if (action === 'swap-bins') {
      if (adminBinId) {
        setSwapSelection([adminBinId])
        setHelperText(`Swap ${adminBinId} with another bin. Click a second bin to continue.`)
      } else {
        setSwapSelection([])
        setHelperText('Select the first bin to swap, then select the second bin.')
      }
    }
  }

  function toggleAdminProperty (propertyId) {
    if (!adminBinId) return
    
    // Check if this property is currently selected
    const currentProperties = binPropertyMap[adminBinId] ?? []
    const isCurrentlySelected = currentProperties.includes(propertyId)
    
    // If clicking the selected property, deselect it. Otherwise, replace with new property.
    const newProperties = isCurrentlySelected ? [] : [propertyId]
    
    // Apply immediately
    updateBinProperties({ binId: adminBinId, properties: newProperties })
      .then(() => refreshBinProperties())
      .catch(err => {
        console.error('Failed to update property', err)
        showToast('Unable to save — try again', 'error')
      })
  }

  async function applyAdminProperties () {
    if (!adminBinId) return
    setWaiting(true)
    try {
      await updateBinProperties({ binId: adminBinId, properties: adminPropertySelection })
      await refreshBinProperties()
      setAdminAction(null)
      showToast('Properties updated!')
    } catch (err) {
      console.error('Failed to update properties', err)
      showToast('Unable to save — try again', 'error')
    } finally {
      setWaiting(false)
    }
  }

  async function cancelAdminAction () {
    setAdminAction(null)
    setSwapSelection([])
    setAdminBinId(null)
    setAdminPropertySelection([])
    setHelperText('Admin mode active. Click a bin to manage it.')
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
      showToast('Select two bins to swap', 'error')
      return
    }

    const [a, b] = swapSelection
    showConfirm(
      `Swap the contents of bin ${displayBinId(a)} with bin ${displayBinId(b)}?`,
      async () => {
        setWaiting(true)
        try {
          const resA = await getBinContents(a)
          const resB = await getBinContents(b)
          const contentsA = Array.isArray(resA.details)
            ? resA.details
            : Array.isArray(resA.items)
              ? resA.items.map(partId => ({ partId, categoryId: undefined }))
              : []
          const contentsB = Array.isArray(resB.details)
            ? resB.details
            : Array.isArray(resB.items)
              ? resB.items.map(partId => ({ partId, categoryId: undefined }))
              : []

          for (const part of contentsA) {
            try { await operateBin({ operation: 'add', binId: b, partId: part.partId, categoryId: part.categoryId }) } catch (err) { console.error('Add failed', err) }
          }
          for (const part of contentsB) {
            try { await operateBin({ operation: 'add', binId: a, partId: part.partId, categoryId: part.categoryId }) } catch (err) { console.error('Add failed', err) }
          }
          for (const part of contentsA) {
            try { await operateBin({ operation: 'remove', binId: a, partId: part.partId, categoryId: part.categoryId }) } catch (err) { console.error('Remove failed', err) }
          }
          for (const part of contentsB) {
            try { await operateBin({ operation: 'remove', binId: b, partId: part.partId, categoryId: part.categoryId }) } catch (err) { console.error('Remove failed', err) }
          }

          await refreshBinProperties()
          showToast(`Swapped bins ${displayBinId(a)} and ${displayBinId(b)}!`)
          setSwapSelection([])
          setAdminAction(null)
          setHelperText(`Swapped ${a} and ${b}`)
        } catch (err) {
          console.error('Swap failed', err)
          showToast('Swap failed — try again', 'error')
        } finally {
          setWaiting(false)
        }
      },
      { confirmLabel: 'Swap', confirmClass: 'blue' }
    )
  }

  async function handleEmptyBin () {
    if (!adminBinId) return
    showConfirm(
      `Empty bin ${displayBinId(adminBinId)}? This will remove all pieces from it.`,
      async () => {
        setWaiting(true)
        try {
          await emptyBin(adminBinId)
          await refreshBinProperties()
          if (selectedBinId === adminBinId) {
            setCurrentBinContents([])
          }
          setAdminAction(null)
          showToast(`Bin ${displayBinId(adminBinId)} emptied`)
          setHelperText(`Bin ${adminBinId} emptied and marked Empty`)
        } catch (err) {
          console.error('Empty bin failed', err)
          showToast('Couldn\'t empty that bin', 'error')
        } finally {
          setWaiting(false)
        }
      },
      { confirmLabel: 'Empty It', confirmClass: 'red' }
    )
  }

  return (
    <div className='App w3-theme-light'>
      <div className={`toolbar-drawer${toolbarOpen ? ' open' : ''}`}>
        <button className='toolbar-handle' onClick={() => setToolbarOpen(prev => !prev)} aria-label='Toggle toolbar'>
          <IconChevron />
        </button>
        <div className='toolbar-buttons'>
          <button className='toolbar-btn' onClick={() => { resetToHome(); cameraRef.current?.triggerCapture(); setToolbarOpen(false) }} aria-label='Capture with camera'><IconCamera /></button>
          <button
            ref={searchToggleRef}
            className={`toolbar-btn${showSearchPanel ? ' active active-search' : ''}`}
            onClick={() => {
              if (showSearchPanel) {
                setShowSearchPanel(false)
                setKeyboardVisible(false)
              } else {
                resetToHome()
                setShowSearchPanel(true)
                setShowFilterPanel(false)
              }
              setToolbarOpen(false)
            }}
            aria-label='Toggle search'
          ><IconSearch /></button>
          <button
            ref={filterToggleRef}
            className={`toolbar-btn${selectedCategoryIds.length || showFilterPanel ? ' active active-search' : ''}`}
            onClick={() => {
              if (selectedCategoryIds.length) {
                setSelectedCategoryIds([])
                setDropdownResetTrigger(prev => prev + 1)
                setShowFilterPanel(false)
              } else {
                resetToHome()
                setShowFilterPanel(prev => !prev)
                setShowSearchPanel(false)
              }
              setToolbarOpen(false)
              setKeyboardVisible(false)
            }}
            aria-label='Toggle category filter'
          ><IconFilter /></button>
          <div className='toolbar-sep' />
          <button className={`toolbar-btn${showHelperPopup ? ' active active-help' : ''}`} onClick={() => { toggleHelperPopup(); setToolbarOpen(false) }} aria-label='Show help'><IconHelp /></button>
          <button
            className={`toolbar-btn${adminMode ? ' active active-admin' : ''}`}
            onClick={() => {
              if (!adminMode) resetToHome()
              toggleAdminMode()
              setToolbarOpen(false)
            }}
            aria-label='Toggle admin mode'
          ><IconSettings /></button>
          <div className='toolbar-sep' />
          <button className='toolbar-btn' onClick={() => window.location.reload()} aria-label='Refresh page'><IconRefresh /></button>
        </div>
      </div>
      <div className='top-panel'>
        {(() => {
          if (setMode) return null
          if (page === BRICK_INFO) return <div className='panel-context-label'>Brick Info:</div>
          if (page === SELECT_PAGE && selectedBinId) return <div className='panel-context-label'>Bin {displayBinId(selectedBinId)} Contents:</div>
          if (page === SELECT_PAGE) return <div className='panel-context-label'>Photo Results:</div>
          if (emptyBinMsg && selectedBinId) return <div className='panel-context-label'>Bin {displayBinId(selectedBinId)} is empty</div>
          if (page === OPTION_CARDS) return <div className='panel-context-label'>{systems[activeSystemIndex]?.name ?? ''}</div>
          return null
        })()}
        {getPage()}
      </div>

      {selectedCategoryIds.length > 0 && !setMode && (
        <div className='filter-indicator'>
          <IconFilter />
          <span>{selectedCategoryLabels.join(' › ')}</span>
        </div>
      )}

      {cameraNotice && (
        <div className='camera-notice'>
          <span>{cameraNotice.message}</span>
          <button
            onClick={() => {
              setCameraNotice(null)
              cameraRef.current?.triggerCapture()
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <Camera
        ref={cameraRef}
        onBricksIdentified={onBricksIdentified}
        onNoResults={() => setCameraNotice({ message: "Couldn't find any pieces — try again!" })}
        onCaptureError={() => setCameraNotice({ message: 'Something went wrong with the camera.' })}
      />

      <SearchPanel
        visible={showSearchPanel}
        onClose={() => { setShowSearchPanel(false); setKeyboardVisible(false) }}
        triggerRef={searchToggleRef}
        exemptRefs={searchExemptRefs}
        searchQuery={searchQuery}
        onSearchChange={v => { setSearchQuery(v); setSearchError(null); setSearchDisambig(null) }}
        onSearch={handleExactPartSearch}
        waiting={waiting}
        searchInputRef={searchInputRef}
        onSearchFocus={() => setKeyboardVisible(true)}
        searchError={searchError}
        disambig={searchDisambig}
        onDisambigPart={handleDisambigPart}
        onDisambigSet={handleDisambigSet}
      />

      <FilterPanel
        visible={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        triggerRef={filterToggleRef}
        resetTrigger={dropdownResetTrigger}
        onCategorySelect={handleCategorySelect}
      />

      {setMode && selectedBinId && (
        <SetBinPanel
          binId={selectedBinId}
          parts={setBinPartsMap[selectedBinId]}
          pulledPartKeys={pulledPartKeys}
          onTogglePart={(partKey) => {
            setPulledPartKeys(prev =>
              prev.includes(partKey)
                ? prev.filter(k => k !== partKey)
                : [...prev, partKey]
            )
          }}
          onClose={() => setSelectedBinId(null)}
        />
      )}

      <RecentDrawer
        items={recentItems}
        onSelect={item => handleExactPartSearch(item.id)}
        onOpen={() => setToolbarOpen(false)}
      />

      <OnScreenKeyboard
        visible={keyboardVisible}
        inputRef={searchInputRef}
        value={searchQuery}
        onChange={setSearchQuery}
        onEnter={handleExactPartSearch}
        onClose={() => setKeyboardVisible(false)}
        containerRef={keyboardContainerRef}
      />

      {showHelperPopup && (
        <div className='helper-popup-overlay' onClick={closeHelperPopup}>
          <div className='helper-popup' onClick={e => e.stopPropagation()}>
            <div className='helper-popup-header'>
              <span>Help</span>
              <button className='helper-popup-close' onClick={closeHelperPopup} aria-label='Close help'>×</button>
            </div>
            <div className='helper-popup-body'>
              {helperText}
            </div>
          </div>
        </div>
      )}
      {adminMode && (
        <div className="bottom-controls">
          <div className="admin-left-group">
            {BIN_PROPERTIES.map(prop => {
              const isSelected = adminBinId && (binPropertyMap[adminBinId] ?? []).includes(prop.id)
              return (
                <button
                  key={prop.id}
                  className={`ui-button ${prop.className}${isSelected ? ' selected' : ''}`}
                  onClick={() => { if (adminBinId) toggleAdminProperty(prop.id) }}
                  disabled={!adminBinId}
                  title={prop.label}
                >
                  {prop.label}
                </button>
              )
            })}
          </div>

          <div className="admin-divider" />

          <div className="admin-right-group">
            <button className='ui-button blue' onClick={() => setAdminActionMode('swap-bins')} disabled={!adminBinId}>Swap Bins</button>
            <button className='ui-button red' onClick={handleEmptyBin} disabled={!adminBinId}>Empty Bin</button>
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
            <button className='ui-button neutral' onClick={cancelAdminAction}>Cancel</button>
          </div>
        </div>
      )}

      {systems.length > 0 && (() => {
        const currentSystem = systems[activeSystemIndex]
        const leftIdx  = (activeSystemIndex - 1 + systems.length) % systems.length
        const rightIdx = (activeSystemIndex + 1) % systems.length
        const leftHighlighted  = highlightedBinIds.some(id => id.startsWith(systems[leftIdx].id  + '-'))
        const rightHighlighted = highlightedBinIds.some(id => id.startsWith(systems[rightIdx].id + '-'))
        return (
          <div className='system-nav-wrapper' onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <button
              className={`system-nav-arrow left${leftHighlighted ? ' has-highlighted' : ''}`}
              onClick={() => navigateSystem('left')}
              aria-label={`Go to ${systems[leftIdx].name}`}
            >
              <IconChevronLeft />
            </button>

            <div className='system-nav-content'>
              <div className='system-nav-main'>
                <Table
                  onBinClick={onBinClicked}
                  selectedBinId={adminMode ? adminBinId : selectedBinId}
                  highlightedBinIds={highlightedBinIds}
                  displayMode={binDisplayMode}
                  pulledBinIds={pulledBinIds}
                  partialBinIds={partialBinIds}
                  propertyDefs={BIN_PROPERTIES}
                  propertyMap={binPropertyMap}
                  showPropertyClasses={adminMode}
                  systemDef={currentSystem}
                  unitTypes={unitTypes}
                />
              </div>
              <div className='system-nav-dots'>
                {systems.map((s, i) => (
                  <button
                    key={s.id}
                    className={`system-dot${i === activeSystemIndex ? ' active' : ''}`}
                    onClick={() => { setActiveSystemIndex(i); setSelectedBinId(null); setEmptyBinMsg(null) }}
                    aria-label={s.name}
                  />
                ))}
              </div>
            </div>

            <button
              className={`system-nav-arrow right${rightHighlighted ? ' has-highlighted' : ''}`}
              onClick={() => navigateSystem('right')}
              aria-label={`Go to ${systems[rightIdx].name}`}
            >
              <IconChevronRight />
            </button>
          </div>
        )
      })()}

      {toast && (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {confirmModal && (
        <div className='helper-popup-overlay' onClick={() => setConfirmModal(null)}>
          <div className='helper-popup' onClick={e => e.stopPropagation()}>
            <div className='helper-popup-body'>{confirmModal.message}</div>
            <div className='helper-popup-actions'>
              <button className='ui-button neutral' onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className={`ui-button ${confirmModal.confirmClass ?? 'blue'}`}
                onClick={async () => {
                  setConfirmModal(null)
                  await confirmModal.onConfirm()
                }}
              >
                {confirmModal.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {waiting && (
        <div className='loading-overlay'>
          <img src={brick2x2} alt='Loading' className='lego-brick-spinner' />
          <div className='loading-overlay-text'>Loading…</div>
        </div>
      )}
    </div>
  )
}
export default App

