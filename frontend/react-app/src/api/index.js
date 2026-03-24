const API_BASE_URL = 'http://localhost:8000'

export async function api(method, path, body = null) {
  const opts = {
    method,
    headers: {},
    credentials: "include"   // ⭐ ADD THIS LINE
  }

  if (body instanceof FormData) {
    opts.body = body
  } else if (body) {
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    opts.body = new URLSearchParams(body).toString()
  }

  const url = `${API_BASE_URL}${path}`

  const res  = await fetch(url, opts)
  const data = await res.json()

  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
  return data
}