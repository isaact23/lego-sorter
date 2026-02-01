import express from 'express'
const router = express.Router()

import getBinContents from './bin/getBinContents.js'
import addBrick from './bin/addBrick.js'
import removeBrick from './bin/removeBrick.js'
import getBins_Brick from './bin/getBins_Brick.js'
import searchParts from './bin/searchParts.js'

// Routes under the /bin route
router.post('/get-info', getBinContents)
router.post('/add', addBrick)
router.post('/remove', removeBrick)
router.post('/getBins_Brick', getBins_Brick)
router.post('/search-parts', searchParts)

export default router
