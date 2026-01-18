import './Table.css'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { BACKEND_URL } from '../config'
import { searchPartsByPrefix } from '../services/searchService'


function Table ({ brick, editBin: originalEditBin, binOperation, setBinOperation, operationStatus, searchQuery, searchResults, setSearchResults }) {
  const [targetBinIds, setTargetBinIds] = useState([])

  // Determine which bins to highlight - either from brick or from search
  const highlightedBinIds = searchQuery && searchResults.length > 0 ? searchResults : targetBinIds

  console.log('Table render - searchQuery:', searchQuery, 'searchResults:', searchResults, 'highlightedBinIds:', highlightedBinIds)

  // Fetch bins that contain this brick
  const fetchTargetBins = (brickId) => {
    console.log('Fetching bin IDs for piece ' + brickId)

    axios
      .post(
        `${BACKEND_URL}/bin/get-all-bins`,
        {
          pieceId: brickId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => {
        console.log('Got bin IDs:', res.data)
        setTargetBinIds(Array.isArray(res.data) ? res.data : [res.data])
      })
      .catch(err => {
        console.error('Error fetching bins for piece ' + brickId + ':', err.message)
        setTargetBinIds([])
      })
  }

  // Refresh search results if a search is active
  const refreshSearch = async (brickId) => {
    if (searchQuery) {
      console.log('Refreshing search for:', searchQuery)
      try {
        const results = await searchPartsByPrefix(searchQuery)
        setSearchResults(results)
      } catch (err) {
        console.error('Error refreshing search:', err)
      }
    } else {
      // If no search is active, refresh the target bins
      fetchTargetBins(brickId)
    }
  }

  // Wrapper around editBin that refreshes after operation
  const editBin = (binId) => {
    originalEditBin(binId, (brickId) => refreshSearch(brickId))
  }

  // Get all bin IDs that contain the brick.
  useEffect(() => {
    // If no brick is selected, no bins should be selected.
    if (brick === null) {
      setTargetBinIds([])
      return
    }

    fetchTargetBins(brick['id'])
  }, [brick])

  
  // Get a string combining the name of a brick with its part number.
  const describeBrick = () => {
    if (brick != null) {
      return (
        <div className="BrickDescription">
          <div className="BrickText">
            <h2>{brick.name}</h2>
            <p><strong>Category:</strong> {brick.category}</p>
            <p><strong>ID:</strong> {brick.id}</p>
          </div>

          <div className="BrickImage">
            <img
              src={brick.img_url}
              alt={`Picture of ${brick.name}`}
            />
          </div>

          <div className="BrickActions">
            <button 
              className={`w3-button ${binOperation === 'add' ? 'w3-green' : 'w3-light-green'}`}
              onClick={() => setBinOperation('add')}
              style={{ opacity: binOperation === 'add' ? 1 : 0.6 }}
            >
              Add to Bin
            </button>
            <button 
              className={`w3-button ${binOperation === 'remove' ? 'w3-red' : 'w3-light-red'}`}
              onClick={() => setBinOperation('remove')}
              style={{ opacity: binOperation === 'remove' ? 1 : 0.6 }}
            >
              Remove from Bin
            </button>
          </div>
        </div>
      )
    }
  }

  // Get a bin for a specific type of part. Highlight if it contains the targeted part.
  const getBin = binId => {
    let className = 'Bin'
    const isHighlighted = highlightedBinIds.includes(binId)
    
    if (isHighlighted) {
      className = 'TargetBin'
      console.log('Highlighting bin:', binId)
    }

    // Remove system ID and first dash (e.g., "A-C-1" becomes "C-1")
    const displayId = binId.split('-').slice(1).join('-')

    return (
      <div className={className} id={binId} onClick={() => editBin(binId)}>
        <p>{displayId}</p>
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
        size: [6, 10],
        bins: [6, 10]
      },
      {
        id: 'B',
        pos: [0, 10],
        size: [6, 10],
        bins: [6, 10]
      },
      {
        id: 'C',
        pos: [6, 0],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'G',
        pos: [10, 0],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'D',
        pos: [6, 5],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'H',
        pos: [10, 5],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'E',
        pos: [6, 10],
        size: [4, 5],
        bins: [1, 3]
      },
      {
        id: 'I',
        pos: [10, 10],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'F',
        pos: [6, 15],
        size: [4, 5],
        bins: [1, 3]
      },
      {
        id: 'J',
        pos: [10, 15],
        size: [4, 5],
        bins: [2, 3]
      },
    {
        id: 'K',
        pos: [14, 0],
        size: [6, 10],
        bins: [6, 10]
      },
      {
        id: 'L',
        pos: [14, 10],
        size: [6, 10],
        bins: [6, 10]
      },
      {
        id: 'M',
        pos: [20, 0],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'N',
        pos: [20, 5],
        size: [4, 5],
        bins: [2, 3]
      },
      {
        id: 'O',
        pos: [20, 10],
        size: [4, 5],
        bins: [1, 3]
      },
      {
        id: 'P',
        pos: [20, 15],
        size: [4, 5],
        bins: [1, 3]
      },
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
      let id = `${systemId}-${container.id}-${i+1}`
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
