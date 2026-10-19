#!/usr/bin/env node
/* Audit statique local du gros index V2. N'ouvre ni Firebase ni données d'abonnés.
 * N'imprime que des numéros de lignes et marqueurs de code, pas de contenu privé.
 * Usage: node scripts/audit-expense-save.cjs
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'../index.html');
const src=fs.readFileSync(file,'utf8');
const newlineOffsets=[0];
for(let i=0;i<src.length;i++)if(src.charCodeAt(i)===10)newlineOffsets.push(i+1);
function lineAt(pos){
  let lo=0,hi=newlineOffsets.length;
  while(lo+1<hi){const m=(lo+hi)>>1;if(newlineOffsets[m]<=pos)lo=m;else hi=m}
  return lo+1;
}
const probes=[
  ['SOURCE_DEPENSES',/vehicleExpenses/g],
  ['CARBURANT',/carburant/gi],
  ['ENREGISTRER',/Enregistrer/gi],
  ['FONCTION_SAVE',/function\s+save\s*\(|\bsave\s*[:=]\s*(?:async\s*)?(?:function|\()/g],
  ['ECRITURE_FIREBASE',/\.set\s*\(|\.update\s*\(|\.transaction\s*\(|\.push\s*\(/g],
  ['FACTURE',/facture/gi],
  ['DEPENSE',/d[eé]pense/gi],
  ['CLICK',/addEventListener\s*\(\s*['"](?:click|submit)['"]/g]
];
for(const [name,re] of probes){
  const positions=[...src.matchAll(re)].map(m=>m.index);
  console.log(name+' : '+positions.length+' occurrence(s), lignes : '+positions.slice(0,90).map(lineAt).join(', ')+(positions.length>90?' ...':''));
}
console.log('NOTE : ceci localise seulement les blocs. Il ne diagnostique pas à lui seul la cause.');
console.log('Inspection humaine nécessaire des fonctions de sauvegarde des dépenses et des retours asynchrones Firebase.');
