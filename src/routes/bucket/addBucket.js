import { readBucketData, writeBucketData } from '../../data/bucketData.js'

// Add a piece to a bucket.
const addBucket = (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId

  let binMappings = readBucketData()

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

      // Add the piece to the current row
      binMappings[rowId] = binMappings[rowId].concat(pieceId)
      writeBucketData(binMappings)
      res.send('Done')
      return
    }
  }

  // Add a new row and save to filesystem
  binMappings = binMappings.concat([[bucketId, pieceId]])
  writeBucketData(binMappings)
  res.send('Done')
}

export default addBucket
