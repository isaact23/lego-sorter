import { readBucketData } from '../../data/bucketData.js'

// Given a piece ID, get all bucket IDs that contain the piece.
const getAllBins = (req, res) => {
  const pieceId = req.body.pieceId

  console.log('getAllBins called with pieceId:', pieceId)

  let binMappings = readBucketData()
  let foundBins = []

  // Iterate through all rows and collect bins containing this piece
  for (let rowId in binMappings) {
    let pieces = binMappings[rowId].slice(1).map(p => p.trim())

    if (pieces.indexOf(pieceId) >= 0) {
      foundBins.push(binMappings[rowId][0])
      console.log(`Found pieceId ${pieceId} in bin: ${binMappings[rowId][0]}`)
    }
  }

  if (foundBins.length > 0) {
    res.json(foundBins)
  } else {
    console.log(`pieceId ${pieceId} not found in any bins`)
    res.json([])
  }
}

export default getAllBins