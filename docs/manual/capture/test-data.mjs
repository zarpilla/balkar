// Creates (or removes) the data the manual screenshots need on a live site, through the Strapi
// admin API with the admin login from .env.manual:
//  - a confirmed test student (STUDENT_EMAIL / STUDENT_PASSWORD), with a filled-in profile;
//  - a test course (uid TEST_SPACE_UID, published, public = off) with one module, unit and
//    lesson, used for the before/after examples, with the test student enrolled.
// Optionally enrolls the student in an existing course too (to screenshot real content).
//
//   node test-data.mjs urr|balkar [--enroll <space uid>]
//   node test-data.mjs urr|balkar --cleanup     removes everything above
import { loadEnv, SITES, env } from './helpers.mjs'

loadEnv()
const site = process.argv[2]
if (!SITES[site]) throw new Error('usage: node test-data.mjs urr|balkar [--enroll uid] [--cleanup]')
const cleanup = process.argv.includes('--cleanup')
const enrollIdx = process.argv.indexOf('--enroll')
const extraEnroll = enrollIdx > 0 ? process.argv[enrollIdx + 1] : null
const API = SITES[site].api
const STUDENT = env(site, 'STUDENT_EMAIL')
const SPACE_UID = env(site, 'TEST_SPACE_UID')

let token
async function call (method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`)
  return json
}
const cm = (uid) => `/content-manager/collection-types/${uid}`
const find = async (uid, filters, locale) => {
  const q = new URLSearchParams({ pageSize: '100' })
  Object.entries(filters).forEach(([k, v]) => q.set(`filters[$and][0][${k}][$eq]`, v))
  if (locale) q.set('plugins[i18n][locale]', locale)
  return (await call('GET', `${cm(uid)}?${q}`)).results
}

token = (await call('POST', '/admin/login', { email: env(site, 'ADMIN_EMAIL'), password: env(site, 'ADMIN_PASSWORD') })).data.token
const locales = await call('GET', '/i18n/locales')
const locale = (locales.find(l => l.isDefault) || locales[0]).code
console.log(`${site}: default locale ${locale}`)

const U = 'plugin::users-permissions.user'
const LS = 'api::learning-space.learning-space'

if (cleanup) {
  const [user] = await find(U, { email: STUDENT })
  if (user) {
    for (const e of await find('api::enrollment.enrollment', { 'users_permissions_user][id': user.id })) {
      await call('DELETE', `${cm('api::enrollment.enrollment')}/${e.id}`)
    }
    for (const t of ['api::progress.progress', 'api::bookmark.bookmark']) {
      for (const e of await find(t, { 'users_permissions_user][id': user.id })) await call('DELETE', `${cm(t)}/${e.id}`)
    }
    await call('DELETE', `${cm(U)}/${user.id}`)
    console.log('removed student', STUDENT)
  }
  for (const space of await find(LS, { uid: SPACE_UID }, locale)) {
    const rel = (uid, id, field) => call('GET', `/content-manager/relations/${uid}/${id}/${field}?pageSize=100`).then(r => r.results || [])
    for (const m of await rel(LS, space.id, 'content_modules')) {
      for (const u of await rel('api::module.module', m.id, 'units')) {
        for (const l of await rel('api::unit.unit', u.id, 'lessons')) await call('DELETE', `${cm('api::lesson.lesson')}/${l.id}`)
        await call('DELETE', `${cm('api::unit.unit')}/${u.id}`)
      }
      await call('DELETE', `${cm('api::module.module')}/${m.id}`)
    }
    await call('DELETE', `${cm(LS)}/${space.id}`)
    console.log('removed test course', SPACE_UID)
  }
  process.exit(0)
}

// --- student
const roles = (await call('GET', '/users-permissions/roles')).roles
const authenticated = roles.find(r => r.type === 'authenticated')
let [student] = await find(U, { email: STUDENT })
if (!student) {
  student = await call('POST', cm(U), {
    username: STUDENT,
    email: STUDENT,
    password: env(site, 'STUDENT_PASSWORD'),
    confirmed: true,
    blocked: false,
    role: { connect: [{ id: authenticated.id }] },
    name: 'Alex',
    lastname: 'Example',
    locale
  })
  // a second save makes updatedAt != createdAt, so the dashboard doesn't ask for the profile
  await new Promise(r => setTimeout(r, 1100))
  await call('PUT', `${cm(U)}/${student.id}`, { organization: 'Example City Council', occupation: 'Urban planner' })
  console.log('created student', STUDENT)
} else {
  console.log('student exists', STUDENT)
}

// --- test course
const blocks = (text) => [{ type: 'paragraph', children: [{ type: 'text', text }] }]
let [space] = await find(LS, { uid: SPACE_UID }, locale)
if (!space) {
  const publish = async (uid, id) => call('POST', `${cm(uid)}/${id}/actions/publish`)
  const lesson = await call('POST', `${cm('api::lesson.lesson')}?plugins[i18n][locale]=${locale}`, {
    title: 'Test lesson',
    locale,
    content: [{ __component: 'content.text', title: 'A text block', text: blocks('This lesson belongs to the test course used for the administrator manual.') }]
  })
  await publish('api::lesson.lesson', lesson.id)
  const unit = await call('POST', `${cm('api::unit.unit')}?plugins[i18n][locale]=${locale}`, {
    title: 'Test unit',
    shortTitle: 'Unit 1',
    locale,
    content: [{ __component: 'content.text', title: 'Unit introduction', text: blocks('Units can have their own content and a list of lessons.') }],
    lessons: { connect: [{ id: lesson.id }] }
  })
  await publish('api::unit.unit', unit.id)
  const mod = await call('POST', `${cm('api::module.module')}?plugins[i18n][locale]=${locale}`, {
    title: 'Test module',
    shortTitle: 'Module 1',
    menuTitle: 'Test module',
    moduleType: 'Content',
    locale,
    units: { connect: [{ id: unit.id }] }
  })
  await publish('api::module.module', mod.id)
  space = await call('POST', `${cm(LS)}?plugins[i18n][locale]=${locale}`, {
    name: 'Manual test course',
    nameMore: 'Used for the administrator manual screenshots',
    uid: SPACE_UID,
    public: false,
    free: true,
    locale,
    publicDescription: 'A course used to show how changes in the admin panel appear on the site.',
    content_modules: { connect: [{ id: mod.id }] }
  })
  await publish(LS, space.id)
  console.log('created test course', SPACE_UID)
} else {
  console.log('test course exists', SPACE_UID)
}

// --- enrollments
async function enroll (spaceUid) {
  const [s] = await find(LS, { uid: spaceUid }, locale)
  if (!s) throw new Error(`no course ${spaceUid} in ${locale}`)
  const existing = await find('api::enrollment.enrollment', { 'users_permissions_user][id': student.id, 'learning_space][id': s.id })
  if (existing.length) return console.log('already enrolled in', spaceUid)
  await call('POST', cm('api::enrollment.enrollment'), {
    users_permissions_user: { connect: [{ id: student.id }] },
    learning_space: { connect: [{ id: s.id }] }
  })
  console.log('enrolled in', spaceUid)
}
await enroll(SPACE_UID)
if (extraEnroll) await enroll(extraEnroll)
