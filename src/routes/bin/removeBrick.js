import { readBinData, writeBinData } from '../../data/binData.js'

// Remove a piece from a bin (and possibly its category)
const removeBrick = (req, res) => {
  const { binId, pieceId, categoryId } = req.body
  const bin = binMappings[binId]
  if (!bin) return res.send('Done')

  bin.pairs = bin.pairs.filter(
    p => !(p.partId === pieceId && p.categoryId === categoryId)
  )

  writeBinData(binMappings)
  res.send('Done')
}

export default removeBrick