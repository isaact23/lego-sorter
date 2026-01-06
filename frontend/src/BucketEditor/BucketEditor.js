import './BucketEditor.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function BucketEditor ({ bucketId, returnToCamera, returnToGrid }) {
  const [bucketInfo, setBucketInfo] = useState(null)

  // Send request to backend to get bucket information
  useEffect(() => {
    console.log('Fetching bucket info for ' + bucketId)

    axios.post(
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
  }, [bucketId])

  return (
    <div className='BinEditor'>
      <h1>Lego Sorter</h1>
      <h2>Bin Editor</h2>
      <p>{bucketId}</p>
      <button onClick={returnToCamera}>Return to camera</button>
      <button onClick={returnToGrid}>Return to grid</button>
    </div>
  )
}

export default BucketEditor
