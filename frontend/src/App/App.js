import './App.css'
import Camera from '../Modules/Camera'
import Select from '../Modules/Select'
import Table from '../Table/Table'
import BrickInfo from '../Modules/BrickInfo'
import { useState, useRef } from 'react'
import OptionCard from '../Modules/OptionCard'
import CategorySelectCard from '../Modules/CategorySelectCard'
import { identify, takePicture, handleFileChange } from '../services/imageService'
import { createBrickCallbacks } from '../services/brickService'
import { createEditBinHandler } from '../services/binService'
import { searchPartsByPrefix } from '../services/searchService'
import { fetchBrickData } from '../services/brickDataService'


const CAMERA_PAGE = 0
const SELECT_PAGE = 1
const OPTION_CARDS = 2
const BRICK_INFO = 3

function App () {
  const [page, setPage] = useState(2)
  const [brickList, setBrickList] = useState([])
  const [brick, setBrick] = useState(null)
  const [binId, setBinId] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [binOperation, setBinOperation] = useState(null)
  const [operationStatus, setOperationStatus] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [dropdownResetTrigger, setDropdownResetTrigger] = useState(0)
  const pictureInputRef = useRef(null)

  const { brickCallback, selectCallback } = createBrickCallbacks(
    {
      setBrickList,
      setPage,
      setBrick,
      setBinOperation
    },
    {
      SELECT_PAGE,
      BRICK_INFO
    }
  )

  const editBin = createEditBinHandler({ brick, binOperation }, {
    setBinOperation,
    setOperationStatus
  })

  // Function to camera page and reset.
  function returnToCamera () {
    setPage(CAMERA_PAGE)
  }

  // Pass operationStatus to Table
  const getPage = () => {
    if (page === CAMERA_PAGE) 
      return 
        <Camera 
          brickCallback={brickCallback} 
        />
    if (page === SELECT_PAGE)
      return (
        <Select
          brickList={brickList}
          selectCallback={selectCallback}
          returnToCamera={returnToCamera}
        />
      )
    if (page === BRICK_INFO)
      return (
        <BrickInfo
          brick={brick}
          binOperation={binOperation}
          setBinOperation={setBinOperation}
          onClose={handleCloseBrickInfo}
        />
      )

    if (page === OPTION_CARDS)
      return (
        <div className='top-panel-row'>
          <input
            id='cameraInput'
            type='file'
            accept='image/*'
            capture='environment'
            hidden
            onChange={handleImageChange}
            ref={pictureInputRef}
          />
    

          {/* Card 1: two dropdowns */}
          <CategorySelectCard 
            resetTrigger={dropdownResetTrigger}
            onCategorySelect={() => {
              setSearchQuery('') // Clear search when category is selected
              setSearchResults([])
            }}
          />
          
          {/* Card 2: part number search */}
          <OptionCard iconSrc='/icons/typewriter.png'>
            <input 
              className='w3-input w3-border' 
              placeholder='Enter part #' 
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button 
              className='w3-button w3-theme-d1'
              onClick={handleExactPartSearch}
              disabled={waiting || !searchQuery.trim()}
              style={{ width: '100%', marginTop: '-4px' }}
            >
              Search Part
            </button>
          </OptionCard>

          {/* Card 3: action button */}
          <OptionCard iconSrc='/icons/cam.png' onClick={() => handleTakePicture()}>
            <strong>Find Brick</strong>
          </OptionCard>
        </div>
      )
  }

  //
  function handleIdentify (bricks) {
    setWaiting(false)
    if (!bricks) {
      alert('No pieces identified, try again?')
    } else {
      brickCallback(bricks)
    }
  }

  function handleIdentifyError (error) {
    alert(error)
    setWaiting(false)
  }

  // Handle when Take Picture button is pressed.
  function handleTakePicture () {
    if (waiting) return
    setWaiting(true)
    setSearchQuery('') // Clear search when taking picture
    setSearchResults([])
    setDropdownResetTrigger(prev => prev + 1) // Reset dropdown when taking picture
    takePicture(pictureInputRef)
  }

  // Handle when an image is taken.
  function handleImageChange (event) {
    handleFileChange(event, (base64Data) => {
      identify(base64Data, handleIdentify, handleIdentifyError)
    })
  }

  // Handle part number search
  async function handleSearchChange (event) {
    const query = event.target.value
    setSearchQuery(query)
    setDropdownResetTrigger(prev => prev + 1) // Trigger dropdown reset

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const results = await searchPartsByPrefix(query)
      setSearchResults(results)
    } catch (err) {
      console.error('Error searching parts:', err)
      setSearchResults([])
    }
  }

  // Search for exact part number and show like camera results
  async function handleExactPartSearch () {
    if (!searchQuery.trim()) {
      alert('Please enter a part number')
      return
    }

    setWaiting(true)
    try {
      const part = await fetchBrickData(searchQuery, 1.0)
      if (part) {
        // Use brick callback to navigate like camera detection
        selectCallback(part)
        setPage(BRICK_INFO)
      } else {
        alert(`Part #${searchQuery} not found in Rebrickable`)
      }
    } catch (err) {
      console.error('Error searching part:', err)
      alert('Error searching for part')
    } finally {
      setWaiting(false)
    }
  }

  function handleCloseBrickInfo () {
    setBrick(null)
    setBinOperation(null)
    setSearchQuery('')
    setSearchResults([])
    setPage(OPTION_CARDS)
  }

  return (
    <div className='App w3-theme-light'>
      <div className='top-panel'>
        {getPage()}
      </div>
      <Table 
        brick={brick} 
        editBin={editBin} 
        binOperation={binOperation} 
        setBinOperation={setBinOperation} 
        operationStatus={operationStatus} 
        searchQuery={searchQuery} 
        searchResults={searchResults} 
        setSearchResults={setSearchResults} 
      />   
    </div>
  )
}
export default App
