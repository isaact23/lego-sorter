import axios from 'axios'

const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY

export async function fetchBrickData (partNumber, confidence = 1.0) {
  try {
    const response = await axios.get(
      `https://rebrickable.com/api/v3/lego/parts/?part_num=${partNumber}`,
      {
        headers: {
          Authorization: `key ${REBRICKABLE_API_KEY}`,
          Accept: 'application/json'
        }
      }
    )

    const parts = response.data.results || []
    if (parts.length === 0) {
      return null
    }

    // Standardized brick format
    const part = parts[0]
    return {
      id: part.part_num,
      name: part.name,
      category: part.part_cat_id || 'Unknown',
      img_url: part.part_img_url,
      score: confidence
    }
  } catch (err) {
    console.error(`Error fetching brick data for part ${partNumber}:`, err)
    return null
  }
}
