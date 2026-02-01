function BrickInfo({
  brick,
  selectedOperation,
  onOperationSelect,
  onClose
}) {
  if (!brick) return null

  const isAddActive = selectedOperation === 'add'
  const isRemoveActive = selectedOperation === 'remove'

  return (
    <div className="top-panel-row">
      <div className="Top-Panel-BrickInfo">
        <div className="BrickText">
          <h2>{brick.name}</h2>
          <p><strong>Category:</strong> {brick.category}</p>
          <p><strong>ID:</strong> {brick.id}</p>
        </div>

        <div className="BrickImageFrame">
          <img
            src={brick.img_url}
            alt={brick.name}
          />
        </div>

        <div className="BrickActions">
          <button
            className={`ui-button green ${
              isAddActive ? 'pending' : ''
            }`}
            onClick={() =>
              onOperationSelect(isAddActive ? null : 'add')
            }
          >
            Add to Bin
          </button>

          <button
            className={`ui-button red ${
              isRemoveActive ? 'pending' : ''
            }`}
            onClick={() =>
              onOperationSelect(isRemoveActive ? null : 'remove')
            }
          >
            Remove from Bin
          </button>

          <button
            className="ui-button blue"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrickInfo
