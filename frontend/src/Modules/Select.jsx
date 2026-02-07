import '../App/App.css'
import { useEffect, useState } from 'react'
import { fetchBrickData } from '../services/brickDataService'
//import { getBrickImage } from '../services/imageService'

function Select ({ partIds = [], selectCallback, onClose }) {
  const [bricks, setBricks] = useState([])
  //const [images, setImages] = useState({})

  // Load brick metadata from part IDs
  useEffect(() => {
    let cancelled = false

    async function loadBricks () {
      const results = []

      for (const id of partIds) {
        try {
          const brick = await fetchBrickData(id, 1.0)
          if (brick) results.push(brick)
        } catch (err) {
          console.error('Failed to fetch brick:', id, err)
        }
      }

      if (!cancelled) {
        setBricks(results)
      }
    }

    if (partIds.length) {
      loadBricks()
    } else {
      setBricks([])
    }

    return () => {
      cancelled = true
    }
  }, [partIds])

  if (!bricks.length) return null

  return (
    <div className="top-panel-select">
      <div className="scroll-row">
        {bricks.map(brick => (
          <div
            key={brick.part_num}
            className="top-panel-card Select TopModule"
            onClick={() => selectCallback(brick)}
          >
            <div className="SelectImageFrame">
              <img
                  src={brick.part_img_url}
                  alt={brick.name}
                />
            </div>
            <strong>{brick.name}</strong>
            <div>Part #{brick.part_num}</div>
          </div>
        ))}
      </div>

      {/* Static placeholder card (close / spacer) */}
      <div className="top-panel-card-static">
        <button
            className="ui-button blue"
            onClick={onClose}
          >
            Close
        </button>
      </div>
    </div>
  )
}

export default Select
