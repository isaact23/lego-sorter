import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const CameraOverlay = ({ visible, stream, onClose, onTakePhoto, waiting, videoRef }) => {
  useEffect(() => {
    if (!visible || !stream || !videoRef?.current) return
    const video = videoRef.current
    video.srcObject = stream
    video.play().catch(() => {})
  }, [visible, stream, videoRef])

  if (!visible) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#000',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        flexShrink: 0,
        background: '#111',
        color: '#fff',
      }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Camera Preview</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 8,
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          Close
        </button>
      </div>

      {/* Video wrapper — fills all remaining height */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'rotate(180deg)',
          }}
        />
      </div>

      {/* Shutter row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        flexShrink: 0,
        background: '#111',
      }}>
        <button
          type="button"
          disabled={waiting}
          onClick={onTakePhoto}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '5px solid #fff',
            background: waiting ? '#555' : '#e74c3c',
            boxShadow: waiting ? 'none' : '0 0 24px rgba(231,76,60,0.6)',
            cursor: waiting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        />
      </div>
    </div>,
    document.body
  )
}

export default CameraOverlay
