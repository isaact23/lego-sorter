import { readBinData } from '../../binData.js'

const getBins_Brick = (req, res) => {
  const { pieceId } = req.body
  const pieceIdStr = String(pieceId)

  console.log('getBins_Brick called with pieceId:', pieceIdStr)

  const binMappings = readBinData()
  const foundBins = []

  for (const [binId, bin] of Object.entries(binMappings)) {
    if (!bin.items || !Array.isArray(bin.items)) continue

    const match = bin.items.some(
      item => String(item.partId) === pieceIdStr
    )

    if (match) {
      foundBins.push(binId)
      console.log(`Found ${pieceIdStr} in bin ${binId}`)
    }
  }

  res.json(foundBins)
}

export default getBins_Brick