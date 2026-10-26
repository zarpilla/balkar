// Screenshots that need a login: the Strapi admin panel and the learner pages, plus the
// before/after examples on the test course (docs-manual-test).
//   node private.mjs [name-filter]
//
// Logins and the test course come from .env.manual (see test-data.mjs). Every write the
// browser tries is blocked (helpers.readOnly). The before/after steps change the TEST course
// through the admin API and always put the original values back (try/finally).
import { chromium } from '@playwright/test'
import { SITES, readOnly, settle, shot, adminLogin, frontLogin, loadEnv, env } from './helpers.mjs'
import { adminApi } from './admin-api.mjs'

loadEnv()
const only = process.argv[2] ? new RegExp(process.argv[2]) : null
const viewport = { width: 1440, height: 900 }

// --- live data used below (see the manual chapters)
const URR_SPACE = 'how-to-build-carbon-neutral-resilient-and-just-cities'
const URR_SPACE_ID = 23
const URR_UNIT = { id: 33, module: '5b8acb14-d6af-4a81-aca9-4ef22ff23fbd', uid: '7557d614-b910-45bc-ba2e-3cbebd7a301c' } // text, accordion, video
const URR_QUIZ_UNIT = { module: 'd941c5b6-a5e2-46db-a5c8-48277b0b812f', uid: 'ae3c0ee0-4868-4d51-bae4-c0f61bbbda38' }
const URR_LESSON = { module: '3920904b-09b3-4374-87ce-9ba2e32e60fb', unit: '7260daa9-3087-4880-b5b1-728fb90cfc0d', uid: 'ebc65187-7c7d-49e8-a8cf-2c275845e1ea' }
const URR_MODULE_ID = 7
const URR_TRANSLATION_ID = 549 // dashboard-intro-guest
const URR_FORUM_ID = 12
const URR_CERTIFICATE_ID = 1
const URR_THEME_TEST_ID = 2 // "Test blue"
const BALKAR_SPACE_ID = 27
const BALKAR_THEME_ID = 1
const BALKAR_PRODUCT_ID = 4
const TEST = site => env(site, 'TEST_SPACE_UID')

const LS = 'api::learning-space.learning-space'
const cmUrl = (site, uid, id, locale) =>
  `${SITES[site].api}/admin/content-manager/collection-types/${uid}${id ? '/' + id : ''}${locale ? `?plugins[i18n][locale]=${locale}` : ''}`

// --- browser sessions, one per site and role
const browser = await chromium.launch()
const sessions = {}
async function session (site, role) {
  const key = `${site}:${role}`
  if (sessions[key]) return sessions[key]
  const context = await browser.newContext({ viewport, locale: 'en-GB' })
  await readOnly(context)
  const page = await context.newPage()
  if (role === 'admin') await adminLogin(page, site)
  if (role === 'student') await frontLogin(page, site)
  sessions[key] = page
  return page
}
const apis = {}
const api = async site => (apis[site] ||= await adminApi(site))

// Strapi admin: open a page and wait for it to settle (no spinners, no toasts)
async function admin (page, url, waitFor) {
  await page.goto(url)
  await settle(page, 1500)
  if (waitFor) await page.getByText(waitFor).first().waitFor({ timeout: 30_000 })
  await page.evaluate(() => document.querySelectorAll('[role="status"], [data-strapi-notification]').forEach(e => e.remove()))
}
// Learner site
async function front (page, site, path, waitFor) {
  await page.goto(SITES[site].front + path)
  await settle(page, 2500)
  if (waitFor) await page.getByText(waitFor).filter({ visible: true }).first().waitFor({ timeout: 30_000 })
}
const testTestPath = (site, s) => `/space/${TEST(site)}${s || ''}`

// The test course's ids (module, unit, lesson) in the default locale
async function testCourse (site) {
  const a = await api(site)
  const locale = site === 'urr' ? 'en' : 'ca'
  const [space] = await a.list(LS, `plugins[i18n][locale]=${locale}&filters[$and][0][uid][$eq]=${TEST(site)}`)
  const [modRef] = await a.relations(LS, space.id, 'content_modules')
  const mod = await a.one('api::module.module', modRef.id)
  const [unitRef] = await a.relations('api::module.module', mod.id, 'units')
  const unit = await a.one('api::unit.unit', unitRef.id)
  const [lessonRef] = await a.relations('api::unit.unit', unit.id, 'lessons')
  const lesson = await a.one('api::lesson.lesson', lessonRef.id)
  return { space, mod, unit, lesson, locale }
}

// Changes the test course through the admin API, takes the "before" and "after" pictures with
// show(page), and always restores the original values.
async function beforeAfter ({ chapter, site, name, role = 'student', show, change, options = {} }) {
  const page = await session(site, role)
  await show(page)
  await shot(page, chapter, site, `${name}-before`, options)
  const restore = await change(await api(site))
  try {
    await show(page)
    await shot(page, chapter, site, `${name}-after`, options)
  } finally {
    await restore()
  }
}

const shots = [
  // ---------- 02 admin basics
  ['02-admin-basics', 'urr', 'login', async () => {
    const context = await browser.newContext({ viewport, locale: 'en-GB' })
    await readOnly(context)
    const page = await context.newPage()
    await page.goto(SITES.urr.api + '/admin/auth/login'); await settle(page)
    await shot(page, '02-admin-basics', 'urr', 'login')
    await context.close()
  }],
  ['02-admin-basics', 'urr', 'content-manager', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', LS, null, 'en'), 'How to Build')
    await shot(page, '02-admin-basics', 'urr', 'content-manager')
  }],
  ['02-admin-basics', 'urr', 'list', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::unit.unit', null, 'en'), 'Unit')
    await shot(page, '02-admin-basics', 'urr', 'list')
  }],
  ['02-admin-basics', 'urr', 'edit', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', LS, URR_SPACE_ID, 'en'), 'How to Build')
    await shot(page, '02-admin-basics', 'urr', 'edit')
  }],
  ['02-admin-basics', 'balkar', 'locale', async () => {
    const page = await session('balkar', 'admin')
    await admin(page, cmUrl('balkar', LS, BALKAR_SPACE_ID, 'ca'), 'Regenerative')
    await page.getByRole('combobox', { name: 'Locales', exact: true }).click()
    await page.waitForTimeout(600)
    await shot(page, '02-admin-basics', 'balkar', 'locale')
    await page.keyboard.press('Escape')
  }],
  ['02-admin-basics', 'urr', 'media', async () => {
    const page = await session('urr', 'admin')
    await admin(page, SITES.urr.api + '/admin/plugins/upload')
    await page.waitForTimeout(2500)
    await shot(page, '02-admin-basics', 'urr', 'media')
  }],

  // ---------- 03 site settings
  ...['urr', 'balkar'].map(site => ['03-site-settings', site, 'admin-administration', async () => {
    const page = await session(site, 'admin')
    await admin(page, `${SITES[site].api}/admin/content-manager/single-types/api::administration.administration`, 'Administration')
    await shot(page, '03-site-settings', site, 'admin-administration', { fullPage: true })
  }]),
  ['03-site-settings', 'balkar', 'admin-theme', async () => {
    const page = await session('balkar', 'admin')
    await admin(page, cmUrl('balkar', 'api::theme.theme', BALKAR_THEME_ID), 'Balkar')
    await shot(page, '03-site-settings', 'balkar', 'admin-theme')
  }],

  // ---------- 04 translations
  ['04-translations', 'urr', 'admin-list', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::translation.translation', null, 'en'), 'Translation')
    await shot(page, '04-translations', 'urr', 'admin-list')
  }],
  ['04-translations', 'urr', 'admin-entry', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::translation.translation', URR_TRANSLATION_ID, 'en'), 'dashboard-intro-guest')
    await shot(page, '04-translations', 'urr', 'admin-entry')
  }],
  ['04-translations', 'balkar', 'language-menu', async () => {
    const page = await session('balkar', 'student')
    await front(page, 'balkar', '/dashboard')
    await page.locator('.dropdown-toggle, [data-bs-toggle="dropdown"]').first().click()
    await page.waitForTimeout(500)
    await page.locator('.dropdown-menu.show .dropdown-item').filter({ hasText: /idioma|language/i }).first().click()
    await page.waitForTimeout(1200)
    await shot(page, '04-translations', 'balkar', 'language-menu')
    await page.keyboard.press('Escape')
    await page.reload(); await settle(page)
  }],

  // ---------- 05 emails
  ['05-emails', 'urr', 'admin-list', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::email-template.email-template', null, 'en'), 'reset_password')
    await shot(page, '05-emails', 'urr', 'admin-list')
  }],

  // ---------- 06 learning spaces
  ['06-learning-spaces', 'urr', 'admin-list', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', LS, null, 'en'), 'How to Build')
    await shot(page, '06-learning-spaces', 'urr', 'admin-list')
  }],
  ['06-learning-spaces', 'urr', 'admin-edit', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', LS, URR_SPACE_ID, 'en'), 'How to Build')
    await shot(page, '06-learning-spaces', 'urr', 'admin-edit', { fullPage: true })
  }],
  ['06-learning-spaces', 'urr', 'dashboard-card', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', '/dashboard', 'My courses')
    await shot(page, '06-learning-spaces', 'urr', 'dashboard-card')
  }],
  ['06-learning-spaces', 'urr', 'course-inside', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}`, 'Completed')
    await shot(page, '06-learning-spaces', 'urr', 'course-inside')
  }],
  ['06-learning-spaces', 'urr', 'test-card', () => beforeAfter({
    chapter: '06-learning-spaces',
    site: 'urr',
    name: 'test-card',
    show: page => front(page, 'urr', '/dashboard', 'Manual test course'),
    change: async a => {
      const { space } = await testCourse('urr')
      const real = await a.one(LS, URR_SPACE_ID, 'populate=bannerOther')
      await a.update(LS, space.id, { nameMore: 'A short course to try things out', bannerOther: real.bannerOther ? real.bannerOther.id : null })
      return () => a.update(LS, space.id, { nameMore: space.nameMore, bannerOther: null })
    }
  })],
  ['06-learning-spaces', 'urr', 'test-theme', () => beforeAfter({
    chapter: '06-learning-spaces',
    site: 'urr',
    name: 'test-theme',
    show: page => front(page, 'urr', testTestPath('urr'), 'Unit introduction'),
    change: async a => {
      const { space } = await testCourse('urr')
      await a.update(LS, space.id, { theme: { connect: [{ id: URR_THEME_TEST_ID }] } })
      return () => a.update(LS, space.id, { theme: { disconnect: [{ id: URR_THEME_TEST_ID }] } })
    }
  })],

  // ---------- 07 course structure
  ['07-course-structure', 'urr', 'unit', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/module/${URR_UNIT.module}/unit/${URR_UNIT.uid}`, 'Circular Urban Planning Tool')
    await shot(page, '07-course-structure', 'urr', 'unit')
  }],
  ['07-course-structure', 'urr', 'admin-module', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::module.module', URR_MODULE_ID, 'en'))
    await shot(page, '07-course-structure', 'urr', 'admin-module', { fullPage: true })
  }],
  ['07-course-structure', 'urr', 'module-titles', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/module/${URR_LESSON.module}/unit/${URR_LESSON.unit}/lesson/${URR_LESSON.uid}`, '15-minute City')
    await shot(page, '07-course-structure', 'urr', 'module-titles')
  }],
  ['07-course-structure', 'urr', 'lesson', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/module/${URR_LESSON.module}/unit/${URR_LESSON.unit}/lesson/${URR_LESSON.uid}`, '15-minute City')
    await shot(page, '07-course-structure', 'urr', 'lesson', { fullPage: true })
  }],
  ['07-course-structure', 'urr', 'test-unit', () => beforeAfter({
    chapter: '07-course-structure',
    site: 'urr',
    name: 'test-unit',
    show: async page => {
      const { mod, unit, lesson } = await testCourse('urr')
      await front(page, 'urr', testTestPath('urr', `/module/${mod.uid}/unit/${unit.uid}/lesson/${lesson.uid}`), 'Test lesson')
    },
    change: async a => {
      const { unit } = await testCourse('urr')
      await a.update('api::unit.unit', unit.id, { title: 'Getting started', shortTitle: 'Start here' })
      return () => a.update('api::unit.unit', unit.id, { title: unit.title, shortTitle: unit.shortTitle })
    }
  })],

  // ---------- 08 content blocks
  ['08-content-blocks', 'urr', 'admin-add-block', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::unit.unit', URR_UNIT.id, 'en'))
    const add = page.getByRole('button', { name: /add a component to content/i }).last()
    await add.scrollIntoViewIfNeeded(); await add.click()
    await page.waitForTimeout(800)
    const picker = page.getByText(/pick one component/i).first()
    await picker.waitFor({ timeout: 10_000 })
    await picker.evaluate(e => e.scrollIntoView({ block: 'start' }))
    await page.mouse.wheel(0, -120)
    await page.waitForTimeout(500)
    await shot(page, '08-content-blocks', 'urr', 'admin-add-block')
  }],
  ...[['text', '.content-text'], ['video', '.content-video'], ['accordion', '.content-accordion']].map(([name, sel]) =>
    ['08-content-blocks', 'urr', name, async () => {
      const page = await session('urr', 'student')
      await front(page, 'urr', `/space/${URR_SPACE}/module/${URR_UNIT.module}/unit/${URR_UNIT.uid}`, 'Circular Urban Planning Tool')
      await shot(page, '08-content-blocks', 'urr', name, { element: page.locator(sel).first() })
    }]),
  ['08-content-blocks', 'urr', 'quiz', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/module/${URR_QUIZ_UNIT.module}/unit/${URR_QUIZ_UNIT.uid}`)
    await shot(page, '08-content-blocks', 'urr', 'quiz', { element: page.locator('.content-quiz').first() })
  }],

  // ---------- 09 forum
  ['09-forum', 'urr', 'forum', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/forum`)
    await shot(page, '09-forum', 'urr', 'forum')
  }],
  ['09-forum', 'urr', 'admin-forum', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::forum.forum', URR_FORUM_ID, 'en'), 'Cities Community')
    await shot(page, '09-forum', 'urr', 'admin-forum', { fullPage: true })
  }],

  // ---------- 10 certificates
  ['10-certificates', 'urr', 'certificate-page', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/certificate`)
    await shot(page, '10-certificates', 'urr', 'certificate-page')
  }],
  ['10-certificates', 'urr', 'admin-certificate', async () => {
    const page = await session('urr', 'admin')
    await admin(page, cmUrl('urr', 'api::certificate.certificate', URR_CERTIFICATE_ID))
    await shot(page, '10-certificates', 'urr', 'admin-certificate', { fullPage: true })
  }],

  // ---------- 11 enrollment and payments
  ['11-enrollment-payments', 'urr', 'admin-user', async () => {
    const page = await session('urr', 'admin')
    const a = await api('urr')
    const [u] = await a.list('plugin::users-permissions.user', `filters[$and][0][email][$eq]=${env('urr', 'STUDENT_EMAIL')}`)
    await admin(page, cmUrl('urr', 'plugin::users-permissions.user', u.id), 'confirmed')
    await shot(page, '11-enrollment-payments', 'urr', 'admin-user', { fullPage: true, keepEmails: true })
  }],
  ['11-enrollment-payments', 'urr', 'profile-first', async () => {
    const page = await session('urr', 'student')
    // what a new learner sees: the dashboard asks for the profile while it was never updated
    // (createdAt == updatedAt). Only the browser's copy of /users/me is changed.
    const fake = async route => {
      const res = await route.fetch()
      const user = await res.json()
      await route.fulfill({ response: res, json: { ...user, updatedAt: user.createdAt } })
    }
    await page.route(/\/api\/users\/me/, fake)
    try {
      await front(page, 'urr', '/dashboard')
      await shot(page, '11-enrollment-payments', 'urr', 'profile-first')
    } finally {
      await page.unroute(/\/api\/users\/me/, fake)
    }
  }],
  ['11-enrollment-payments', 'urr', 'admin-enrollments', async () => {
    const page = await session('urr', 'admin')
    await admin(page, `${SITES.urr.api}/admin/content-manager/collection-types/api::enrollment.enrollment?page=1&pageSize=10&sort=id:DESC`)
    await page.waitForTimeout(1500)
    await shot(page, '11-enrollment-payments', 'urr', 'admin-enrollments', { blur: ['tbody td:nth-child(3)'] })
  }],
  ['11-enrollment-payments', 'balkar', 'admin-product', async () => {
    const page = await session('balkar', 'admin')
    await admin(page, cmUrl('balkar', 'api::product.product', BALKAR_PRODUCT_ID), 'Biomimicry')
    await shot(page, '11-enrollment-payments', 'balkar', 'admin-product', { fullPage: true })
  }],

  // ---------- 12 progress, managers, uploads
  ['12-progress-managers', 'urr', 'progress', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/progress`)
    await shot(page, '12-progress-managers', 'urr', 'progress')
  }],
  ['12-progress-managers', 'urr', 'bookmarks', async () => {
    const page = await session('urr', 'student')
    await front(page, 'urr', `/space/${URR_SPACE}/bookmarks`)
    await shot(page, '12-progress-managers', 'urr', 'bookmarks')
  }],
  ['12-progress-managers', 'urr', 'admin-spacemanager', async () => {
    const page = await session('urr', 'admin')
    await admin(page, `${SITES.urr.api}/admin/content-manager/collection-types/api::space-manager.space-manager`)
    await page.waitForTimeout(1500)
    await shot(page, '12-progress-managers', 'urr', 'admin-spacemanager')
  }],
  ['12-progress-managers', 'urr', 'course-admin', async () => {
    // make the test student manager of the TEST course for a moment
    const a = await api('urr')
    const { space } = await testCourse('urr')
    const [u] = await a.list('plugin::users-permissions.user', `filters[$and][0][email][$eq]=${env('urr', 'STUDENT_EMAIL')}`)
    await a.update('plugin::users-permissions.user', u.id, { manager: true })
    const sm = await a.create('api::space-manager.space-manager', { user: { connect: [{ id: u.id }] }, learning_space: { connect: [{ id: space.id }] } })
    try {
      const page = await session('urr', 'student')
      await front(page, 'urr', testTestPath('urr', '/admin'))
      await page.waitForTimeout(2000)
      await shot(page, '12-progress-managers', 'urr', 'course-admin', { fullPage: true })
    } finally {
      await a.remove('api::space-manager.space-manager', sm.id)
      await a.update('plugin::users-permissions.user', u.id, { manager: false })
    }
  }],
  ['12-progress-managers', 'balkar', 'upload', async () => {
    // turn on uploadFiles on the TEST course module for a moment
    const a = await api('balkar')
    const { mod, unit } = await testCourse('balkar')
    await a.update('api::module.module', mod.id, { uploadFiles: true })
    try {
      const page = await session('balkar', 'student')
      await front(page, 'balkar', testTestPath('balkar', `/module/${mod.uid}/unit/${unit.uid}`))
      await page.waitForTimeout(1500)
      await shot(page, '12-progress-managers', 'balkar', 'upload', { fullPage: true })
    } finally {
      await a.update('api::module.module', mod.id, { uploadFiles: false })
    }
  }]
]

let failed = 0
for (const [chapter, site, name, step] of shots) {
  if (only && !only.test(`${chapter}/${site}-${name}`)) continue
  console.log(`${chapter}/${site}-${name}`)
  try {
    await step()
  } catch (e) {
    failed++
    console.log('  FAILED', e.message.split('\n')[0])
  }
}
await browser.close()
if (failed) { console.log(`${failed} failed`); process.exitCode = 1 }
