import './Select.css'

function Select ({ brickList, selectCallback, returnHome }) {
  return (
    <div className='Select'>
      <h1>Lego Sorter</h1>
      <h2>Choose the correct piece</h2>
      {brickList.map(brick => {
        return (
          <div className='ListItem' onClick={() => selectCallback(brick)}>
            <p>{brick['category'] + ' (' + brick['id'] + ')'}</p>
          </div>
        )
      })}
      <button onClick={returnHome}>Return home</button>
    </div>
  )
}

export default Select
