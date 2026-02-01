import { readBinData, writeBinData } from '../../data/binData.js'

// Remove a piece from a bin
const removeBrick = (req, res) => {
  const { pieceId, binId } = req.body

  console.log('removeBrick called with pieceId:', pieceId, 'binId:', binId)

  const binMappings = readBinData()

  // If bin does not exist, nothing to do
  if (!binMappings[binId]) {
    console.log('Bin not found')
    res.send('Done')
    return
  }

  const pieces = binMappings[binId]

  const index = pieces.indexOf(pieceId)
  if (index === -1) {
    console.log('Piece not found in bin')
    res.send('Done')
    return
  }

  // Remove the piece
  pieces.splice(index, 1)

  // Optional: delete empty bins
  if (pieces.length === 0) {
    delete binMappings[binId]
  }

  writeBinData(binMappings)
  console.log('Saved updated bin data')

  res.send('Done')
}

export default removeBrick
