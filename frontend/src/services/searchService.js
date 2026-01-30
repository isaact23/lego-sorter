import axios from 'axios'
import { BACKEND_URL } from '../data/config'

export async function searchPartsByPrefix (searchQuery) {
  try {
    const response = await axios.post(`${BACKEND_URL}/bin/search-parts`, {
      prefix: searchQuery
    })
    return response.data || []
  } catch (err) {
    console.error('Error searching parts:', err)
    return []
  }
}
