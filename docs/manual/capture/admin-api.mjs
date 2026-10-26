// Small read helper for the Strapi admin API (content-manager), used by the capture scripts.
import { SITES, env } from './helpers.mjs'

export async function adminApi (site) {
  const API = SITES[site].api
  const login = await fetch(API + '/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: env(site, 'ADMIN_EMAIL'), password: env(site, 'ADMIN_PASSWORD') })
  }).then(r => r.json())
  const token = login.data.token
  const call = async (method, path, body) => {
    const r = await fetch(API + path, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined
    })
    const t = await r.text()
    if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${t.slice(0, 200)}`)
    return t ? JSON.parse(t) : null
  }
  const cm = uid => `/content-manager/collection-types/${uid}`
  return {
    call,
    get: path => call('GET', path),
    list: (uid, query = '') => call('GET', `${cm(uid)}?pageSize=100&${query}`).then(r => r.results),
    one: (uid, id, query = '') => call('GET', `${cm(uid)}/${id}?${query}`),
    update: (uid, id, data) => call('PUT', `${cm(uid)}/${id}`, data),
    create: (uid, data, query = '') => call('POST', `${cm(uid)}?${query}`, data),
    remove: (uid, id) => call('DELETE', `${cm(uid)}/${id}`),
    // related entries of a relation field (the edit endpoint only returns counts)
    relations: (uid, id, field) => call('GET', `/content-manager/relations/${uid}/${id}/${field}?pageSize=100`).then(r => r.results || (r.data ? [r.data] : []))
  }
}
