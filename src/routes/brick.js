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
    console.log('[downloadImage] Downloading', partNum, 'to', filePath)
    const writer = fs.createWriteStream(filePath)

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('[downloadImage] Successfully saved', partNum)
        resolve()
      })
      writer.on('error', (err) => {
        console.error('[downloadImage] Error writing', partNum, err.message)
        reject(err)
      })
    })
  }

  router.get('/brick', (req, res) => {
    const part = req.query.part?.trim()

    if (!part) {
      return res.status(400).json({ error: 'Missing part parameter' })
    }

    // Try exact match first
    let brick = partsMap.get(part)

    // If not found, search for any part starting with this base number
    // (handles variants like 2454, 2454a, 2454b, etc.)
    if (!brick) {
      for (const [key, value] of partsMap.entries()) {
        if (key.startsWith(part)) {
          brick = value
          break
        }
      }
    }

    if (!brick) {
      return res.status(404).json({ error: 'Part not found' })
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
      console.log('[/api/image] Requested:', part)

      // Try local cache first
      if (fs.existsSync(imagePath)) {
        console.log('[/api/image] File exists, sending:', part)
        return res.sendFile(imagePath)
      }

      // If no local file, try Rebrickable if API key is available
      if (!REBRICKABLE_API_KEY) {
        console.log('[/api/image] Image not in cache and API key not available for:', part)
        return res.status(404).json({ error: 'Image not available locally. Configure REBRICKABLE_API_KEY to auto-download images.' })
      }

      console.log('[/api/image] Image not cached, fetching from Rebrickable for part:', part)

      await enforceRateLimit()

      const response = await axios.get(REBRICKABLE_BASE, {
        params: {
          part_nums: part,
          key: REBRICKABLE_API_KEY
        }
      })

      const partData = response.data.results?.[0]

      if (!partData?.part_img_url) {
        console.log('[/api/image] No image URL from Rebrickable for part:', part)
        return res.status(404).json({ error: 'No image available' })
      }

      console.log('[/api/image] Downloading image for part:', part)
      await downloadImage(partData.part_img_url, part)

      return res.sendFile(imagePath)

    } catch (err) {
      console.error('[/api/image] Error:', err.message)
      
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      }

      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Image not available' })
      }

      return res.status(500).json({ error: `Failed to load image: ${err.message}` })
    }
  })

  return router
}