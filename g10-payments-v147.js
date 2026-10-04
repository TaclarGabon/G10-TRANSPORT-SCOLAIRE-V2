/* G10 Transport Scolaire — Paiements unifiés V1.47.1 */
(function(){
  if(window.__G10_PAYMENTS_V1471_ROW__) return;
  window.__G10_PAYMENTS_V1471_ROW__=true;

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
  function money(v){return Number(v||0).toLocaleString("fr-FR")+" FCFA"}
  function currentMonthKey(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
  function monthLabel(k){var m=String(k||"").match(/^(\d{4})-(\d{2})$/);if(!m)return"";return new Date(Number(m[1]),Number(m[2])-1,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
  function nextMonthKey(k){var m=String(k||currentMonthKey()).match(/^(\d{4})-(\d{2})$/),d=m?new Date(Number(m[1]),Number(m[2])-1,1):new Date();d.setMonth(d.getMonth()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
  function parentKey(x){return String(x.parentPhone||x.phoneParent||x.guardianPhone||x.parentTel||x.phone||x.parentName||x.guardian||x.responsable||"").trim().toLowerCase()}
  function ensure(x){if(!x.paymentV147)x.paymentV147={discountPct:0,advanceAmount:0,advanceFor:"",monthKey:currentMonthKey(),updatedAt:""};if(!x.paymentV147.monthKey)x.paymentV147.monthKey=currentMonthKey();return x.paymentV147}
  function baseAmount(x){
    var k=["monthlyPrice","monthlyFee","subscriptionPrice","subscriptionAmount","price","amount","tarif","fee","montant","monthly","mensualite","monthlyAmount","schoolFee","transportFee","paymentAmount","paidAmount"];
    for(var i=0;i<k.length;i++){var n=Number(x[k[i]]);if(isFinite(n)&&n>0)return n}
    var nested=[x.payment,x.subscription,x.plan,x.billing];
    for(var j=0;j<nested.length;j++){var o=nested[j];if(!o)continue;for(var z=0;z<k.length;z++){var nn=Number(o[k[z]]);if(isFinite(nn)&&nn>0)return nn}}
    return Number(x.paymentBaseV147||0)
  }
  function calc(x){var p=ensure(x),b=baseAmount(x),discount=Math.round(b*Number(p.discountPct||0)/100);return{base:b,discount:discount,net:b-discount}}
  function familyCount(x){var k=parentKey(x);if(!k||!window.st||!Array.isArray(st.subs))return 0;return st.subs.filter(function(s){return parentKey(s)===k}).length}
  function saveNow(){if(typeof save==="function")save()}
  function findSub(id){return st.subs.find(function(s){return String(s.id)===String(id)})}
  function idq(x){return String(x.id).replace(/'/g,"\\'")}
  function advanceOpts(cur){var h='<option value="0">Aucune</option>';for(var n=30000;n<=100000;n+=5000)h+='<option value="'+n+'" '+(Number(cur)===n?'selected':'')+'>'+money(n)+'</option>';return h}

  window.g10V147Base=function(id,v){var x=findSub(id);if(!x)return;x.paymentBaseV147=Math.max(0,Number(v||0));ensure(x).updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Discount=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x);p.discountPct=Number(v)===10?10:0;p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Advance=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x),n=Number(v||0);p.advanceAmount=n;p.advanceFor=n?monthLabel(nextMonthKey(p.monthKey)):"";p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Month=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x);p.monthKey=String(v||currentMonthKey());if(p.advanceAmount)p.advanceFor=monthLabel(nextMonthKey(p.monthKey));p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}

  function exactNameNodes(root,name){
    var all=root.querySelectorAll("div,span,b,strong,p,h4,h5,td");var out=[];
    for(var i=0;i<all.length;i++){var e=all[i];if(e.closest&&e.closest('.g10v147-cell'))continue;if(String(e.textContent||'').trim()===String(name||'').trim())out.push(e)}
    return out
  }
  function paymentRowFor(root,x){
    var nodes=exactNameNodes(root,x.name),best=null,bestLen=1e9;
    for(var i=0;i<nodes.length;i++){
      var e=nodes[i];
      for(var up=0;up<8&&e&&e!==root;up++,e=e.parentElement){
        var t=String(e.innerText||e.textContent||'');
        if(!/Reçu|Payé|Non payé|À vérifier|Mode à renseigner|Mobile Money|Espèces/i.test(t))continue;
        var count=0;for(var j=0;j<st.subs.length;j++)if(st.subs[j].name&&t.indexOf(st.subs[j].name)>=0)count++;
        if(count>1)continue;
        if(t.length<bestLen){best=e;bestLen=t.length}
      }
    }
    return best
  }
  function cell(cls,label,body){return '<div class="g10v147-cell '+cls+'"><label>'+label+'</label>'+body+'</div>'}
  function cellsHtml(x){
    var p=ensure(x),c=calc(x),id=idq(x),next=monthLabel(nextMonthKey(p.monthKey)),fam=familyCount(x);
    var warn=fam>1?'<div class="g10v147-family">Même responsable : '+fam+' enfants</div>':'';
    return cell("g10v147-month","Mois concerné",'<input type="month" value="'+esc(p.monthKey)+'" onchange="g10V147Month(\''+id+'\',this.value)">')+
      cell("g10v147-tarif","Tarif mensuel",'<input type="number" min="0" step="5000" value="'+c.base+'" onchange="g10V147Base(\''+id+'\',this.value)">')+
      cell("g10v147-discount","Réduction",'<select onchange="g10V147Discount(\''+id+'\',this.value)"><option value="0" '+(Number(p.discountPct||0)===0?'selected':'')+'>Aucune</option><option value="10" '+(Number(p.discountPct||0)===10?'selected':'')+'>10 %</option></select>'+warn)+
      cell("g10v147-discountamount","Montant réduction",'<div class="g10v147-display">'+(c.discount>0?money(c.discount):'—')+'</div>')+
      cell("g10v147-advance","Avance — "+esc(next),'<select onchange="g10V147Advance(\''+id+'\',this.value)">'+advanceOpts(p.advanceAmount)+'</select>')
  }
  function directChildren(row){return Array.prototype.slice.call(row.children||[])}
  function placeCells(row,x){
    var old=row.querySelectorAll(":scope > .g10v147-cell");for(var i=0;i<old.length;i++)old[i].remove();
    var kids=directChildren(row);
    if(kids.length<2)return;
    var anchor=kids[1];
    var wrap=document.createElement("div");wrap.innerHTML=cellsHtml(x);
    var nodes=Array.prototype.slice.call(wrap.children);
    for(var n=0;n<nodes.length;n++)row.insertBefore(nodes[n],anchor);
    row.classList.add("g10v147-one-row");
    var now=directChildren(row);
    for(var j=0;j<now.length;j++){now[j].classList.add("g10v147-grid-child");now[j].style.minWidth="0"}
    var labels=["Statut paiement","Montant payé","Date","Mode de paiement","Reçu"];
    var tail=directChildren(row).slice(-5);
    for(var k=0;k<tail.length;k++){
      if(!(tail[k].querySelector&&tail[k].querySelector(".g10v147-native-label"))){
        var lab=document.createElement("div");lab.className="g10v147-native-label";lab.textContent=labels[k];
        tail[k].insertBefore(lab,tail[k].firstChild);
      }
    }
    var receipt=tail[4];
    if(receipt){
      var btn=receipt.querySelector("button");
      if(btn){
        var children=Array.prototype.slice.call(receipt.children);
        for(var r=0;r<children.length;r++){
          if(!children[r].classList.contains("g10v147-native-label")&&children[r]!==btn)children[r].style.display="none";
        }
        var nodesTxt=Array.prototype.slice.call(receipt.childNodes);
        for(var t=0;t<nodesTxt.length;t++){
          if(nodesTxt[t].nodeType===3&&String(nodesTxt[t].nodeValue||"").trim())nodesTxt[t].nodeValue="";
        }
      }
    }
  }
  function enhancePayments(){
    var root=document.getElementById("adminBody");if(!root||!window.st||!Array.isArray(st.subs))return;
    var legacy=root.querySelectorAll("#g10v147Payments,.g10v147-inline");for(var q=0;q<legacy.length;q++)legacy[q].remove();
    for(var i=0;i<st.subs.length;i++){var x=st.subs[i],row=paymentRowFor(root,x);if(row)placeCells(row,x)}
  }

  var css=document.createElement("style");css.id="g10v147-row-style";
  css.textContent=".g10v147-one-row{display:grid!important;grid-template-columns:180px 128px 98px 98px 108px 145px 116px 118px 132px 145px 92px!important;gap:6px!important;align-items:end!important;padding:10px 10px!important}.g10v147-one-row>.g10v147-grid-child{width:auto!important;max-width:none!important;margin:0!important;align-self:end!important}.g10v147-cell{min-width:0}.g10v147-cell label,.g10v147-native-label{display:block;font-size:10px;line-height:1.1;color:#5d7185;font-weight:850;margin-bottom:5px;white-space:normal;min-height:20px}.g10v147-cell input,.g10v147-cell select,.g10v147-one-row>.g10v147-grid-child input,.g10v147-one-row>.g10v147-grid-child select{width:100%!important;min-width:0!important;box-sizing:border-box!important;border-radius:8px!important;padding:7px 7px!important;font-size:12px!important;min-height:38px!important}.g10v147-display{height:38px;box-sizing:border-box;display:flex;align-items:center;padding:7px 8px;border-radius:8px;background:#f3f7fb;color:#153a66;font-weight:900;font-size:12px}.g10v147-family{font-size:8.5px;line-height:1.05;margin-top:2px;color:#8a6200;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.g10v147-one-row button{min-width:76px!important;max-width:92px!important;padding:7px 10px!important;font-size:12px!important;min-height:38px!important}.g10v147-one-row>.g10v147-grid-child:first-child{font-size:125%!important}.g10v147-one-row>.g10v147-grid-child:last-child{overflow:hidden!important}.g10v147-one-row>.g10v147-grid-child:last-child .g10v147-native-label{position:static!important}.g10v147-one-row>.g10v147-grid-child:last-child button{display:block!important;margin:0!important}@media(max-width:1500px){.g10v147-one-row{grid-template-columns:170px 118px 90px 90px 100px 135px 108px 108px 122px 135px 86px!important;gap:5px!important}.g10v147-cell label,.g10v147-native-label{font-size:9px}.g10v147-cell input,.g10v147-cell select,.g10v147-one-row>.g10v147-grid-child input,.g10v147-one-row>.g10v147-grid-child select,.g10v147-display{font-size:11px!important}}";
  document.head.appendChild(css);

  function hook(){
    if(!window.st||!window.adminTab){setTimeout(hook,250);return}
    if(window.__G10_PAYMENTS_ADMIN_HOOK_ROW__)return;
    window.__G10_PAYMENTS_ADMIN_HOOK_ROW__=true;
    var old=window.adminTab;
    window.adminTab=function(t){
      old(t);
      setTimeout(function(){var key=String(t||'').toLowerCase();if(key.indexOf('pai')>=0||key.indexOf('cotis')>=0)enhancePayments()},100)
    }
  }
  hook();
})();