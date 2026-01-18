
/*

  const describeBrick = () => {
    if (brick != null) {
      return (
        <div className="BrickDescription">
          <div className="BrickText">
            <h2>{brick.name}</h2>
            <p><strong>Category:</strong> {brick.category}</p>
            <p><strong>ID:</strong> {brick.id}</p>
          </div>

          <div className="BrickImage">
            <img
              src={brick.img_url}
              alt={`Picture of ${brick.name}`}
            />
          </div>

          <div className="BrickActions">
            <button 
              className={`w3-button ${binOperation === 'add' ? 'w3-green' : 'w3-light-green'}`}
              onClick={() => setBinOperation('add')}
              style={{ opacity: binOperation === 'add' ? 1 : 0.6 }}
            >
              Add to Bin
            </button>
            <button 
              className={`w3-button ${binOperation === 'remove' ? 'w3-red' : 'w3-light-red'}`}
              onClick={() => setBinOperation('remove')}
              style={{ opacity: binOperation === 'remove' ? 1 : 0.6 }}
            >
              Remove from Bin
            </button>
          </div>
        </div>
      )
    }
  }

  */