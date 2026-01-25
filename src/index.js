import express from 'express'
import path from 'path'
import cors from 'cors'
import './data/binData.js'
import binRouter from './routes/bin.js'

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.static(path.join(import.meta.dirname, '../frontend/build')))
app.use(express.json())


// Send the frontend when loading the webpage
app.get('/', (req, res) => {
  res.sendFile(path.join(import.meta.dirname, '../frontend/build/index.html'))
})

// All requests to the /bin route are sent to binRouter
app.use('/bin', binRouter)

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
