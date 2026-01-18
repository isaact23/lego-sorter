import { readBinData } from '../../data/binData.js'

function searchParts (req, res) {
  const { prefix } = req.body

  if (!prefix || typeof prefix !== 'string') {
    res.send([])
    return
  }

  try {
    const binMappings = readBinData()
    const matchingBins = []

    // Iterate through all bins
    for (let rowId in binMappings) {
      const binData = binMappings[rowId]
      const binId = binData[0] // First element is the bin ID
      const pieces = binData.slice(1).map(p => p.toString().trim()) // Rest are part IDs

      // Check if any part ID starts with the search prefix
      for (const partId of pieces) {
        if (partId.startsWith(prefix)) {
          matchingBins.push(binId)
          break // Don't add the same bin multiple times
        }
      }
    }

    console.log(`Search for "${prefix}" found ${matchingBins.length} matching bins:`, matchingBins)
    res.send(matchingBins)
  } catch (err) {
    console.error('Error searching parts:', err)
    res.status(500).send([])
  }
}

export default searchParts
