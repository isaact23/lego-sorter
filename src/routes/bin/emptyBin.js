import { readBinData, writeBinData } from '../../binData.js'

const emptyBin = (req, res) => {
  const { binId } = req.body

  if (!binId) {
    return res.status(400).json({ success: false, message: 'binId is required' })
  }

  const binMappings = readBinData()

  if (!binMappings[binId]) {
    binMappings[binId] = { items: [], properties: [] }
  }

  binMappings[binId].items = []
  binMappings[binId].properties = ['Empty']

  writeBinData(binMappings)

  res.json({ success: true, binId, properties: binMappings[binId].properties })
}

export default emptyBin
