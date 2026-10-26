// Screenshots of the pages anyone can see, on both sites (no login).
//   node public.mjs [name-filter]
import { chromium } from '@playwright/test'
import { SITES, readOnly, settle, shot, setLocale } from './helpers.mjs'

const only = process.argv[2] ? new RegExp(process.argv[2]) : null
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const go = (route) => async (page, site) => {
  await page.goto(SITES[site].front + route)
  await settle(page, 2000)
}

const shots = [
  // [chapter, site, name, step, options]
  ['01-overview', 'urr', 'home', go('/'), { fullPage: true }],
  ['01-overview', 'balkar', 'home-redirects-to-login', go('/')],
  ['01-overview', 'urr', 'home-mobile', go('/'), { device: mobile }],
  ['01-overview', 'balkar', 'login-mobile', go('/login'), { device: mobile }],
  ['03-site-settings', 'urr', 'header-footer', go('/'), { fullPage: true }],
  ['03-site-settings', 'balkar', 'header-footer', go('/login'), { fullPage: true }],
  ['03-site-settings', 'balkar', 'login-en', async (page, site) => { await go('/login')(page, site); await setLocale(page, 'en'); await settle(page) }],
  ['06-learning-spaces', 'urr', 'public-about', go('/space/how-to-build-carbon-neutral-resilient-and-just-cities/about'), { fullPage: true }],
  ['11-enrollment-payments', 'urr', 'register', go('/register'), { fullPage: true }],
  ['11-enrollment-payments', 'balkar', 'register', go('/register'), { fullPage: true }],
  ['11-enrollment-payments', 'urr', 'forgot', go('/forgot')],
  ['05-emails', 'urr', 'login-confirmed', go('/login?confirmed=1')]
]

const browser = await chromium.launch()
for (const [chapter, site, name, step, { device = desktop, ...options } = {}] of shots) {
  if (only && !only.test(`${chapter}/${site}-${name}`)) continue
  console.log(`${chapter}/${site}-${name}`)
  const context = await browser.newContext({ ...device, locale: 'en-GB' })
  await readOnly(context)
  const page = await context.newPage()
  await step(page, site)
  await shot(page, chapter, site, name, options)
  await context.close()
}
await browser.close()
