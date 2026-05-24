import express from 'express'
import getSystems  from './system/getSystems.js'
import saveSystems from './system/saveSystems.js'

const router = express.Router()

router.get('/',  getSystems)   // GET  /api/systems
router.put('/',  saveSystems)  // PUT  /api/systems  (used by future editor)

export default router
