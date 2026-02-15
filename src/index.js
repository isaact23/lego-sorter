import express from 'express'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import csv from 'csv-parser'
import axios from 'axios'
import { fileURLToPath } from 'url'
import binRouter from './routes/bin.js'
import './data/binData.js'

// =====================
// SETUP
// =====================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

const partsMap = new Map()
const csvPath = path.join(__dirname, 'data', 'parts.csv')
const IMAGE_DIR = path.join(__dirname, 'images')

const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY
const REBRICKABLE_BASE = 'https://rebrickable.com/api/v3/lego/parts/'

const MAX_BATCH_SIZE = 50
const MIN_DELAY_MS = 1000
const MAX_DAILY_CALLS = 200

let lastCallTime = 0
let dailyCallCount = 0

console.log('API KEY PRESENT:', !!process.env.REBRICKABLE_API_KEY)

// =====================
// MIDDLEWARE
// =====================

app.use(cors())
app.use(express.json())

// =====================
// RATE LIMITER
// =====================

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

// =====================
// IMAGE HELPERS
// =====================

function getMissingImages(parts) {
  return parts.filter(part => {
    const imagePath = path.join(IMAGE_DIR, `${part}.jpg`)
    return !fs.existsSync(imagePath)
  })
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

// =====================
// BIN ROUTES
// =====================

app.use('/bin', binRouter)

// =====================
// BRICK LOOKUP
// =====================

app.get('/api/brick', (req, res) => {
  const part = req.query.part?.trim()

  if (!part) {
    return res.status(400).json({ error: 'Missing part parameter' })
  }

  const brick = partsMap.get(part)

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

// =====================
// LOCAL IMAGE SERVING
// =====================

app.get('/api/image/:part', async (req, res) => {
  console.log({
    Authorization: `key ${process.env.REBRICKABLE_API_KEY}`
  })
  try {
    const part = req.params.part?.trim()
    if (!part) {
      return res.status(400).json({ error: 'Missing part number' })
    }

    const imagePath = path.join(IMAGE_DIR, `${part}.jpg`)

    // If image already cached → serve it
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath)
    }

    // Otherwise fetch from Rebrickable
    console.log('Fetching image from Rebrickable for:', part)

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

  } 
  catch (err) {
    console.error('Image route error FULL:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack
    })

    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limited by Rebrickable' })
    }

    return res.status(500).json({ error: err.message })
  }
})

// =====================
// SAFE REBRICKABLE FETCH
// =====================
/*
app.post('/api/rebrickable/images', async (req, res) => {
  try {
    
    if (!REBRICKABLE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const parts = req.body.parts

    if (!Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ error: 'Invalid parts array' })
    }

    if (parts.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: 'Batch too large' })
    }

    const missing = getMissingImages(parts)

    if (missing.length === 0) {
      return res.json({ message: 'All images already cached' })
    }

    await enforceRateLimit()

    const response = await axios.get(REBRICKABLE_BASE, {
      params: {
        part_nums: missing.join(','),
        key: REBRICKABLE_API_KEY
      }
    })

    for (const part of response.data.results) {
      if (part.part_img_url) {
        await downloadImage(part.part_img_url, part.part_num)
      }
    }

    return res.json({ fetched: missing.length })

  } catch (err) {
    console.error('Rebrickable error:', err.message)

    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limited by Rebrickable' })
    }

    return res.status(500).json({ error: 'Image fetch failed' })
  }
})
*/
// =====================
// LOAD CSV
// =====================

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    partsMap.set(row.part_num, row)
  })
  .on('end', () => {
    console.log('CSV loaded:', partsMap.size, 'parts')
  })

// =====================
// SERVE REACT BUILD
// =====================

const buildPath = path.join(__dirname, '../frontend/build')

app.use(express.static(buildPath))

app.use((req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'))
})

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})