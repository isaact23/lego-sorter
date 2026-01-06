import './BucketEditor.css'

function BucketEditor ({ bucketId }) {
  return (
    <div className='BinEditor'>
      <h1>Lego Sorter</h1>
      <h2>Bin Editor</h2>
      <p>{bucketId}</p>
      <button>Return to camera</button>
      <button>Return to grid</button>
    </div>
  )
}

export default BucketEditor
