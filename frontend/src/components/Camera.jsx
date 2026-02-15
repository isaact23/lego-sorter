import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { identifyFromBlob } from '../services/imageService'

const Camera = forwardRef(({ onBricksIdentified }, ref) => {
  const fileInputRef = useRef(null)
  const [waiting, setWaiting] = useState(false)

  useImperativeHandle(ref, () => ({
    async triggerCapture() {
      try {
        const blob = await captureFromCamera()
        await processBlob(blob)
      } catch (err) {
        // Fallback to file picker if webcam fails
        fileInputRef.current?.click()
      }
    }
  }))

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

  async function processBlob(blob) {
    if (!blob) return

    setWaiting(true)

    try {
      const bricks = await identifyFromBlob(blob)

      if (!bricks.length) {
        alert('No pieces identified, try again?')
      } else {
        onBricksIdentified(bricks)
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong.')
    } finally {
      setWaiting(false)
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    processBlob(file)

    // Reset input so same file can be chosen again
    event.target.value = ''
  }

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={handleFileChange}
    />
  )
})

export default Camera