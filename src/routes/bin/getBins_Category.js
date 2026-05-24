import { readBinData } from '../../binData.js'

const getBins_Category = (req, res) => {
  const { categoryId } = req.body
  const categoryIdStr = String(categoryId)

  console.log('getBins_Category called with categoryId:', categoryIdStr)

  const binMappings = readBinData()
  const foundBins = []

  for (const [binId, bin] of Object.entries(binMappings)) {
    if (!bin.items || !Array.isArray(bin.items)) continue

    const match = bin.items.some(
      item => String(item.categoryId) === categoryIdStr
    )

    if (match) {
      foundBins.push(binId)
      console.log(`Found ${categoryIdStr} in bin ${binId}`)
    }
  }

  res.json(foundBins)
}

export default getBins_Category