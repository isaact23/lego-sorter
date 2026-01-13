import './Table.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Table ({ brick, editBin }) {
  const [targetBinId, setTargetBinId] = useState(null)

  // Get the bin ID based on the brick.
  useEffect(() => {
    // If no brick is selected, no bin should be selected.
    if (brick === null) {
      setTargetBinId(null)
      return
    }

    console.log('Fetching bin ID for piece ' + brick['id'])

    axios
      .post(
        'http://localhost:3000/bin/get-bin',
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
        console.log('Got bin ID ' + res.data)
        setTargetBinId(res.data)
      })
      .catch(err => {
        console.error(
          'Error fetching bin for piece ' + brick['id'] + ':',
          err.message
        )
        setTargetBinId(null)
      })
  }, [brick])

  // Get a string combining the name of a brick with its part number.
  const describeBrick = () => {
    if (brick != null) {
      return (
        <div className='BrickDescription'>
          <h2>{brick['name']}</h2>
          <h2>Category: {brick['category']}</h2>
          <h2>ID: {brick['id']}</h2>
          <a
            href={brick['external_sites'][0]['url']}
            target='_blank'
            rel='noreferrer'
          >
            <h3>Bricklink</h3>
          </a>
          <img src={brick['img_url']} alt={'Picture of ' + brick['name']} />
        </div>
      )
    }
  }

  // Get a bin for a specific type of part. Blink if it's the targeted part.
  const getBin = binId => {
    let className = 'Bin'
    if (targetBinId === binId) {
      className = 'TargetBin'
    }

    return (
      <div className={className} id={binId} onClick={() => editBin(binId)}>
        <p>{binId}</p>
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
      let id = `${systemId}-${container.id}-${i}`
      binArray.push(getBin(id))
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
