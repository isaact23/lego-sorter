import axios from 'axios'
import { API_ENDPOINT } from '../config'
import { fetchBrickData } from './brickDataService'

export async function identify (base64Data, onSuccess, onError) {
  try {
    const base64 = await fetch(base64Data)
    const blob = await base64.blob()

    const formData = new FormData()
    formData.append('query_image', blob, 'image.jpg')

    const res = await axios.post(API_ENDPOINT, formData, {
      headers: { Accept: 'application/json' }
    })

    const detectedParts = res.data.items
    if (detectedParts.length === 0) {
      onError('No pieces identified, try again?')
      return
    }

    // Fetch full brick data from Rebrickable for each detected part
    const bricksWithData = await Promise.all(
      detectedParts.map(part => fetchBrickData(part.id, part.score))
    )

    // Filter out any null results (parts not found in Rebrickable)
    const validBricks = bricksWithData.filter(brick => brick !== null)
    
    if (validBricks.length === 0) {
      onError('No matching parts found in Rebrickable database')
      return
    }

    onSuccess(validBricks)
  } catch (err) {
    console.error(err)
    onError('Something went wrong.')
  }
}

export function takePicture (pictureInputRef) {
  pictureInputRef.current?.click()
}

export function handleFileChange (event, onFileRead) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onloadend = () => {
    onFileRead(reader.result)
  }
  reader.readAsDataURL(file)
}
