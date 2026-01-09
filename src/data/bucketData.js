import { loadCsv, writeCsv } from './csv.js'

const BUCKET_DATA = 'data/buckets.csv'

// Load database
let binMappings
loadCsv(BUCKET_DATA, data => {
  binMappings = data
  console.log('Loaded bin mappings')
})

// Get the most up-to-date bucket data
export function readBucketData () {
  return binMappings
}

// Write to the bucket data file
export function writeBucketData (data) {
  writeCsv(BUCKET_DATA, data)
  binMappings = data
}
