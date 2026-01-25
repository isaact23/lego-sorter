import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './Modules.css'
import '../App/App.css'
import { getBrickImage } from '../services/imageService'

//const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY

function hasScores(bricks) {
  return bricks.length > 0 && bricks[0].score !== undefined
}

// Remove special, legacy, prototype variants (keep A versions)
// If scores exist, keep highest score per base number
// If not, keep first encountered
function dedupeParts(bricks, useScores) {
  const map = {}
  const removed = []

  bricks.forEach(brick => {
    const match = brick.id.match(/^(\d+)([A-Za-z]?)$/)
    if (!match) return

    const numeric = match[1]

    if (!map[numeric]) {
      map[numeric] = brick
      return
    }

    if (useScores && brick.score > map[numeric].score) {
      removed.push(map[numeric])
      map[numeric] = brick
    } else {
      removed.push(brick)
    }
  })

  return {
    kept: Object.values(map),
    removed
  }
}


// Display a scrollable row of identified parts for user selection
function Select ({ brickList, selectCallback, returnHome, retryPhoto }) {
  // State to hold fetched images
  const [images, setImages] = useState({})
  // Determine if we have scores (if not, was called by bin selection)
  const useScores = useMemo(() => hasScores(brickList), [brickList])

  // Step 1: dedupe (remove duplicates, special variants)
  const { kept: cleanBricks } = useMemo(
    () => dedupeParts(brickList, useScores),
    [brickList, useScores]
  )

  // Step 2: fetch images via imageService (cached + rate-limit safe)
  useEffect(() => {
    cleanBricks.forEach(brick => {
      // Skip if we already resolved this brick (including null)
      if (images.hasOwnProperty(brick.id)) return

      getBrickImage(brick.id).then(imageUrl => {
        setImages(prev => ({
          ...prev,
          [brick.id]: imageUrl
        }))
      })
    })
  }, [cleanBricks])


  // Step 3: discard bricks without images
  const bricksWithImages = useMemo(
    () => cleanBricks.filter(brick => images[brick.id]),
    [cleanBricks, images]
  )

  // Step 4: sort (must be before any return)
  const bricksToDisplay = useMemo(() => {
    const sorted = [...bricksWithImages]

    if (useScores) {
      sorted.sort((a, b) => b.score - a.score)
    } else {
      sorted.sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true })
      )
    }

    return sorted
  }, [bricksWithImages, useScores])


  if (!bricksToDisplay.length) return null

  return (
    <div className='top-panel-wrapper top-panel-row scroll-row'>
      <div>
        {
          bricksToDisplay.map(brick => {
            let fillWidth
            let confidence_color

            if (useScores) {
              fillWidth = `${Math.round(brick.score * 100)}%`

              if (brick.score <= 0.5) {
                confidence_color = 'hsl(0, 100%, 50%)'
              } else if (brick.score >= 0.9) {
                confidence_color = 'hsl(120, 100%, 40%)'
              } else {
                const normalized = (brick.score - 0.5) / (0.9 - 0.5)
                const hue = Math.round(60 + normalized * 60)
                confidence_color = `hsl(${hue}, 100%, 45%)`
              }
            }

            return (
              <div
                key={brick.id}
                className='top-panel-card Select TopModule'
                onClick={() => selectCallback(brick)}
              >
                <div className='SelectImageFrame'>
                  <img
                    src={images[brick.id]}
                    alt={brick.name}
                  />
                </div>

                <strong>{brick.name}</strong>
                <div>Part #{brick.id}</div>

                {useScores && (
                  <div className='ConfidenceBar'>
                    <div
                      className='ConfidenceFill'
                      style={{ width: fillWidth, background: confidence_color }}
                    />
                  </div>
                )}
              </div>
            )
          })
        }
      </div>
      <div className='top-panel-fixed'>
        <button
          className='w3-button w3-theme-d1'
          onClick={returnHome}
        >
          Return Home
        </button>
      </div>
    </div>
  )
}

export default Select
