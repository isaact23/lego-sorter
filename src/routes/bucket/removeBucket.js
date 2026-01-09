import { readBucketData, writeBucketData } from '../../data/bucketData.js'

// Remove a piece from the bucket.
const removeBucket = (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId

  let binMappings = readBucketData()

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bucket ID
    if (binMappings[rowId][0] == bucketId) {
      // Get the pieces in this row
      let pieces = binMappings[rowId].slice(1)

      // Exit if piece is not in the bucket
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
      writeBucketData(binMappings)
      res.send('Done')
      return
    }
  }
  res.send('Done')
}

export default removeBucket
