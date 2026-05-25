import express from 'express'
const router = express.Router()

import getBinContents from './bin/getBinContents.js'
import addBrick from './bin/addBrick.js'
import removeBrick from './bin/removeBrick.js'
import getBins_Brick from './bin/getBins_Brick.js'
import getBins_Category from './bin/getBins_Category.js'
import getBins_Property from './bin/getBins_Property.js'
import getAllBins from './bin/getAllBins.js'
import updateBinProperties from './bin/updateBinProperties.js'
import emptyBin from './bin/emptyBin.js'
import setBinName from './bin/setBinName.js'

// Routes under the /bin route
router.post('/get-Info', getBinContents)
router.post('/add', addBrick)
router.post('/remove', removeBrick)
router.post('/getBins_Brick', getBins_Brick)
router.post('/getBins_Category', getBins_Category)
router.post('/getBins_Property', getBins_Property)
router.get('/all', getAllBins)
router.post('/updateProperties', updateBinProperties)
router.post('/empty', emptyBin)
router.post('/setName', setBinName)

export default router
