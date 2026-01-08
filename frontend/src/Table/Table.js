import './Table.css'
import { layout } from './PieceLayout.js'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Table ({ brick, editBucket }) {
  const [targetBucketId, setTargetBucketId] = useState(null)

  // Get the bucket ID based on the brick.
  useEffect(() => {
    // If no brick is selected, no bucket should be selected.
    if (brick === null) {
      setTargetBucketId(null)
      return
    }

    console.log('Fetching bucket ID for piece ' + brick['id'])

    axios
      .post(
        'http://localhost:3000/bucket/get-bucket',
        {
          pieceId: brick['id']
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => {
        console.log('Got bucket ID ' + res.data)
        setTargetBucketId(res.data)
      })
      .catch(err => {
        console.error(
          'Error fetching bucket for piece ' + brick['id'] + ':',
          err.message
        )
        setTargetBucketId(null)
      })
  }, [brick])

  // A recursive function that converts the bucket layout defined in PieceLayout.js
  // to a giant HTML table.
  const makeTable = (layout, bucketId) => {
    return (
      <table>
        {layout.map((row, rowId) => {
          return (
            <tr>
              {row.map((col, colId) => {
                const newBucketId =
                  bucketId + rowId.toString() + colId.toString()
                if (typeof col == 'string')
                  return <th>{getBucket(newBucketId)}</th>
                return <th>{makeTable(col, newBucketId)}</th>
              })}
            </tr>
          )
        })}
      </table>
    )
  }

  // Get a string combining the name of a brick with its part number.
  const describeBrick = () => {
    if (brick != null) {
      return (
        <div className='BrickDescription'>
          <h2>{brick['name']}</h2>
          <h2>Category: {brick['category']}</h2>
          <h2>ID: {brick['id']}</h2>
          <a href={brick['external_sites'][0]['url']} target='_blank'>
            <h3>Bricklink</h3>
          </a>
          <img src={brick['img_url']} alt={'Picture of ' + brick['name']} />
        </div>
      )
    }
  }

  // Get a bucket for a specific type of part. Blink if it's the targeted part.
  const getBucket = bucketId => {
    let className = 'Bucket'
    if (targetBucketId === bucketId) {
      className = 'TargetBucket'
    }

    return (
      <div
        className={className}
        id={bucketId}
        onClick={() => editBucket(bucketId)}
      >
        <p>{bucketId}</p>
      </div>
    )
  }

  return (
    <div className='App'>
      {describeBrick()}
      <div className='BinTable'>{makeTable(layout, '')}</div>
    </div>
  )
}

export default Table
