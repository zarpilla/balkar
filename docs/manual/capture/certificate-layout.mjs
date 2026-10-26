// Draws images/10-certificates/certificate-layout.png: the URR certificate background with the
// texts placed the way the backend's PDF code places them (A4 landscape 842 x 595 pt, x/y from
// the top-left, font size in px x 0.75, align within x .. right margin), and the field values.
//   node certificate-layout.mjs [urr|balkar] [certificate id]
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { loadEnv, SITES, imagesDir } from './helpers.mjs'
import { adminApi } from './admin-api.mjs'

loadEnv()
const site = process.argv[2] || 'urr'
const id = Number(process.argv[3] || 1)
const a = await adminApi(site)
const c = await a.one('api::certificate.certificate', id, 'populate=background')
const bg = c.background ? SITES[site].api + c.background.url : null

const W = 842; const H = 595; const MARGIN = 50
const items = [
  { key: 'to', text: 'Alex Example', on: true },
  { key: 'course', text: 'Course name', on: !!c.course },
  { key: 'date', text: '26/10/2026', on: true },
  { key: 'hours', text: c.hours || '', on: !!(c.hours && c.hours_x && c.hours_y) }
].filter(i => i.on)
const defaults = { to: 30, course: 20, date: 15, hours: 15 }
const font = f => f === 'font2' ? "'Lora', serif; font-style: italic" : "'Inter', sans-serif"

const boxes = items.map(({ key, text }) => {
  const x = c[`${key}_x`] || 0
  const y = c[`${key}_y`] || 0
  const size = (c[`${key}_fontsize`] || defaults[key]) * 0.75
  const align = c[`${key}_align`] || 'left'
  const width = W - MARGIN - x
  return `
  <div class="box" style="left:${x}px; top:${y}px; width:${width}px"></div>
  <div class="text" style="left:${x}px; top:${y}px; width:${width}px; text-align:${align}; font-size:${size}px; font-family:${font(c[`${key}_font`])}; color:${c.color || '#000'}">${text}</div>
  <div class="dot" style="left:${x - 4}px; top:${y - 4}px"></div>
  <div class="label" style="left:${Math.min(x, W - 230)}px; top:${y + size * 1.35 + 4}px">${key}: x=${x}, y=${y}, size=${c[`${key}_fontsize`] || defaults[key]}, ${align}, ${c[`${key}_font`] || 'font1'}</div>`
}).join('')

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Lora:ital@1&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 24px 24px 48px; background: #fff; font-family: 'Inter', sans-serif; }
  .page { position: relative; width: ${W}px; height: ${H}px; ${bg ? `background: url('${bg}') center/100% 100% no-repeat;` : 'background:#f4f4f4;'} box-shadow: 0 2px 10px rgba(0,0,0,.25); }
  .margin { position: absolute; top: 0; bottom: 0; left: ${W - MARGIN}px; border-left: 1px dashed #e5007d; }
  .box { position: absolute; height: 2px; background: rgba(229,0,125,.35); }
  .text { position: absolute; line-height: 1.2; white-space: nowrap; }
  .dot { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #e5007d; }
  .label { position: absolute; font-size: 10px; color: #fff; background: #e5007d; padding: 1px 5px; border-radius: 3px; white-space: nowrap; }
  .axis { position: absolute; font-size: 11px; color: #e5007d; white-space: nowrap; }
</style></head><body>
<div class="page">
  <div class="margin"></div>
  <div class="axis" style="left:4px; top:4px">(0, 0)</div>
  <div class="axis" style="right:${MARGIN + 4}px; top:4px">right margin (x = ${W - MARGIN}) →</div>
  <div class="axis" style="right:4px; bottom:4px">(${W}, ${H})</div>
  ${boxes}
</div></body></html>`

const tmp = path.join(path.dirname(new URL(import.meta.url).pathname), 'results', 'certificate-layout.html')
fs.mkdirSync(path.dirname(tmp), { recursive: true })
fs.writeFileSync(tmp, html)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W + 48, height: H + 72 }, deviceScaleFactor: 1.5 })
await page.goto('file://' + tmp, { waitUntil: 'networkidle' })
const out = path.join(imagesDir, '10-certificates', 'certificate-layout.png')
fs.mkdirSync(path.dirname(out), { recursive: true })
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('saved', path.relative(imagesDir, out))
