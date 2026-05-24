import { readBinData, writeBinData } from '../../binData.js'

// Remove a piece-category pair from a bin
const removeBrick = (req, res) => {
  const { binId, pieceId, categoryId } = req.body

  const binMappings = readBinData()
  const bin = binMappings[binId]

  if (!bin || !Array.isArray(bin.items)) {
    return res.json({ success: true })
  }

  bin.items = bin.items.filter(
    item =>
      !(
        String(item.partId) === String(pieceId) &&
        String(item.categoryId) === String(categoryId)
      )
  )

  writeBinData(binMappings)
  res.json({ success: true })
}

export default removeBrick