import { useEffect, useState } from 'react'
import axios from 'axios'
import './Modules.css'
import '../App/App.css'

const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY

// Remove special, legacy, prototype variants (keep A versions)
// Returns { kept: best bricks, removed: duplicate variants }
function dedupeParts(bricks) {
  const map = {}
  const removed = []

  bricks.forEach(brick => {
    const match = brick.id.match(/^(\d+)([A-Za-z]?)$/)
    if (!match) return

    const numeric = match[1]

    // Keep the highest-score variant for each base part number
    if (!map[numeric]) {
      map[numeric] = {
        ...brick,
        id: brick.id
      }
    } else if (brick.score > map[numeric].score) {
      removed.push(map[numeric])
      map[numeric] = {
        ...brick,
        id: brick.id
      }
    } else {
      removed.push(brick)
    }
  })

  return {
    kept: Object.values(map),
    removed
  }
}

function Select ({ brickList, selectCallback, returnHome, retryPhoto }) {
  const [images, setImages] = useState({})
  const [showAll, setShowAll] = useState(false)

  // Step 1: dedupe special bricks
  const { kept: cleanBricks, removed: removedBricks } = dedupeParts(brickList)

  // Step 2: fetch images from Rebrickable
  useEffect(() => {
    cleanBricks.forEach(brick => {
      if (images[brick.id] !== undefined) return

      axios
        .get(
          `https://rebrickable.com/api/v3/lego/parts/?part_num=${brick.id}`,
          {
            headers: {
              Authorization: `key ${REBRICKABLE_API_KEY}`,
              Accept: 'application/json'
            }
          }
        )
        .then(res => {
          const part = res.data.results?.[0]
          setImages(prev => ({
            ...prev,
            [brick.id]: part?.part_img_url || null
          }))
        })
        .catch(() => {
          setImages(prev => ({
            ...prev,
            [brick.id]: null
          }))
        })
    })
  }, [cleanBricks, images])

  // Step 3: discard bricks without images
  const bricksWithImages = cleanBricks.filter(brick => images[brick.id])
  const removedWithImages = removedBricks.filter(brick => images[brick.id])

  if (!bricksWithImages.length) return null

  // Simple logic: show best bricks, optionally show removed variants
  const bricksToDisplay = showAll
    ? [...bricksWithImages, ...removedWithImages].sort((a, b) => b.score - a.score)
    : bricksWithImages.sort((a, b) => b.score - a.score)

  return (
    <div className='top-panel-row'>
      {bricksToDisplay.map((brick, index) => {
        const fillWidth = `${Math.round(brick.score * 100)}%`

        let confidence_color

        if (brick.score <= 0.5) {
          // Red
          confidence_color = 'hsl(0, 100%, 50%)'
        } else if (brick.score >= 0.9) {
          // Green
          confidence_color = 'hsl(120, 100%, 40%)'
        } else {
          // Gradient from yellow to green between 0.5 and 0.9
          const normalized = (brick.score - 0.5) / (0.9 - 0.5) // 0 to 1
          const hue = Math.round(60 + normalized * 60) // 60 = yellow, 120 = green
          confidence_color = `hsl(${hue}, 100%, 45%)`
        }

        return (
          <div
            key={brick.id}
            className='top-panel-card Select TopModule'
            onClick={() => selectCallback(brick)}
          >
            <div className="SelectImageFrame">
              <img
                src={images[brick.id]}
                alt={brick.name}
              />
            </div>


            <strong>{brick.name}</strong>
            <div>Part #{brick.id}</div>

            <div className='ConfidenceBar'>
              <div
                className='ConfidenceFill'
                style={{ width: fillWidth, background: confidence_color }}
              />
            </div>
          </div>
        )
      })}
      

      <button
        className='w3-button w3-theme-d1'
        onClick={() => setShowAll(!showAll)}
        disabled={removedWithImages.length === 0}
        style={{
          width: '100%',
          marginTop: '16px',
          opacity: removedWithImages.length === 0 ? 0.5 : 1,
          cursor: removedWithImages.length === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {showAll 
          ? `Hide ${removedWithImages.length} more options`
          : `Show ${removedWithImages.length} more options`
        }
      </button>
    </div>
  )
}

export default Select
