import './Camera.css'
import axios from 'axios'
import { useState } from 'react'

const API_ENDPOINT = 'https://api.brickognize.com/predict/'

function Camera ({ brickCallback }) {
  const [waiting, setWaiting] = useState(false)

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
    <div className='Camera'>
      <input
        id='cameraInput'
        type='file'
        accept='image/*'
        capture='environment'
        hidden
        onChange={handleFileChange}
      />

      <button
        className='w3-button w3-theme-d1'
        disabled={waiting}
        onClick={() => document.getElementById('cameraInput').click()}
      >
        Find Brick
      </button>
    </div>
  )
}

export default Camera
