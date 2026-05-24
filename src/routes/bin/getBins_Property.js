import { readBinData } from '../../binData.js'

const getBins_Property = (req, res) => {
  const { propertyId } = req.body
  const propIdStr = String(propertyId)

  console.log('getBins_Property called with propertyId:', propIdStr)

  const binMappings = readBinData()
  const foundBins = []

  for (const [binId, bin] of Object.entries(binMappings)) {
    const props = Array.isArray(bin.properties) ? bin.properties : []
    if (props.some(p => String(p) === propIdStr)) {
      foundBins.push(binId)
      console.log(`Found property ${propIdStr} on bin ${binId}`)
    }
  }

  res.json(foundBins)
}

export default getBins_Property
