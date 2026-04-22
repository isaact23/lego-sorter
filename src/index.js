import express from 'express'
import path from 'path'
import cors from 'cors'
import fs from 'fs'
import csv from 'csv-parser'
import axios from 'axios'
import { fileURLToPath } from 'url'
import binRouter from './routes/bin.js'
import createBrickRouter from './routes/brick.js'
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

// Ensure IMAGE_DIR exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true })
  console.log('[INIT] Created IMAGE_DIR:', IMAGE_DIR)
} else {
  console.log('[INIT] IMAGE_DIR exists:', IMAGE_DIR)
  try {
    const files = fs.readdirSync(IMAGE_DIR)
    console.log('[INIT] Images in directory:', files.length)
  } catch (err) {
    console.error('[INIT] Error reading IMAGE_DIR:', err.message)
  }
}

console.log('API KEY PRESENT:', !!process.env.REBRICKABLE_API_KEY)

// =====================
// MIDDLEWARE
// =====================

app.use(cors())
app.use(express.json())

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
// ROUTES
// =====================

app.use('/bin', binRouter)
app.use('/api', createBrickRouter(partsMap, IMAGE_DIR))

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