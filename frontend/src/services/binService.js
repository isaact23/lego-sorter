// frontend/src/services/binService.js

import axios from 'axios'
import { BACKEND_URL } from '../config'


// Get all bins containing a specific brick
export async function getBinsByBrick (pieceId) {
  const res = await fetch('/bin/getBins_Brick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pieceId })
  })
  return res.json()
}

// Get all bins containing a specific brick
export async function getBinsbyCategory (categoryId) {
  const res = await fetch('/bin/getBins_Category', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId })
  })
  return res.json()
}

// Get all bins with full loaded data
export async function getAllBins () {
  const response = await axios.get(`${BACKEND_URL}/bin/all`)
  return response.data ?? {}
}

// Get bins which have a specific property assigned
export async function getBinsByProperty (propertyId) {
  const res = await fetch('/bin/getBins_Property', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId })
  })
  return res.json()
}

export async function updateBinProperties ({ binId, properties }) {
  const response = await axios.post(
    `${BACKEND_URL}/bin/updateProperties`,
    { binId, properties }
  )
  return response.data
}

export async function emptyBin (binId) {
  const response = await axios.post(
    `${BACKEND_URL}/bin/empty`,
    { binId }
  )
  return response.data
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
    `${BACKEND_URL}/bin/get-Info`,
    { binId }
  )

  // Expecting an object: { items: [partIds], properties: [propId] }
  return response.data ?? { items: [], properties: [] }
}
