import { readBinData } from '../../binData.js'

const getBinContents = (req, res) => {
  const { binId } = req.body

  const binMappings = readBinData()
  const bin = binMappings[binId]

  if (!bin) {
    return res.json({ items: [], properties: [] })
  }

  // Return part IDs only (Select expects this), plus raw item details for admin swaps
  const partIds = Array.isArray(bin.items) ? bin.items.map(item => item.partId) : []
  const properties = Array.isArray(bin.properties) ? bin.properties : []
  const details = Array.isArray(bin.items) ? bin.items : []

  res.json({ items: partIds, details, properties })
}

export default getBinContents