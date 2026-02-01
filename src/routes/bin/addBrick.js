import { readBinData, writeBinData } from '../../data/binData.js'

// Add a piece to a bin
const addBrick = (req, res) => {
  const { pieceId, binId } = req.body

  const binMappings = readBinData()

  // Ensure bin exists
  if (!binMappings[binId]) {
    binMappings[binId] = []
  }

  // Already present, nothing to do
  if (binMappings[binId].includes(pieceId)) {
    res.send('Done')
    return
  }

  // Add piece
  binMappings[binId].push(pieceId)
  writeBinData(binMappings)

  res.send('Done')
}

export default addBrick
