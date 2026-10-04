/* G10 Transport Scolaire — Circuit dynamique élèves/écoles V1.47.1 */
(function(){
  if(window.__G10_DYNAMIC_CIRCUIT_V1471__) return;
  window.__G10_DYNAMIC_CIRCUIT_V1471__=true;

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
  function num(v){var n=Number(v);return isFinite(n)?n:999999}
  function confirmed(x){
    if(x.confirmed===true||x.active===true||x.isActive===true)return true;
    var vals=[x.status,x.subscriptionStatus,x.abonnement,x.subscription,x.state,x.etat,x.dossierStatus];
    for(var i=0;i<vals.length;i++){
      var s=String(vals[i]||"").toLowerCase();
      if(/confirm|actif|active|valid/.test(s))return true;
    }
    return false;
  }
  function orderValue(x,idx){
    var keys=["circuitOrder","routeOrder","pickupOrder","ordreCircuit","ordreRamassage","order"];
    for(var i=0;i<keys.length;i++){if(x[keys[i]]!==undefined&&x[keys[i]]!==null&&x[keys[i]]!=="")return num(x[keys[i]])}
    return idx+1;
  }
  function getList(){
    if(!window.st||!Array.isArray(st.subs))return[];
    var anyConfirmed=st.subs.some(confirmed);
    return st.subs.map(function(x,i){return{x:x,idx:i,ord:orderValue(x,i)}})
      .filter(function(o){return anyConfirmed?confirmed(o.x):true})
      .sort(function(a,b){return a.ord-b.ord||a.idx-b.idx});
  }
  function schoolsFrom(list){
    var seen={},out=[];
    list.forEach(function(o){
      var s=String(o.x.school||o.x.ecole||o.x.etablissement||"Établissement à renseigner").trim();
      if(!seen[s]){seen[s]=true;out.push(s)}
    });
    return out;
  }
  function html(){
    var list=getList(),schools=schoolsFrom(list);
    return '<section class="g10dyn-circuit">'+
      '<div class="g10dyn-head"><div><h3>Ordre opérationnel du circuit</h3><p>Liste synchronisée avec les abonnés confirmés. L’ordre suit le circuit défini dans l’administration ; à défaut, l’ordre d’enregistrement est utilisé.</p></div><span>'+list.length+' élève'+(list.length>1?'s':'')+'</span></div>'+
      '<div class="g10dyn-grid">'+
        '<div class="g10dyn-block"><h4>Ramassage — élèves</h4>'+
          (list.length?list.map(function(o,i){var x=o.x;return '<div class="g10dyn-row"><b>'+(i+1)+'</b><div><strong>'+esc(x.name||"Élève")+'</strong><small>'+esc(x.address||x.adresse||x.quartier||x.commune||"Adresse à renseigner")+'</small></div></div>'}).join(""):'<div class="g10dyn-empty">Aucun élève confirmé.</div>')+
        '</div>'+
        '<div class="g10dyn-block"><h4>Établissements desservis</h4>'+
          (schools.length?schools.map(function(s,i){return '<div class="g10dyn-row school"><b>'+(i+1)+'</b><div><strong>'+esc(s)+'</strong><small>Établissement du circuit</small></div></div>'}).join(""):'<div class="g10dyn-empty">Aucun établissement renseigné.</div>')+
        '</div>'+
      '</div>'+
    '</section>'
  }
  function inject(){
    var b=document.getElementById("adminBody");if(!b)return;
    var old=b.querySelector(".g10dyn-circuit");if(old)old.remove();
    b.insertAdjacentHTML("afterbegin",html());
  }

  var css=document.createElement("style");
  css.textContent=".g10dyn-circuit{background:#fff;border:1px solid #d9e5ef;border-radius:16px;padding:14px;margin:10px 0}.g10dyn-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.g10dyn-head h3{margin:0;color:#153a66}.g10dyn-head p{margin:4px 0 0;color:#6a7f91;font-size:11px}.g10dyn-head span{background:#e8f8ef;color:#087a43;border-radius:999px;padding:6px 10px;font-weight:900;font-size:11px;white-space:nowrap}.g10dyn-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.g10dyn-block{border:1px solid #e0e8f0;border-radius:12px;padding:10px}.g10dyn-block h4{margin:0 0 8px;color:#153a66}.g10dyn-row{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #eef2f6}.g10dyn-row:last-child{border-bottom:0}.g10dyn-row>b{width:28px;height:28px;border-radius:8px;background:#eaf2ff;color:#0b5fad;display:grid;place-items:center}.g10dyn-row strong{display:block;color:#153a66}.g10dyn-row small{display:block;color:#6a7f91;margin-top:2px}.g10dyn-row.school>b{background:#e8f8ef;color:#087a43}.g10dyn-empty{color:#6a7f91;font-size:11px;padding:8px 0}@media(max-width:800px){.g10dyn-grid{grid-template-columns:1fr}}";
  document.head.appendChild(css);

  function hook(){
    if(!window.st||!window.adminTab){setTimeout(hook,250);return}
    if(window.__G10_DYNAMIC_CIRCUIT_HOOK__)return;
    window.__G10_DYNAMIC_CIRCUIT_HOOK__=true;
    var old=window.adminTab;
    window.adminTab=function(t){
      old(t);
      setTimeout(function(){var k=String(t||"").toLowerCase();if(k.indexOf("circuit")>=0||k.indexOf("route")>=0)inject()},80)
    }
  }
  hook();
})();