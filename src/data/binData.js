import { loadCsv, writeCsv } from './csv.js'

const BIN_DATA = 'data/bins.csv'

// Load database
let binMappings
loadCsv(BIN_DATA, data => {
  binMappings = data
  console.log('Loaded bin mappings')
})

// Get the most up-to-date bin data
export function readBinData () {
  return binMappings
}

// Write to the bin data file
export function writeBinData (data) {
  writeCsv(BIN_DATA, data)
  binMappings = data
}
