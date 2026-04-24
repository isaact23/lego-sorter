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
        console.log('[/api/image] File exists locally, sending:', part)
        return res.sendFile(imagePath)
      }

      // No local file - try Rebrickable
      console.log('[/api/image] Not cached, attempting Rebrickable API for:', part)

      if (!REBRICKABLE_API_KEY) {
        console.error('[/api/image] REBRICKABLE_API_KEY not configured')
        return res.status(404).json({ error: 'Image not cached and API key not configured' })
      }

      await enforceRateLimit()

      console.log('[/api/image] Calling Rebrickable API...')
      const response = await axios.get(REBRICKABLE_BASE, {
        params: {
          part_nums: part,
          key: REBRICKABLE_API_KEY
        }
      })

      console.log('[/api/image] Rebrickable response status:', response.status)
      
      const partData = response.data.results?.[0]

      if (!partData) {
        console.log('[/api/image] Part not found on Rebrickable:', part)
        return res.status(404).json({ error: 'Part not found on Rebrickable' })
      }

      if (!partData.part_img_url) {
        console.log('[/api/image] Part on Rebrickable has no image:', part)
        return res.status(404).json({ error: 'No image URL on Rebrickable' })
      }

      console.log('[/api/image] Downloading from:', partData.part_img_url)
      await downloadImage(partData.part_img_url, part)

      return res.sendFile(imagePath)

    } catch (err) {
      console.error('[/api/image] Error:', err.message, err.response?.status)
      
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      }

      return res.status(500).json({ error: `Error: ${err.message}` })
    }
  })

  return router
}