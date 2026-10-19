/* Préproduction — garde contre les clics répétés sur les dépenses.
 * Limite les doublons de clic côté navigateur, NE garantit PAS l'idempotence serveur.
 * Aucune écriture Firebase dans ce module.
 */
(function (global) {
  'use strict';
  if (global.__G10ExpenseGuardV161) return;
  global.__G10ExpenseGuardV161=true;
  const LOCK_MS=90000;
  let pendingUntil=0;
  let lastCount=null;
  const stateCount=()=> {
    const rows=global.st?.vehicleExpenses;
    return Array.isArray(rows)?rows.length:(rows && typeof rows==='object'?Object.keys(rows).length:null);
  };
  function isExpenseSave(button) {
    if(!button || !button.matches('button, input[type=submit]'))return false;
    const txt=(button.textContent||button.value||'').trim();
    if(!/enregistrer|confirmer|sauvegarder/i.test(txt))return false;
    const area=button.closest('form, [class*=expense], [id*=expense], [id*=depense], [class*=depense], #adminBody, #directionBody');
    if(!area)return false;
    const form=button.closest('form')||area;
    const fields=[...form.querySelectorAll('input,select,textarea')];
    const names=fields.map(x=>(x.name||x.id||x.placeholder||'').toLowerCase()).join(' ');
    const text=(form.textContent||'').slice(0,1800).toLowerCase();
    return (/montant|amount|litres|kilom|km/.test(names) && /facture|carburant|dépense|depense|frais|véhicule|vehicule/.test(text)) ||
      (/expense|depense/i.test(form.id+' '+form.className) && /montant|amount/.test(names));
  }
  function status(button,message) {
    const root=button.closest('form')||button.parentElement;
    if(!root)return;
    let note=root.querySelector('[data-g10-expense-status]');
    if(!note){note=document.createElement('p');note.dataset.g10ExpenseStatus='1';note.setAttribute('role','status');
      note.style.cssText='padding:9px;border-radius:8px;background:#fff4d4;color:#674500;font-size:12px;font-weight:700';
      root.appendChild(note);}
    note.textContent=message;
  }
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('button,input[type=submit]');
    if(!isExpenseSave(button))return;
    const now=Date.now();
    if(now<pendingUntil){
      event.preventDefault();event.stopImmediatePropagation();
      status(button,'Enregistrement déjà demandé. Ne recliquez pas : vérifiez la liste des dépenses avant toute nouvelle tentative.');
      return;
    }
    pendingUntil=now+LOCK_MS;
    lastCount=stateCount();
    status(button,'Enregistrement demandé. Attendez la confirmation et vérifiez la liste des dépenses. Ne recliquez pas.');
    setTimeout(()=>{
      const current=stateCount();
      if(current!==null && lastCount!==null && current>lastCount){
        status(button,'Une nouvelle dépense apparaît dans la liste locale. Vérifiez qu’elle est bien enregistrée avant de continuer.');
      } else {
        status(button,'Aucune confirmation certaine. Vérifiez la liste et rechargez avant de tenter à nouveau.');
      }
    },2500);
  },true);
  global.G10ExpenseGuardV161=Object.freeze({isExpenseSave});
})(window);
