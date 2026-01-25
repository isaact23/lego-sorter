import axios from 'axios'


const IMAGE_CACHE_KEY = 'brickImageCache'
const REBRICKABLE_API_KEY = process.env.REACT_APP_LS_API_KEY

function loadCache () {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveCache (cache) {
  localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
}

/**
 * Get an image URL for a brick part number.
 * - Returns cached image if available
 * - Fetches from Rebrickable only if missing
 */
export async function getBrickImage (partId) {
  const cache = loadCache()

  // Cache hit (including cached nulls)
  if (cache.hasOwnProperty(partId)) {
    return cache[partId]
  }

  // Cache miss → fetch image only
  try {
    const res = await axios.get(
      `https://rebrickable.com/api/v3/lego/parts/${partId}/`,
      {
        headers: {
          Authorization: `key ${REBRICKABLE_API_KEY}`,
          Accept: 'application/json'
        }
      }
    )

    const imageUrl = res.data?.part_img_url || null

    cache[partId] = imageUrl
    saveCache(cache)

    return imageUrl
  } catch (err) {
    console.warn(`Image fetch failed for ${partId}`)
    cache[partId] = null
    saveCache(cache)
    return null
  }
}
