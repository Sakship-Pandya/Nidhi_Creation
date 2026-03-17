export async function api(method, path, body = null) {
  const opts = { method, headers: {} }

  if (body instanceof FormData) {
    opts.body = body
  } else if (body) {
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    opts.body = new URLSearchParams(body).toString()
  }

  const res  = await fetch(path, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
  return data
}