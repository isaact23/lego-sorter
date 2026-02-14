import '../App/App.css'
import { useEffect, useState } from 'react'
import { fetchBrickData } from '../services/brickDataService'

function Select({ initialBricks = null, partIds = [], selectCallback, onClose }) {
  const [bricks, setBricks] = useState([])

  console.log('[Select] render', {
    partIds,
    partIdsLength: partIds.length,
    bricksLength: bricks.length
  })

  // Load brick metadata from part IDs
  useEffect(() => {
    let cancelled = false

    async function loadBricks () {
      const results = []

      for (const id of partIds) {
        try {
          const brick = await fetchBrickData(id)
          if (brick) results.push(brick)
        } catch (err) {
          console.error('[Select] failed to fetch brick:', id, err)
        }
      }

      if (!cancelled) {
        setBricks(results)
      }
    }

    // If full brick objects are provided (camera flow)
    if (initialBricks && initialBricks.length) {
      setBricks(initialBricks)
      return
    }

    // Otherwise load from part IDs (bin browsing flow)
    if (partIds.length) {
      loadBricks()
    } else {
      setBricks([])
    }

    return () => {
      cancelled = true
    }
  }, [initialBricks, partIds])

  if (!bricks.length) {
    console.log('[Select] no bricks, returning null')
    return null
  }

  return (
    <div className="top-panel-select">
      <div className="scroll-row">
        {bricks.map(brick => (
          <div
            key={brick.part_num}
            className="top-panel-card Select TopModule"
            onClick={() => {
              console.log('[Select] brick clicked', brick.part_num)
              selectCallback(brick)
            }}
          >
            <div className="SelectImageFrame">
              <img
                src={`/api/image/${brick.part_num}`}
                alt={brick.name}
              />
            </div>
            <strong>{brick.name}</strong>
            <div>Part #{brick.part_num}</div>
            {brick.confidence != null && (
              <>
                <div className="ConfidenceBar">
                  <span
                    className="ConfidenceFill"
                    style={{
                      width: `${brick.confidence * 100}%`,
                      backgroundColor:
                        brick.confidence > 0.9
                          ? '#16a34a'
                          : brick.confidence > 0.75
                          ? '#eab308'
                          : '#dc2626'
                    }}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="top-panel-card-static">
        <button
          className="ui-button blue"
          onClick={() => {
            console.log('[Select] close clicked')
            onClose()
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default Select