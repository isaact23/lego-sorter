

import axios from 'axios'

export async function fetchBrickData(partNumber) {
  try {
    console.log('[fetchBrickData] Requesting enrichment for:', partNumber)
    
    if (!partNumber || partNumber.length < 2) {
      console.warn('[fetchBrickData] Invalid part number:', partNumber)
      return null
    }

    console.log('[fetchBrickData] Making API call to /api/brick?part=' + partNumber)
    const response = await axios.get(`/api/brick?part=${partNumber}`)
    
    console.log('[fetchBrickData] API response:', response.data)
    return response.data
  } catch (err) {
    console.error('[fetchBrickData] Error:', err.message, err.response?.status)
    if (err.response?.status === 404) {
      console.log('[fetchBrickData] Part not found on server (404)')
    }
    return null
  }
}
