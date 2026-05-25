const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json()
}

export async function getBinsByBrick(pieceId) {
  return post('/bin/getBins_Brick', { pieceId })
}

export async function getBinsbyCategory(categoryId) {
  return post('/bin/getBins_Category', { categoryId })
}

export async function getAllBins() {
  const res = await fetch('/bin/all')
  if (!res.ok) throw new Error(`GET /bin/all → ${res.status}`)
  return res.json()
}

export async function getBinsByProperty(propertyId) {
  return post('/bin/getBins_Property', { propertyId })
}

export async function updateBinProperties({ binId, properties }) {
  return post('/bin/updateProperties', { binId, properties })
}

export async function emptyBin(binId) {
  return post('/bin/empty', { binId })
}

export async function operateBin({ binId, partId, categoryId, operation }) {
  if (!binId || !partId || !operation) {
    throw new Error('operateBin requires binId, partId, and operation')
  }
  const path = operation === 'add' ? '/bin/add' : '/bin/remove'
  return post(path, { binId, pieceId: partId, categoryId })
}

export async function setBinName(binId, name) {
  return post('/bin/setName', { binId, name: name ?? '' })
}

export async function getBinContents(binId) {
  if (!binId) throw new Error('getBinContents requires binId')
  const data = await post('/bin/get-Info', { binId })
  return data ?? { items: [], properties: [] }
}
