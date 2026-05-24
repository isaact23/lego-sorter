import fs from 'fs'
import path from 'path'

const BIN_DATA = path.resolve('data/bins.json')
const BACKUP_DIR = path.resolve('data/backups')
const MAX_BACKUPS = 10

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
        items: Array.isArray(value.items) ? value.items : [],
        properties: Array.isArray(value.properties) ? value.properties : []
      }
  }

  return normalized
}

// Load database once at startup
function loadBinData () {
  try {
    const raw = fs.readFileSync(BIN_DATA, 'utf8')
    const parsed = JSON.parse(raw)
    const normalized = normalizeBinData(parsed)
    binMappings = normalized
    // If original file lacked a `properties` array on any bin, persist normalized form
    let needWrite = false
    for (const [binId, normBin] of Object.entries(normalized)) {
      const orig = parsed[binId]
      if (!orig || !Array.isArray(orig.properties)) {
        needWrite = true
        break
      }
    }

    if (needWrite) {
      try {
        writeBinData(normalized)
        console.log('Updated bin data file to include missing properties arrays')
      } catch (err) {
        console.error('Failed to write normalized bin data', err)
      }
    }
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

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

function writeBackup(data) {
  ensureBackupDir()

  // Write timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(BACKUP_DIR, `bins-${timestamp}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))

  // Prune oldest backups beyond MAX_BACKUPS
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('bins-') && f.endsWith('.json'))
    .sort() // ISO timestamps sort lexicographically = chronologically

  if (backups.length > MAX_BACKUPS) {
    backups.slice(0, backups.length - MAX_BACKUPS).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f))
    })
  }
}

export function writeBinData(data) {
  binMappings = normalizeBinData(data)

  // Backup before overwriting
  if (fs.existsSync(BIN_DATA)) {
    const existing = fs.readFileSync(BIN_DATA, 'utf8')
    writeBackup(JSON.parse(existing))
  }

  fs.writeFileSync(BIN_DATA, JSON.stringify(binMappings, null, 2))
}

// Restore from a specific backup file, or latest if omitted
export function restoreBinData(filename) {
  ensureBackupDir()
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('bins-') && f.endsWith('.json'))
    .sort()

  if (backups.length === 0) throw new Error('No backups found')

  const target = filename ?? backups[backups.length - 1]
  const backupPath = path.join(BACKUP_DIR, target)
  const raw = fs.readFileSync(backupPath, 'utf8')

  binMappings = normalizeBinData(JSON.parse(raw))
  fs.writeFileSync(BIN_DATA, JSON.stringify(binMappings, null, 2))
  console.log(`Restored from backup: ${target}`)
}

export function listBackups() {
  ensureBackupDir()
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('bins-') && f.endsWith('.json'))
    .sort()
    .reverse() // newest first
}