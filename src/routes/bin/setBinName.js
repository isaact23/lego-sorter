import { readBinData, writeBinData } from '../../binData.js'

const setBinName = (req, res) => {
  const { binId, name } = req.body

  if (!binId) {
    return res.status(400).json({ success: false, message: 'binId is required' })
  }

  const binMappings = readBinData()

  if (!binMappings[binId]) {
    binMappings[binId] = { items: [], properties: [] }
  }

  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed) {
    binMappings[binId].name = trimmed
  } else {
    delete binMappings[binId].name
  }

  writeBinData(binMappings)

  res.json({ success: true, binId, name: binMappings[binId].name ?? null })
}

export default setBinName
