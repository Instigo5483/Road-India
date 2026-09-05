import test from 'node:test'
import assert from 'node:assert/strict'
import { hasValidLocation, upvotePatch, assertEditable, validateContent, validateFeedback } from '../src/lib/reportValidation.js'
import { toDate, formatDuration, formatTimestamp, resolutionDuration, averageResolution, timestampIso } from '../src/lib/time.js'
import { distanceKm } from '../src/lib/geo.js'
import { prepareResolution } from '../src/lib/resolution.js'
import { publicName, readLocal } from '../src/lib/preferences.js'
import { normalizeCategoryId, reportTypeIds } from '../src/data/categoryTypes.js'
import { seedReports } from '../src/data/seedReports.js'
import { fetchJson } from '../src/lib/request.js'
import { triageReport } from '../src/lib/triage.js'
import { runTriage } from '../api/_triage-core.js'

const photo = 'data:image/jpeg;base64,YQ=='
const report = { id: 'test', createdBy: 'author', status: 'submitted', description: 'Pothole', photoUrls: [], location: { lat: 0, lng: 0 } }
const proof = { photoUrls: [photo], officer: ' Test officer ', notes: ' Fixed ', certified: true }

test('world coordinates accept equator, prime meridian and negative locations', () => {
  for (const location of [{ lat: 0, lng: 0 }, { lat: -33.9, lng: 151.2 }, { lat: 90, lng: -180 }]) assert.ok(hasValidLocation(location))
})
test('invalid coordinates never reach Leaflet', () => {
  for (const location of [null, {}, { lat: '1', lng: 2 }, { lat: NaN, lng: 0 }, { lat: 91, lng: 0 }, { lat: 1, lng: 181 }]) assert.equal(hasValidLocation(location), false)
  assert.equal(distanceKm({}, { lat: 0, lng: 0 }), Infinity)
})
test('distance remains finite for antipodal points', () => {
  assert.equal(distanceKm({lat: 0, lng: 0}, {lat: 0, lng: 0}), 0)
  assert.ok(Math.abs(distanceKm({lat: 0, lng: 0}, {lat: 0, lng: 180}) - 20015) < 1)
})
test('support toggle preserves legacy baseline and other voters', () => {
  const original = { upvotes: 20, upvotedBy: ['someone'] }
  const added = upvotePatch(original, 'author')
  assert.deepEqual(added, {upvotes:21, upvotedBy:['someone', 'author']})
  assert.deepEqual(upvotePatch(added, 'author'), original)
})
test('support handles missing voters and avoids negative counts', () => {
  assert.deepEqual(upvotePatch({}, 'author'), {upvotes:1, upvotedBy:['author']})
  assert.equal(upvotePatch({upvotes:0, upvotedBy:['author']}, 'author').upvotes, 0)
})
test('only author edits a waiting report', () => {
  assert.doesNotThrow(() => assertEditable(report, 'author'))
  for (const r of [null, {...report,status:'in_progress'}, {...report,status:'resolved'}]) assert.throws(() => assertEditable(r,'author'))
  assert.throws(() => assertEditable(report,'someone'))
})
test('content validation accepts zero coordinates and rejects invalid payloads', () => {
  assert.doesNotThrow(() => validateContent(report))
  for (const patch of [{description:''},{description:'a'.repeat(5001)},{photoUrls:[photo,photo,photo,photo]},{photoUrls:['data:text/html;base64,YQ==']},{location:{lat:NaN,lng:0}}]) assert.throws(() => validateContent({...report,...patch}))
})
test('feedback requires ownership, resolution, rating and confirmation', () => {
  const resolved = {...report,status:'resolved'}
  const feedback = {rating:5,confirmedResolved:true,review:'Good'}
  assert.doesNotThrow(() => validateFeedback(resolved,'author',feedback))
  for (const rating of [0,6,1.5,'5']) assert.throws(() => validateFeedback(resolved,'author',{...feedback,rating}))
  assert.throws(() => validateFeedback(report,'author',feedback))
  assert.throws(() => validateFeedback(resolved,'someone',feedback))
  assert.throws(() => validateFeedback({...resolved,citizenFeedback:feedback},'author',feedback))
})
test('resolution proof atomically prepares status and timestamp', () => {
  const now = new Date('2026-09-05T00:00:00Z')
  const patch = prepareResolution(report,proof,now)
  assert.equal(patch.status,'resolved')
  assert.equal(patch.resolvedAt,now.toISOString())
  assert.equal(patch.resolutionProof.officer,'Test officer')
  assert.equal(patch.resolutionProof.notes,'Fixed')
})
test('resolution rejects missing, duplicate and oversized evidence', () => {
  for (const p of [{...proof,photoUrls:[]},{...proof,officer:''},{...proof,certified:false},{...proof,photoUrls:['not an image']},{...proof,photoUrls:[photo,photo]}]) assert.throws(() => prepareResolution(report,p))
  assert.throws(() => prepareResolution({...report,status:'resolved'},proof))
  assert.throws(() => prepareResolution({...report,description:'x'.repeat(980000)},proof))
})
test('missing and malformed timestamps are not 1970 or NaN labels', () => {
  for (const value of [null,undefined,'','bad']) {
    assert.ok(Number.isNaN(toDate(value).getTime()))
    assert.equal(formatTimestamp(value),'—')
    assert.equal(timestampIso(value),'')
  }
  assert.equal(formatDuration(NaN),'—')
  assert.equal(formatDuration(-1),'—')
})
test('Firestore timestamps and resolution metrics handle pending/invalid data', () => {
  assert.equal(toDate({toDate:()=>new Date(1000)}).getTime(),1000)
  const r = {createdAt:'2026-09-01',resolvedAt:'2026-09-02'}
  assert.equal(resolutionDuration(r),86400000)
  assert.equal(resolutionDuration({...r,createdAt:null}),null)
  assert.equal(resolutionDuration({...r,resolvedAt:'2026-08-01'}),null)
  assert.equal(averageResolution([r,{}, {...r,resolvedAt:'bad'}]),86400000)
  assert.equal(averageResolution([]),null)
})
test('legacy road categories/types still work; emergency data is not seeded', () => {
  assert.equal(normalizeCategoryId('problem'),'issue')
  assert.equal(normalizeCategoryId('corruption'),'issue')
  assert.deepEqual(reportTypeIds({type:'pothole'}),['pothole'])
  assert.ok(seedReports.every(r => r.category === 'issue' && hasValidLocation(r.location)))
})
test('privacy labels and corrupt stored preferences fail safely', t => {
  assert.equal(publicName('Anika Joshi'),'Anika J.')
  assert.equal(publicName('Anika Joshi','anonymous'),'Anonymous citizen')
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unused') })
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {getItem:()=>'"wrong type"'} })
  try { assert.deepEqual(readLocal('draft',{}),{}); assert.deepEqual(readLocal('history',[]),[]) }
  finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage }
})
test('HTTP errors and aborted requests reject cleanly', async t => {
  t.mock.method(globalThis,'fetch',async () => ({ok:false,status:503}))
  await assert.rejects(fetchJson('/test'),/503/)
  globalThis.fetch = (_url,{signal}) => new Promise((_resolve,reject) => signal.addEventListener('abort',()=>reject(new Error('aborted'))))
  await assert.rejects(fetchJson('/test',{},5),/aborted/)
})
test('triage client sends only one image and falls back on network failure', async t => {
  let body
  t.mock.method(globalThis,'fetch',async (_url,options) => { body=JSON.parse(options.body); return {ok:true,json:async()=>({severity:'low'})} })
  await triageReport({category:'issue',description:'Pothole',types:[],photoUrls:[photo,photo,photo]})
  assert.equal(body.photoUrls.length,1)
  globalThis.fetch = async () => { throw new Error('offline') }
  assert.equal(await triageReport(report),null)
})
test('fallback triage recognizes merged issue category and malformed input', async () => {
  assert.equal((await runTriage({category:'issue',description:'Road damage'},null)).department,'Municipal Roads & Infrastructure')
  assert.equal((await runTriage(null,null)).aiGenerated,false)
})
test('model output is whitelisted and malformed output falls back without crashing', async t => {
  t.mock.method(globalThis,'fetch',async () => ({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({severity:'high',department:'Roads',summary:'Repair needed',unexpected:'ignored'})}}]})}))
  const result = await runTriage({...report,types:[],photoUrls:[photo]},'test-key')
  assert.equal(result.aiGenerated,true)
  assert.equal(result.photoAnalyzed,true)
  assert.equal(result.unexpected,undefined)
  globalThis.fetch = async () => ({ok:true,json:async()=>({choices:[{message:{content:'{"severity":"invalid","department":{},"summary":[]}'}}]})})
  assert.equal((await runTriage(report,'test-key')).aiGenerated,false)
})
