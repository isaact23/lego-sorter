import './BinEditor.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function BinEditor ({ binId }) {
  const [pieces, setPieces] = useState([])

  // Send request to backend to get bin information when bin ID changes
  useEffect(fetchPieces, [binId])

  // Fetch piece listing from backend
  function fetchPieces () {
    console.log('Fetching bin info for ' + binId)

    axios
      .post(
        '/bin/get-info',
        {
          binId: binId
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
      .catch(err => {
        console.error('Error fetching bin info', err?.response || err.message)
        setPieces([])
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

  // Add a piece to the bin mapping
  function addPiece () {
    const pieceId = prompt('Enter piece # to add')
    if (pieceId == null) return

    axios
      .post(
        '/bin/add',
        {
          binId: binId,
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
      .catch(err => {
        console.error('Error adding piece', err?.response || err.message)
      })
  }

  // Remove a piece from the bin mapping
  function removePiece () {
    const pieceId = prompt('Enter piece # to remove')
    if (pieceId == null) return

    axios
      .post(
        '/bin/remove',
        {
          binId: binId,
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
      .catch(err => {
        console.error('Error removing piece', err?.response || err.message)
      })
  }

  return (
    <div className='BinEditor'>
      <h1>Lego Sorter</h1>
      <h2>Bin Number: {binId}</h2>
      <button className='w3-button w3-theme-d1' onClick={addPiece}>
        Add piece
      </button>
      <button className='w3-button w3-theme-d1' onClick={removePiece}>
        Remove piece
      </button>
      <h2>Pieces:</h2>
      {getPieces()}
    </div>
  )
}

export default BinEditor
