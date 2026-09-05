import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import en from '../src/i18n/en.js'
import hi from '../src/i18n/hi.js'

const root = path.resolve('src')
const files = fs.readdirSync(root, {recursive:true})
  .filter(name => /\.(jsx?|css)$/.test(name)).map(name => path.join(root,name))
const text = file => fs.readFileSync(file,'utf8')

test('every local import resolves and every source module is reachable', () => {
  const seen = new Set()
  const visit = file => {
    if (seen.has(file)) return
    seen.add(file)
    for (const match of text(file).matchAll(/(?:from\s*|import\s*\(?\s*)['"]([.][^'"]+)['"]/g)) {
      const base = path.resolve(path.dirname(file),match[1])
      const target = [base,base+'.js',base+'.jsx',path.join(base,'index.js')].find(p => fs.existsSync(p) && fs.statSync(p).isFile())
      assert.ok(target,'Missing import '+match[1]+' in '+file)
      if (/\.(jsx?|css)$/.test(target)) visit(target)
    }
  }
  visit(path.join(root,'main.jsx'))
  assert.deepEqual(files.filter(file => !seen.has(file)),[])
})
test('literal UI translations exist in both languages', () => {
  for (const file of files) {
    if (file.includes(path.sep+'i18n'+path.sep)) continue
    for (const match of text(file).matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*[,)]/g)) {
      assert.ok(match[1] in en,'Missing English '+match[1])
      assert.ok(match[1] in hi,'Missing Hindi '+match[1])
    }
  }
  assert.deepEqual(Object.keys(en).sort(),Object.keys(hi).sort())
})
test('retired response-team routes and dispatch API stay removed', () => {
  const app = text(path.join(root,'App.jsx'))
  assert.doesNotMatch(app,/path="\/(team|admin\/teams)/)
  assert.equal(fs.existsSync('api/dispatch.js'),false)
  assert.equal(fs.existsSync('public/firebase-messaging-sw.js'),false)
})
