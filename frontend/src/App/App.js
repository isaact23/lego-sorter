import './App.css'
import Camera from '../Camera/Camera'
import Select from '../Select/Select'
import Table from '../Table/Table'
import BucketEditor from '../BucketEditor/BucketEditor'
import { useState, useRef } from 'react'
import axios from 'axios'
import OptionCard from './OptionCard'
import CategorySelectCard from '../Category/CategorySelectCard'

const CAMERA_PAGE = 0
const SELECT_PAGE = 1
const TABLE_PAGE = 2
const EDIT_BUCKET_PAGE = 3
const BIN_OPERATION_PAGE = 4
const API_ENDPOINT = 'https://api.brickognize.com/predict/'
function App () {
  const [page, setPage] = useState(2)
  const [brickList, setBrickList] = useState([])
  const [brick, setBrick] = useState(null)
  const [bucketId, setBucketId] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [binOperation, setBinOperation] = useState(null)
  const [operationStatus, setOperationStatus] = useState(null) // Add this
  const pictureInputRef = useRef(null)

  // Callback for the Camera component once Lego bricks are identified
  function brickCallback (bricks) {
    console.log(bricks)
    if (bricks.length > 1) {
      // Prompt the user to choose the correct brick
      console.log('Multiple bricks detected')
      setBrickList(bricks)
      setPage(SELECT_PAGE)
    } else {
      // Only one brick was detected - go straight to the table page
      selectCallback(bricks[0])
    }
  }

  // Callback for the Select component once a Lego brick is selected by the user
  function selectCallback (selectedBrick) {
    console.log('Selected brick ' + selectedBrick['category'])
    setBrick(selectedBrick)
    setBinOperation(null) // Don't auto-select any operation
    setPage(TABLE_PAGE)
  }

  // Function to camera page and reset.
  function returnToCamera () {
    setPage(CAMERA_PAGE)
  }

  // Function to grid page and reset.
  function returnToGrid () {
    setPage(TABLE_PAGE)
  }

  // Function to add/remove part from a bucket.
  function editBin (newBucketId) {
    console.log('editBin called with:', newBucketId, 'binOperation:', binOperation, 'brick:', brick)
    if (binOperation === 'add') {
      addPartToBin(brick.id, newBucketId)
    } else if (binOperation === 'remove') {
      removePartFromBin(brick.id, newBucketId)
    } else {
      console.warn('No operation selected')
    }
  }

  async function addPartToBin (pieceId, bucketId) {
    console.log('addPartToBin called:', pieceId, bucketId)
    try {
      const response = await axios.post('http://10.10.10.121:3000/bucket/add', {
        pieceId,
        bucketId
      })
      console.log('Add response:', response)
      setOperationStatus(`✓ Added piece ${pieceId} to bin ${bucketId}`)
      setTimeout(() => setOperationStatus(null), 3000) // Clear after 3 seconds
      setBrick({...brick})
      setBinOperation(null)
    } catch (err) {
      console.error('Error adding part to bin:', err)
      setOperationStatus(`✗ Error adding piece: ${err.message}`)
      setTimeout(() => setOperationStatus(null), 3000)
    }
  }

  async function removePartFromBin (pieceId, bucketId) {
    console.log('removePartFromBin called:', pieceId, bucketId)
    try {
      const response = await axios.post('http://10.10.10.121:3000/bucket/remove', {
        pieceId,
        bucketId
      })
      console.log('Remove response:', response)
      setOperationStatus(`✓ Removed piece ${pieceId} from bin ${bucketId}`)
      setTimeout(() => setOperationStatus(null), 3000) // Clear after 3 seconds
      setBrick({...brick})
      setBinOperation(null)
    } catch (err) {
      console.error('Error removing part from bin:', err)
      setOperationStatus(`✗ Error removing piece: ${err.message}`)
      setTimeout(() => setOperationStatus(null), 3000)
    }
  }

  // Pass operationStatus to Table
  const getPage = () => {
    if (page === CAMERA_PAGE) return <Camera brickCallback={brickCallback} />
    if (page === SELECT_PAGE)
      return (
        <Select
          brickList={brickList}
          selectCallback={selectCallback}
          returnToCamera={returnToCamera}
        />
      )
    if (page === BIN_OPERATION_PAGE || page === TABLE_PAGE)
      return <Table brick={brick} editBin={editBin} binOperation={binOperation} setBinOperation={setBinOperation} operationStatus={operationStatus} />
    if (page === EDIT_BUCKET_PAGE) return <BucketEditor bucketId={bucketId} />
  }

  //
  async function identify (base64Data) {
    setWaiting(true)

    const base64 = await fetch(base64Data)
    const blob = await base64.blob()

    const formData = new FormData()
    formData.append('query_image', blob, 'image.jpg')

    axios
      .post(API_ENDPOINT, formData, {
        headers: { Accept: 'application/json' }
      })
      .then(res => {
        const legoList = res.data.items
        if (legoList.length === 0) {
          alert('No pieces identified, try again?')
        } else {
          brickCallback(legoList)
        }
        setWaiting(false)
      })
      .catch(err => {
        console.error(err)
        alert('Something went wrong.')
        setWaiting(false)
      })
  }

  // Handle when Take Picture button is pressed.
  function takePicture () {
    if (waiting) return

    // Call the <input> element to fetch the file.
    // That will call the handleFileChange callback once a file is chosen.
    pictureInputRef.current.click()
  }

  // Handle when an image is taken.
  function handleFileChange (event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      identify(reader.result)
    }
    reader.readAsDataURL(file)
  }



  return (
    <div className='App w3-theme-light'>
      <div className='option-card-row w3-container w3-padding'>
        <input
          id='cameraInput'
          type='file'
          accept='image/*'
          capture='environment'
          hidden
          onChange={handleFileChange}
          ref={pictureInputRef}
        />

        {/* Card 1: two dropdowns */}
        <CategorySelectCard />
        
        {/* Card 2: text input */}
        <OptionCard iconSrc='/icons/typewriter.png'>
          <input className='w3-input w3-border' placeholder='Enter text' />
        </OptionCard>

        {/* Card 3: action button */}
        <OptionCard iconSrc='/icons/cam.png' onClick={() => takePicture()}>
          <strong>Find Brick</strong>
        </OptionCard>
      </div>
      {getPage()}
    </div>
  )
}


export default App
