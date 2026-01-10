import './App.css'
import Camera from '../Camera/Camera'
import Select from '../Select/Select'
import Table from '../Table/Table'
import BucketEditor from '../BucketEditor/BucketEditor'
import { useState, useRef } from 'react'
import axios from 'axios'

const CAMERA_PAGE = 0
const SELECT_PAGE = 1
const TABLE_PAGE = 2
const EDIT_BUCKET_PAGE = 3

const API_ENDPOINT = 'https://api.brickognize.com/predict/'

function App () {
  // App state variables (React hooks)
  const [page, setPage] = useState(2)
  const [brickList, setBrickList] = useState([])
  const [brick, setBrick] = useState(null)
  const [bucketId, setBucketId] = useState(0)
  const [waiting, setWaiting] = useState(false)
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

  // Function to edit a bucket.
  function editBucket (newBucketId) {
    setBucketId(newBucketId)
    setPage(EDIT_BUCKET_PAGE)
  }

  // Depending on the page variable, return the correct component
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
    if (page === TABLE_PAGE)
      return <Table brick={brick} editBucket={editBucket} />
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
        <OptionCard iconSrc='/icons/mag_glass.png'>
          <select className='w3-select w3-border option-select'>
            <option>First dropdown option</option>
          </select>

          <select className='w3-select w3-border option-select'>
            <option>Second dropdown option</option>
          </select>
        </OptionCard>

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
function OptionCard ({ iconSrc, iconAlt = '', children, onClick }) {
  return (
    <div
      className={`option-card ${onClick ? 'option-card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className='option-card-icon'>
        <img src={iconSrc} alt={iconAlt} className='option-card-icon-img' />
      </div>

      <div className='option-card-content'>{children}</div>
    </div>
  )
}

export default App
