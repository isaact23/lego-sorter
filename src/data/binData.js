import fs from 'fs'
import path from 'path'

const BIN_DATA = path.resolve('data/bins.json')

// In-memory cache
let binMappings = {}

// Normalize legacy + new formats
function normalizeBinData (data) {
  const normalized = {}

  for (const [binId, value] of Object.entries(data)) {

    // Legacy: bin → [partIds]
    if (Array.isArray(value)) {
      normalized[binId] = {
        items: value.map(partId => ({
          partId,
          categoryId: null
        }))
      }
      continue
    }

    // Semi-legacy: { parts, categories }
    if (value.parts && Array.isArray(value.parts)) {
      normalized[binId] = {
        items: value.parts.map(partId => ({
          partId,
          categoryId: null
        }))
      }
      continue
    }

    // New format
    normalized[binId] = {
      items: Array.isArray(value.items) ? value.items : []
    }
  }

  return normalized
}

// Load database once at startup
function loadBinData () {
  try {
    const raw = fs.readFileSync(BIN_DATA, 'utf8')
    const parsed = JSON.parse(raw)
    binMappings = normalizeBinData(parsed)
    console.log('Loaded bin mappings (normalized)')
  } catch (err) {
    console.error('Failed to load bin mappings', err)
    binMappings = {}
  }
}

loadBinData()

export function readBinData () {
  return binMappings
}

export function writeBinData (data) {
  binMappings = normalizeBinData(data)
  fs.writeFileSync(BIN_DATA, JSON.stringify(binMappings, null, 2))
}