// Shared helpers for the course-administrator manual screenshots.
//
// The screenshots are taken on the production sites (URR and Balkar). To keep that safe:
//  - every request that could change data (POST/PUT/PATCH/DELETE) is blocked, except logging in;
//    a step that really needs to save (the before/after examples on the test course) must call
//    allowWrites(page) first and undo its change afterwards;
//  - email addresses on screen are blurred before each screenshot (real students' data).
//
// Logins live in .env.manual (git-ignored), see .env.manual.example.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const imagesDir = path.resolve(here, '..', 'images')

export function loadEnv () {
  const file = path.join(here, '.env.manual')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

export const SITES = {
  urr: {
    name: 'URR',
    front: 'https://edu.urbanresilienceresearch.net',
    api: 'https://api.urbanresilienceresearch.net'
  },
  balkar: {
    name: 'Balkar',
    front: 'https://area.balkar.earth',
    api: 'https://api.balkar.earth'
  }
}

export const env = (site, key) => process.env[`${site.toUpperCase()}_${key}`]

const writable = new WeakSet()
const LOGIN_PATHS = [/\/admin\/login$/, /\/admin\/renew-token$/, /\/api\/auth\/local$/]

// Blocks writes on every page of the context (call once per context).
export async function readOnly (context) {
  await context.route('**/*', route => {
    const req = route.request()
    const method = req.method()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return route.continue()
    const url = new URL(req.url())
    if (LOGIN_PATHS.some(re => re.test(url.pathname))) return route.continue()
    // Strapi admin reads that use POST (e.g. counting relations) are harmless, but we don't
    // need them for screenshots; analytics beacons too. Only writable pages may send them.
    if (writable.has(req.frame().page())) return route.continue()
    console.log(`  [blocked ${method}] ${url.pathname}`)
    return route.abort()
  })
}

export const allowWrites = page => writable.add(page)
export const blockWrites = page => writable.delete(page)

// Strapi admin panel login (https://api.../admin).
export async function adminLogin (page, site) {
  const { api } = SITES[site]
  const email = env(site, 'ADMIN_EMAIL')
  const password = env(site, 'ADMIN_PASSWORD')
  if (!email || !password) throw new Error(`${site.toUpperCase()}_ADMIN_EMAIL / _PASSWORD missing in .env.manual`)
  await page.goto(api + '/admin/auth/login')
  await page.locator('input[name=email]').fill(email)
  await page.locator('input[name=password]').fill(password)
  await page.locator('button[type=submit]').click()
  await page.waitForURL(u => !u.pathname.includes('/auth/'), { timeout: 30_000 })
  await settle(page)
}

// Frontend (learner) login. user = 'STUDENT' or 'MANAGER' (env prefix).
export async function frontLogin (page, site, who = 'STUDENT', locale) {
  const { front } = SITES[site]
  const email = env(site, `${who}_EMAIL`)
  const password = env(site, `${who}_PASSWORD`)
  if (!email || !password) throw new Error(`${site.toUpperCase()}_${who}_EMAIL / _PASSWORD missing in .env.manual`)
  await page.goto(front + '/login')
  if (locale) await setLocale(page, locale)
  await page.locator('form input:not([type=password])').first().fill(email)
  await page.locator('input[type=password]').first().fill(password)
  await page.locator('button[type=submit]').first().click()
  await page.waitForFunction(() => !!localStorage.getItem('user.jwt'), null, { timeout: 30_000 })
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30_000 })
  await settle(page)
}

// The front reads its language from localStorage 'locale' (else administration.defaultLocale).
export async function setLocale (page, locale) {
  await page.evaluate(l => localStorage.setItem('locale', l), locale)
  await page.reload({ waitUntil: 'networkidle' })
}

export async function settle (page, ms = 1200) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

// Blur every element whose own text contains an email address.
async function blurEmails (page) {
  await page.evaluate(() => {
    // the sites' own generic contact addresses (info@, hello@) can stay visible
    const own = /^(info|hello|contact)@(balkar\.earth|urbanresilienceresearch\.net|resilience\.earth)$/
    const personal = /[\w.+-]+@[\w-]+\.[\w.-]+/g
    const re = { test: s => (s.match(personal) || []).some(e => !own.test(e)) }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (re.test(n.nodeValue) && n.parentElement) n.parentElement.style.filter = 'blur(5px)'
    }
    document.querySelectorAll('input').forEach(i => { if (re.test(i.value)) i.style.filter = 'blur(5px)' })
  })
}

// Saves images/<chapter>/<site>-<name>.png.
// options: { fullPage, clip, blur: [selectors to blur], keepEmails, highlight: [selectors] }
export async function shot (page, chapter, site, name, { blur = [], keepEmails, highlight = [], ...options } = {}) {
  const file = path.join(imagesDir, chapter, `${site}-${name}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.mouse.move(0, 0)
  if (!keepEmails) await blurEmails(page)
  for (const sel of blur) await page.locator(sel).evaluateAll(els => els.forEach(e => { e.style.filter = 'blur(6px)' }))
  for (const sel of highlight) {
    await page.locator(sel).evaluateAll(els => els.forEach(e => {
      e.style.outline = '3px solid #e5007d'
      e.style.outlineOffset = '3px'
    }))
  }
  if (options.element) {
    // a single element (e.g. one content block), with a little margin around it
    const { element, pad = 16 } = options
    await element.scrollIntoViewIfNeeded()
    const box = await element.boundingBox()
    if (!box) throw new Error(`${name}: element not visible`)
    const view = page.viewportSize()
    const docH = await page.evaluate(() => document.documentElement.scrollHeight)
    const clip = {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(view.width, box.width + 2 * pad),
      height: Math.min(docH, box.height + 2 * pad)
    }
    // clip coordinates are relative to the page when fullPage is set
    const scrollY = await page.evaluate(() => window.scrollY)
    await page.screenshot({ path: file, animations: 'disabled', fullPage: true, clip: { ...clip, y: clip.y + scrollY } })
  } else {
    await page.screenshot({ path: file, animations: 'disabled', ...options })
  }
  for (const sel of highlight) await page.locator(sel).evaluateAll(els => els.forEach(e => { e.style.outline = '' }))
  console.log('  saved', path.relative(imagesDir, file))
  return file
}
