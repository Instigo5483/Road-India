// One-off, create-only photo import. Never overwrites reports or existing users.
// Manifest and receipt are .local files so test login identifiers stay out of Git.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
import { CATEGORIES } from '../src/data/categoryTypes.js'
import { validateContent } from '../src/lib/reportValidation.js'

const project = 'road-india-5dd8c'
const base = 'https://road-india.vercel.app'
const westBengal = process.argv.includes('--west-bengal')
const input = 'C:/Users/basta/OneDrive/Pictures/Road India' + (westBengal ? '/New folder (3)' : '')
const additional = process.argv.includes('--additional')
const manifest = JSON.parse(await fs.readFile(new URL(westBengal ? './photo-reports-west-bengal.local.json' : additional ? './photo-reports-additional.local.json' : './photo-reports.local.json', import.meta.url), 'utf8'))
const offset = westBengal ? 17 : additional ? 13 : 0
const receiptFile = new URL(westBengal ? './photo-import-west-bengal-receipt.local.json' : additional ? './photo-import-additional-receipt.local.json' : './photo-import-receipt.local.json', import.meta.url)
const triageFile = new URL('./photo-triage-west-bengal-cache.local.json', import.meta.url)
let triageCache = {}
try { triageCache = JSON.parse(await fs.readFile(triageFile, 'utf8')) } catch (e) { if (e.code !== 'ENOENT') throw e }
let saveQueue = Promise.resolve()
function saveJson(file, data) { const contents = JSON.stringify(data, null, 2); saveQueue = saveQueue.then(() => fs.writeFile(file, contents)); return saveQueue }
const requireRuntime = createRequire('C:/Users/basta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const sharp = requireRuntime('sharp')
const apply = process.argv.includes('--apply')
if (apply && !process.argv.includes(`--confirm-project=${project}`)) throw new Error('Explicit target required')

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
  if (res.status === 404) return null
  const data = await res.json()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error?.status || 'request failed'}`)
  return data
}
function value(v) {
  if (v === null) return { nullValue: null }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } }
  if (typeof v === 'object') return { mapValue: { fields: fields(v) } }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  return { stringValue: v }
}
function fields(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, value(v)])) }
const prepared = []
for (const [index, entry] of manifest.entries()) {
  const n = String(offset + index + 1).padStart(2, '0')
  const photoUrls = [], evidence = []
  for (const [i, file] of entry.photos.entries()) {
    const raw = await fs.readFile(path.join(input, file))
    let buffer
    for (const width of [1600, 1400, 1200, 1000, 800]) {
      buffer = await sharp(raw).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer()
      if (buffer.toString('base64').length + 23 <= 240000) break
    }
    photoUrls.push('data:image/jpeg;base64,' + buffer.toString('base64'))
    evidence.push({ sourceFile: file, sourceSha256: createHash('sha256').update(raw).digest('hex'), capturedAt: new Date(entry.captured[i]), location: entry.photoLocations?.[i] || (i === 1 && entry.secondaryLocation ? entry.secondaryLocation : { lat: entry.lat, lng: entry.lng }), metadataSource: 'visible GPS Map Camera stamp; not independently verified' })
  }
  if (!entry.types.every(id => CATEGORIES[0].types.some(type => type.id === id))) throw new Error('Invalid issue type')
  const captured = entry.captured.map(v => v.replace('T', ' ').replace('+05:30', ' IST')).join('; ')
  const report = {
    category: 'issue', types: entry.types,
    description: `${entry.description}\n\nPhoto capture: ${captured}. Location and capture time transcribed from the visible photo stamps, not independently verified. Uploaded from user-supplied photos through a demo account; not an independent citizen submission.`,
    photoUrls, location: { lat: entry.lat, lng: entry.lng, address: entry.address, city: entry.city, state: entry.state, country: 'India' },
    status: 'submitted', upvotes: 0, upvotedBy: [], aiTriage: null,
    createdByName: `Demo Citizen ${n}`, showCitizenBadge: false, showCivicRank: false,
    isDemo: true, importBatch: 'user-photos-20260906', capturedAt: new Date(entry.captured[0]), evidence,
  }
  validateContent(report)
  if (Buffer.byteLength(JSON.stringify(report)) > 900000) throw new Error('Document budget exceeded')
  prepared.push({ report, reportId: `photo-import-20260906-${n}`, testId: `00092606${String(offset + index + 1).padStart(4, '0')}` })
  console.log(`Prepared ${n}: ${entry.city}; ${entry.types.join(', ')}; ${photoUrls.length} photo(s); ${Math.round(Buffer.byteLength(JSON.stringify(report))/1024)} KiB`)
}
if (!apply) { console.log('Dry run only; no accounts or records created.'); process.exit(0) }

const html = await (await fetch(base)).text()
const asset = html.match(/src="([^" ]*\/index-[^" ]+\.js)"/)?.[1]
if (!asset) throw new Error('Cannot locate current site configuration')
const js = await (await fetch(new URL(asset, base))).text()
const apiKey = js.match(/apiKey:["']([^"']+)["']/)?.[1]
const actualProject = js.match(/projectId:["']([^"']+)["']/)?.[1]
if (!apiKey || actualProject !== project) throw new Error('Live project configuration mismatch')
const root = `projects/${project}/databases/(default)/documents`
const rest = `https://firestore.googleapis.com/v1/${root}`
const receipt = []
async function importItem(item) {
  const tokenResult = await request(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ digilockerId: item.testId }) })
  if (!tokenResult?.token) throw new Error('Stable account endpoint unavailable; no anonymous fallback used')
  const login = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenResult.token, returnSecureToken: true }) })
  const uid = JSON.parse(Buffer.from(login.idToken.split('.')[1], 'base64url').toString()).sub
  const expectedUid = 'ri-' + createHash('sha256').update(item.testId).digest('hex').slice(0, 40)
  if (uid !== expectedUid) throw new Error('Unexpected account identity')
  const headers = { Authorization: `Bearer ${login.idToken}`, 'Content-Type': 'application/json' }
  const oldReport = await request(`${rest}/reports/${item.reportId}`, { headers })
  const oldProfile = await request(`${rest}/users/${uid}`, { headers })
  if (oldReport || oldProfile) {
    if (oldReport?.fields?.createdBy?.stringValue !== uid || oldReport?.fields?.importBatch?.stringValue !== 'user-photos-20260906' || oldProfile?.fields?.isDemo?.booleanValue !== true) throw new Error('Existing data collision; refusing overwrite')
    console.log(`Already imported ${item.reportId}; skipped`)
  } else {
    if (westBengal) {
      const key = createHash('sha256').update(JSON.stringify({description:item.report.description,types:item.report.types,evidence:item.report.evidence})).digest('hex')
      let triage = triageCache[key]
      for (let attempt = 0; attempt < 5 && !triage?.aiGenerated; attempt++) {
        await delay(attempt ? 20000 : 6000)
        try {
          const result = await request(`${base}/api/triage`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:item.report.category,types:item.report.types,description:item.report.description,photoUrls:[item.report.photoUrls[0]]})})
          if (!result || !['low','medium','high','critical'].includes(result.severity) || typeof result.department !== 'string' || !result.department.trim() || typeof result.summary !== 'string' || !result.summary.trim()) throw new Error('Invalid triage response')
          if (result.aiGenerated === true && result.photoAnalyzed === true) triage = {severity:result.severity,department:result.department.slice(0,150),summary:result.summary.slice(0,500),aiGenerated:true,photoAnalyzed:true}
        } catch { console.log(`Triage retry for ${item.reportId}`) }
      }
      if (!triage?.aiGenerated || !triage.photoAnalyzed) throw new Error(`OpenAI photo triage unavailable for ${item.reportId}; report not created`)
      triageCache[key] = triage
      await saveJson(triageFile, triageCache)
      item.report.aiTriage = triage
    }
    const profile = { digilockerId: item.testId, name: item.report.createdByName, preferredLanguage: 'en', isDemo: true, preferences: { visibility: 'legal_name', showBadge: false, showRank: false, offlineDrafts: false, compressPhotos: true, geoHistory: false, rating: 0 } }
    item.report.createdBy = uid
    const writes = [[`users/${uid}`, profile], [`reports/${item.reportId}`, item.report]].map(([doc, data]) => ({ update: { name: `${root}/${doc}`, fields: fields(data) }, currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }] }))
    await request(`${rest}:commit`, { method: 'POST', headers, body: JSON.stringify({ writes }) })
    console.log(`Created ${item.reportId} under ${profile.name}`)
  }
  const saved = await request(`${rest}/reports/${item.reportId}`, { headers })
  if (saved?.fields?.photoUrls?.arrayValue?.values?.length !== item.report.photoUrls.length || saved.fields.status.stringValue !== 'submitted') throw new Error('Readback verification failed')
  if (westBengal && (saved.fields.aiTriage?.mapValue?.fields?.aiGenerated?.booleanValue !== true || saved.fields.aiTriage?.mapValue?.fields?.photoAnalyzed?.booleanValue !== true)) throw new Error('Saved OpenAI triage verification failed')
  if (saved.fields.location.mapValue.fields.lat.doubleValue !== item.report.location.lat || saved.fields.location.mapValue.fields.lng.doubleValue !== item.report.location.lng || new Date(saved.fields.capturedAt.timestampValue).valueOf() !== item.report.capturedAt.valueOf()) throw new Error('Location/capture readback mismatch')
  if (JSON.stringify(saved.fields.photoUrls.arrayValue.values.map(v=>v.stringValue)) !== JSON.stringify(item.report.photoUrls) || saved.fields.createdBy.stringValue !== uid || saved.fields.isDemo.booleanValue !== true) throw new Error('Photo/owner readback mismatch')
  receipt.push({ reportId: item.reportId, name: item.report.createdByName, testLoginId: item.testId, uid, city: item.report.location.city, types: item.report.types, photos: item.report.photoUrls.length, capturedAt: item.report.capturedAt, createdAt: saved.fields.createdAt.timestampValue, aiGenerated: saved.fields.aiTriage?.mapValue?.fields?.aiGenerated?.booleanValue === true, severity: saved.fields.aiTriage?.mapValue?.fields?.severity?.stringValue })
  await saveJson(receiptFile, receipt)
}
const errors=[]
let cursor=0
await Promise.all(Array.from({length:1},async()=>{
 while(cursor<prepared.length){const item=prepared[cursor++];try{await importItem(item)}catch(e){errors.push({reportId:item.reportId,error:e.message});console.log(`FAILED ${item.reportId}: ${e.message}`)}}
}))
await saveQueue
console.log(`Verified ${receipt.length} reports, ${receipt.reduce((n, r) => n + r.photos, 0)} photos, and ${new Set(receipt.map(r => r.uid)).size} accounts. No existing reports overwritten.`)
if(errors.length){console.log(JSON.stringify(errors));process.exitCode=1}
