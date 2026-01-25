import React from 'react'

function BrickInfo({ brick, binOperation, setBinOperation, onClose }) {
  if (!brick) return null

  return (
    <div className="top-panel-row">
      <div className="Top-Panel-BrickInfo">
        <div className="BrickText">
          <h2>{brick.name}</h2>
          <p><strong>Category:</strong> {brick.category}</p>
          <p><strong>ID:</strong> {brick.id}</p>
        </div>

        <div className="BrickImageFrame">
          <img
            src={brick.img_url}
            alt={`Picture of ${brick.name}`}
          />
        </div>

        <div className="BrickActions">
          <button
            className={`w3-button ${binOperation === 'add' ? 'w3-green' : 'w3-light-green'}`}
            onClick={() => setBinOperation('add')}
            style={{ opacity: binOperation === 'add' ? 1 : 0.6 }}
          >
            Add to Bin
          </button>

          <button
            className={`w3-button ${binOperation === 'remove' ? 'w3-red' : 'w3-light-red'}`}
            onClick={() => setBinOperation('remove')}
            style={{ opacity: binOperation === 'remove' ? 1 : 0.6 }}
          >
            Remove from Bin
          </button>

          <button
            className="w3-button w3-theme-l3"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrickInfo
