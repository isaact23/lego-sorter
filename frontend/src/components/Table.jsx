import './Table.css'

// ─── Physical unit type definitions ────────────────────────────────────────
// physicalHeight: actual product height in inches — used as flex weight so
// units within a column divide height proportionally, making all columns
// the same total height regardless of how many units they contain.
// These can be imported from a JSON file in future
// physicalHeight is a visual weight, not an exact measurement.
// drawer-60 is set to 18 so that 2× = 36, matching 4× drawer-6 (4×9 = 36).
// All columns sum to the same flex total → perfectly flush bottom edges.
const UNIT_TYPES = {
  'drawer-60': { bins: [6, 10], physicalHeight: 18 },
  'drawer-6':  { bins: [2, 3],  physicalHeight: 9  },
  'drawer-3':  { bins: [1, 3],  physicalHeight: 9  },
}

// ─── System layout definition ───────────────────────────────────────────────
// Columns of physical units stacked top-to-bottom.
// Can be replaced with an imported JSON file.
const SYSTEM_DEF = {
  id: 'A',
  cols: [
    {
      id: 'col-1',
      units: [
        { id: 'A', type: 'drawer-60' },
        { id: 'B', type: 'drawer-60' },
      ]
    },
    {
      id: 'col-2',
      units: [
        { id: 'C', type: 'drawer-6' },
        { id: 'D', type: 'drawer-6' },
        { id: 'E', type: 'drawer-3' },
        { id: 'F', type: 'drawer-3' },
      ]
    },
    {
      id: 'col-3',
      units: [
        { id: 'G', type: 'drawer-6' },
        { id: 'H', type: 'drawer-6' },
        { id: 'I', type: 'drawer-6' },
        { id: 'J', type: 'drawer-6' },
      ]
    },
    {
      id: 'col-4',
      units: [
        { id: 'K', type: 'drawer-60' },
        { id: 'L', type: 'drawer-60' },
      ]
    },
    {
      id: 'col-5',
      units: [
        { id: 'M', type: 'drawer-6' },
        { id: 'N', type: 'drawer-6' },
        { id: 'O', type: 'drawer-3' },
        { id: 'P', type: 'drawer-3' },
      ]
    },
  ]
}

// ─── Component ──────────────────────────────────────────────────────────────

function Table ({
  highlightedBinIds = [],
  selectedBinId = null,
  onBinClick,
  displayMode = 'DEFAULT',
  propertyDefs = [],
  propertyMap = {},
  showPropertyClasses = false,
  pulledBinIds = [],
  partialBinIds = [],
  systemDef = SYSTEM_DEF,
  unitTypes = UNIT_TYPES,
}) {

  const getBinState = (binId) => {
    const isSelected    = binId === selectedBinId
    const isHighlighted = highlightedBinIds.includes(binId)

    const assigned = propertyMap[binId] ?? []
    const propClassNames = showPropertyClasses
      ? assigned
          .map(pid => {
            const def = propertyDefs.find(d => d.id === pid)
            return def ? def.className : null
          })
          .filter(Boolean)
          .join(' ')
      : ''

    switch (displayMode) {
      case 'DEFAULT':
        return { className: `bin ${propClassNames}`,                                           clickable: true }
      case 'SELECT':
        return { className: isSelected ? `bin bin-selected ${propClassNames}` : `bin ${propClassNames}`, clickable: true }
      case 'FILTER':
        return { className: isHighlighted ? `bin bin-highlighted ${propClassNames}` : `bin bin-disabled ${propClassNames}`, clickable: isHighlighted }
      case 'ADD':
        return { className: isHighlighted ? `bin bin-highlighted bin-halftone ${propClassNames}` : `bin ${propClassNames}`, clickable: true }
      case 'REMOVE':
        return { className: isHighlighted ? `bin bin-highlighted ${propClassNames}` : `bin bin-disabled ${propClassNames}`, clickable: isHighlighted }
      case 'SET_BROWSE':
        if (isSelected)                    return { className: `bin bin-selected ${propClassNames}`,      clickable: true  }
        if (pulledBinIds.includes(binId))  return { className: `bin bin-set-pulled ${propClassNames}`,    clickable: true  }
        if (partialBinIds.includes(binId)) return { className: `bin bin-set-partial ${propClassNames}`,   clickable: true  }
        if (isHighlighted)                 return { className: `bin bin-set-pending ${propClassNames}`,   clickable: true  }
        return { className: `bin bin-disabled ${propClassNames}`, clickable: false }
      default:
        return { className: 'bin bin-disabled', clickable: false }
    }
  }

  const renderBin = (binId) => {
    const { className, clickable } = getBinState(binId)
    const displayId = binId.split('-').slice(1).join('-')

    return (
      <div
        key={binId}
        className={className}
        onClick={() => { if (clickable) onBinClick(binId) }}
      >
        <p>{displayId}</p>
      </div>
    )
  }

  const renderUnit = (unit) => {
    const typeDef = unitTypes[unit.type]
    if (!typeDef) return null

    const [cols, rows] = typeDef.bins
    const totalBins = cols * rows

    return (
      <div
        key={unit.id}
        className="Unit"
        style={{ flex: typeDef.physicalHeight }}
      >
        <div
          className="BinGrid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows:    `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: totalBins }, (_, i) =>
            renderBin(`${systemDef.id}-${unit.id}-${i + 1}`)
          )}
        </div>
      </div>
    )
  }

  const renderCol = (col) => (
    <div key={col.id} className="Col">
      {col.units.map(renderUnit)}
    </div>
  )

  return (
    <div className="System">
      {systemDef.cols.map(renderCol)}
    </div>
  )
}

export default Table
