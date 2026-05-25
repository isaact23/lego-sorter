import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './CameraOverlay.css'

const CameraOverlay = ({ visible, stream, onClose, onTakePhoto, waiting, videoRef }) => {
  useEffect(() => {
    if (!visible || !stream || !videoRef?.current) return
    const video = videoRef.current
    video.srcObject = stream
    video.play().catch(() => {})
  }, [visible, stream, videoRef])

  if (!visible) return null

  return createPortal(
    <div className="camera-overlay">
      <div className="camera-overlay-bar">
        <span>Camera Preview</span>
        <button type="button" className="camera-overlay-close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="camera-overlay-video-wrap">
        <video
          ref={videoRef}
          className="camera-overlay-video"
          autoPlay
          playsInline
          muted
        />
      </div>

      <div className="camera-overlay-shutter">
        <button
          type="button"
          className="camera-shutter-btn"
          disabled={waiting}
          onClick={onTakePhoto}
        />
      </div>
    </div>,
    document.body
  )
}

export default CameraOverlay
