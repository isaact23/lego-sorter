import { useState } from 'react'
import './RecentDrawer.css'

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15.5 15.5"/>
  </svg>
)

export default function RecentDrawer ({ items, onSelect }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`recent-drawer${open ? ' open' : ''}`}>
      <div className='recent-drawer-panel'>
        <div className='recent-drawer-title'>Recent</div>
        {items.length === 0
          ? <div className='recent-empty'>No recent searches</div>
          : items.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                className='recent-item'
                onClick={() => { onSelect(item); setOpen(false) }}
              >
                <div className='recent-item-img'>
                  <img
                    src={item.type === 'set' ? item.img_url : `/api/image/${item.id}`}
                    alt={item.name}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
                <div className='recent-item-text'>
                  <div className='recent-item-name'>{item.name || item.id}</div>
                  <div className='recent-item-sub'>{item.type === 'set' ? `Set ${item.id}` : `Part #${item.id}`}</div>
                </div>
              </div>
            ))
        }
      </div>
      <button
        className='recent-drawer-handle'
        onClick={() => setOpen(prev => !prev)}
        aria-label='Recent searches'
      >
        <IconClock />
      </button>
    </div>
  )
}
