export default function OptionCard ({ iconSrc, iconAlt = '', children, onClick }) {
  return (
    <div
      className={`option-card ${onClick ? 'option-card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className='option-card-icon'>
        <img src={iconSrc} alt={iconAlt} className='option-card-icon-img' />
      </div>

      <div className='option-card-content'>{children}</div>
    </div>
  )
}