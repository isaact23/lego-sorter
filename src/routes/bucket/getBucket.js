import { readBucketData } from '../../data/bucketData.js'

// Given a piece ID, get the bucket ID that the piece goes into.
const getBucket = (req, res) => {
  const pieceId = req.body.pieceId

  console.log('getBucket called with pieceId:', pieceId, 'type:', typeof pieceId)

  let binMappings = readBucketData()

  console.log('binMappings keys:', Object.keys(binMappings))

  // Iterate through the rows of the CSV
  for (let rowId in binMappings) {
    let pieces = binMappings[rowId].slice(1).map(p => p.trim())

    console.log(`Checking rowId: ${rowId}, binId: ${binMappings[rowId][0]}, pieces:`, pieces)

    // If the row contains the given piece ID, send back the bucket number.
    if (pieces.indexOf(pieceId) >= 0) {
      console.log(`Found pieceId ${pieceId} in rowId ${rowId}, returning binId: ${binMappings[rowId][0]}`)
      res.send(binMappings[rowId][0])
      return
    }
  }
  console.log(`pieceId ${pieceId} not found in any bucket`)
  res.status(404).json({ error: 'Piece not found in any bucket' })
}

export default getBucket
