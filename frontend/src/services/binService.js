// frontend/src/services/binService.js
// Service functions for managing bin operations
// such as adding/removing parts and retrieving bin info.

import axios from 'axios'
import { BACKEND_URL } from '../config'

export async function addPartToBin (pieceId, binId, setState, onSuccess) {
  const { setOperationStatus, setBinOperation } = setState
  console.log('addPartToBin called:', pieceId, binId)
  try {
    const response = await axios.post(`${BACKEND_URL}/bin/add`, {
      pieceId,
      binId
    })
    console.log('Add response:', response)
    setOperationStatus(`✓ Added piece ${pieceId} to bin ${binId}`)
    setBinOperation(null)
    console.log('Calling onSuccess with:', pieceId, 'onSuccess:', onSuccess)
    if (onSuccess) {
      console.log('onSuccess is defined, calling it')
      onSuccess(pieceId)
    } else {
      console.warn('onSuccess is undefined!')
    }
    setTimeout(() => {
      setOperationStatus(null)
    }, 3000)
  } catch (err) {
    console.error('Error adding part to bin:', err)
    setOperationStatus(`✗ Error adding piece: ${err.message}`)
    setTimeout(() => {
      setOperationStatus(null)
    }, 3000)
  }
}

export function createEditBinHandler (state, setState, pages) {
  const { brick, binOperation } = state
  const {
    setBinOperation,
    setOperationStatus,
    setBrickList,
    setPage
  } = setState
  const { SELECT_PAGE } = pages

  return async (newBinId, onSuccess) => {
    console.log(
      'editBin called with:',
      newBinId,
      'binOperation:',
      binOperation,
      'brick:',
      brick
    )

    // CASE 1: No brick selected, show bin contents
    if (!brick) {
      try {
        const binParts = await GetBinInfo(newBinId)

        const cleanedParts = binParts.map(p => p.trim())

        setBrickList(
          cleanedParts.map(id => ({
            id,
            name: `Part ${id}`
          }))
        )

        setPage(SELECT_PAGE)
      } catch (err) {
        console.error('Failed to load bin contents:', err)
        setOperationStatus('✗ Failed to load bin contents')
        setTimeout(() => setOperationStatus(null), 3000)
      }

      return
    }


    // CASE 2: Normal add/remove behavior
    if (binOperation === 'add') {
      addPartToBin(
        brick.id,
        newBinId,
        { setOperationStatus, setBinOperation },
        onSuccess
      )
    } else if (binOperation === 'remove') {
      removePartFromBin(
        brick.id,
        newBinId,
        { setOperationStatus, setBinOperation },
        onSuccess
      )
    } else {
      console.warn('No operation selected, binOperation:', binOperation)
    }
  }
}


export async function removePartFromBin (pieceId, binId, setState, onSuccess) {
  const { setOperationStatus, setBinOperation } = setState
  console.log('removePartFromBin called:', pieceId, binId)
  try {
    const response = await axios.post(`${BACKEND_URL}/bin/remove`, {
      pieceId,
      binId
    })
    console.log('Remove response:', response)
    setOperationStatus(`✓ Removed piece ${pieceId} from bin ${binId}`)
    setBinOperation(null)
    console.log('Calling onSuccess with:', pieceId, 'onSuccess:', onSuccess)
    if (onSuccess) {
      console.log('onSuccess is defined, calling it')
      onSuccess(pieceId)
    } else {
      console.warn('onSuccess is undefined!')
    }
    setTimeout(() => {
      setOperationStatus(null)
    }, 3000)
  } catch (err) {
    console.error('Error removing part from bin:', err)
    setOperationStatus(`✗ Error removing piece: ${err.message}`)
    setTimeout(() => {
      setOperationStatus(null)
    }, 3000)
  }
}

export async function GetBinInfo (binId) {
  console.log('GetBinInfo called for binId:', binId)
  try {
    const response = await axios.post(`${BACKEND_URL}/bin/Get-Info`, { binId })
    console.log('GetBinInfo response:', response)
    return response.data
  } 
  catch (err) {
    console.error('Error getting bin info:', err)
    throw err
  }
}
