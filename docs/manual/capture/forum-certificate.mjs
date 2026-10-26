// Screenshots that need content the live sites don't have yet, made on the TEST course only
// (see test-data.mjs) and removed again at the end:
//  - a forum with one channel and a message by a teacher (manager) -> 09-forum
//  - the test student completing the course and downloading the certificate -> 10-certificates
//   node forum-certificate.mjs [forum|certificate]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { loadEnv, SITES, env, readOnly, frontLogin, settle, shot, imagesDir } from './helpers.mjs'
import { adminApi } from './admin-api.mjs'

loadEnv()
const site = 'urr'
const only = process.argv[2]
const API = SITES[site].api
const UID = env(site, 'TEST_SPACE_UID')
const LS = 'api::learning-space.learning-space'
const URR_CERTIFICATE_ID = 1
const a = await adminApi(site)

// the test course and student
const [space] = await a.list(LS, `plugins[i18n][locale]=en&filters[$and][0][uid][$eq]=${UID}`)
const [modRef] = await a.relations(LS, space.id, 'content_modules')
const mod = await a.one('api::module.module', modRef.id)
const [unitRef] = await a.relations('api::module.module', mod.id, 'units')
const unit = await a.one('api::unit.unit', unitRef.id)
const [lessonRef] = await a.relations('api::unit.unit', unit.id, 'lessons')
const lesson = await a.one('api::lesson.lesson', lessonRef.id)
const [student] = await a.list('plugin::users-permissions.user', `filters[$and][0][email][$eq]=${env(site, 'STUDENT_EMAIL')}`)
const jwt = (await fetch(`${API}/api/auth/local`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ identifier: env(site, 'STUDENT_EMAIL'), password: env(site, 'STUDENT_PASSWORD') })
}).then(r => r.json())).jwt
const asStudent = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt}` }, body: body ? JSON.stringify(body) : undefined })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-GB' })
await readOnly(context)
const page = await context.newPage()
await frontLogin(page, site)
const front = async (p, wait) => {
  await page.goto(SITES[site].front + p)
  await settle(page, 2500)
  if (wait) await page.getByText(wait).filter({ visible: true }).first().waitFor({ timeout: 30_000 })
}

const undo = []
try {
  if (!only || only === 'forum') {
    const forum = await a.create('api::forum.forum', {
      name: 'Test course forum',
      description: 'Questions and ideas about the test course.',
      locale: 'en',
      learning_space: { connect: [{ id: space.id }] }
    }, 'plugins[i18n][locale]=en')
    undo.push(() => a.remove('api::forum.forum', forum.id))
    const channel = await a.create('api::channel.channel', {
      name: 'General', order: 1, locale: 'en', forum: { connect: [{ id: forum.id }] }
    }, 'plugins[i18n][locale]=en')
    undo.push(() => a.remove('api::channel.channel', channel.id))
    const ch = await a.one('api::channel.channel', channel.id)
    await a.update('plugin::users-permissions.user', student.id, { manager: true })
    undo.push(() => a.update('plugin::users-permissions.user', student.id, { manager: false }))
    const msg = await asStudent('POST', '/api/messages', { data: { channel: channel.id, text: 'Welcome to the course! Use this channel for your questions and to share ideas with other participants.' } })
    undo.push(() => a.remove('api::message.message', msg.data.id))

    await front(`/space/${UID}/forum/channel/${ch.uid}`, 'Welcome to the course')
    await shot(page, '09-forum', site, 'forum-message')
    // the smallest block that holds both the author line (with the badge) and the text
    const message = page.locator('div.d-flex', { has: page.locator('.teacher') }).filter({ hasText: 'Welcome to the course' }).last()
    await shot(page, '09-forum', site, 'teacher-badge', { element: message })
  }

  if (!only || only === 'certificate') {
    await a.update(LS, space.id, { certificate: { connect: [{ id: URR_CERTIFICATE_ID }] } })
    undo.push(() => a.update(LS, space.id, { certificate: { disconnect: [{ id: URR_CERTIFICATE_ID }] } }))
    await asStudent('POST', '/api/progresses/complete', { data: { uid: UID, module: mod.uid, unit: unit.uid, lesson: lesson.uid } })
    undo.push(() => asStudent('POST', '/api/progresses/notcomplete', { data: { uid: UID, module: mod.uid, unit: unit.uid, lesson: lesson.uid } }))

    await front(`/space/${UID}/certificate`)
    await shot(page, '10-certificates', site, 'certificate-ready')

    const issued = await asStudent('POST', `/api/certificates/issue/${UID}`)
    const [uc] = await a.list('api::user-certificate.user-certificate', `filters[$and][0][user][id][$eq]=${student.id}`)
    if (uc) undo.push(() => a.remove('api::user-certificate.user-certificate', uc.id))
    const pdf = await fetch(API + issued.pdfUrl)
    if (!pdf.ok) throw new Error(`PDF ${issued.pdfUrl}: ${pdf.status}`)
    const tmp = path.join(os.tmpdir(), `manual-cert-${process.pid}.pdf`)
    fs.writeFileSync(tmp, Buffer.from(await pdf.arrayBuffer()))
    const out = path.join(imagesDir, '10-certificates', `${site}-certificate-pdf`)
    execFileSync('pdftoppm', ['-png', '-singlefile', '-scale-to-x', '1200', '-scale-to-y', '-1', tmp, out])
    fs.rmSync(tmp)
    console.log('  saved 10-certificates/urr-certificate-pdf.png  (server file:', issued.pdfUrl + ')')
  }
} finally {
  for (const fn of undo.reverse()) {
    try { await fn() } catch (e) { console.log('  UNDO FAILED', e.message) }
  }
  await browser.close()
}
