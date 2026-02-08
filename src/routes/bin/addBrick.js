import { readBinData, writeBinData } from '../../data/binData.js'

// Add a piece to a bin (and track category)
const addBrick = (req, res) => {
  const { binId, pieceId, categoryId } = req.body

  if (!binMappings[binId]) {
    binMappings[binId] = { pairs: [] }
  }

  const bin = binMappings[binId]

  const exists = bin.pairs.some(
    p => p.partId === pieceId && p.categoryId === categoryId
  )

  if (!exists) {
    bin.pairs.push({ partId: pieceId, categoryId })
  }

  writeBinData(binMappings)
  res.send('Done')
}

export default addBrick