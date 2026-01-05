import './App.css'
import Camera from '../Camera/Camera'
import Select from '../Select/Select'
import Table from '../Table/Table'
import { useState } from 'react'

const CAMERA_PAGE = 0
const SELECT_PAGE = 1
const TABLE_PAGE = 2

function App () {
  // App state variables (React hooks)
  const [page, setPage] = useState(2)
  const [brickList, setBrickList] = useState([])
  const [brick, setBrick] = useState(null)

  // Callback for the Camera component once Lego bricks are identified
  function brickCallback (bricks) {
    console.log(bricks)
    if (bricks.length > 1) {
      // Prompt the user to choose the correct brick
      console.log('Multiple bricks detected')
      setBrickList(bricks)
      setPage(SELECT_PAGE)
    } else {
      // Only one brick was detected - go straight to the table page
      selectCallback(bricks[0])
    }
  }

  // Callback for the Select component once a Lego brick is selected by the user
  function selectCallback (selectedBrick) {
    console.log('Selected brick ' + selectedBrick['category'])
    setBrick(selectedBrick)
    setPage(TABLE_PAGE)
  }

  // Function to return home and reset.
  function returnHome () {
    setPage(CAMERA_PAGE)
    setBrickList([])
    setBrick(null)
  }

  // Depending on the page variable, return the correct component
  const getPage = () => {
    if (page === CAMERA_PAGE) return <Camera brickCallback={brickCallback} />
    if (page === SELECT_PAGE)
      return (
        <Select
          brickList={brickList}
          selectCallback={selectCallback}
          returnHome={returnHome}
        />
      )
    if (page === TABLE_PAGE)
      return <Table brick={brick} returnHome={returnHome} />
  }

  return <div className='App'>{getPage()}</div>
}
export default App
