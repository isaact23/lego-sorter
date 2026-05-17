import { readBinData, writeBinData } from '../../data/binData.js'

const updateBinProperties = (req, res) => {
  const { binId, properties } = req.body

  if (!binId) {
    return res.status(400).json({ success: false, message: 'binId is required' })
  }

  const binMappings = readBinData()

  if (!binMappings[binId]) {
    binMappings[binId] = { items: [], properties: [] }
  }

  binMappings[binId].properties = Array.isArray(properties) ? properties : []

  writeBinData(binMappings)

  res.json({ success: true, binId, properties: binMappings[binId].properties })
}

export default updateBinProperties
