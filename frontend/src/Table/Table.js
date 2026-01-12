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
                if (typeof col[0] == 'number') {
                  let colElems = []
                  for (let j = 0; j < col[0]; j++) {
                    let rowElems = []
                    for (let i = 0; i < col[1]; i++) {
                      const subBucketId =
                        newBucketId + j.toString() + i.toString()
                      rowElems.push(<td>{getBucket(subBucketId)}</td>)
                    }
                    colElems.push(<tr>{rowElems}</tr>)
                  }
                  return <td>{colElems}</td>
                }
                return <td>{makeTable(col, newBucketId)}</td>
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

  const systemSize = [24, 20]
  const containers = [
    {
      pos: [0, 0],
      size: [6, 20],
      bins: [6, 20]
    },
    {
      pos: [6, 0],
      size: [6, 10],
      bins: [4, 6]
    },
    {
      pos: [6, 10],
      size: [3, 10],
      bins: [1, 6]
    },
    {
      pos: [9, 10],
      size: [3, 10],
      bins: [2, 6]
    },
    {
      pos: [12, 0],
      size: [6, 20],
      bins: [6, 20]
    },
    {
      pos: [18, 0],
      size: [6, 10],
      bins: [4, 6]
    },
    {
      pos: [18, 10],
      size: [6, 10],
      bins: [1, 6]
    }
  ]

  const getSystem = size => {
    return (
      <div
        className='System'
        style={{
          gridTemplateColumns: `repeat(${size[0]}, 1fr)`,
          gridTemplateRows: `repeat(${size[1]}, 1fr)`
        }}
      >
        {containers.map(container => {
          return getContainer(container.pos, container.size, container.bins)
        })}
      </div>
    )
  }

  const getContainer = (pos, size, bins) => {
    let binArray = []
    for (let i = 0; i < bins[0] * bins[1]; i++) {
      binArray.push(
        <div className='Bin'>
          <p>A</p>
        </div>
      )
    }
    return (
      <div
        className='Container'
        style={{
          gridTemplateRows: `repeat(${bins[1]}, 1fr)`,
          gridTemplateColumns: `repeat(${bins[0]}, 1fr)`,
          gridRowStart: pos[1] + 1,
          gridRowEnd: pos[1] + size[1] + 1,
          gridColumnStart: pos[0] + 1,
          gridColumnEnd: pos[0] + size[0] + 1
        }}
      >
        {binArray}
      </div>
    )
  }

  return (
    <div className='App'>
      {describeBrick()}
      {getSystem(systemSize)}
    </div>
  )
}

export default Table
