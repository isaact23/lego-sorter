import express from 'express'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { readBinData } from '../data/binData.js'

export default function createBrickRouter(partsMap, IMAGE_DIR) {
  const router = express.Router()

  // Your Rebrickable API key, pulled from the .env file
  const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY
  const REBRICKABLE_BASE = 'https://rebrickable.com/api/v3/lego/parts/'

  // Tracks the last time we called the API and how many calls we've made today
  let lastCallTime = 0
  let dailyCallCount = 0

  // Don't call the API more than once per second, or more than 200 times per day
  const MIN_DELAY_MS = 1000
  const MAX_DAILY_CALLS = 200

  // Pauses if we're calling the API too fast, and blocks us if we've hit the daily limit
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

  // Downloads an image from a URL and saves it to disk so we don't have to fetch it again
  async function downloadImage(url, partNum) {
    const response = await axios.get(url, { responseType: 'stream' })
    const filePath = path.join(IMAGE_DIR, `${partNum}.jpg`)
    console.log('[downloadImage] Downloading', partNum, 'to', filePath)
    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
      writer.on('finish', () => { console.log('[downloadImage] Saved', partNum); resolve() })
      writer.on('error', (err) => { console.error('[downloadImage] Error', partNum, err.message); reject(err) })
    })
  }

  // Main endpoint - called when the frontend wants info about a part
  router.get('/brick', async (req, res) => {
    try {
      const part = req.query.part?.trim()
      if (!part) return res.status(400).json({ error: 'Missing part parameter' })

      // Printed parts have a "pr" suffix (e.g. "3001pr0038") - strip it so we look up the base mold
      const cleanPart = part.replace(/pr.*$/i, '')
      console.log('[/brick] Received part:', part, '-> cleaned:', cleanPart)

      // --- Fast path: check our local CSV first ---
      // If we already have this part, return it immediately with no API call
      const csvData = partsMap.get(cleanPart)
      if (csvData) {
        console.log('[/brick] Found in local CSV, returning immediately:', cleanPart)

        // Check if we also have the image already saved on disk
        const imagePath = path.join(IMAGE_DIR, `${cleanPart}.jpg`)
        const imageUrl = fs.existsSync(imagePath)
          ? `/api/image/${cleanPart}`  // use local cached image
          : null                        // frontend can request it separately if needed

        return res.json({
          part_num: csvData.part_num ?? cleanPart,
          name: csvData.name ?? '',
          part_cat_id: Number(csvData.part_cat_id) ?? null,
          part_img_url: imageUrl,
          source: 'csv'  // tells the frontend this came from local data
        })
      }

      // --- Slow path: part wasn't in our CSV, so ask Rebrickable ---
      console.log('[/brick] Not in local CSV, calling Rebrickable for:', cleanPart)

      if (!REBRICKABLE_API_KEY) {
        return res.status(404).json({ error: 'Part not in local DB and API key not configured' })
      }

      await enforceRateLimit()

      const response = await axios.get(REBRICKABLE_BASE, {
        params: { bricklink_id: cleanPart, key: REBRICKABLE_API_KEY }
      })

      const partData = response.data.results?.[0]
      if (!partData) {
        console.log('[/brick] Part not found on Rebrickable:', cleanPart)
        return res.status(404).json({ error: 'Part not found' })
      }

      const canonicalData = {
        part_num: partData.part_num,
        name: partData.name,
        part_cat_id: partData.part_cat_id,
        part_img_url: partData.part_img_url,
        source: 'api'  // tells the frontend this came from Rebrickable
      }

      // Kick off image download in the background - don't make the frontend wait for it
      if (canonicalData.part_img_url) {
        downloadImage(canonicalData.part_img_url, canonicalData.part_num).catch(err =>
          console.error('[/brick] Background image download failed:', err.message)
        )
      }

      console.log('[/brick] Returning API data for:', canonicalData.part_num)
      return res.json(canonicalData)

    } catch (err) {
      console.error('[/brick] Error:', err.message, err.response?.status)
      if (err.response?.status === 429) return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      return res.status(500).json({ error: `Error: ${err.message}` })
    }
  })

  // Cache: set_num → { setInfo: {name, set_img_url}, parts: [...] }
  // Parts list and set info are stable; bin mappings are re-computed each request
  // so they always reflect current bin contents.
  const setCache = new Map()

  // Set endpoint - fetch all parts for a set and map them to bins
  router.get('/set-bins', async (req, res) => {
    try {
      let { set_num } = req.query
      if (!set_num) return res.status(400).json({ error: 'Missing set_num parameter' })

      // Auto-append variant suffix if missing (75257 → 75257-1)
      if (!set_num.includes('-')) set_num = `${set_num}-1`

      if (!REBRICKABLE_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' })
      }

      let cached = setCache.get(set_num)

      if (!cached) {
        console.log('[/set-bins] Cache miss for', set_num, '— fetching from Rebrickable')

        // Fetch set info (name + image) — one API call
        await enforceRateLimit()
        const setInfoRes = await axios.get(
          `https://rebrickable.com/api/v3/lego/sets/${set_num}/`,
          { params: { key: REBRICKABLE_API_KEY } }
        )
        const setInfo = {
          name: setInfoRes.data.name,
          set_img_url: setInfoRes.data.set_img_url,
        }

        // Fetch all parts with pagination (page_size=1000 minimises calls)
        const allParts = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          await enforceRateLimit()
          const response = await axios.get(
            `https://rebrickable.com/api/v3/lego/sets/${set_num}/parts/`,
            { params: { key: REBRICKABLE_API_KEY, page_size: 1000, page } }
          )
          allParts.push(...response.data.results)
          hasMore = !!response.data.next
          page++
        }

        // Normalise part entries, excluding spares
        const parts = allParts.filter(item => !item.is_spare).map(item => ({
          part_num:  item.part.part_num,
          name:      item.part.name,
          quantity:  item.quantity,
          colorId:   item.color.id,
          colorName: item.color.name,
          colorRgb:  item.color.rgb,
        }))

        cached = { setInfo, parts }
        setCache.set(set_num, cached)
        console.log('[/set-bins] Cached', parts.length, 'parts for', set_num)
      } else {
        console.log('[/set-bins] Cache hit for', set_num)
      }

      const { setInfo, parts } = cached

      // Re-compute bin mappings against current bin state every request
      const binMappings = readBinData()
      const binPartsMap = {}

      for (const part of parts) {
        for (const [binId, bin] of Object.entries(binMappings)) {
          if (!Array.isArray(bin.items)) continue
          const inBin = bin.items.some(item => String(item.partId) === part.part_num)
          if (inBin) {
            if (!binPartsMap[binId]) binPartsMap[binId] = []
            binPartsMap[binId].push(part)
          }
        }
      }

      res.json({
        setNum: set_num,
        setInfo,
        totalParts: parts.length,
        binIds: Object.keys(binPartsMap),
        binPartsMap,
      })

    } catch (err) {
      console.error('[/set-bins] Error:', err.message, err.response?.status)
      if (err.response?.status === 404) return res.status(404).json({ error: 'Set not found' })
      if (err.response?.status === 429) return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      return res.status(500).json({ error: err.message })
    }
  })

  // Image endpoint - serves a part image, using the disk cache if available
  router.get('/image/:part', async (req, res) => {
    try {
      const part = req.params.part?.trim()
      if (!part) return res.status(400).json({ error: 'Missing part number' })

      const imagePath = path.join(IMAGE_DIR, `${part}.jpg`)
      console.log('[/api/image] Requested:', part)

      // If we already downloaded this image before, just send it directly
      if (fs.existsSync(imagePath)) {
        console.log('[/api/image] Serving cached image for:', part)
        return res.sendFile(imagePath)
      }

      // Image not on disk - fetch it from Rebrickable and cache it for next time
      console.log('[/api/image] Not cached, fetching from Rebrickable for:', part)

      if (!REBRICKABLE_API_KEY) {
        return res.status(404).json({ error: 'Image not cached and API key not configured' })
      }

      await enforceRateLimit()

      const response = await axios.get(REBRICKABLE_BASE, {
        params: { part_nums: part, key: REBRICKABLE_API_KEY }
      })

      const partData = response.data.results?.[0]

      if (!partData) {
        return res.status(404).json({ error: 'Part not found on Rebrickable' })
      }
      if (!partData.part_img_url) {
        return res.status(404).json({ error: 'No image available on Rebrickable' })
      }

      // Download and save, then serve the file
      await downloadImage(partData.part_img_url, part)
      return res.sendFile(imagePath)

    } catch (err) {
      console.error('[/api/image] Error:', err.message, err.response?.status)
      if (err.response?.status === 429) return res.status(429).json({ error: 'Rate limited by Rebrickable' })
      return res.status(500).json({ error: `Error: ${err.message}` })
    }
  })

  return router
}