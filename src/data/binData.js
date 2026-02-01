import fs from 'fs'
import path from 'path'

const BIN_DATA = path.resolve('data/bins.json')

// In-memory cache
let binMappings = {}

// Load database once at startup
function loadBinData () {
  try {
    const raw = fs.readFileSync(BIN_DATA, 'utf8')
    binMappings = JSON.parse(raw)
    console.log('Loaded bin mappings (JSON)')
  } catch (err) {
    console.error('Failed to load bin mappings', err)
    binMappings = {}
  }
}

loadBinData()

// Read-only access
export function readBinData () {
  return binMappings
}

// Persist updates
export function writeBinData (data) {
  binMappings = data
  fs.writeFileSync(BIN_DATA, JSON.stringify(binMappings, null, 2))
}
