import { readBinData, writeBinData } from '../../data/binData.js'

// Add a piece to a bin.
const addBin = (req, res) => {
  const pieceId = req.body.pieceId
  const binId = req.body.binId

  let binMappings = readBinData()

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bin ID
    if (binMappings[rowId][0] == binId) {
      // Check if the piece is already in the bin
      const pieces = binMappings[rowId].slice(1)
      if (pieces.indexOf(pieceId) >= 0) {
        res.send('Done')
        return
      }

      // Add the piece to the current row
      binMappings[rowId] = binMappings[rowId].concat(pieceId)
      writeBinData(binMappings)
      res.send('Done')
      return
    }
  }

  // Add a new row and save to filesystem
  binMappings = binMappings.concat([[binId, pieceId]])
  writeBinData(binMappings)
  res.send('Done')
}

export default addBin
