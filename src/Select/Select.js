import { useEffect, useState } from 'react'
import axios from 'axios'

const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY
const CONFIDENCE_THRESHOLD = 0.75

// Remove special, legacy, prototype variants
function dedupeParts(bricks) {
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
              Authorization: `key ${REBRICKABLE_API_KEY}`
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
  const bricksWithImages = cleanBricks.filter(
    brick => images[brick.id]
  )

  if (!bricksWithImages.length) return null

  // Step 4: threshold logic exactly as requested
  const aboveThreshold = bricksWithImages.filter(
    brick => brick.score >= CONFIDENCE_THRESHOLD
  )

  let primaryBricks = []
  let hiddenBricks = []
  let buttonText = ''

  if (aboveThreshold.length === 1) {
    primaryBricks = [aboveThreshold[0]]
    hiddenBricks = bricksWithImages.filter(
      b => b.id !== aboveThreshold[0].id
    )
    buttonText = 'Not this one'
  } else if (aboveThreshold.length > 1) {
    primaryBricks = aboveThreshold
    hiddenBricks = bricksWithImages.filter(
      b => !aboveThreshold.some(a => a.id === b.id)
    )
    buttonText = 'None of these'
  } else {
    primaryBricks = [bricksWithImages[0]]
    hiddenBricks = bricksWithImages.slice(1)
    buttonText = 'Not this one'
  }

  const bricksToDisplay = showAll
    ? [...primaryBricks, ...hiddenBricks]
    : primaryBricks

  return (
    <div className="Select">
      <h1>Lego Sorter</h1>
      <h2>Choose the correct piece</h2>

      <div className="BrickList">
        {bricksToDisplay.map((brick, index) => (
          <div
            key={brick.id}
            className={`ListItem ${index > 0 ? 'secondary' : ''}`}
            onClick={() => selectCallback(brick)}
          >
            <img
              src={images[brick.id]}
              alt={brick.name}
              width={index === 0 ? 150 : 100}
            />

            <strong>{brick.name}</strong>
            <div>Part #{brick.id}</div>

            <div className="ConfidenceBar">
              <div
                className="ConfidenceFill"
                style={{ width: `${brick.score * 100}%` }}
              />
            </div>

            <div className="ConfidenceLabel">
              {(brick.score * 100).toFixed(1)}% sure
            </div>
          </div>
        ))}
      </div>

      {!showAll && hiddenBricks.length > 0 && (
        <button
          className="SecondaryButton"
          onClick={() => setShowAll(true)}
        >
          {buttonText}
        </button>
      )}

      <div className="BottomActions">
        <button
          className="SecondaryButton"
          onClick={retryPhoto}
        >
          Try another photo
        </button>

        <button onClick={returnHome}>
          Return home
        </button>
      </div>
    </div>
  )
}

export default Select
