import express from 'express'
import path from 'path'
import { loadCsv, writeCsv } from './csv.js'

const app = express()
const PORT = 3000

// Load database
let binMappings
loadCsv(data => {
  binMappings = data
  console.log('Loaded bin mappings')
})

app.use(express.static(path.join(import.meta.dirname, 'frontend/build')))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(import.meta.dirname, 'frontend/build/index.html'))
})

// Given a bucket ID, get all pieces that go into that bucket.
app.post('/bucket/get', (req, res) => {
  const bucketId = req.body.bucketId

  // Iterate through the rows of the CSV
  for (let row of binMappings) {
    // Look for the row with the bucket ID
    if (row[0] == bucketId) {
      // Send all pieces assigned to this bucket
      res.send(row.slice(1))
      return
    }
  }
  res.send([])
})

// Add a piece to a bucket.
app.post('/bucket/add', (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bucket ID
    if (binMappings[rowId][0] == bucketId) {
      // Check if the piece is already in the bucket
      const pieces = binMappings[rowId].slice(1)
      if (pieces.indexOf(pieceId) >= 0) {
        res.send('Done')
        return
      }
    }
  }

  // Add a new row and save to filesystem
  binMappings = binMappings.concat([[bucketId, pieceId]])
  writeCsv(binMappings)
})

// Remove a piece from the bucket.
app.post('/bucket/remove', (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bucket ID
    if (binMappings[rowId][0] == bucketId) {
      // Check if the piece is in the bucket
      let pieces = binMappings[rowId].slice(1)
      const index = pieces.indexOf(pieceId)
      if (index == -1) {
        res.send('Done')
        return
      }

      // Remove the piece from the bucket
      pieces.splice(index, 1)
      let row = [binMappings[rowId][0]]
      binMappings[rowId] = row.concat(pieces)

      // Save to filesystem
      writeCsv(binMappings)
    }
  }
  res.send('Done')
})

app.listen(PORT, () => {
  console.log('Listening on ' + PORT.toString())
})

// Handle shutdown
function cleanup () {
  process.exit()
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
