import axios from 'axios'

const IMAGE_CACHE_KEY = 'brickImageCache'

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveCache(cache) {
  localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
}

export async function getBrickImage(partId) {
  const cache = loadCache()

  if (cache.hasOwnProperty(partId)) {
    return cache[partId]
  }

  try {
    const res = await axios.get(`/api/brick?part=${partId}`)
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