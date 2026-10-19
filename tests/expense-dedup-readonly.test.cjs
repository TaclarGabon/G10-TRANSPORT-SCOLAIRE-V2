'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {candidates}=require('../audit/expense-dedup-readonly.js');
test('regroupe les dépenses potentiellement dupliquées sans modifier les entrées',()=>{
 const data=[
  {id:'a',date:'2026-10-19',type:'Carburant',amount:35000,bus:'BUS-1',bill:'X42',supplier:'PETRO'},
  {id:'b',date:'2026-10-19',type:'carburant',amount:'35000',bus:'BUS-1',bill:'X42',supplier:'PETRO'},
  {id:'c',date:'2026-10-19',type:'Carburant',amount:35000,bus:'BUS-2',bill:'X42',supplier:'PETRO'}
 ];
 const before=JSON.stringify(data);const r=candidates(data);
 assert.equal(r.count,3);assert.equal(r.groups.length,1);assert.deepEqual(r.groups[0].map(x=>x.id),['a','b']);
 assert.equal(JSON.stringify(data),before);
});
test('données manquantes et factures identiques ne conduisent à aucune suppression',()=>{
 const r=candidates([{date:'2026-10-19',amount:null},{date:'2026-10-19',amount:'inconnu'}]);
 assert.equal(r.groups.length,0);
 assert.equal(candidates(null).count,null);
});
