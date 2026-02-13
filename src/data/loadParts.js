import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const partsDB = {}

export function loadParts() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(import.meta.dirname, 'parts.csv')

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const key = row.part_num?.trim()
        if (!key) return

        // Store only what you care about
        partsDB[key] = {
          part_num: key,
          name: row.name,
          part_cat_id: row.part_cat_id,
          part_material: row.part_material
        }
      })
      .on('end', () => {
        console.log(`Loaded ${Object.keys(partsDB).length} parts into memory`)
        resolve()
      })
      .on('error', reject)
  })
}

export function getPart(partNumber) {
  if (!partNumber) return null
  return partsDB[partNumber.trim()] || null
}