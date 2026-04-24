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

  router.get('/brick', async (req, res) => {
    try {
      let part = req.query.part?.trim()

      if (!part) {
        return res.status(400).json({ error: 'Missing part parameter' })
      }

      // Step 1: Normalize the input - strip off "pr" and anything that follows (for printed pieces)
      const cleanPart = part.replace(/pr.*$/i, '')
      console.log('[/brick] Received part:', part, '-> cleaned:', cleanPart)

      // Step 2: Check CSV for quick validation (optional - for reference)
      let csvData = partsMap.get(cleanPart)
      if (csvData) {
        console.log('[/brick] Found in CSV')
      } else {
        console.log('[/brick] Not found in CSV')
      }

      // Step 3: Make single API call to Rebrickable for canonical data and image
      if (!REBRICKABLE_API_KEY) {
        console.error('[/brick] REBRICKABLE_API_KEY not configured')
        return res.status(404).json({ error: 'API key not configured' })
      }

      await enforceRateLimit()

      console.log('[/brick] Calling Rebrickable API with bricklink_id:', cleanPart)
      const response = await axios.get(REBRICKABLE_BASE, {
        params: {
          bricklink_id: cleanPart,
          key: REBRICKABLE_API_KEY
        }
      })

      console.log('[/brick] Rebrickable response status:', response.status)
      
      const partData = response.data.results?.[0]

      if (!partData) {
        console.log('[/brick] Part not found on Rebrickable:', cleanPart)
        return res.status(404).json({ error: 'Part not found' })
      }

      // Step 4: Build canonical response with Rebrickable data
      const canonicalData = {
        part_num: partData.part_num,
        name: partData.name,
        part_cat_id: partData.part_cat_id,
        part_img_url: partData.part_img_url
      }

      // Step 5: Download and cache the image using the canonical part number
      if (canonicalData.part_img_url) {
        try {
          console.log('[/brick] Downloading image for canonical part:', canonicalData.part_num)
          await downloadImage(canonicalData.part_img_url, canonicalData.part_num)
        } catch (imgErr) {
          console.error('[/brick] Error downloading image:', imgErr.message)
          // Don't fail the request if image download fails
        }
      }

      // Step 6: Return the canonical data
      console.log('[/brick] Returning canonical part_num:', canonicalData.part_num)
      return res.json(canonicalData)

    } catch (err) {
      console.error('[/brick] Error:', err.message, err.response?.status)
      
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      }

      return res.status(500).json({ error: `Error: ${err.message}` })
    }
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