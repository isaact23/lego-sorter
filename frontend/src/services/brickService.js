

import axios from 'axios'

export async function fetchBrickData(partNumber) {
  try {
    if (!partNumber || partNumber.length < 2) return null

    const response = await axios.get(`/api/brick?part=${partNumber}`)
    return response.data
  } catch (err) {
    console.error('Error fetching brick data:', err)
    return null
  }
}
