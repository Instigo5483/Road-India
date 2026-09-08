// Backfill only aiTriage on the 17 explicitly imported reports. No rule changes.
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const project = 'road-india-5dd8c'
if (!process.argv.includes(`--confirm-project=${project}`)) throw new Error('Explicit target required')
const receipts = (await Promise.all(['photo-import-receipt.local.json', 'photo-import-additional-receipt.local.json'].map(async file => JSON.parse(await fs.readFile(new URL(file, import.meta.url), 'utf8'))))).flat()
if (receipts.length !== 17 || new Set(receipts.map(r => r.reportId)).size !== 17 || receipts.some(r => !/^photo-import-20260906-\d{2}$/.test(r.reportId))) throw new Error('Unexpected target list')
const credentials = JSON.parse(await fs.readFile(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
const headers = { Authorization: `Bearer ${credentials.tokens.access_token}`, 'Content-Type': 'application/json' }
const root = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/reports/`
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Request failed: HTTP ${response.status}`)
  return response.json()
}
function encode(v) {
  if (typeof v === 'boolean') return { booleanValue: v }
  return { stringValue: v }
}
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]))
  return v
}
const outcomes = []
for (const item of receipts) {
  const url = root + item.reportId
  const doc = await request(url, { headers })
  const f = doc.fields
  if (f.createdBy?.stringValue !== item.uid || f.importBatch?.stringValue !== 'user-photos-20260906') throw new Error('Target ownership/import mismatch')
  if (f.aiTriage?.mapValue?.fields?.aiGenerated?.booleanValue === true) {
    console.log(`${item.reportId}: already has AI triage; skipped`)
    outcomes.push({ reportId: item.reportId, source: 'existing-ai' })
    continue
  }
  const result = await request('https://road-india.vercel.app/api/triage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: f.category.stringValue, types: (f.types?.arrayValue?.values ?? []).map(v => v.stringValue), description: f.description.stringValue, photoUrls: (f.photoUrls?.arrayValue?.values ?? []).slice(0, 1).map(v => v.stringValue) }),
  })
  if (!['low', 'medium', 'high', 'critical'].includes(result.severity) || typeof result.aiGenerated !== 'boolean' || typeof result.department !== 'string' || !result.department.trim() || typeof result.summary !== 'string' || !result.summary.trim()) throw new Error('Invalid triage result')
  const triage = { severity: result.severity, department: result.department.slice(0, 150), summary: result.summary.slice(0, 500), aiGenerated: result.aiGenerated, photoAnalyzed: result.aiGenerated && result.photoAnalyzed === true }
  const fields = Object.fromEntries(Object.entries(triage).map(([key, v]) => [key, encode(v)]))
  await request(`${url}?updateMask.fieldPaths=aiTriage&currentDocument.updateTime=${encodeURIComponent(doc.updateTime)}`, { method: 'PATCH', headers, body: JSON.stringify({ fields: { aiTriage: { mapValue: { fields } } } }) })
  const saved = await request(url, { headers })
  const { aiTriage: beforeTriage, ...before } = f
  const { aiTriage: afterTriage, ...after } = saved.fields
  void beforeTriage
  if (JSON.stringify(canonical(before)) !== JSON.stringify(canonical(after)) || JSON.stringify(canonical(afterTriage.mapValue.fields)) !== JSON.stringify(canonical(fields))) throw new Error('Readback mismatch; stopped')
  outcomes.push({ reportId: item.reportId, source: triage.aiGenerated ? 'openai' : 'rule-based-fallback', ...triage })
  await fs.writeFile(new URL('./photo-triage-receipt.local.json', import.meta.url), JSON.stringify(outcomes, null, 2))
  console.log(`${item.reportId}: ${triage.aiGenerated ? 'OpenAI' : 'FALLBACK'}; ${triage.severity}; photo analyzed: ${triage.photoAnalyzed}; verified`)
}
await fs.writeFile(new URL('./photo-triage-receipt.local.json', import.meta.url), JSON.stringify(outcomes, null, 2))
console.log(JSON.stringify({ total: outcomes.length, ai: outcomes.filter(r => ['openai', 'existing-ai'].includes(r.source)).length, fallback: outcomes.filter(r => r.source === 'rule-based-fallback').length }))
