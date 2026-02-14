import express from 'express'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'
import binRouter from './routes/bin.js'
import './data/binData.js'

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

const partsMap = new Map()
const csvPath = path.join(__dirname, 'data', 'parts.csv')

// Middleware
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log('REQ:', req.method, req.url)
  next()
})

// =====================
// BIN ROUTES
// =====================
app.use('/bin', binRouter)

// =====================
// BRICK LOOKUP API
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
// LOCAL IMAGE ENDPOINT
// =====================
app.get('/api/image/:part', (req, res) => {
  const part = req.params.part?.trim()

  if (!part) {
    return res.status(400).json({ error: 'Missing part number' })
  }

  const imagePath = path.join(__dirname, 'images', `${part}.jpg`)

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' })
  }

  return res.sendFile(imagePath)
})

// =====================
// LOAD CSV INTO MEMORY
// =====================
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