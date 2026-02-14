import axios from 'axios'
import { API_ENDPOINT } from '../config'
import { fetchBrickData } from './brickDataService'

export async function identify (onSuccess, onError) {
  try {
    const blob = await captureFromCamera()

    const formData = new FormData()
    formData.append('query_image', blob, 'image.jpg')

    const res = await axios.post(API_ENDPOINT, formData, {
      headers: { Accept: 'application/json' }
    })

    const detectedParts = res.data.items
    if (detectedParts.length === 0) {
      onError('No pieces identified, try again?')
      return
    }

    const bricksWithData = await Promise.all(
      detectedParts.map(async part => {
        const metadata = await fetchBrickData(part.id)
        if (!metadata) return null

        return {
          ...metadata,
          confidence: part.score
        }
      })
    )

    const validBricks = bricksWithData.filter(Boolean)
    
    if (validBricks.length === 0) {
      onError('No matching parts found in Rebrickable database')
      return
    }

    onSuccess(validBricks)
  } catch (err) {
    console.error(err)
    onError('Something went wrong.')
  }
}

export function handleFileChange (event, onFileRead) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onloadend = () => {
    onFileRead(reader.result)
  }
  reader.readAsDataURL(file)
}


export async function captureFromCamera () {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  })

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    document.body.appendChild(video)

    video.srcObject = stream
    video.playsInline = true

    video.onloadedmetadata = () => {
      video.play()

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(blob => {
        stream.getTracks().forEach(track => track.stop())
        video.remove()
        resolve(blob)
      }, 'image/jpeg', 0.9)
    }

    video.onerror = err => {
      stream.getTracks().forEach(track => track.stop())
      video.remove()
      reject(err)
    }
  })
}
