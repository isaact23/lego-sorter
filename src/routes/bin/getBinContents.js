import { readBinData } from '../../data/binData.js'

// Given a bin ID, get all pieces in that bin
const getBinContents = (req, res) => {
  const { binId } = req.body

  console.log(`Looking for pieces in bin ID: ${binId}`)

  const binMappings = readBinData()

  const contents = binMappings[binId] || []

  res.send(contents)
}

export default getBinContents
