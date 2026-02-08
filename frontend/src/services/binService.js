// frontend/src/services/binService.js

import axios from 'axios'
import { BACKEND_URL } from '../config'


// Get all bins containing a specific brick
export async function getBinsForBrick (pieceId) {
  const res = await fetch('/bin/getBins_Brick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pieceId })
  })
  return res.json()
}

// Add or remove a part from a bin
export async function operateBin ({ binId, partId, categoryId, operation }) {
  if (!binId || !partId || !operation) {
    throw new Error('operateBin requires binId, partId, and operation')
  }

  const endpoint =
    operation === 'add'
      ? '/bin/add'
      : operation === 'remove'
        ? '/bin/remove'
        : null

  const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
    binId,
    pieceId: partId,
    categoryId
  })

  return response.data
}

// Return all parts in a given bin
export async function getBinContents (binId) {
  if (!binId) {
    throw new Error('getBinContents requires binId')
  }

  const response = await axios.post(
    `${BACKEND_URL}/bin/Get-Info`,
    { binId }
  )

  // Expecting an array of part IDs
  return response.data ?? []
}
