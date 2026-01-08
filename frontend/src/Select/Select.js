import { useEffect, useState } from 'react'
import axios from 'axios'
import './Select.css'

const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY
const CONFIDENCE_THRESHOLD = 0.75

// Remove special, legacy, prototype variants
function dedupeParts (bricks) {
  const map = {}

  bricks.forEach(brick => {
    const numeric = brick.id.match(/^\d+/)?.[0]
    if (!numeric) return

    if (!map[numeric] || brick.score > map[numeric].score) {
      map[numeric] = {
        ...brick,
        id: numeric
      }
    }
  })

  return Object.values(map)
}

function Select ({ brickList, selectCallback, returnHome, retryPhoto }) {
  const [images, setImages] = useState({})
  const [showAll, setShowAll] = useState(false)

  // Step 1: dedupe special bricks
  const cleanBricks = dedupeParts(brickList)

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

  if (!bricksWithImages.length) return null

  // Simple logic: show all bricks with images sorted by confidence (highest to lowest)
  const bricksToDisplay = bricksWithImages.sort((a, b) => b.score - a.score)

  return (
    <div className='Select'>
      <h2>Does this look right?</h2>
      <div className='BrickList'>
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
              className={`ListItem ${index > 0 ? 'secondary' : ''}`}
              onClick={() => selectCallback(brick)}
            >
              <img
                src={images[brick.id]}
                alt={brick.name}
                width={150}
              />

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
      </div>
    </div>
  )
}

export default Select
