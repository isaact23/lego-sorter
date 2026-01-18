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

export function createEditBinHandler (state, setState) {
  const { brick, binOperation } = state
  const { setBinOperation, setOperationStatus } = setState

  return (newBinId, onSuccess) => {
    console.log('editBin called with:', newBinId, 'binOperation:', binOperation, 'brick:', brick)
    
    if (!brick) {
      console.error('No brick selected!')
      return
    }

    if (binOperation === 'add') {
      console.log('Adding part to bin:', brick.id, newBinId)
      addPartToBin(brick.id, newBinId, { setOperationStatus, setBinOperation }, onSuccess)
    } else if (binOperation === 'remove') {
      console.log('Removing part from bin:', brick.id, newBinId)
      removePartFromBin(brick.id, newBinId, { setOperationStatus, setBinOperation }, onSuccess)
    } else {
      console.warn('No operation selected, binOperation:', binOperation)
    }
  }
}
