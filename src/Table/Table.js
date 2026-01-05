import './Table.css'
import { layout } from './PieceLayout.js'
import { binMappings } from './BinMappings.js'

function Table ({ brick, returnHome }) {
  // A recursive function that converts the bucket layout defined in PieceLayout.js
  // to a giant HTML table.
  const makeTable = layout => {
    return (
      <table>
        {layout.map(row => {
          return (
            <tr>
              {row.map(col => {
                if (typeof col == 'string') return <th>{getBucket(col)}</th>
                return <th>{makeTable(col)}</th>
              })}
            </tr>
          )
        })}
      </table>
    )
  }

  // Get a string combining the name of a brick with its part number.
  const describeBrick = () => {
    if (brick != null) {
      return <h2>{brick['category'] + ' (' + brick['id'] + ')'}</h2>
    }
  }

  // Get the name of the targeted bucket.
  const getTargetBucketName = () => {
    if (brick == null) return ''
    const bucketName = binMappings[brick['id']]
    if (bucketName === undefined) return ''
    return bucketName
  }

  // Get a bucket for a specific type of part. Blink if it's the targeted part.
  const getBucket = partName => {
    let className = 'Bucket'
    if (getTargetBucketName() === partName) {
      className = 'TargetBucket'
    }

    return (
      <div className={className} id={partName}>
        <p>{partName}</p>
      </div>
    )
  }

  return (
    <div className='App'>
      <h1>Lego Sorter</h1>
      {describeBrick()}
      <button onClick={returnHome}>Return home</button>
      <div className='BinTable'>{makeTable(layout)}</div>
    </div>
  )
}

export default Table
