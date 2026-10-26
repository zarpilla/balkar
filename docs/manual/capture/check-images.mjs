// Lists the images the chapters reference that don't exist yet, and images nobody references.
//   node check-images.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const manual = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const refs = new Map()
for (const f of fs.readdirSync(manual).filter(f => /^\d\d-.*\.md$/.test(f))) {
  const text = fs.readFileSync(path.join(manual, f), 'utf8')
  for (const m of text.matchAll(/(?:\]\(|src=")(images\/[^)"]+\.png)/g)) {
    if (!refs.has(m[1])) refs.set(m[1], f)
  }
}
const missing = [...refs].filter(([img]) => !fs.existsSync(path.join(manual, img)))
const existing = fs.readdirSync(path.join(manual, 'images'), { recursive: true })
  .filter(f => f.endsWith('.png')).map(f => 'images/' + f)
const unused = existing.filter(f => !refs.has(f))
console.log(`${refs.size} referenced, ${refs.size - missing.length} present, ${missing.length} missing`)
for (const [img, f] of missing) console.log(`  missing  ${img}  (${f})`)
for (const img of unused) console.log(`  unused   ${img}`)
process.exitCode = missing.length ? 1 : 0
