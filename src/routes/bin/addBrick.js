import { readBinData, writeBinData } from '../../data/binData.js'

// Add a piece to a bin (and track category)
const addBrick = (req, res) => {
  const { binId, pieceId, categoryId } = req.body

  const binMappings = readBinData()

  if (!binMappings[binId]) {
    binMappings[binId] = { items: [] }
  }

  const bin = binMappings[binId]
  if (!Array.isArray(bin.items)) bin.items = []

  const exists = bin.items.some(
    item =>
      String(item.partId) === String(pieceId) &&
      String(item.categoryId) === String(categoryId)
  )

  if (!exists) {
    bin.items.push({ partId: pieceId, categoryId })
  }

  writeBinData(binMappings)
  res.json({ success: true })
}

export default addBrick