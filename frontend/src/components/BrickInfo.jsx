import { useState } from 'react'

function BrickInfo({
  brick,
  selectedOperation,
  onOperationSelect,
  onClose
}) {
  const [imageError, setImageError] = useState(false)

  console.log('[BrickInfo] Rendered with brick:', brick)

  if (!brick) return null

  const isAddActive = selectedOperation === 'add'
  const isRemoveActive = selectedOperation === 'remove'

  // Show warning if brick data is incomplete
  const isIncomplete = !brick.name || !brick.part_cat_id
  
  console.log('[BrickInfo] isIncomplete:', isIncomplete, 'name:', brick.name, 'part_cat_id:', brick.part_cat_id)

  return (
    <div className="top-panel-row">
      <div className="Top-Panel-BrickInfo">
        <div className="BrickText">
          <h2>{brick.name || 'Unknown Part'}</h2>
          <p><strong>Category:</strong> {brick.part_cat_id || 'Unknown'}</p>
          <p><strong>ID:</strong> {brick.part_num}</p>
          {isIncomplete && (
            <p style={{ color: 'orange' }}>⚠️ Partial data - part may not be in database</p>
          )}
        </div>

        <div className="BrickImageFrame">
          {imageError ? (
            <div style={{ 
              width: '100%', 
              height: '200px', 
              background: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px',
              border: '1px solid #ddd'
            }}>
              📦 No image cached
            </div>
          ) : (
            <img
              src={`/api/image/${brick.part_num}`}
              alt={brick.name}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="BrickActions">
          <button
            className={`ui-button green ${
              isAddActive ? 'pending' : ''
            }`}
            onClick={() =>
              onOperationSelect(isAddActive ? null : 'add')
            }
          >
            Add to Bin
          </button>

          <button
            className={`ui-button red ${
              isRemoveActive ? 'pending' : ''
            }`}
            onClick={() =>
              onOperationSelect(isRemoveActive ? null : 'remove')
            }
          >
            Remove from Bin
          </button>

          <button
            className="ui-button blue"
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
