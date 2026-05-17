import { readBinData } from '../../data/binData.js'

const getAllBins = (req, res) => {
  const binMappings = readBinData()
  res.json(binMappings)
}

export default getAllBins
