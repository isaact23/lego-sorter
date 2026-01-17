import express from 'express'
const router = express.Router()

import getBucketInfo from './bucket/getBucketInfo.js'
import getBucket from './bucket/getBucket.js'
import addBucket from './bucket/addBucket.js'
import removeBucket from './bucket/removeBucket.js'
import getAllBins from './bucket/getAllBins.js'

// Routes under the /bucket route
router.post('/get-info', getBucketInfo)
router.post('/get-bin', getBucket)
router.post('/add', addBucket)
router.post('/remove', removeBucket)
router.post('/get-all-bins', getAllBins)

export default router
