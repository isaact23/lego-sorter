import './Camera.css'
import Webcam from 'react-webcam'
import axios from 'axios'
import { useState } from 'react'

const API_ENDPOINT = 'https://api.brickognize.com/predict/'

// These determine how big the webcam picture is rendered on the screen
const WEBCAM_WIDTH = 1280
const WEBCAM_HEIGHT = 720

// These determine the dimensions of the image sent to the Brickognize backend
const SCREENSHOT_WIDTH = 400
const SCREENSHOT_HEIGHT = 300

function Camera ({ brickCallback }) {
  const [waiting, setWaiting] = useState(false)

  // Send a request to Brickognize to identify the Lego in the image.
  async function identify (base64Data) {
    setWaiting(true)

    // Convert Base64 to Blob
    const base64 = await fetch(base64Data)
    const blob = await base64.blob()

    // Set up request
    const formData = new FormData()
    formData.append('query_image', blob, 'image.jpg')

    // Send API request
    axios
      .post(API_ENDPOINT, formData, {
        headers: {
          Accept: 'application/json'
        }
      })
      .then(res => {
        // API call succeeded
        const legoList = res['data']['items']
        if (legoList.length === 0) {
          alert('No pieces identified, try again?')
        } else {
          // Send the identified bricks back to the app
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

  return (
    <div className='Camera'>
      <h1>Lego Sorter</h1>
      <Webcam
        width={WEBCAM_WIDTH}
        height={WEBCAM_HEIGHT}
        screenshotFormat='image/jpeg'
      >
        {({ getScreenshot }) => (
          // Screenshot button
          <button
            disabled={waiting}
            onClick={() => {
              // The getScreenshot method is provided by the React-Webcam module
              const imageSrc = getScreenshot({
                width: SCREENSHOT_WIDTH,
                height: SCREENSHOT_HEIGHT
              })
              if (imageSrc != null) {
                identify(imageSrc)
              }
            }}
          >
            Find Brick
          </button>
        )}
      </Webcam>
    </div>
  )
}

export default Camera
