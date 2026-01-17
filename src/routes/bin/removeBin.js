import { readBinData, writeBinData } from '../../data/binData.js'

// Remove a piece from the bin.
const removeBin = (req, res) => {
  const pieceId = req.body.pieceId
  const binId = req.body.binId

  console.log('removeBin called with pieceId:', pieceId, 'binId:', binId)

  let binMappings = readBinData()

  // Iterate through row INDICES
  for (let rowId in binMappings) {
    // Look for a row with the bin ID
    if (binMappings[rowId][0] == binId) {
      // Get the pieces in this row and trim whitespace
      let pieces = binMappings[rowId].slice(1).map(p => p.trim())

      console.log('Found bin, pieces:', pieces)

      // Exit if piece is not in the bin
      const index = pieces.indexOf(pieceId)
      if (index == -1) {
        console.log('Piece not found in bin')
        res.send('Done')
        return
      }

      // Remove the piece from the bin
      console.log('Removing piece at index:', index)
      pieces.splice(index, 1)
      let row = [binMappings[rowId][0]]
      binMappings[rowId] = row.concat(pieces)

      console.log('Updated row:', binMappings[rowId])

      // Save to filesystem
      writeBinData(binMappings)
      console.log('Saved to file')
      res.send('Done')
      return
    }
  }
  res.send('Done')
}

export default removeBin
