import express from 'express'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

export default function createBrickRouter(partsMap, IMAGE_DIR) {
  const router = express.Router()

  const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY
  const REBRICKABLE_BASE = 'https://rebrickable.com/api/v3/lego/parts/'

  let lastCallTime = 0
  let dailyCallCount = 0

  const MIN_DELAY_MS = 1000
  const MAX_DAILY_CALLS = 200

  async function enforceRateLimit() {
    const now = Date.now()
    const elapsed = now - lastCallTime

    if (elapsed < MIN_DELAY_MS) {
      await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed))
    }

    if (dailyCallCount >= MAX_DAILY_CALLS) {
      throw new Error('Daily Rebrickable API cap reached')
    }

    dailyCallCount++
    lastCallTime = Date.now()
  }

  async function downloadImage(url, partNum) {
    const response = await axios.get(url, { responseType: 'stream' })
    const filePath = path.join(IMAGE_DIR, `${partNum}.jpg`)
    const writer = fs.createWriteStream(filePath)

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }

  router.get('/brick', async (req, res) => {
    const part = req.query.part?.trim()

    if (!part) {
      return res.status(400).json({ error: 'Missing part parameter' })
    }

    const brick = partsMap.get(part)

    if (!brick) {
      return res.status(404).json({ error: 'Part not found' })
    }

    // Check if image exists, if not, fetch it asynchronously
    const imagePath = path.join(IMAGE_DIR, `${part}.jpg`)
    if (!fs.existsSync(imagePath)) {
      // Fire and forget to avoid blocking the brick data response
      enforceRateLimit().then(async () => {
        try {
          const response = await axios.get(REBRICKABLE_BASE, {
            params: {
              part_nums: part,
              key: REBRICKABLE_API_KEY
            }
          })

          const partData = response.data.results[0]

          if (partData?.part_img_url) {
            await downloadImage(partData.part_img_url, part)
          }
        } catch (err) {
          console.error('Failed to fetch image for', part, err.message)
        }
      }).catch(err => {
        console.error('Rate limit error for', part, err.message)
      })
    }

    return res.json({
      part_num: brick.part_num,
      name: brick.name,
      part_cat_id: brick.part_cat_id,
      part_material: brick.part_material
    })
  })

  router.get('/image/:part', async (req, res) => {
    try {
      const part = req.params.part?.trim()
      if (!part) {
        return res.status(400).json({ error: 'Missing part number' })
      }

      const imagePath = path.join(IMAGE_DIR, `${part}.jpg`)

      if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath)
      }

      await enforceRateLimit()

      const response = await axios.get(REBRICKABLE_BASE, {
        params: {
          part_nums: part,
          key: REBRICKABLE_API_KEY
        }
      })

      const partData = response.data.results[0]

      if (!partData?.part_img_url) {
        return res.status(404).json({ error: 'No image available' })
      }

      await downloadImage(partData.part_img_url, part)

      return res.sendFile(imagePath)

    } catch (err) {
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      }

      return res.status(500).json({ error: err.message })
    }
  })

  return router
}