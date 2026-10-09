/* ===== V1.60 — intégration Inter-Akanda sans PIN ===== */
(function(){
  'use strict';
  var V160_SCHOOLS=[
    'Lycée MBELE',
    'Prytanée Militaire',
    'Lycée Michel Montaigne',
    'Lycée René Descartes',
    'Lycée National Léon Mba',
    'Lycée Paul Indjendjet Gondjout',
    'Lycée International de Libreville (LIL)'
  ];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function byId(id){return (st.subs||[]).find(function(x){return String(x.id)===String(id)})}
  function moneyV160(v){try{return new Intl.NumberFormat('fr-FR').format(Number(v)||0)+' FCFA'}catch(e){return (Number(v)||0)+' FCFA'}}
  function busZone(busId){return busId==='BUS-2'?'Inter-Akanda':'Akanda'}
  function busLabel(busId){return busId==='BUS-2'?'Bus 2':'Bus 1'}
  function ensureV160(){
    var changed=false;
    st.busRegistryV155=Array.isArray(st.busRegistryV155)?st.busRegistryV155:[];
    var b1=st.busRegistryV155.find(function(b){return b.id==='BUS-1'});
    if(!b1){b1={id:'BUS-1'};st.busRegistryV155.push(b1);changed=true}
    var b1Data={label:'Bus 1 — Akanda',driver:'MBA ONDO Emmanuel',phone:b1.phone||'',zone:'Akanda',serviceZone:'Akanda',capacity:23,active:true};
    Object.keys(b1Data).forEach(function(k){if(b1[k]!==b1Data[k]){b1[k]=b1Data[k];changed=true}});
    var b2=st.busRegistryV155.find(function(b){return b.id==='BUS-2'});
    if(!b2){b2={id:'BUS-2'};st.busRegistryV155.push(b2);changed=true}
    var b2Data={label:'Bus 2 — Inter-Akanda',driver:'Iwangu Inzambe Edherson',phone:'+241 66 15 60 81',zone:'Inter-Akanda',serviceZone:'Inter-Akanda',capacity:23,active:true,formula:'Standard A/R',pickupMode:'Point de relais / point d’arrêt'};
    Object.keys(b2Data).forEach(function(k){if(b2[k]!==b2Data[k]){b2[k]=b2Data[k];changed=true}});
    st.drivers=Array.isArray(st.drivers)?st.drivers:[];
    var d2=st.drivers.find(function(d){return d.busId==='BUS-2'||String(d.phone||'').replace(/\D/g,'').endsWith('66156081')||/Iwangu\s+Inzambe\s+Edherson/i.test(d.name||'')});
    if(!d2){d2={id:'DRV-BUS2'};st.drivers.push(d2);changed=true}
    var d2Data={name:'Iwangu Inzambe Edherson',firstName:'Edherson',lastName:'Iwangu Inzambe',phone:'+241 66 15 60 81',zone:'Inter-Akanda',busId:'BUS-2',plate:d2.plate||'',capacity:23,active:true,satisfaction:Number(d2.satisfaction)||0,punctuality:Number(d2.punctuality)||0,complaints:Number(d2.complaints)||0,controls360:Number(d2.controls360)||0};
    Object.keys(d2Data).forEach(function(k){if(d2[k]!==d2Data[k]){d2[k]=d2Data[k];changed=true}});
    (st.subs||[]).forEach(function(x){
      if(!x.busId){x.busId='BUS-1';changed=true}
      var z=busZone(x.busId);
      if(x.serviceZone!==z){x.serviceZone=z;changed=true}
      if(x.busId==='BUS-2'){
        if(x.plan!=='Standard'){x.plan='Standard';changed=true}
        if(x.pickupType!=='Relais'){x.pickupType='Relais';changed=true}
        if(x.dropType!=='Relais'){x.dropType='Relais';changed=true}
        if(x.partialService){x.partialService='';changed=true}
      }
    });
    st.schoolOrdersV160=st.schoolOrdersV160&&typeof st.schoolOrdersV160==='object'?st.schoolOrdersV160:{};
    if(!Array.isArray(st.schoolOrdersV160['BUS-1'])){st.schoolOrdersV160['BUS-1']=Array.isArray(st.schoolOrder)?st.schoolOrder.slice():[];changed=true}
    if(!Array.isArray(st.schoolOrdersV160['BUS-2'])){st.schoolOrdersV160['BUS-2']=[];changed=true}
    if(!st.activeCircuitBusV160){st.activeCircuitBusV160='BUS-1';changed=true}
    return changed;
  }
  var initialChanged=ensureV160();
  if(initialChanged){try{localStorage.setItem('g10-safari-v122',JSON.stringify(st))}catch(e){}}

  /* Migration également appliquée après réception Firebase, sans toucher aux règles d’accès. */
  if(typeof window.normalizeRemoteState==='function'){
    var normalizeBaseV160=window.normalizeRemoteState;
    window.normalizeRemoteState=function(){var r=normalizeBaseV160.apply(this,arguments);ensureV160();return r};
  }

  /* L’affectation au bus définit automatiquement la zone/service actuelle. */
  window.g10SetBusV160=function(id,busId){
    var x=byId(id);if(!x||x.g10Cleaned)return;
    x.busId=busId==='BUS-2'?'BUS-2':'BUS-1';
    x.serviceZone=busZone(x.busId);
    if(x.busId==='BUS-2'){
      x.plan='Standard';x.pickupType='Relais';x.dropType='Relais';x.partialService='';
      if(!x.relayStop)x.relayStop=x.pickup||'';
      if(!x.drop||/domicile/i.test(x.drop))x.drop=x.relayStop||x.pickup||'Point de relais';
    }
    try{if(typeof pushDirectionActivity==='function')pushDirectionActivity('bus','Affectation '+busLabel(x.busId),x.name+' • '+x.serviceZone,'abonnes')}catch(e){}
    save();adminTab('abonnes');
  };

  /* Inter-Akanda reste Standard uniquement pour le moment. */
  if(typeof window.setFormula==='function'){
    var setFormulaBaseV160=window.setFormula;
    window.setFormula=function(id,v){var x=byId(id);if(x&&x.busId==='BUS-2'&&v!=='Standard'){alert('Inter-Akanda : formule Standard aller-retour uniquement pour le moment.');x.plan='Standard';x.pickupType='Relais';x.dropType='Relais';x.partialService='';save();adminTab('abonnes');return}return setFormulaBaseV160.apply(this,arguments)};
  }
  if(typeof window.setDrop==='function'){
    var setDropBaseV160=window.setDrop;
    window.setDrop=function(id,v){var x=byId(id);if(x&&x.busId==='BUS-2'&&v!=='Relais'){alert('Inter-Akanda : la dépose se fait au point de relais / point d’arrêt.');v='Relais'}return setDropBaseV160.call(this,id,v)};
  }

  /* Colonne Zone/service + Bus affecté directement dans le tableau Abonnés. */
  if(typeof window.masterTable==='function'){
    var masterBaseV160=window.masterTable;
    window.masterTable=function(){
      var html=masterBaseV160.apply(this,arguments),box=document.createElement('div');box.innerHTML=html;
      var table=box.querySelector('table.master');if(!table)return html;
      var title=box.querySelector('h2');if(title&&/Zone Akanda/i.test(title.textContent))title.textContent='Tableau des abonnés — Akanda & Inter-Akanda';
      var headers=Array.prototype.slice.call(table.querySelectorAll('thead th'));
      var actionIndex=headers.findIndex(function(th){return th.textContent.trim()==='Action'});if(actionIndex<0)actionIndex=Math.max(1,headers.length-1);
      var headRow=table.querySelector('thead tr');
      if(headRow&&!headRow.querySelector('[data-v160-zone]')){
        var thZone=document.createElement('th');thZone.textContent='Zone / service';thZone.setAttribute('data-v160-zone','1');
        var thBus=document.createElement('th');thBus.textContent='Bus affecté';thBus.setAttribute('data-v160-bus','1');
        var anchor=headRow.children[actionIndex]||null;headRow.insertBefore(thZone,anchor);headRow.insertBefore(thBus,anchor);
      }
      Array.prototype.slice.call(table.querySelectorAll('tbody tr')).forEach(function(tr,i){
        var x=(st.subs||[])[i];if(!x)return;
        var cells=tr.children;var anchor=cells[actionIndex]||null;
        var tdZone=document.createElement('td');
        var tdBus=document.createElement('td');
        if(x.g10Cleaned){tdZone.textContent='—';tdBus.textContent='—'}else{
          var zone=busZone(x.busId||'BUS-1');
          tdZone.innerHTML='<span class="v160-zone-pill '+(zone==='Inter-Akanda'?'inter':'')+'">'+esc(zone)+'</span>'+(x.busId==='BUS-2'?'<div class="small">Standard A/R • point de relais</div>':'');
          tdBus.innerHTML='<select class="select-compact v160-bus-select" onchange="g10SetBusV160('+JSON.stringify(String(x.id)).replace(/"/g,'&quot;')+',this.value)"><option value="BUS-1" '+((x.busId||'BUS-1')==='BUS-1'?'selected':'')+'>Bus 1 — Akanda</option><option value="BUS-2" '+(x.busId==='BUS-2'?'selected':'')+'>Bus 2 — Inter-Akanda</option></select>';
          if(x.busId==='BUS-2'){
            var f=tr.querySelector('select[onchange*="setFormula"]');if(f){f.value='Standard';f.disabled=true;f.title='Inter-Akanda : Standard uniquement'}
            var d=tr.querySelector('select[onchange*="setDrop"]');if(d){d.value='Relais';d.disabled=true;d.title='Inter-Akanda : point de relais / arrêt'}
          }
        }
        tr.insertBefore(tdZone,anchor);tr.insertBefore(tdBus,anchor);
      });
      return box.innerHTML;
    };
  }

  /* Formulaire Modifier / Nouvel abonné : zone automatique + écoles Inter-Akanda. */
  if(typeof window.editSub==='function'){
    var editBaseV160=window.editSub;
    window.editSub=function(id){
      var r=editBaseV160.apply(this,arguments),x=byId(id),p=document.getElementById('editPanel');if(!x||!p)return r;
      var bus=p.querySelector('#e_busId'),plan=p.querySelector('#e_plan'),grid=p.querySelector('.editgrid');
      if(bus){
        Array.prototype.slice.call(bus.options).forEach(function(o){if(o.value==='BUS-1')o.textContent='Bus 1 — Akanda';if(o.value==='BUS-2')o.textContent='Bus 2 — Inter-Akanda — Iwangu Inzambe Edherson'});
        bus.value=x.busId||'BUS-1';
      }
      if(grid&&!p.querySelector('#e_serviceZoneV160')){
        var lab=document.createElement('label');lab.innerHTML='Zone / service<input id="e_serviceZoneV160" readonly>';grid.appendChild(lab);
      }
      if(!p.querySelector('#v160BusRule')){var n=document.createElement('div');n.id='v160BusRule';n.className='v160-standard-note';p.querySelector('.card')?.insertBefore(n,p.querySelector('.edit-actions')||null)}
      function applyFormBus(){
        var is2=bus&&bus.value==='BUS-2',z=is2?'Inter-Akanda':'Akanda',ze=p.querySelector('#e_serviceZoneV160'),note=p.querySelector('#v160BusRule');
        if(ze)ze.value=z;
        if(note)note.textContent=is2?'Bus 2 — Inter-Akanda : formule Standard aller-retour uniquement, ramassage et dépose au point de relais / point d’arrêt.':'Bus 1 — Zone Akanda : les formules existantes restent disponibles.';
        if(plan){if(is2){plan.value='Standard';plan.disabled=true}else{plan.disabled=false}}
        var pt=p.querySelector('#e_pickupType');if(is2&&pt)pt.value='Relais';
        var partial=p.querySelector('#v155partialwrap');if(partial&&is2)partial.style.display='none';
      }
      if(bus){bus.addEventListener('change',applyFormBus);applyFormBus()}
      var school=p.querySelector('#e_school');if(school){
        var listId=school.getAttribute('list')||'v160schools',dl=p.querySelector('#'+listId);
        if(!dl){dl=document.createElement('datalist');dl.id=listId;p.appendChild(dl);school.setAttribute('list',listId)}
        var have=Array.prototype.slice.call(dl.options||[]).map(function(o){return o.value});
        V160_SCHOOLS.forEach(function(s){if(have.indexOf(s)<0){var o=document.createElement('option');o.value=s;dl.appendChild(o)}});
      }
      return r;
    };
  }
  if(typeof window.saveEdit==='function'){
    var saveEditBaseV160=window.saveEdit;
    window.saveEdit=function(id){
      var x=byId(id),bus=document.getElementById('e_busId'),plan=document.getElementById('e_plan');
      if(x&&bus){x.busId=bus.value==='BUS-2'?'BUS-2':'BUS-1';x.serviceZone=busZone(x.busId)}
      if(x&&x.busId==='BUS-2'){
        x.plan='Standard';x.pickupType='Relais';x.dropType='Relais';x.partialService='';
        if(plan)plan.value='Standard';
        var pt=document.getElementById('e_pickupType');if(pt)pt.value='Relais';
      }
      return saveEditBaseV160.apply(this,arguments);
    };
  }

  function busRegistryHtmlV160(){
    return '<div class="v160-bus-grid">'+
      '<div class="v160-bus-card"><h3>Bus 1 — Zone Akanda</h3><div class="v160-line"><b>Chauffeur :</b> MBA ONDO Emmanuel</div><div class="v160-line"><b>Capacité :</b> 23 places</div><div class="v160-line"><b>Immatriculation :</b> à confirmer</div><div class="v160-line"><b>Service :</b> circuit actuel Akanda</div></div>'+
      '<div class="v160-bus-card"><h3>Bus 2 — Inter-Akanda</h3><div class="v160-line"><b>Chauffeur :</b> Iwangu Inzambe Edherson</div><div class="v160-line"><b>Téléphone :</b> +241 66 15 60 81</div><div class="v160-line"><b>Capacité :</b> 23 places</div><div class="v160-line"><b>Immatriculation :</b> à confirmer</div><div class="v160-line"><b>Formule :</b> Standard A/R — point de relais / point d’arrêt</div><div class="v160-school-list"><b>Établissements annoncés :</b> '+V160_SCHOOLS.map(esc).join(' • ')+'</div></div>'+
    '</div>';
  }
  window.g10BusRegistryHtmlV160=busRegistryHtmlV160;

  function analyticsV160(){
    var valid=(st.subs||[]).filter(function(x){return !x.g10Cleaned&&String(x.name||'').trim()});
    function row(id){
      var a=valid.filter(function(x){return (x.busId||'BUS-1')===id}),confirmed=a.filter(function(x){return x.subscriptionStatus==='Confirmé'||x.activeTransport===true}),expected=confirmed.reduce(function(s,x){return s+(Number(x.price)||0)},0),received=a.reduce(function(s,x){return s+(Number(x.amountReceived)||0)},0),capacity=23;
      return {id:id,zone:busZone(id),label:busLabel(id),assigned:a.length,confirmed:confirmed.length,expected:expected,received:received,capacity:capacity};
    }
    var a=row('BUS-1'),b=row('BUS-2'),all={assigned:a.assigned+b.assigned,confirmed:a.confirmed+b.confirmed,expected:a.expected+b.expected,received:a.received+b.received};
    return '<div class="card v160-analysis"><div class="v160-analysis-head"><div><h3>Analyse par zone et par bus</h3><div class="v160-analysis-note">La zone sert à l’analyse commerciale (Akanda / Inter-Akanda) et le bus à l’exploitation. Pour le moment ils sont liés automatiquement : Bus 1 = Akanda, Bus 2 = Inter-Akanda. Cette séparation permet de conserver des analyses correctes si un véhicule change de circuit plus tard.</div></div></div>'+
      '<div class="v160-kpis"><div class="v160-kpi"><b>'+all.assigned+'</b><span>Abonnés affectés</span></div><div class="v160-kpi"><b>'+all.confirmed+'</b><span>Abonnements confirmés</span></div><div class="v160-kpi"><b>'+moneyV160(all.expected)+'</b><span>Mensuel prévu — confirmés</span></div><div class="v160-kpi"><b>'+moneyV160(all.received)+'</b><span>Encaissé enregistré</span></div></div>'+
      '<div class="v160-analysis-scroll"><table class="v160-analysis-table"><thead><tr><th>Zone / service</th><th>Bus</th><th>Affectés</th><th>Confirmés</th><th>Capacité</th><th>Mensuel prévu</th><th>Encaissé</th></tr></thead><tbody>'+[a,b].map(function(r){return '<tr><td><span class="v160-zone-pill '+(r.id==='BUS-2'?'inter':'')+'">'+esc(r.zone)+'</span></td><td>'+esc(r.label)+'</td><td class="v160-num">'+r.assigned+'</td><td class="v160-num">'+r.confirmed+'</td><td class="v160-num">'+r.confirmed+' / '+r.capacity+'</td><td class="v160-num">'+moneyV160(r.expected)+'</td><td class="v160-num">'+moneyV160(r.received)+'</td></tr>'}).join('')+'</tbody></table></div></div>';
  }

  /* Circuit : sélection du bus sans modifier les autres modules. */
  var saveBaseV160=window.save;
  var opBaseV160=window.operationalSubs;
  if(typeof opBaseV160==='function'){
    window.operationalSubs=function(){var arr=opBaseV160.apply(this,arguments);if(window.__g10RouteBusV160)arr=arr.filter(function(x){return (x.busId||'BUS-1')===window.__g10RouteBusV160});return arr};
  }
  if(typeof saveBaseV160==='function'){
    window.save=function(){if(window.__g10RenderOnlyV160)return;return saveBaseV160.apply(this,arguments)};
  }
  window.g10SelectCircuitBusV160=function(bus){st.activeCircuitBusV160=bus==='BUS-2'?'BUS-2':'BUS-1';save();adminTab('circuit')};
  if(typeof window.routeEditor==='function'){
    var routeBaseV160=window.routeEditor;
    window.routeEditor=function(){
      ensureV160();var bus=st.activeCircuitBusV160==='BUS-2'?'BUS-2':'BUS-1',savedOrder=Array.isArray(st.schoolOrder)?st.schoolOrder.slice():[],html='';
      st.schoolOrder=(st.schoolOrdersV160[bus]||[]).slice();window.__g10RouteBusV160=bus;window.__g10RenderOnlyV160=true;
      try{html=routeBaseV160.apply(this,arguments);st.schoolOrdersV160[bus]=Array.isArray(st.schoolOrder)?st.schoolOrder.slice():[]}
      finally{st.schoolOrder=savedOrder;window.__g10RenderOnlyV160=false;window.__g10RouteBusV160=null}
      try{saveBaseV160()}catch(e){}
      var count=(st.subs||[]).filter(function(x){return !x.g10Cleaned&&x.activeTransport!==false&&(x.busId||'BUS-1')===bus}).length;
      var bar='<div class="v160-bus-toolbar"><button class="v160-bus-btn '+(bus==='BUS-1'?'active':'')+'" onclick="g10SelectCircuitBusV160(\'BUS-1\')">Bus 1 — Akanda</button><button class="v160-bus-btn '+(bus==='BUS-2'?'active':'')+'" onclick="g10SelectCircuitBusV160(\'BUS-2\')">Bus 2 — Inter-Akanda</button><div class="v160-bus-note"><b>'+count+' élève(s) actif(s)</b> sur ce bus. Utilise les flèches du circuit pour définir l’ordre de ramassage de ce bus uniquement.</div></div>';
      return bar+html;
    };
  }
  if(typeof window.moveSubIndex==='function'){
    window.moveSubIndex=function(i,dir){
      var bus=st.activeCircuitBusV160==='BUS-2'?'BUS-2':'BUS-1';
      var arr=(st.subs||[]).filter(function(x){return x.activeTransport!==false&&(x.busId||'BUS-1')===bus}),j=i+dir;if(i<0||j<0||i>=arr.length||j>=arr.length)return;
      var ai=st.subs.indexOf(arr[i]),bi=st.subs.indexOf(arr[j]);if(ai<0||bi<0)return;var tmp=st.subs[ai];st.subs[ai]=st.subs[bi];st.subs[bi]=tmp;save();adminTab('circuit');
    };
  }
  if(typeof window.moveSchoolIndex==='function'){
    window.moveSchoolIndex=function(i,dir){var bus=st.activeCircuitBusV160==='BUS-2'?'BUS-2':'BUS-1',order=(st.schoolOrdersV160[bus]||[]).slice(),j=i+dir;if(i<0||j<0||i>=order.length||j>=order.length)return;var t=order[i];order[i]=order[j];order[j]=t;st.schoolOrdersV160[bus]=order;save();adminTab('circuit')};
  }

  /* Enrichissements visuels Administration et Direction. */
  if(typeof window.adminTab==='function'){
    var adminBaseV160=window.adminTab;
    window.adminTab=function(t){var r=adminBaseV160.apply(this,arguments);if(t==='chauffeurs'){var b=document.getElementById('adminBody');if(b&&!b.querySelector('.v160-bus-grid'))b.insertAdjacentHTML('afterbegin',busRegistryHtmlV160())}return r};
  }
  if(typeof window.directionTab==='function'){
    var directionBaseV160=window.directionTab;
    window.directionTab=function(t){var r=directionBaseV160.apply(this,arguments),b=document.getElementById('directionBody');if(!b)return r;if(t==='dashboard'&&!b.querySelector('.v160-analysis'))b.insertAdjacentHTML('afterbegin',analyticsV160());if(t==='bus'&&!b.querySelector('.v160-bus-grid'))b.insertAdjacentHTML('afterbegin',busRegistryHtmlV160());return r};
  }

  /* V1.60.1 — justificatifs de dépenses cliquables, agrandissables et zoomables. */
  var receiptZoomV160=1;
  window.g10OpenReceiptV160=function(src,label){
    if(!src)return;
    var old=document.getElementById('v160ReceiptModal');if(old)old.remove();
    receiptZoomV160=1;
    var modal=document.createElement('div');modal.id='v160ReceiptModal';modal.className='v160-receipt-modal';
    modal.innerHTML='<div class="v160-receipt-card" role="dialog" aria-modal="true" aria-label="Aperçu du justificatif"><div class="v160-receipt-head"><b>'+esc(label||'Justificatif de dépense')+'</b><div class="v160-receipt-tools"><button type="button" onclick="g10ReceiptZoomV160(-0.25)">− Zoom</button><button type="button" onclick="g10ReceiptZoomV160(0)">100 %</button><button type="button" onclick="g10ReceiptZoomV160(0.25)">+ Zoom</button><button type="button" class="v160-close" onclick="g10CloseReceiptV160()">Fermer</button></div></div><div class="v160-receipt-stage"><img id="v160ReceiptImage" src="'+src+'" alt="Justificatif agrandi"></div><div class="v160-receipt-hint">Clique sur + / − pour zoomer. Sur téléphone, l’image peut aussi être parcourue en faisant défiler la zone.</div></div>';
    modal.addEventListener('click',function(e){if(e.target===modal)g10CloseReceiptV160()});
    document.body.appendChild(modal);
  };
  window.g10ReceiptZoomV160=function(delta){
    if(delta===0)receiptZoomV160=1;else receiptZoomV160=Math.max(.5,Math.min(3,receiptZoomV160+delta));
    var img=document.getElementById('v160ReceiptImage');if(img)img.style.transform='scale('+receiptZoomV160+')';
  };
  window.g10CloseReceiptV160=function(){var m=document.getElementById('v160ReceiptModal');if(m)m.remove()};
  document.addEventListener('click',function(e){
    var img=e.target&&e.target.closest?e.target.closest('.expense-row .receipt-thumb'):null;
    if(!img)return;
    e.preventDefault();e.stopPropagation();
    g10OpenReceiptV160(img.currentSrc||img.src,'Justificatif de dépense');
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('v160ReceiptModal'))g10CloseReceiptV160()});

  /* Libellés généraux : l’application couvre maintenant les deux services. */
  if(typeof window.spaceTitlebar==='function'){
    var titleBaseV160=window.spaceTitlebar;
    window.spaceTitlebar=function(space){return titleBaseV160.apply(this,arguments).replace('G10 Transport Scolaire — Zone Akanda','G10 Transport Scolaire — Akanda & Inter-Akanda')};
  }
  function refreshHomeV160(){var z=document.querySelector('#home .zone');if(z)z.textContent='📍 Akanda • Inter-Akanda'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshHomeV160);else refreshHomeV160();
})();
