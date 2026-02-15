import axios from 'axios'

const API_ENDPOINT = 'https://api.brickognize.com/predict/'

export async function identifyFromBlob(blob) {
  const formData = new FormData()
  formData.append('query_image', blob, 'image.jpg')

  const res = await axios.post(API_ENDPOINT, formData, {
    headers: { Accept: 'application/json' }
  })

  const legoList = res.data.items || []

  return legoList.map(item => ({
    part_num: item.id,
    confidence: item.score
  }))
}