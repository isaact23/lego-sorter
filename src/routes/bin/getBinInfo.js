import { readBinData } from '../../data/binData.js'

// Given a bin ID, get all pieces that go into that bin.
const getBinInfo = (req, res) => {
  const binId = req.body.binId

  let binMappings = readBinData()

  // Iterate through the rows of the CSV
  for (let row of binMappings) {
    // Look for the row with the bin ID
    if (row[0] == binId) {
      // Send all pieces assigned to this bin
      res.send(row.slice(1))
      return
    }
  }
  res.send([])
}

export default getBinInfo
