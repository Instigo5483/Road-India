import test from 'node:test'
import assert from 'node:assert/strict'

test('local login preserves identity and report changes persist without Firebase', async () => {
  const previous = globalThis.window
  const storage = new Map()
  globalThis.window = {localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key,value) => storage.set(key,value),
  }}
  try {
    const {mockBackend} = await import('../src/lib/mockBackend.js')
    const first = await mockBackend.findOrCreateUser({digilockerId:'000000000000',name:'Test Citizen',preferredLanguage:'en'})
    await mockBackend.signOut()
    assert.equal(mockBackend.getSession(),null)
    const again = await mockBackend.findOrCreateUser({digilockerId:'000000000000',name:'Different Name',preferredLanguage:'hi'})
    assert.equal(again.uid,first.uid)
    assert.equal(again.name,'Test Citizen')
    assert.equal(again.preferredLanguage,'hi')
    const report = await mockBackend.createReport({category:'issue',description:'Test report',createdBy:again.uid,location:{lat:0,lng:0},photoUrls:[]})
    await mockBackend.toggleUpvote(report.id,again.uid)
    assert.equal((await mockBackend.listReports()).find(r=>r.id===report.id).upvotes,1)
    await mockBackend.updateReportStatus(report.id,{status:'resolved',resolvedAt:new Date().toISOString()})
    assert.equal(JSON.parse(storage.get('road_india_reports')).find(r=>r.id===report.id).status,'resolved')
    globalThis.window.localStorage.setItem = () => {throw new Error('Storage denied')}
    await mockBackend.signOut()
    assert.equal(mockBackend.getSession(),null)
  } finally { if (previous) globalThis.window=previous; else delete globalThis.window }
})
