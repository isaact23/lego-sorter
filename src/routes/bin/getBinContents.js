import { readBinData } from '../../data/binData.js'

const getBinContents = (req, res) => {
  const { binId } = req.body

  const binMappings = readBinData()
  const bin = binMappings[binId]

  if (!bin) {
    return res.json({ items: [], properties: [] })
  }

  // Return part IDs only (Select expects this)
  const partIds = bin.items.map(item => item.partId)
  const properties = Array.isArray(bin.properties) ? bin.properties : []

  res.json({ items: partIds, properties })
}

export default getBinContents