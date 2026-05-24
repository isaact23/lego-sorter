import fs from 'fs'
import path from 'path'

const SYSTEMS_FILE = path.resolve('data/systems.json')
const BACKUP_DIR   = path.resolve('data/backups')
const MAX_BACKUPS  = 10

function writeBackup (current) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    fs.writeFileSync(path.join(BACKUP_DIR, `systems-${ts}.json`), current, 'utf-8')

    // Prune oldest backups beyond MAX_BACKUPS
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('systems-'))
      .sort()
    for (const old of files.slice(0, -MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old))
    }
  } catch (err) {
    console.warn('[saveSystems] backup failed:', err.message)
  }
}

const saveSystems = (req, res) => {
  try {
    const data = req.body

    if (!data || !Array.isArray(data.systems)) {
      return res.status(400).json({ error: 'Body must contain a "systems" array' })
    }

    // Back up whatever is currently on disk
    if (fs.existsSync(SYSTEMS_FILE)) {
      writeBackup(fs.readFileSync(SYSTEMS_FILE, 'utf-8'))
    }

    fs.writeFileSync(SYSTEMS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    res.json({ ok: true })
  } catch (err) {
    console.error('[saveSystems]', err)
    res.status(500).json({ error: 'Failed to save systems data' })
  }
}

export default saveSystems
