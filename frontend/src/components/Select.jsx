import '../app/App.css'
import { useEffect, useState } from 'react'
import { fetchBrickData } from '../services/brickService'

function Select({ initialBricks = null, partIds = [], selectCallback, onClose }) {
  const [bricks, setBricks] = useState([])
  const [loading, setLoading] = useState(true)

  console.log('[Select] render', {
    partIds,
    partIdsLength: partIds.length,
    bricksLength: bricks.length,
    loading
  })

  useEffect(() => {
    let cancelled = false

    async function loadBricks() {
      setLoading(true)

      const results = []

      const source = initialBricks && initialBricks.length
        ? initialBricks
        : partIds.map(id => ({ part_num: id }))

      for (const item of source) {
        try {
          const fullBrick = await fetchBrickData(item.part_num)

          if (fullBrick) {
            results.push({
              ...fullBrick,
              confidence: item.confidence ?? null
            })
          }
        } catch (err) {
          console.error('[Select] failed to fetch brick:', item.part_num, err)
        }
      }

      if (cancelled) return

      // 🔥 Auto-select if exactly one result
      //if (results.length === 1) {
      //  console.log('[Select] auto-selecting single brick', results[0].part_num)
      //  selectCallback(results[0])
      //  //  return
      //  }

      setBricks(results)
      setLoading(false)
    }

    loadBricks()

    return () => {
      cancelled = true
    }
  }, [initialBricks, partIds, selectCallback])

  // ⛔ While loading OR auto-selecting → render nothing
  if (loading) return null

  // ⛔ If no bricks → render nothing (parent handles message/page state)
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
            className="brick-card-selectable"
            onClick={() => {
              console.log('[Select] brick clicked', brick.part_num)
              selectCallback(brick)
            }}
          >
            <div className="BrickImageFrame">
              <img src={`/api/image/${brick.part_num}`} alt={brick.name} />
            </div>

            <div className="BrickText">
              <h2>{brick.name}</h2>
              <p>Part #{brick.part_num}</p>
              {brick.part_cat_id && <p>Category {brick.part_cat_id}</p>}
              {brick.confidence != null && (
                <div className="ConfidenceBar" style={{ marginTop: 4 }}>
                  <span
                    className="ConfidenceFill"
                    style={{
                      width: `${brick.confidence * 100}%`,
                      backgroundColor:
                        brick.confidence > 0.9 ? '#16a34a'
                        : brick.confidence > 0.75 ? '#eab308'
                        : '#dc2626'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="top-panel-card-static">
        <button className="ui-button blue" onClick={() => { console.log('[Select] close clicked'); onClose() }}>
          Close
        </button>
      </div>
    </div>
  )
}

export default Select