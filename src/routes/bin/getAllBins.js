import { readBinData } from '../../binData.js'

const getAllBins = (req, res) => {
  const binMappings = readBinData()
  res.json(binMappings)
}

export default getAllBins
