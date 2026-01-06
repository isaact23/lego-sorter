const express = require('express')
const path = require('path')
const sqlite = require('better-sqlite3')

const app = express()
const PORT = 3000 // Open database
const db = sqlite('database.db')
db.pragma('journal_mode = WAL')

app.use(express.static(path.join(__dirname, 'frontend/build')))
app.use(express.json())

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'))
})

// Given a bucket ID, get all pieces that go into that bucket.
app.post('/bucket/get', (req, res) => {
  const bucketId = req.body.bucketId
  db.prepare(
    `SELECT Piece, Bucket FROM Buckets
    WHERE Bucket='${bucketId}'`
  ).all()
})

// Add a piece to a bucket.
app.post('/bucket/add', (req, res) => {
  const pieceId = req.body.pieceId
  const bucketId = req.body.bucketId
  db.prepare(
    `INSERT INTO Buckets (Piece, Bucket)'
    VALUES ('${pieceId}', '${bucketId}')`
  ).run()
})

app.listen(PORT, () => {
  console.log('Listening on ' + PORT.toString())
})

// Create tables (only call once)
function createTables () {
  db.prepare(
    'CREATE TABLE Buckets (\
    Piece varchar(255) PRIMARY KEY,\
    Bucket varchar(255))'
  ).run()
}

// Handle shutdown
function cleanup () {
  db.close()
  console.log('\nDatabase closed')
  process.exit()
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
