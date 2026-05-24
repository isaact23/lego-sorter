import './Table.css'

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
  systemDef,
  unitTypes = {},
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
        return { className: `bin ${propClassNames}`,                                                                    clickable: true }
      case 'SELECT':
        return { className: isSelected ? `bin bin-selected ${propClassNames}` : `bin ${propClassNames}`,                clickable: true }
      case 'FILTER':
        return { className: isHighlighted ? `bin bin-highlighted ${propClassNames}` : `bin bin-disabled ${propClassNames}`, clickable: isHighlighted }
      case 'ADD':
        return { className: isHighlighted ? `bin bin-highlighted bin-halftone ${propClassNames}` : `bin ${propClassNames}`, clickable: true }
      case 'REMOVE':
        return { className: isHighlighted ? `bin bin-highlighted ${propClassNames}` : `bin bin-disabled ${propClassNames}`, clickable: isHighlighted }
      case 'SET_BROWSE':
        if (isSelected)                    return { className: `bin bin-selected ${propClassNames}`,    clickable: true  }
        if (pulledBinIds.includes(binId))  return { className: `bin bin-set-pulled ${propClassNames}`,  clickable: true  }
        if (partialBinIds.includes(binId)) return { className: `bin bin-set-partial ${propClassNames}`, clickable: true  }
        if (isHighlighted)                 return { className: `bin bin-set-pending ${propClassNames}`, clickable: true  }
        return { className: `bin bin-disabled ${propClassNames}`, clickable: false }
      default:
        return { className: 'bin bin-disabled', clickable: false }
    }
  }

  // Resolve display text: labels map wins, then binDef.label, then auto ID
  const resolveLabel = (binId, fallback, binDefLabel) =>
    systemDef.labels?.[binId] || binDefLabel || fallback

  // ── Unit mode (System A style) ──────────────────────────────────────────
  const renderBin = (binId) => {
    const { className, clickable } = getBinState(binId)
    const autoId = binId.split('-').slice(1).join('-')   // "A-B-5" → "B-5"
    const label  = resolveLabel(binId, autoId)
    return (
      <div
        key={binId}
        className={className}
        onClick={() => { if (clickable) onBinClick(binId) }}
      >
        <p>{label}</p>
      </div>
    )
  }

  const renderUnit = (unit) => {
    const typeDef = unitTypes[unit.type]
    if (!typeDef) return null
    const [cols, rows] = typeDef.bins
    return (
      <div key={unit.id} className="Unit" style={{ flex: typeDef.physicalHeight }}>
        <div
          className="BinGrid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows:    `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: cols * rows }, (_, i) =>
            renderBin(`${systemDef.id}-${unit.id}-${i + 1}`)
          )}
        </div>
      </div>
    )
  }

  // ── Direct bin mode (System B/C style) ──────────────────────────────────
  // Bin ID is system prefix + bin id only (2 segments): "B-L1", "B-Wheels & Tires"
  const renderDirectBin = (binDef) => {
    const binId = `${systemDef.id}-${binDef.id}`
    const { className, clickable } = getBinState(binId)
    const label = resolveLabel(binId, binDef.id, binDef.label)
    return (
      <div
        key={binId}
        className={`${className} bin-direct`}
        style={{ flex: binDef.height ?? 1 }}
        onClick={() => { if (clickable) onBinClick(binId) }}
      >
        <p>{label}</p>
      </div>
    )
  }

  const renderCol = (col) => (
    <div key={col.id} className={`Col${col.bins ? ' col-direct' : ''}`}>
      {col.bins
        ? col.bins.map(renderDirectBin)
        : col.units.map(renderUnit)
      }
    </div>
  )

  const systemStyle = {
    ...(systemDef.maxWidth && { maxWidth: systemDef.maxWidth, margin: '0 auto' }),
    ...(systemDef.height   && { height: systemDef.height }),
  }

  return (
    <div className="System" style={systemStyle}>
      {systemDef.cols.map(renderCol)}
    </div>
  )
}

export default Table
