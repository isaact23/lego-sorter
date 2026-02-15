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