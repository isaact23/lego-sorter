export default function PartNumberCard ({ iconSrc, iconAlt = '', children, onClick }) {
  return (
    <div
      className={`top-panel-card ${onClick ? 'top-panel-card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className='top-panel-card-icon'>
        <img src={iconSrc} alt={iconAlt} className='top-panel-card-icon-img' />
      </div>

      <div className='top-panel-card-content'>{children}</div>
    </div>
  )
}