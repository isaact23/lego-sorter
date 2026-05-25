import './OnScreenKeyboard.css'

const KEY_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACK'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'SPACE', 'ENTER']
]

function keyClass(key) {
  if (key === 'ENTER') return 'key-btn key-wide key-enter'
  if (key === 'BACK')  return 'key-btn key-wide key-back'
  if (key === 'SPACE') return 'key-btn key-space'
  return 'key-btn'
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
      className="osk-container"
      onMouseDown={(e) => e.preventDefault()}
    >
      {KEY_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="osk-row">
          {row.map((key) => (
            <button
              key={key}
              type='button'
              className={keyClass(key)}
              onClick={() => insertText(key)}
            >
              {key === 'BACK' ? '⌫' : key === 'SPACE' ? 'Space' : key === 'ENTER' ? 'Enter' : key}
            </button>
          ))}
        </div>
      ))}
      <div className="osk-action-row">
        <button
          type='button'
          className='ui-button'
          onClick={() => onClose?.()}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default OnScreenKeyboard
