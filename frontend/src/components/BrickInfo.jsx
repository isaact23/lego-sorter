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
        <div className="BrickImageFrame">
          {imageError
            ? null
            : <img src={`/api/image/${brick.part_num}`} alt={brick.name} onError={() => setImageError(true)} />
          }
        </div>

        <div className="BrickText">
          <h2>{brick.name || 'Unknown Part'}</h2>
          <p>Part #{brick.part_num}</p>
          {brick.part_cat_id && <p>Category {brick.part_cat_id}</p>}
          {isIncomplete && <p style={{ color: '#f59e0b' }}>Partial data</p>}
        </div>

        <div className="BrickActions">
          <button
            className={`ui-button green${isAddActive ? ' pending' : ''}`}
            onClick={() => onOperationSelect(isAddActive ? null : 'add')}
          >
            Add to Bin
          </button>
          <button
            className={`ui-button red${isRemoveActive ? ' pending' : ''}`}
            onClick={() => onOperationSelect(isRemoveActive ? null : 'remove')}
          >
            Remove from Bin
          </button>
          <button className="ui-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default BrickInfo
