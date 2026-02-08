import '../App/App.css'
import { useEffect, useState } from 'react'
import { fetchBrickData } from '../services/brickDataService'

function Select ({ partIds = [], selectCallback, onClose }) {
  const [bricks, setBricks] = useState([])

  console.log('[Select] render', {
    partIds,
    partIdsLength: partIds.length,
    bricksLength: bricks.length
  })

  // Load brick metadata from part IDs
  useEffect(() => {
    console.log('[Select] useEffect fired', partIds)

    let cancelled = false

    async function loadBricks () {
      console.log('[Select] loading bricks for IDs:', partIds)

      const results = []

      for (const id of partIds) {
        try {
          console.log('[Select] fetching brick', id)
          const brick = await fetchBrickData(id, 1.0)
          if (brick) {
            console.log('[Select] fetched brick OK', brick.part_num)
            results.push(brick)
          }
        } catch (err) {
          console.error('[Select] failed to fetch brick:', id, err)
        }
      }

      if (!cancelled) {
        console.log('[Select] setting bricks', results.length)
        setBricks(results)
      } else {
        console.log('[Select] load cancelled')
      }
    }

    if (partIds.length) {
      loadBricks()
    } else {
      console.log('[Select] no partIds, clearing bricks')
      setBricks([])
    }

    return () => {
      console.log('[Select] cleanup')
      cancelled = true
    }
  }, [partIds])

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
                src={brick.part_img_url}
                alt={brick.name}
              />
            </div>
            <strong>{brick.name}</strong>
            <div>Part #{brick.part_num}</div>
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