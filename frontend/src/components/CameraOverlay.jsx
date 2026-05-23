import { useEffect } from 'react'

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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        flexShrink: 0,
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

      {/* Video — fills remaining space */}
      <video
        ref={videoRef}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          background: '#000',
          transform: 'rotate(180deg)',
          objectFit: 'contain',
          display: 'block',
        }}
        autoPlay
        playsInline
        muted
      />

      {/* Shutter row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.6)',
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
            background: waiting ? '#888' : '#e74c3c',
            boxShadow: waiting ? 'none' : '0 0 24px rgba(231,76,60,0.6)',
            cursor: waiting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        />
      </div>
    </div>
  )
}

export default CameraOverlay
