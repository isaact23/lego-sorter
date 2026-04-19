import { useEffect } from 'react'

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12
}

const windowStyle = {
  width: '100%',
  maxWidth: 600,
  maxHeight: '90vh',
  background: '#111',
  borderRadius: 14,
  boxShadow: '0 0 40px rgba(0,0,0,.45)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px 8px',
  color: '#fff'
}

const videoStyle = {
  width: '100%',
  height: '70vh',
  background: '#000',
  transform: 'rotate(180deg)',
  objectFit: 'cover'
}

const shutterRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px',
  background: '#111'
}

const shutterStyle = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  border: '4px solid #fff',
  background: '#e74c3c',
  boxShadow: '0 0 20px rgba(231, 76, 60, 0.45)',
  cursor: 'pointer'
}

const closeButtonStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.35)',
  borderRadius: 8,
  color: '#fff',
  padding: '8px 12px',
  cursor: 'pointer'
}

const CameraOverlay = ({ visible, stream, onClose, onTakePhoto, waiting, videoRef }) => {
  useEffect(() => {
    if (!visible || !stream || !videoRef?.current) return

    const video = videoRef.current
    video.srcObject = stream
    video.play().catch(() => {})
  }, [visible, stream, videoRef])

  if (!visible) return null

  return (
    <div
      style={overlayStyle}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div style={windowStyle} onClick={(event) => event.stopPropagation()}>
        <div style={topBarStyle}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Camera Preview</div>
          <button type="button" style={closeButtonStyle} onClick={onClose}>
            Close
          </button>
        </div>

        <video
          ref={videoRef}
          style={videoStyle}
          autoPlay
          playsInline
          muted
        />

        <div style={shutterRowStyle}>
          <button
            type="button"
            style={shutterStyle}
            onClick={onTakePhoto}
            disabled={waiting}
          />
        </div>
      </div>
    </div>
  )
}

export default CameraOverlay
