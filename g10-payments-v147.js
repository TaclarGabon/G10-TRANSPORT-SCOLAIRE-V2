/* G10 Transport Scolaire — Paiements unifiés V1.47.1 */
(function(){
  if(window.__G10_PAYMENTS_V1471__) return;
  window.__G10_PAYMENTS_V1471__=true;

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
  function money(v){return Number(v||0).toLocaleString("fr-FR")+" FCFA"}
  function monthLabelFromKey(key){var m=String(key||"").match(/^(\d{4})-(\d{2})$/);if(!m)return"";return new Date(Number(m[1]),Number(m[2])-1,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
  function currentMonthKey(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
  function nextMonthKey(key){var m=String(key||currentMonthKey()).match(/^(\d{4})-(\d{2})$/),d=m?new Date(Number(m[1]),Number(m[2])-1,1):new Date();d.setMonth(d.getMonth()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
  function parentKey(x){return String(x.parentPhone||x.phoneParent||x.guardianPhone||x.parentTel||x.phone||x.parentName||x.guardian||x.responsable||"").trim().toLowerCase()}
  function ensure(x){if(!x.paymentV147)x.paymentV147={discountPct:0,advanceAmount:0,advanceFor:"",monthKey:currentMonthKey(),updatedAt:""};if(!x.paymentV147.monthKey)x.paymentV147.monthKey=currentMonthKey();return x.paymentV147}
  function baseAmount(x){
    var k=["monthlyPrice","monthlyFee","subscriptionPrice","subscriptionAmount","price","amount","tarif","fee","montant","monthly","mensualite","monthlyAmount","schoolFee","transportFee","paymentAmount","paidAmount"];
    for(var i=0;i<k.length;i++){var n=Number(x[k[i]]);if(isFinite(n)&&n>0)return n}
    var nested=[x.payment,x.subscription,x.plan,x.billing];
    for(var j=0;j<nested.length;j++){var o=nested[j];if(!o)continue;for(var z=0;z<k.length;z++){var nn=Number(o[k[z]]);if(isFinite(nn)&&nn>0)return nn}}
    return Number(x.paymentBaseV147||0)
  }
  function calc(x){var p=ensure(x),b=baseAmount(x),d=Math.round(b*(1-Number(p.discountPct||0)/100)),a=Number(p.advanceAmount||0);return{base:b,discounted:d,advance:a,balance:Math.max(0,d-a)}}
  function familyCount(x){var k=parentKey(x);if(!k||!window.st||!Array.isArray(st.subs))return 0;return st.subs.filter(function(s){return parentKey(s)===k}).length}
  function saveNow(){if(typeof save==="function")save()}
  function findSub(id){return st.subs.find(function(s){return String(s.id)===String(id)})}
  function idq(x){return String(x.id).replace(/'/g,"\\'")}
  function opts(cur){var h='<option value="0">Aucune avance</option>';for(var n=30000;n<=100000;n+=5000)h+='<option value="'+n+'" '+(Number(cur)===n?'selected':'')+'>'+money(n)+'</option>';return h}

  window.g10V147Base=function(id,v){var x=findSub(id);if(!x)return;x.paymentBaseV147=Math.max(0,Number(v||0));ensure(x).updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Discount=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x);p.discountPct=Number(v)===10?10:0;p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Advance=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x),n=Number(v||0);p.advanceAmount=n;p.advanceFor=n?monthLabelFromKey(nextMonthKey(p.monthKey)):"";p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}
  window.g10V147Month=function(id,v){var x=findSub(id);if(!x)return;var p=ensure(x);p.monthKey=String(v||currentMonthKey());if(p.advanceAmount)p.advanceFor=monthLabelFromKey(nextMonthKey(p.monthKey));p.updatedAt=new Date().toISOString();saveNow();enhancePayments()}

  function exactNameNodes(root,name){
    var all=root.querySelectorAll("div,span,b,strong,p,h4,h5,td");var out=[];
    for(var i=0;i<all.length;i++){var e=all[i];if(e.closest&&e.closest('.g10v147-inline'))continue;if(String(e.textContent||'').trim()===String(name||'').trim())out.push(e)}
    return out
  }
  function paymentRowFor(root,x){
    var nodes=exactNameNodes(root,x.name),best=null,bestLen=1e9;
    for(var i=0;i<nodes.length;i++){
      var e=nodes[i];
      for(var up=0;up<7&&e&&e!==root;up++,e=e.parentElement){
        var t=String(e.innerText||e.textContent||'');
        var looks=/Reçu|Payé|Non payé|À vérifier|Mode à renseigner|Mobile Money|Espèces/i.test(t);
        if(!looks)continue;
        var count=0;
        for(var j=0;j<st.subs.length;j++)if(st.subs[j].name&&t.indexOf(st.subs[j].name)>=0)count++;
        if(count>1)continue;
        if(t.length<bestLen){best=e;bestLen=t.length}
      }
    }
    return best
  }
  function inlineHtml(x){
    var p=ensure(x),c=calc(x),id=idq(x),fam=familyCount(x),nextLabel=monthLabelFromKey(nextMonthKey(p.monthKey));
    var warn=fam>1?'<div class="g10v147-family">👨‍👩‍👧‍👦 Même responsable : '+fam+' enfants — réduction 10 % disponible</div>':'';
    var discountAmount=Number(p.discountPct||0)>0?money(c.base-c.discounted):'—';
    var advanceDisplay=Number(p.advanceAmount||0)>0?money(p.advanceAmount)+' → '+esc(nextLabel):'—';
    return '<div class="g10v147-inline" data-g10-pay="'+esc(x.id)+'">'+
      '<div class="g10v147-field"><label>Mois concerné</label><input type="month" value="'+esc(p.monthKey)+'" onchange="g10V147Month(\''+id+'\',this.value)"></div>'+
      '<div class="g10v147-field"><label>Tarif mensuel</label><input type="number" min="0" step="5000" value="'+c.base+'" onchange="g10V147Base(\''+id+'\',this.value)"></div>'+
      '<div class="g10v147-field"><label>Réduction</label><select onchange="g10V147Discount(\''+id+'\',this.value)"><option value="0" '+(Number(p.discountPct||0)===0?'selected':'')+'>Aucune</option><option value="10" '+(Number(p.discountPct||0)===10?'selected':'')+'>−10 %</option></select>'+warn+'</div>'+
      '<div class="g10v147-field"><label>Montant réduction</label><div class="g10v147-value">'+discountAmount+'</div></div>'+
      '<div class="g10v147-field"><label>Avance — '+esc(nextLabel)+'</label><select onchange="g10V147Advance(\''+id+'\',this.value)">'+opts(c.advance)+'</select><div class="g10v147-sub">'+advanceDisplay+'</div></div>'+
      '</div>'
  }
  function enhancePayments(){
    var root=document.getElementById("adminBody");if(!root||!window.st||!Array.isArray(st.subs))return;
    var old=root.querySelector("#g10v147Payments");if(old)old.remove();
    var olds=root.querySelectorAll(".g10v147-inline");for(var q=0;q<olds.length;q++)olds[q].remove();
    for(var i=0;i<st.subs.length;i++){
      var x=st.subs[i],row=paymentRowFor(root,x);if(!row)continue;
      row.classList.add("g10v147-payment-row");
      row.insertAdjacentHTML("beforeend",inlineHtml(x));
    }
  }

  var css=document.createElement("style");
  css.id="g10v1471-style";
  css.textContent=".g10v147-payment-row{position:relative}.g10v147-inline{display:grid;grid-template-columns:minmax(115px,.9fr) minmax(105px,.8fr) minmax(105px,.8fr) minmax(105px,.8fr) minmax(150px,1.15fr);gap:6px;align-items:start;margin-top:6px;padding-top:6px;border-top:1px dashed #d8e3ec}.g10v147-field label{display:block;font-size:8px;color:#6a7f91;font-weight:850;margin-bottom:3px}.g10v147-field input,.g10v147-field select{width:100%;box-sizing:border-box;border:1px solid #cfdbe6;border-radius:8px;padding:5px 6px;background:#fff;font-size:10px}.g10v147-value{padding:6px;border-radius:8px;background:#f3f7fb;color:#153a66;font-weight:900;font-size:10px;min-height:16px}.g10v147-sub{font-size:8px;color:#087a43;font-weight:800;margin-top:3px}.g10v147-family{margin-top:3px;padding:3px 5px;border-radius:6px;background:#fff7d6;color:#8a6200;font-size:8px;font-weight:800}@media(max-width:1000px){.g10v147-inline{grid-template-columns:repeat(2,minmax(0,1fr))}}";
  document.head.appendChild(css);

  function hook(){
    if(!window.st||!window.adminTab){setTimeout(hook,250);return}
    if(window.__G10_PAYMENTS_ADMIN_HOOK_V1471__)return;
    window.__G10_PAYMENTS_ADMIN_HOOK_V1471__=true;
    var old=window.adminTab;
    window.adminTab=function(t){
      old(t);
      setTimeout(function(){var key=String(t||'').toLowerCase();if(key.indexOf('pai')>=0||key.indexOf('cotis')>=0)enhancePayments();else{var r=document.getElementById('g10v147Payments');if(r)r.remove()}},80)
    }
  }
  hook();
})();