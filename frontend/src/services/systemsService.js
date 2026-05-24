export async function fetchSystems () {
  const res = await fetch('/api/systems')
  if (!res.ok) throw new Error(`GET /api/systems → ${res.status}`)
  return res.json()  // { version, unitTypes, systems }
}

export async function saveSystems (data) {
  const res = await fetch('/api/systems', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`PUT /api/systems → ${res.status}`)
  return res.json()
}
