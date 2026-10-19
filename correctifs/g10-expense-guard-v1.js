/* G10 V2 — garde complémentaire contre les doubles clics sur les factures.
 * Préproduction uniquement : script à injecter APRÈS index.html, sans modifier Firebase.
 * Ne remplace pas l'idempotence serveur, et ne supprime aucune facture.
 */
(function(root){
  'use strict';
  function amount(v){return Number(v)||0}
  function sameExpense(a,b){
    return !!a&&!!b&&String(a.type||'')===String(b.type||'')&&
      String(a.date||'')===String(b.date||'')&&
      amount(a.amount)===amount(b.amount)&&
      amount(a.odometer)===amount(b.odometer)&&
      amount(a.litres)===amount(b.litres)&&
      String(a.vendor||'').trim()===String(b.vendor||'').trim();
  }
  function recentDuplicate(expenses,draft,now){
    return (Array.isArray(expenses)?expenses:[]).some(function(e){
      var when=Date.parse(e.enteredAt||e.createdAt||'');
      return !e.cancelledAt&&Number.isFinite(when)&&now-when>=0&&now-when<1800000&&sameExpense(e,draft)
    });
  }
  function install(){
    if(root.__g10ExpenseGuardInstalled)return true;
    var original=root.addExpenseV145;
    if(typeof original!=='function')return false;
    var busy=Object.create(null);
    root.__g10ExpenseGuardInstalled=true;
    function notice(msg){
      if(!root.document||!root.document.body)return;
      var el=root.document.getElementById('g10-expense-guard-notice');
      if(!el){
        el=root.document.createElement('div');el.id='g10-expense-guard-notice';
        el.setAttribute('role','status');
        el.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;max-width:600px;margin:auto;z-index:999999;background:#fff3d8;border:1px solid #f2d38d;color:#6c4600;padding:12px 14px;border-radius:12px;font:700 13px/1.5 Arial,sans-serif;box-shadow:0 6px 22px #123d7822';
        root.document.body.appendChild(el);
      }
      el.textContent=msg;
    }
    function formData(ctx){
      var prefix=typeof root.expenseCtxPrefix==='function'?root.expenseCtxPrefix(ctx):({admin:'aexp',gestion:'gexp',driver:'dexp'}[ctx]);
      if(!prefix||!root.document)return null;
      var get=function(s){var el=root.document.getElementById(prefix+'_'+s);return el?el.value:''};
      return {type:get('type'),date:get('date'),amount:amount(get('amount')),
        odometer:amount(get('odo')),litres:amount(get('litres')),vendor:String(get('vendor')||'').trim()};
    }
    function confirmedRemotely(record){
      if(!root.demoRef||typeof root.demoRef.child!=='function')return;
      var attempts=0;
      function check(){
        attempts++;
        root.demoRef.child('state/vehicleExpenses').once('value').then(function(snap){
          var data=snap.val(),items=Array.isArray(data)?data:Object.values(data||{});
          var found=items.some(function(e){return e&&e.id===record.id});
          if(found){notice('Facture retrouvée dans Firebase. Enregistrement confirmé.');return}
          if(attempts<3){root.setTimeout(check,attempts*2000);return}
          notice('Facture présente localement, mais non confirmée dans Firebase. Vérifiez la connexion avant toute nouvelle saisie.');
        }).catch(function(){
          if(attempts<3){root.setTimeout(check,attempts*2000);return}
          notice('Connexion Firebase non vérifiable. Ne ressaisissez pas avant de contrôler les dépenses.')
        });
      }
      root.setTimeout(check,1200);
    }
    root.addExpenseV145=function(ctx,validateNow){
      if(busy[ctx]){notice('Traitement en cours : un seul clic suffit. Attendez avant de recommencer.');return}
      var draft=formData(ctx);
      var state=root.st;
      var editing=root.expenseEditIdByCtx&&root.expenseEditIdByCtx[ctx];
      if(!draft||!draft.date||draft.amount<=0||(draft.type==='Carburant'&&draft.odometer<=0)){
        return original.apply(this,arguments); // Validation native conservée.
      }
      if(!editing&&state&&recentDuplicate(state.vehicleExpenses,draft,Date.now())){
        if(typeof root.confirm!=='function'||!root.confirm(
          'Une facture identique figure déjà dans les dépenses récentes. Vérifiez la liste. Voulez-vous vraiment enregistrer une AUTRE facture ?'))return;
      }
      var before=(state&&Array.isArray(state.vehicleExpenses)?state.vehicleExpenses:[]).map(function(e){
        return {id:e.id,mark:[e.lastEditedAt,e.status,e.validatedAt,e.amount,e.receipt&&e.receipt.length].join('|')}
      });
      var ids=new Set(before.map(function(e){return e.id}));
      var oldMark=before.find(function(e){return e.id===editing});
      busy[ctx]=true;
      notice('Facture en traitement. Ne cliquez pas plusieurs fois : la photo peut prendre du temps.');
      var finished=false,elapsed=0;
      var poll=root.setInterval(function(){
        elapsed+=150;
        var list=root.st&&root.st.vehicleExpenses||[];
        var changed=list.find(function(e){
          if(!e||!e.id)return false;
          if(!ids.has(e.id))return true;
          return editing&&e.id===editing&&oldMark&&
            [e.lastEditedAt,e.status,e.validatedAt,e.amount,e.receipt&&e.receipt.length].join('|')!==oldMark.mark
        });
        if(changed){
          finished=true;root.clearInterval(poll);busy[ctx]=false;
          notice('Facture ajoutée localement. Vérification de la synchronisation Firebase…');
          confirmedRemotely(changed);
        }else if(elapsed>=30000){
          root.clearInterval(poll);
          // Conserver le verrou : le traitement de la photo peut encore terminer après 30 s.
          notice('Le traitement dépasse 30 secondes. Ne recliquez pas. Vérifiez l’historique et la synchronisation avant de recharger la page.');
        }
      },150);
      try{return original.apply(this,arguments)}
      catch(e){
        root.clearInterval(poll);busy[ctx]=false;
        notice('Erreur de traitement. Vérifiez la liste avant toute nouvelle tentative.');
        throw e;
      }
    };
    return true;
  }
  var api={install:install,sameExpense:sameExpense,recentDuplicate:recentDuplicate};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.G10ExpenseGuardV1=api;install()}
})(typeof window==='object'?window:globalThis);
