import express from 'express'
const router = express.Router()

import getBucketInfo from './bucket/getBucketInfo.js'
import getBucket from './bucket/getBucket.js'
import addBucket from './bucket/addBucket.js'
import removeBucket from './bucket/removeBucket.js'

// Routes under the /bucket route
router.post('/get-info', getBucketInfo)
router.post('/get-bucket', getBucket)
router.post('/add', addBucket)
router.post('/remove', removeBucket)

export default router
