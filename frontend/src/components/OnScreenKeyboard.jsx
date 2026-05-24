const KEY_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACK'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'SPACE', 'ENTER']
]

const buttonStyle = {
  flex: 1,
  minWidth: 36,
  minHeight: 44,
  border: '1px solid #ccc',
  borderRadius: 6,
  margin: 2,
  background: '#f7f7f7',
  color: '#111',
  fontSize: 16,
  cursor: 'pointer'
}

const containerStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  background: '#ffffffee',
  borderTop: '1px solid #ccc',
  padding: '12px 8px 18px',
  zIndex: 9999,
  boxShadow: '0 -2px 12px rgba(0,0,0,.16)'
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  marginBottom: 6
}

const actionRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 6
}

const OnScreenKeyboard = ({
  visible,
  inputRef,
  containerRef,
  value,
  onChange,
  onEnter,
  onClose
}) => {
  if (!visible) return null

  const insertText = (key) => {
    const input = inputRef?.current
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? start
    let nextValue = value || ''
    let cursor = start

    if (key === 'BACK') {
      if (start === end && start > 0) {
        nextValue = nextValue.slice(0, start - 1) + nextValue.slice(end)
        cursor = start - 1
      } else {
        nextValue = nextValue.slice(0, start) + nextValue.slice(end)
        cursor = start
      }
    } else if (key === 'SPACE') {
      nextValue = nextValue.slice(0, start) + ' ' + nextValue.slice(end)
      cursor = start + 1
    } else if (key === 'ENTER') {
      onEnter?.()
      return
    } else {
      nextValue = nextValue.slice(0, start) + key + nextValue.slice(end)
      cursor = start + key.length
    }

    onChange(nextValue)

    setTimeout(() => {
      if (input) {
        input.focus()
        input.setSelectionRange(cursor, cursor)
      }
    }, 0)
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={(e) => e.preventDefault()}
    >
      {KEY_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} style={rowStyle}>
          {row.map((key) => (
            <button
              key={key}
              type='button'
              style={{
                ...buttonStyle,
                minWidth: key === 'SPACE' ? 120 : key === 'ENTER' || key === 'BACK' ? 88 : 36,
                background: key === 'ENTER' ? '#0078d4' : key === 'BACK' ? '#e0e0e0' : '#f7f7f7',
                color: key === 'ENTER' ? '#fff' : '#111'
              }}
              onClick={() => insertText(key)}
            >
              {key === 'BACK' ? '⌫' : key === 'SPACE' ? 'Space' : key === 'ENTER' ? 'Enter' : key}
            </button>
          ))}
        </div>
      ))}
      <div style={actionRowStyle}>
        <button
          type='button'
          className='ui-button'
          style={{ ...buttonStyle, flex: 1, minWidth: 0 }}
          onClick={() => onClose?.()}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default OnScreenKeyboard
