import './Table.css'
import { layout } from './PieceLayout.js'

function Table () {
  const makeTable = layout => {
    return (
      <table>
        {layout.map(row => {
          return (
            <tr>
              {row.map(col => {
                if (typeof col == 'string')
                  return (
                    <th>
                      <div className='Bucket' id={col}>
                        <p>{col}</p>
                      </div>
                    </th>
                  )
                return <th>{makeTable(col)}</th>
              })}
            </tr>
          )
        })}
      </table>
    )
  }

  return (
    <div className='App'>
      <h1>Lego Sorter</h1>
      <div className='BinTable'>{makeTable(layout)}</div>
    </div>
  )
}

export default Table
