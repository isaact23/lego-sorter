import { readBucketData } from '../../data/bucketData.js'

// Given a bucket ID, get all pieces that go into that bucket.
const getBucketInfo = (req, res) => {
  const bucketId = req.body.bucketId

  let binMappings = readBucketData()

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
}

export default getBucketInfo
