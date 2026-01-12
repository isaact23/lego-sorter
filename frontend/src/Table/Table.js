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

  const mySystem = {
    id: 'A',
    size: [24, 20],
    containers: [
      {
        id: 'A',
        pos: [0, 0],
        size: [6, 20],
        bins: [6, 20]
      },
      {
        id: 'B',
        pos: [6, 0],
        size: [6, 10],
        bins: [4, 6]
      },
      {
        id: 'C',
        pos: [6, 10],
        size: [3, 10],
        bins: [1, 6]
      },
      {
        id: 'D',
        pos: [9, 10],
        size: [3, 10],
        bins: [2, 6]
      },
      {
        id: 'E',
        pos: [12, 0],
        size: [6, 20],
        bins: [6, 20]
      },
      {
        id: 'F',
        pos: [18, 0],
        size: [6, 10],
        bins: [4, 6]
      },
      {
        id: 'G',
        pos: [18, 10],
        size: [6, 10],
        bins: [1, 6]
      }
    ]
  }

  const getSystem = system => {
    return (
      <div
        className='System'
        style={{
          gridTemplateColumns: `repeat(${system.size[0]}, 1fr)`,
          gridTemplateRows: `repeat(${system.size[1]}, 1fr)`
        }}
      >
        {system.containers.map(container => {
          return getContainer(container, system.id)
        })}
      </div>
    )
  }

  const getContainer = (container, systemId) => {
    let binArray = []
    for (let i = 0; i < container.bins[0] * container.bins[1]; i++) {
      binArray.push(
        <div className='Bin'>
          <p>{`${systemId}-${container.id}-${i}`}</p>
        </div>
      )
    }
    return (
      <div
        className='Container'
        style={{
          gridTemplateRows: `repeat(${container.bins[1]}, 1fr)`,
          gridTemplateColumns: `repeat(${container.bins[0]}, 1fr)`,
          gridRowStart: container.pos[1] + 1,
          gridRowEnd: container.pos[1] + container.size[1] + 1,
          gridColumnStart: container.pos[0] + 1,
          gridColumnEnd: container.pos[0] + container.size[0] + 1
        }}
      >
        {binArray}
      </div>
    )
  }

  return (
    <div className='App'>
      {describeBrick()}
      {getSystem(mySystem)}
    </div>
  )
}

export default Table
