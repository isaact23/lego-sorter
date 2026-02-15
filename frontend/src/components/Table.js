// frontend/src/Table/Table.jsx
import './Table.css'

function Table ({
  highlightedBinIds = [],
  selectedBinId = null,
  onBinClick,
  displayMode = 'DEFAULT'
}) {

  // Decide how a bin looks + whether it can be clicked
  const getBinState = (binId) => {
    const isSelected = binId === selectedBinId
    const isHighlighted = highlightedBinIds.includes(binId)

    switch (displayMode) {
      case 'DEFAULT':
        return {
          className: 'bin',
          clickable: true
        }

      case 'SELECT':
        return {
          className: isSelected
            ? 'bin bin-selected'
            : 'bin',
          clickable: true
        }

      case 'FILTER':
        return {
          className: isHighlighted
            ? 'bin bin-highlighted'
            : 'bin bin-disabled',
          clickable: isHighlighted
        }

      case 'ADD':
        return {
          className: isHighlighted
            ? 'bin bin-highlighted bin-halftone'
            : 'bin',
          clickable: true
        }

      case 'REMOVE':
        return {
          className: isHighlighted
            ? 'bin bin-highlighted'
            : 'bin bin-disabled',
          clickable: isHighlighted
        }

      default:
        return {
          className: 'bin bin-disabled',
          clickable: false
        }
    }
  }

  const renderBin = binId => {
    const { className, clickable } = getBinState(binId)

    // Remove system prefix (e.g. "A-")
    const displayId = binId.split('-').slice(1).join('-')

    return (
      <div
        key={binId}
        className={className}
        onClick={() => {
          if (!clickable) return
          onBinClick(binId)
        }}
      >
        <p>{displayId}</p>
      </div>
    )
  }

  // Static system layout
  const system = {
    id: 'A',
    size: [24, 20],
    containers: [
      { id: 'A', pos: [0, 0], size: [6, 10], bins: [6, 10] },
      { id: 'B', pos: [0, 10], size: [6, 10], bins: [6, 10] },
      { id: 'C', pos: [6, 0], size: [4, 5], bins: [2, 3] },
      { id: 'G', pos: [10, 0], size: [4, 5], bins: [2, 3] },
      { id: 'D', pos: [6, 5], size: [4, 5], bins: [2, 3] },
      { id: 'H', pos: [10, 5], size: [4, 5], bins: [2, 3] },
      { id: 'E', pos: [6, 10], size: [4, 5], bins: [1, 3] },
      { id: 'I', pos: [10, 10], size: [4, 5], bins: [2, 3] },
      { id: 'F', pos: [6, 15], size: [4, 5], bins: [1, 3] },
      { id: 'J', pos: [10, 15], size: [4, 5], bins: [2, 3] },
      { id: 'K', pos: [14, 0], size: [6, 10], bins: [6, 10] },
      { id: 'L', pos: [14, 10], size: [6, 10], bins: [6, 10] },
      { id: 'M', pos: [20, 0], size: [4, 5], bins: [2, 3] },
      { id: 'N', pos: [20, 5], size: [4, 5], bins: [2, 3] },
      { id: 'O', pos: [20, 10], size: [4, 5], bins: [1, 3] },
      { id: 'P', pos: [20, 15], size: [4, 5], bins: [1, 3] }
    ]
  }

  const renderContainer = (container) => {
    const totalBins = container.bins[0] * container.bins[1]

    return (
      <div
        key={container.id}
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
        {Array.from({ length: totalBins }, (_, i) =>
          renderBin(`${system.id}-${container.id}-${i + 1}`)
        )}
      </div>
    )
  }

  return (
    <div
      className='System'
      style={{
        gridTemplateColumns: `repeat(${system.size[0]}, 1fr)`,
        gridTemplateRows: `repeat(${system.size[1]}, 1fr)`
      }}
    >
      {system.containers.map(renderContainer)}
    </div>
  )
}

export default Table