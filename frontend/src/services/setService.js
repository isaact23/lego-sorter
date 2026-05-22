import axios from 'axios'

export async function getSetBins(setNum) {
  const response = await axios.get('/api/set-bins', {
    params: { set_num: setNum }
  })
  return response.data
}
