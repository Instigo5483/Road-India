import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
const require=createRequire('C:/Users/basta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const sharp=require('sharp')
const inventory=JSON.parse(await fs.readFile('scripts/batch-inventory.local.json','utf8'))
await fs.mkdir('tmp/photo-review',{recursive:true})
if(process.argv.includes('--stamps')){
 const ids=[3,5,12,30,39,50,53,65,69,71,96,107,108,112,113,119,121,122,124,127,131,139,142,144,152,173,174,179,187]
 for(let s=0;s<ids.length;s+=12){
  const composite=[]
  for(let j=s;j<Math.min(s+12,ids.length);j++){
   const n=ids[j],raw=await fs.readFile('C:/Users/basta/OneDrive/Pictures/Road India/New folder (3)/'+inventory.photos[n-1].file),m=await sharp(raw).metadata()
   const top=Math.floor(m.height*0.805)
   composite.push({input:await sharp(raw).extract({left:Math.floor(m.width*.26),top,width:m.width-Math.floor(m.width*.26),height:m.height-top}).resize({width:680,height:220,fit:'contain',background:'white'}).toBuffer(),left:((j-s)%2)*720,top:Math.floor((j-s)/2)*250})
   composite.push({input:Buffer.from(`<svg width="40" height="30"><rect width="40" height="30" fill="white"/><text y="22" font-size="20">${n}</text></svg>`),left:((j-s)%2)*720,top:Math.floor((j-s)/2)*250+220})
  }
  await sharp({create:{width:1440,height:1500,channels:3,background:'white'}}).composite(composite).png().toFile(`tmp/photo-review/stamps-${s}.png`)
 }
 process.exit(0)
}
for(let start=0;start<inventory.photos.length;start+=16){
 const composite=[]
 for(let i=start;i<Math.min(start+16,inventory.photos.length);i++){
  const left=((i-start)%4)*300,top=Math.floor((i-start)/4)*420
  composite.push({input:await sharp('C:/Users/basta/OneDrive/Pictures/Road India/New folder (3)/'+inventory.photos[i].file).resize({width:300,height:390,fit:'inside'}).extend({top:0,bottom:0,left:0,right:0}).toBuffer(),left,top})
  composite.push({input:Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="8" y="22" font-size="21">${i+1}</text></svg>`),left,top:top+390})
 }
 await sharp({create:{width:1200,height:1680,channels:3,background:'white'}}).composite(composite).jpeg({quality:85}).toFile(`tmp/photo-review/sheet-${start+1}.jpg`)
}
