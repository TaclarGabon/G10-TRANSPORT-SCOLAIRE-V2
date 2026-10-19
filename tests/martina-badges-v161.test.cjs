'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function load() {
  const source=fs.readFileSync(path.join(__dirname,'../g10-badges-pdf-v161.js'),'utf8');
  const window={URL,location:{href:'https://example.test/G10/index.html'},document:null};
  const document={readyState:'loading',addEventListener(){}};
  const sandbox={window,document,location:window.location,URL,Promise,Set,Date,Error};
  vm.runInNewContext(source,sandbox);
  return window.G10BadgePdfV161;
}
test('export uniquement des QR existants, sans attribuer de QR',()=>{
  const api=load();
  const data={subs:[
    {id:'1',name:'Exemple 1',qrRef:'G10-TP-SCOL-QR001'},
    {id:'2',name:'Exemple 2'},
    {id:'3',name:'Exemple 3',qrRef:'non valide'}
  ]};
  const before=JSON.stringify(data);
  const result=api.existingBadges(data);
  assert.equal(result.ready.length,1);
  assert.equal(result.skipped,2);
  assert.equal(result.total,3);
  assert.equal(JSON.stringify(data),before);
});
test('doublons QR interdits avant impression',()=>{
  const api=load();
  assert.throws(()=>api.existingBadges({subs:[
    {qrRef:'G10-TP-SCOL-QR001'},{qrRef:'g10-tp-scol-qr001'}
  ]}),/partagent/);
});
test('payload QR identique à la fiche QR V2',()=>{
  const api=load();
  const u=new URL(api.badgeUrl('G10-TP-SCOL-QR025'));
  assert.equal(u.pathname,'/G10/qr-test.html');
  assert.equal(u.searchParams.get('code'),'G10-TP-SCOL-QR025');
  assert.equal(u.searchParams.get('v'),'4');
});
test('pas de faux badges lorsque la source manque',()=>{
  const api=load();
  assert.throws(()=>api.existingBadges(null),/indisponible/);
  assert.throws(()=>api.existingBadges({subs:{}}),/indisponible/);
});
