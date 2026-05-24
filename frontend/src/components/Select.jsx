import '../app/App.css'
import { useEffect, useState } from 'react'
import { fetchBrickData } from '../services/brickService'

function Select({ initialBricks = null, partIds = [], selectCallback, onClose }) {
  const [bricks, setBricks] = useState([])
  const [loading, setLoading] = useState(true)

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
          if (fullBrick) results.push({ ...fullBrick, confidence: item.confidence ?? null })
        } catch (err) {
          console.error('[Select] failed to fetch brick:', item.part_num, err)
        }
      }

      if (cancelled) return

      setBricks(results)
      setLoading(false)
    }

    loadBricks()

    return () => {
      cancelled = true
    }
  }, [initialBricks, partIds, selectCallback])

  if (loading) return null
  if (!bricks.length) return null

  return (
    <div className="top-panel-select">
      <div className="scroll-row">
        {bricks.map(brick => (
          <div
            key={brick.part_num}
            className="brick-card-selectable"
            onClick={() => selectCallback(brick)}
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
        <button className="ui-button blue" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default Select