const SELECT_PAGE = 1
const TABLE_PAGE = 2

export function createBrickCallbacks (setState) {
  const { setBrickList, setPage, setBrick, setBinOperation } = setState

  const brickCallback = (bricks) => {
    console.log(bricks)
    if (bricks.length > 1) {
      console.log('Multiple bricks detected')
      setBrickList(bricks)
      setPage(SELECT_PAGE)
    } else {
      selectCallback(bricks[0])
    }
  }

  const selectCallback = (selectedBrick) => {
    console.log('Selected brick ' + selectedBrick['category'])
    setBrick(selectedBrick)
    setBinOperation(null)
    setPage(TABLE_PAGE)
  }

  return { brickCallback, selectCallback }
}
