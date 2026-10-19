/* Analyse locale, en lecture seule, des dépenses V2.
 * Ne modifie ni ne supprime aucune facture.
 * Les candidats sont à contrôler avec les justificatifs originaux.
 */
(function(root){
'use strict';
const text=v=>String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');
const amount=v=>{const n=typeof v==='number'?v:Number(String(v??'').replace(/\s/g,''));return Number.isFinite(n)&&n>=0?n:null;};
const entries=src=>Array.isArray(src)?src.map((x,i)=>({key:String(i),value:x})):
  (src&&typeof src==='object'?Object.entries(src).map(([key,value])=>({key,value})):null);
function candidates(src){
 const rows=entries(src);
 if(!rows) return {count:null,groups:[],warning:'vehicleExpenses absent ou structure inconnue'};
 const groups=new Map();
 rows.forEach(({key,value})=>{
   if(!value||typeof value!=='object')return;
   // Regrouper sans effacer : date, montant, type, bus, facture/fournisseur, justificatif.
   const d=text(value.date||value.invoiceDate).slice(0,10);
   const n=amount(value.amount);
   if(!d||n===null)return;
   const signature=[d,n,text(value.type),text(value.bus||value.busId),
     text(value.bill||value.invoiceNumber),text(value.supplier)].join('|');
   if(!groups.has(signature))groups.set(signature,[]);
   groups.get(signature).push({key,id:value.id||null,createdAt:value.createdAt||null,status:value.status||null});
 });
 return {
   count:rows.length,
   groups:[...groups.values()].filter(x=>x.length>1),
   warning:'Correspondances potentielles uniquement : mêmes champs ne prouvent pas une duplication. Aucun enregistrement modifié.'
 };
}
const api=Object.freeze({candidates});
if(typeof module==='object'&&module.exports)module.exports=api;else root.G10ExpenseAudit=api;
})(typeof globalThis==='object'?globalThis:this);
