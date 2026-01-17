import { readBucketData, writeBucketData } from '../../data/bucketData.js'

// Remove a piece from the bucket.
const removeBucket = (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId

  console.log('removeBucket called with pieceId:', pieceId, 'bucketId:', bucketId)

  let binMappings = readBucketData()

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bucket ID
    if (binMappings[rowId][0] == bucketId) {
      // Get the pieces in this row and trim whitespace
      let pieces = binMappings[rowId].slice(1).map(p => p.trim())

      console.log('Found bucket, pieces:', pieces)

      // Exit if piece is not in the bucket
      const index = pieces.indexOf(pieceId)
      if (index == -1) {
        console.log('Piece not found in bucket')
        res.send('Done')
        return
      }

      // Remove the piece from the bucket
      console.log('Removing piece at index:', index)
      pieces.splice(index, 1)
      let row = [binMappings[rowId][0]]
      binMappings[rowId] = row.concat(pieces)

      console.log('Updated row:', binMappings[rowId])

      // Save to filesystem
      writeBucketData(binMappings)
      console.log('Saved to file')
      res.send('Done')
      return
    }
  }
  res.send('Done')
}

export default removeBucket
