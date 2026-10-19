'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {selectBadges,badgeUrl}=require('../g10-badges-pdf-v1471.js');
test('sélectionne uniquement les badges existants, sans mutation',()=>{
 const state={subs:[{id:'a',name:'Élève fictif',school:'École test',qrRef:'G10-TP-SCOL-QR001'}]};
 const before=JSON.stringify(state);
 assert.equal(selectBadges(state).length,1);
 assert.equal(JSON.stringify(state),before);
});
test('bloque tout export partiel si une référence QR est absente',()=>{
 assert.throws(()=>selectBadges({subs:[{id:'a',name:'Élève fictif'}]}),/incomplet/);
});
test('bloque les QR en double',()=>{
 assert.throws(()=>selectBadges({subs:[
  {id:'a',name:'A',qrRef:'G10-TP-SCOL-QR001'},
  {id:'b',name:'B',qrRef:'G10-TP-SCOL-QR001'}
 ]}),/Doublon/);
});
test('bloque les identifiants en double',()=>{
 assert.throws(()=>selectBadges({subs:[
  {id:'a',name:'A',qrRef:'G10-TP-SCOL-QR001'},
  {id:'a',name:'B',qrRef:'G10-TP-SCOL-QR002'}
 ]}),/Doublon/);
});
test('bloque les QR non conformes et une liste vide',()=>{
 assert.throws(()=>selectBadges({subs:[{id:'a',name:'A',qrRef:'WRONG'}]}),/incomplet/);
 assert.throws(()=>selectBadges({subs:[]}),/Aucun abonné/);
});
test('URL badge conforme à la V2, sans nouveau QR',()=>{
 const url=badgeUrl('G10-TP-SCOL-QR001','https://example.org/g10/index.html');
 assert.equal(url,'https://example.org/g10/qr-test.html?code=G10-TP-SCOL-QR001&v=4');
});
