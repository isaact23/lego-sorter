import './App.css'
import { layout } from './PieceLayout.js'

function App () {
  const makeTable = layout => {
    return (
      <div className='w3-table'>
        <tr>
          {layout.map(row => {
            return (
              <th>
                {row.map(col => {
                  if (typeof col == 'string') return <p>{col}</p>
                  return makeTable(col)
                })}
              </th>
            )
          })}
        </tr>
      </div>
    )
  }

  return (
    <div className='App'>
      <h1>Lego Sorter</h1>
      {makeTable(layout)}
    </div>
  )
}

export default App
