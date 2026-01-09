import { readBucketData } from '../../data/bucketData.js'

// Given a piece ID, get the bucket ID that the piece goes into.
const getBucket = (req, res) => {
  const pieceId = req.body.pieceId

  let binMappings = readBucketData()

  // Iterate through the rows of the CSV
  for (let rowId in binMappings) {
    let pieces = binMappings[rowId].slice(1)

    // If the row contains the given piece ID, send back the bucket number.
    if (pieces.indexOf(pieceId) >= 0) {
      res.send(binMappings[rowId][0])
      return
    }
  }
  res.status(404).json({ error: 'Piece not found in any bucket' })
}

export default getBucket
