

import axios from 'axios'

export async function fetchBrickData(partNumber) {
  try {
    if (!partNumber || partNumber.length < 2) return null

    // Strip color code suffix (e.g., "90463c01" -> "90463")
    // Brickognize returns part IDs with color codes, but CSV has base part numbers
    // Extract only leading digits to safely remove any suffix
    const basePart = partNumber.match(/^\d+/)?.[0] || partNumber

    const response = await axios.get(`/api/brick?part=${basePart}`)
    return response.data
  } catch (err) {
    console.error('Error fetching brick data:', err)
    return null
  }
}
