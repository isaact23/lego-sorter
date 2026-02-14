import '../App/App.css'
import axios from 'axios'
import { useState } from 'react'

const API_ENDPOINT = 'https://api.brickognize.com/predict/'

function Camera({ brickCallback }) {
  const [waiting, setWaiting] = useState(false)

  async function captureFromCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })

    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.style.position = 'fixed'
      video.style.left = '-9999px'
      document.body.appendChild(video)

      video.srcObject = stream
      video.play()

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        canvas.toBlob(blob => {
          stream.getTracks().forEach(t => t.stop())
          video.remove()
          resolve(blob)
        }, 'image/jpeg', 0.9)
      }

      video.onerror = reject
    })
  }

  async function identifyFromBlob(blob) {
    setWaiting(true)

    const formData = new FormData()
    formData.append('query_image', blob, 'image.jpg')

    try {
      const res = await axios.post(API_ENDPOINT, formData, {
        headers: { Accept: 'application/json' }
      })

      const legoList = res.data.items
      if (legoList.length === 0) {
        alert('No pieces identified, try again?')
      } else {
        brickCallback(legoList)
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong.')
    }

    setWaiting(false)
  }

  async function handleCameraCapture() {
    console.log('CAMERA BUTTON CLICKED')
    try {
      const blob = await captureFromCamera()
      identifyFromBlob(blob)
    } catch (err) {
      console.error('Camera failed, falling back to file upload')
      document.getElementById('cameraInput').click()
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    identifyFromBlob(file)
  }

  return (
    <div className='Camera'>
      <input
        id='cameraInput'
        type='file'
        accept='image/*'
        hidden
        onChange={handleFileChange}
      />

      <button
        className='ui-button blue'
        disabled={waiting}
        onClick={handleCameraCapture}
      >
        Find Brick 2
      </button>
    </div>
  )
}

export default Camera