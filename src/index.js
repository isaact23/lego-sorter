import express from 'express'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import axios from 'axios'

import './data/binData.js'
import binRouter from './routes/bin.js'

import csv from 'csv-parser'

const partsMap = new Map()

const csvPath = path.join(import.meta.dirname, 'data', 'parts.csv')



const app = express()
const PORT = 3000

const fetching = new Set()

// Middleware
app.use(cors())
app.use(express.json())

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    partsMap.set(row.part_num, row)
  })
  .on('end', () => {
    console.log('CSV loaded:', partsMap.size, 'parts')
  })
  .on('error', (err) => {
    console.error('Error loading CSV:', err)
  })

// Serve cached images
app.use(
  '/images',
  express.static(path.join(import.meta.dirname, 'images'))
)

// React frontend
app.use(express.static(path.join(import.meta.dirname, '../frontend/build')))

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

app.get('/', (req, res) => {
  res.sendFile(path.join(import.meta.dirname, '../frontend/build/index.html'))
})

// Bin routes
app.use('/bin', binRouter)

// Image endpoint with caching and graceful failure
app.get('/api/image/:part', async (req, res) => {
  const part = req.params.part?.trim()

  if (!part) {
    return res.status(400).json({ error: 'Missing part number' })
  }

  const imagePath = path.join(
    import.meta.dirname,
    'images',
    `${part}.jpg`
  )

  // If cached locally, return it
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath)
  }

  // Prevent duplicate simultaneous fetches
  if (fetching.has(part)) {
    return res.status(204).end()
  }

  fetching.add(part)

  try {
    /*
    const metaResponse = await axios.get(
      `https://rebrickable.com/api/v3/lego/parts/${part}/`,
      {
        headers: {
          Authorization: `key ${process.env.REBRICKABLE_API_KEY}`
        },
        timeout: 5000
      }
    )
    */
    const imageUrl = metaResponse.data?.part_img_url

    if (!imageUrl) {
      fetching.delete(part)
      return res.status(404).end()
    }

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    })

    fs.writeFileSync(imagePath, imageResponse.data)

    fetching.delete(part)

    return res.sendFile(imagePath)

  } catch (err) {
    fetching.delete(part)

    // External service unavailable
    console.warn('Image fetch skipped for', part)

    // Graceful failure: no image, but no crash
    return res.status(204).end()
  }
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})