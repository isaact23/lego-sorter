import fs from 'fs'
import path from 'path'

const SYSTEMS_FILE = path.resolve('data/systems.json')

const getSystems = (req, res) => {
  try {
    if (!fs.existsSync(SYSTEMS_FILE)) {
      return res.status(404).json({ error: 'systems.json not found' })
    }
    const raw = fs.readFileSync(SYSTEMS_FILE, 'utf-8')
    res.json(JSON.parse(raw))
  } catch (err) {
    console.error('[getSystems]', err)
    res.status(500).json({ error: 'Failed to read systems data' })
  }
}

export default getSystems
