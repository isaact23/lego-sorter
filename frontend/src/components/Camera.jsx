import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { identifyFromBlob } from '../services/imageService'
import CameraOverlay from './CameraOverlay'

const Camera = forwardRef(({ onBricksIdentified, onNoResults, onCaptureError }, ref) => {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [waiting, setWaiting] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [stream, setStream] = useState(null)

  useImperativeHandle(ref, () => ({
    async triggerCapture() {
      try {
        await openCameraOverlay()
      } catch (err) {
        fileInputRef.current?.click()
      }
    }
  }))

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function openCameraOverlay() {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    streamRef.current = mediaStream
    setStream(mediaStream)
    setOverlayOpen(true)
  }

  function stopStream() {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }

  function closeOverlay() {
    setOverlayOpen(false)
    stopStream()
  }

  async function captureFromVideo() {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(Math.PI)
    ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  async function handleTakePhoto() {
    try {
      const blob = await captureFromVideo()
      if (!blob) throw new Error('Capture failed')
      closeOverlay()
      await processBlob(blob)
    } catch (err) {
      console.error(err)
      onCaptureError?.()
      fileInputRef.current?.click()
    }
  }

  async function processBlob(blob) {
    if (!blob) return

    setWaiting(true)

    try {
      const bricks = await identifyFromBlob(blob)

      if (!bricks.length) {
        onNoResults?.()
      } else {
        onBricksIdentified(bricks)
      }
    } catch (err) {
      console.error(err)
      onCaptureError?.()
    } finally {
      setWaiting(false)
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    processBlob(file)
    event.target.value = ''
  }

  useEffect(() => {
    if (!overlayOpen || !videoRef.current || !stream) return
    videoRef.current.srcObject = stream
    videoRef.current.play().catch(() => {})
  }, [overlayOpen, stream])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      <CameraOverlay
        visible={overlayOpen}
        stream={stream}
        onClose={closeOverlay}
        onTakePhoto={handleTakePhoto}
        waiting={waiting}
        videoRef={videoRef}
      />
    </>
  )
})

export default Camera
