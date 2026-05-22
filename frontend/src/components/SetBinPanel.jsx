import { useState } from 'react'
import './SetBinPanel.css'
import COLORS from '../data/rebrickable_colors.json'

function PartImage({ partNum, colorId, colorRgb }) {
  const ldraw = (pn) => `https://cdn.rebrickable.com/media/parts/ldraw/${colorId}/${pn}.png`

  // Some parts have letter-suffix variants in Rebrickable's LDraw library
  // (e.g. 3023 → 3023b for the modern Plate 1x2). Try base name, then 'b' variant, then cached.
  const stages = [ldraw(partNum), ldraw(`${partNum}b`), `/api/image/${partNum}`]

  const [stageIdx, setStageIdx] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  function handleError() {
    const next = stageIdx + 1
    if (next < stages.length) setStageIdx(next)
    else setImgFailed(true)
  }

  return (
    <div className='set-bin-part-img-wrap'>
      {!imgFailed
        ? <img className='set-bin-part-img' src={stages[stageIdx]} alt='' onError={handleError} />
        : <div className='set-bin-part-img-placeholder' />
      }
      <div className='set-bin-part-color-dot' style={{ background: `#${colorRgb}` }} />
    </div>
  )
}

export default function SetBinPanel({ binId, parts, pulledPartKeys = [], onTogglePart, onClose }) {
  if (!binId || !parts) return null

  const displayId = binId.split('-').slice(1).join('-')
  const pulledSet = new Set(pulledPartKeys)

  const pulledCount = parts.filter(p => pulledSet.has(`${p.part_num}-${p.colorId}`)).length
  const allDone = pulledCount === parts.length

  return (
    <div className='set-bin-panel'>
      <div className='set-bin-panel-header'>
        <span className='set-bin-panel-title'>Bin {displayId}</span>
        <button className='set-bin-panel-close' onClick={onClose} aria-label='Close'>×</button>
      </div>

      {parts.length > 1 && (
        <div className='set-bin-panel-progress'>
          {allDone ? 'All pulled ✓' : `${pulledCount} of ${parts.length} pulled`}
        </div>
      )}

      <div className='set-bin-panel-parts'>
        {parts.map(part => {
          const key = `${part.part_num}-${part.colorId}`
          const isPulled = pulledSet.has(key)
          const color = COLORS[String(part.colorId)]
          const rgb = color?.rgb ?? 'cccccc'
          const colorName = color?.name ?? part.colorName
          return (
            <div
              key={key}
              className={`set-bin-part-row${isPulled ? ' pulled' : ''}`}
              onClick={() => onTogglePart?.(key)}
              role='button'
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onTogglePart?.(key)}
            >
              <PartImage partNum={part.part_num} colorId={part.colorId} colorRgb={rgb} />
              <div className='set-bin-part-info'>
                <span className='set-bin-part-name'>{part.name}</span>
                <span className='set-bin-part-color'>{colorName}</span>
              </div>
              <span className='set-bin-part-qty'>×{part.quantity}</span>
              <span className='set-bin-part-check'>{isPulled ? '✓' : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
