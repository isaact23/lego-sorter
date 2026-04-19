import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { identifyFromBlob } from '../services/imageService'

const Camera = forwardRef(({ onBricksIdentified }, ref) => {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [waiting, setWaiting] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)

  useImperativeHandle(ref, () => ({
    async triggerCapture() {
      try {
        await openCamera()
      } catch (err) {
        fileInputRef.current?.click()
      }
    }
  }))

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraOpen])

  useEffect(() => {
    return () => {
      closeCameraStream()
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function openCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    streamRef.current = stream
    setCameraOpen(true)
  }

  function closeCameraStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
  }

  async function captureFrame() {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  async function handleTakePhoto() {
    try {
      const blob = await captureFrame()
      if (!blob) throw new Error('Capture failed')

      const url = URL.createObjectURL(blob)
      setCapturedBlob(blob)
      setPreviewUrl(url)
    } catch (err) {
      console.error(err)
      alert('Unable to capture from camera. Please use a file upload.')
      fileInputRef.current?.click()
    } finally {
      closeCameraStream()
    }
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
      setCapturedBlob(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    processBlob(file)
    event.target.value = ''
  }

  function handleRetake() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setCapturedBlob(null)
    }
    openCamera().catch(() => {
      fileInputRef.current?.click()
    })
  }

  function handleCancel() {
    closeCameraStream()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setCapturedBlob(null)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {cameraOpen && (
        <div style={{ position: 'relative', marginTop: '12px' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', maxWidth: 420, borderRadius: 8, background: '#000' }}
            autoPlay
            playsInline
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="ui-button blue"
              onClick={handleTakePhoto}
              disabled={waiting}
              style={{ flex: 1 }}
            >
              Take Photo
            </button>
            <button
              type="button"
              className="ui-button"
              onClick={handleCancel}
              disabled={waiting}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {previewUrl && !cameraOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.72)',
            zIndex: 10000,
            padding: 16
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              background: '#111',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 0 24px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '72vh',
                borderRadius: 8,
                objectFit: 'contain'
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, width: '100%' }}>
              <button
                type="button"
                className="ui-button blue"
                onClick={() => processBlob(capturedBlob)}
                disabled={waiting}
                style={{ flex: 1 }}
              >
                Use Photo
              </button>
              <button
                type="button"
                className="ui-button"
                onClick={handleRetake}
                disabled={waiting}
                style={{ flex: 1 }}
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

export default Camera