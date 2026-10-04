/* G10 Transport Scolaire — Module QR + arrivée école V1.46 */
(function(){
  if(window.__G10_QR_SCHOOL_V146__) return;
  window.__G10_QR_SCHOOL_V146__=true;

  var QR_PREFIX="G10-TP-SCOL-QR", scanner=null, scannerRunning=false;

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
  function pad(n){return String(n).padStart(3,"0")}
  function seq(ref){var m=String(ref||"").match(/QR(\d+)$/i);return m?Number(m[1]):0}
  function hhmm(v){var d=v?new Date(v):new Date();return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
  function badgeUrl(ref){
    var u=new URL("qr-test.html",location.href);
    u.searchParams.set("code",ref);u.searchParams.set("v","4");
    return u.href
  }
  function normalizeCode(raw){
    var t=String(raw||"").trim();
    try{var u=new URL(t);return (u.searchParams.get("code")||t).trim().toUpperCase()}catch(e){return t.toUpperCase()}
  }
  function loadScript(src,id){
    return new Promise(function(resolve,reject){
      if(document.getElementById(id)) return resolve();
      var s=document.createElement("script");s.id=id;s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)
    })
  }
  function ensureLibs(){
    var jobs=[];
    if(!window.QRCode)jobs.push(loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js","g10-qrcode-lib"));
    if(!window.Html5Qrcode)jobs.push(loadScript("https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js","g10-html5qr-lib"));
    return Promise.all(jobs)
  }

  var css=document.createElement("style");
  css.textContent=
  ".g10v146-card{background:#fff;border:1px solid #dce6f0;border-radius:16px;padding:14px;margin:10px 0}.g10v146-card h3{margin:0 0 5px;color:#153a66}.g10v146-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.g10v146-row{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center;border:1px solid #dce6f0;border-radius:12px;padding:9px}.g10v146-num{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#eaf2ff;color:#0b5fad;font-weight:950}.g10v146-ref{font-size:10px;color:#087a43;font-weight:950;margin-top:3px}.g10v146-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.g10v146-modal{display:none;position:fixed;inset:0;background:rgba(3,20,39,.76);z-index:99999;padding:16px;overflow:auto}.g10v146-modal.open{display:flex}.g10v146-modal-card{width:min(540px,100%);margin:auto;background:#fff;border-radius:18px;padding:14px}.g10v146-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.g10v146-head h3{margin:0;color:#153a66}.g10v146-badge{max-width:410px;margin:12px auto;border:2px solid #f3c62f;border-radius:18px;overflow:hidden}.g10v146-badge-top{padding:14px 16px;background:linear-gradient(135deg,#eef9ff,#d8f1ff);border-bottom:5px solid #f3c62f}.g10v146-logo{font-size:25px;font-weight:1000;color:#123d78}.g10v146-badge-body{display:grid;grid-template-columns:1fr 154px;gap:12px;padding:16px;align-items:center}.g10v146-name{font-size:19px;color:#123d78;font-weight:950;line-height:1.15}.g10v146-code{width:154px;height:154px;display:grid;place-items:center;border:1px solid #dce6f0;border-radius:12px}.g10v146-label{text-align:center;padding:0 16px 14px;color:#087a43;font-weight:950}.g10v146-reader{min-height:280px;border:1px solid #dce6f0;border-radius:12px;overflow:hidden;margin-top:10px}.g10v146-result{margin-top:10px;padding:12px;border-radius:12px;background:#eef4f9;font-size:12px}.g10v146-result.ok{background:#e8f8ef;color:#087a43;border:1px solid #bfe5ce}.g10v146-result.bad{background:#fff0f0;color:#a12b2b;border:1px solid #e7b8b8}.g10v146-arrival{margin-top:10px;border-radius:18px;overflow:hidden;border:1px solid #dce6f0;background:#fff}.g10v146-arrival-top{background:linear-gradient(135deg,#0b5fad,#123d78);color:#fff;padding:14px 16px}.g10v146-arrival-body{padding:16px}.g10v146-arrival-school{font-size:20px;font-weight:950;color:#123d78}.g10v146-arrival-ok{margin-top:10px;background:#e8f8ef;color:#087a43;border:1px solid #bfe5ce;border-radius:12px;padding:12px;font-weight:900}.g10v146-mini{font-size:10px;color:#6a7f91;line-height:1.45}@media(max-width:760px){.g10v146-grid{grid-template-columns:1fr}.g10v146-badge-body{grid-template-columns:1fr 128px}.g10v146-code{width:128px;height:128px}}.g10v146-th-qr,.g10v146-td-qr{text-align:center;white-space:nowrap}.g10v146-table-qr{border:0;border-radius:8px;background:#eaf2ff;color:#0b5fad;font-weight:900;padding:6px 9px;cursor:pointer;font-size:11px}.g10v146-table-qr:hover{background:#dceaff}";
  document.head.appendChild(css);

  window.ensureG10QrRefs=function(){
    if(!window.st||!Array.isArray(st.subs))return false;
    var max=0,changed=false;
    st.subs.forEach(function(x){max=Math.max(max,seq(x.qrRef))});
    st.subs.forEach(function(x){if(!x.qrRef){max++;x.qrRef=QR_PREFIX+pad(max);changed=true}});
    st.qrSequenceMax=Math.max(Number(st.qrSequenceMax||0),max);
    if(changed&&typeof save==="function")save();
    return changed
  };

  function byRef(raw){
    ensureG10QrRefs();var code=normalizeCode(raw);
    return st.subs.find(function(x){return String(x.qrRef||"").toUpperCase()===code})||null
  }
  function registryHtml(){
    ensureG10QrRefs();
    return '<div class="g10v146-card"><h3>QR individuels des élèves</h3><div class="g10v146-mini">Chaque QR identifie uniquement la référence G10 de l’élève. Le scan ouvre sa fiche de ramassage.</div><div class="g10v146-grid">'+st.subs.map(function(x,i){
      return '<div class="g10v146-row"><div class="g10v146-num">'+pad(i+1)+'</div><div><b>'+esc(x.name)+'</b><div class="g10v146-mini">'+esc(x.school||"École à renseigner")+'</div><div class="g10v146-ref">'+esc(x.qrRef)+'</div></div><button class="btn light" onclick="openG10QrBadgeV146(\''+String(x.id).replace(/'/g,"\\'")+'\')">Voir QR</button></div>'
    }).join("")+'</div></div>'
  }
  function scannerCard(){
    return '<div class="g10v146-card"><h3>Montée par QR</h3><div class="g10v146-mini">Scanne le badge de l’enfant au moment du ramassage. La montée est enregistrée dans Firebase et visible dans son espace parent.</div><div class="g10v146-actions"><button class="btn blue" onclick="openG10QrScannerV146()">📷 Scanner un enfant</button></div></div>'
  }
  function integrateQrInSubscribers(){
    ensureG10QrRefs();
    var b=document.getElementById("adminBody");if(!b)return;
    var oldCards=b.querySelectorAll(".g10v146-card");for(var oc=0;oc<oldCards.length;oc++)oldCards[oc].remove();
    var tables=b.querySelectorAll("table"),table=null,headRow=null,tarifIdx=-1,ramIdx=-1;
    for(var i=0;i<tables.length;i++){
      var rows=tables[i].rows;if(!rows||!rows.length)continue;
      for(var r=0;r<Math.min(rows.length,3);r++){
        var cells=rows[r].cells,ti=-1,ri=-1;
        for(var j=0;j<cells.length;j++){
          var txt=String(cells[j].innerText||cells[j].textContent||"").trim().toLowerCase();
          if(txt==="tarif"||txt.indexOf("tarif")===0)ti=j;
          if(txt.indexOf("ramassage")>=0)ri=j;
        }
        if(ti>=0&&ri>=0){table=tables[i];headRow=rows[r];tarifIdx=ti;ramIdx=ri;break}
      }
      if(table)break;
    }
    if(!table||!headRow)return;
    if(!headRow.querySelector(".g10v146-th-qr")){
      var th=document.createElement("th");th.className="g10v146-th-qr";th.textContent="QR code";
      headRow.insertBefore(th,headRow.cells[ramIdx]);
    }
    var bodyRows=table.querySelectorAll("tr");
    for(var k=0;k<bodyRows.length;k++){
      var row=bodyRows[k];if(row===headRow||row.querySelector(".g10v146-td-qr"))continue;
      var txt=String(row.innerText||row.textContent||"");
      var x=null;
      for(var s=0;s<st.subs.length;s++){if(st.subs[s].name&&txt.indexOf(st.subs[s].name)>=0){x=st.subs[s];break}}
      if(!x)continue;
      var td=document.createElement("td");td.className="g10v146-td-qr";
      td.innerHTML='<button class="g10v146-table-qr" onclick="openG10QrBadgeV146(\''+String(x.id).replace(/'/g,"\\'")+'\')">Voir QR</button>';
      var idx=Math.min(ramIdx,row.cells.length);
      row.insertBefore(td,row.cells[idx]||null);
    }
  }
  function ensureModal(){
    var m=document.getElementById("g10v146Modal");if(m)return m;
    m=document.createElement("div");m.id="g10v146Modal";m.className="g10v146-modal";
    m.innerHTML='<div class="g10v146-modal-card"><div class="g10v146-head"><h3 id="g10v146Title">G10 Transport Scolaire</h3><button class="btn light" onclick="closeG10QrModalV146()">Fermer</button></div><div id="g10v146Body"></div></div>';
    document.body.appendChild(m);return m
  }
  window.closeG10QrModalV146=function(){
    if(scannerRunning&&scanner){try{scanner.stop().then(function(){scanner.clear()})}catch(e){}scannerRunning=false}
    var m=document.getElementById("g10v146Modal");if(m)m.classList.remove("open")
  };
  window.openG10QrBadgeV146=function(id){
    ensureG10QrRefs();var x=st.subs.find(function(s){return String(s.id)===String(id)});if(!x)return;
    var m=ensureModal(),body=document.getElementById("g10v146Body");
    document.getElementById("g10v146Title").textContent="Badge QR de "+x.name;
    body.innerHTML='<div class="g10v146-badge"><div class="g10v146-badge-top"><div class="g10v146-logo">G10 TRANSPORT SCOLAIRE</div><div class="g10v146-mini" style="color:#087a43;font-weight:900">ZONE AKANDA</div></div><div class="g10v146-badge-body"><div><div class="g10v146-name">'+esc(x.name)+'</div><div class="g10v146-mini">'+esc(x.school||"")+'<br>'+esc(x.className||"")+'</div></div><div id="g10v146Code" class="g10v146-code"></div></div><div class="g10v146-label">'+esc(x.qrRef)+'</div></div>';
    m.classList.add("open");
    ensureLibs().then(function(){var host=document.getElementById("g10v146Code");if(host&&window.QRCode){host.innerHTML="";new QRCode(host,{text:badgeUrl(x.qrRef),width:140,height:140,correctLevel:QRCode.CorrectLevel.H})}})
  };
  function result(msg,kind){var e=document.getElementById("g10v146Result");if(e){e.textContent=msg;e.className="g10v146-result "+(kind||"")}}
  function process(raw){
    var x=byRef(raw);if(!x){result("QR non reconnu.","bad");return false}
    if(x.ride==="Monté"){
      result("✅ À bord — ramassage confirmé • "+hhmm(x.lastQrBoardingAt),"ok");return true
    }
    x.ride="Monté";x.lastQrBoardingAt=new Date().toISOString();x.lastQrBoardingRef=x.qrRef;x.boardingMethod="QR";
    if(typeof childEvent==="function")childEvent(x.id,"À bord — ramassage confirmé • "+hhmm(x.lastQrBoardingAt));
    if(typeof save==="function")save();
    if(typeof log==="function")log(x.name+" : montée QR "+x.qrRef);
    result("✅ À bord — ramassage confirmé • "+hhmm(x.lastQrBoardingAt),"ok");
    if(navigator.vibrate)try{navigator.vibrate(120)}catch(e){}
    return true
  }
  window.openG10QrScannerV146=function(){
    var m=ensureModal(),body=document.getElementById("g10v146Body");
    document.getElementById("g10v146Title").textContent="Scanner une montée";
    body.innerHTML='<div id="g10v146Reader" class="g10v146-reader"></div><div id="g10v146Result" class="g10v146-result">Présente le badge QR devant la caméra.</div>';
    m.classList.add("open");
    ensureLibs().then(function(){
      if(!window.Html5Qrcode){result("Scanner indisponible.","bad");return}
      scanner=new Html5Qrcode("g10v146Reader");
      scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:220,height:220}},function(text){if(process(text)){try{scanner.pause(true)}catch(e){}}},function(){}).then(function(){scannerRunning=true}).catch(function(){result("Autorise la caméra pour scanner le badge.","bad")})
    })
  };

  function parentArrivalHtml(x){
    if(!x)return "";
    if(!(x.schoolArrivalAt||st.schools&&st.schools[x.school]))return "";
    var when=x.schoolArrivalAt||new Date().toISOString();
    return '<div class="g10v146-arrival"><div class="g10v146-arrival-top"><b>G10 TRANSPORT SCOLAIRE</b><div class="g10v146-mini" style="color:#fff;opacity:.9">Confirmation de descente</div></div><div class="g10v146-arrival-body"><div class="g10v146-arrival-school">'+esc(x.school||"École")+'</div><div class="g10v146-arrival-ok">✅ Arrivé à l’école — descente confirmée • '+hhmm(when)+'</div></div></div>'
  }

  function hook(){
    if(!window.st||!window.adminTab||!window.driverTab||!window.parentView||!window.school){setTimeout(hook,200);return}
    ensureG10QrRefs();

    if(!window.__G10_QR_ADMIN_HOOK__){
      window.__G10_QR_ADMIN_HOOK__=true;
      var oldAdmin=window.adminTab;
      window.adminTab=function(t){oldAdmin(t);if(t==="abonnes"){setTimeout(integrateQrInSubscribers,80)}}
    }
    if(!window.__G10_QR_DRIVER_HOOK__){
      window.__G10_QR_DRIVER_HOOK__=true;
      var oldDriver=window.driverTab;
      window.driverTab=function(t){oldDriver(t);if(t==="montees"){var b=document.getElementById("driverBody");if(b&&!b.querySelector(".g10v146-card"))b.insertAdjacentHTML("afterbegin",scannerCard())}}
    }
    if(!window.__G10_QR_PARENT_HOOK__){
      window.__G10_QR_PARENT_HOOK__=true;
      var oldParent=window.parentView;
      window.parentView=function(x){return oldParent(x)+parentArrivalHtml(x)}
    }
    if(!window.__G10_SCHOOL_HOOK__){
      window.__G10_SCHOOL_HOOK__=true;
      window.school=function(s){
        st.schools=st.schools||{};
        st.schools[s]=!st.schools[s];
        if(st.schools[s]){
          var now=new Date().toISOString();
          st.subs.filter(function(x){return x.school===s&&x.ride==="Monté"}).forEach(function(x){
            x.schoolArrivalAt=now;x.schoolDropConfirmed=true;
            if(typeof childEvent==="function")childEvent(x.id,"Arrivé à l’école — descente confirmée • "+hhmm(now))
          })
        }
        if(typeof save==="function")save();
        if(typeof log==="function")log(s+" : "+(st.schools[s]?"descente école confirmée":"descente école annulée"));
        if(typeof driverTab==="function")driverTab("ecoles")
      }
    }
  }
  hook();
})();