import './BucketEditor.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function BucketEditor ({ bucketId, returnToCamera, returnToGrid }) {
  const [pieces, setPieces] = useState([])

  // Send request to backend to get bucket information when bucket ID changes
  useEffect(fetchPieces, [bucketId])

  // Fetch piece listing from backend
  function fetchPieces () {
    console.log('Fetching bucket info for ' + bucketId)

    axios
      .post(
        'http://localhost:3000/bucket/get',
        {
          bucketId: bucketId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => {
        console.log('Got pieces ' + res.data)
        setPieces(res.data)
      })
  }

  // Generate HTML listing of pieces
  const getPieces = () => {
    return pieces.map(piece => (
      <div className='Piece'>
        <h2>{piece}</h2>
      </div>
    ))
  }

  // Add a piece to the bucket mapping
  function addPiece () {
    const pieceId = prompt('Enter piece # to add')
    if (pieceId == null) return

    axios
      .post(
        'http://localhost:3000/bucket/add',
        {
          bucketId: bucketId,
          pieceId: pieceId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => {
        fetchPieces()
      })
  }

  // Remove a piece from the bucket mapping
  function removePiece () {
    const pieceId = prompt('Enter piece # to remove')
    if (pieceId == null) return

    axios
      .post(
        'http://localhost:3000/bucket/remove',
        {
          bucketId: bucketId,
          pieceId: pieceId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => {
        fetchPieces()
      })
  }

  return (
    <div className='BinEditor'>
      <h1>Lego Sorter</h1>
      <h2>Bin Number: {bucketId}</h2>
      <button onClick={addPiece}>Add piece</button>
      <button onClick={removePiece}>Remove piece</button>
      <h2>Pieces:</h2>
      {getPieces()}
      <button onClick={returnToCamera}>Return to camera</button>
      <button onClick={returnToGrid}>Return to grid</button>
    </div>
  )
}

export default BucketEditor
