import { readBinData } from '../../data/binData.js'

// Given a piece ID, get all bin IDs that contain the piece
const getBins_Brick = (req, res) => {
  const { pieceId } = req.body

  console.log('getBins_Brick called with pieceId:', pieceId)

  const binMappings = readBinData()
  const foundBins = []

  for (const [binId, pieces] of Object.entries(binMappings)) {
    if (pieces.includes(pieceId)) {
      foundBins.push(binId)
      console.log(`Found pieceId ${pieceId} in bin: ${binId}`)
    }
  }

  res.json(foundBins)
}

export default getBins_Brick
