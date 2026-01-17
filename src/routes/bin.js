import express from 'express'
const router = express.Router()

import getBinInfo from './bin/getBinInfo.js'
import getBin from './bin/getBin.js'
import addBin from './bin/addBin.js'
import removeBin from './bin/removeBin.js'
import getAllBins from './bin/getAllBins.js'

// Routes under the /bin route
router.post('/get-info', getBinInfo)
router.post('/get-bin', getBin)
router.post('/add', addBin)
router.post('/remove', removeBin)
router.post('/get-all-bins', getAllBins)

export default router
