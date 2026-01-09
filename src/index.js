import express from 'express'
import path from 'path'
import './data/bucketData.js'
import bucketRouter from './routes/bucket.js'

const app = express()
const PORT = 3000

// Middleware
app.use(express.static(path.join(import.meta.dirname, '../frontend/build')))
app.use(express.json())

// Send the frontend when loading the webpage
app.get('/', (req, res) => {
  res.sendFile(path.join(import.meta.dirname, '../frontend/build/index.html'))
})

// All requests to the /bucket route are sent to bucketRouter
app.use('/bucket', bucketRouter)

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
