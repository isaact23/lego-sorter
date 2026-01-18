export function createBrickCallbacks (
  { setBrickList, setPage, setBrick, setBinOperation },
  { SELECT_PAGE, BRICK_INFO }
) {
  const brickCallback = (bricks) => {
    if (bricks.length > 1) {
      setBrickList(bricks)
      setPage(SELECT_PAGE)
    } else {
      selectCallback(bricks[0])
    }
  }

  const selectCallback = (selectedBrick) => {
    setBrick(selectedBrick)
    setBinOperation(null)
    setPage(BRICK_INFO)
  }

  return { brickCallback, selectCallback }
}
