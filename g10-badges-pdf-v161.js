/* G10 — export PDF des badges déjà attribués, sans modifier Firebase.
 * Préproduction uniquement. Ne crée jamais de QR ni de fiche.
 */
(function (global) {
  'use strict';
  if (global.G10BadgePdfV161) return;
  const QR_LIB='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  const PDF_LIB='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
  function load(src, id) {
    return new Promise((resolve,reject)=>{
      const old=document.getElementById(id);
      if (id==='g10-v161-qr-lib' && global.QRCode) { resolve(); return; }
      if (id==='g10-v161-pdf-lib' && global.jspdf?.jsPDF) { resolve(); return; }
      if (old) { if (old.dataset.ready==='1') resolve(); else {old.addEventListener('load',resolve,{once:true});old.addEventListener('error',()=>reject(new Error('Bibliothèque inaccessible.')),{once:true});} return; }
      const script=document.createElement('script');script.id=id;script.src=src;script.crossOrigin='anonymous';
      script.onload=()=>{script.dataset.ready='1';resolve();};
      script.onerror=()=>reject(new Error('Bibliothèque PDF ou QR inaccessible : vérifier la connexion Internet.'));
      document.head.appendChild(script);
    });
  }
  function existingBadges(state) {
    if (!state || !Array.isArray(state.subs)) throw new Error('Liste des abonnés V2 indisponible.');
    const all=state.subs.filter(x=>x && typeof x==='object');
    const ready=all.filter(x=>typeof x.qrRef==='string' && /^G10-TP-SCOL-QR[0-9]+$/i.test(x.qrRef.trim()));
    const skipped=all.length-ready.length;
    const refs=new Set();
    for (const row of ready) {
      const ref=row.qrRef.trim().toUpperCase();
      if (refs.has(ref)) throw new Error('Deux abonnés partagent le même QR : export arrêté pour éviter un mauvais badge.');
      refs.add(ref);
    }
    return {ready,skipped,total:all.length};
  }
  function badgeUrl(ref) {
    const url=new URL('qr-test.html',location.href);
    url.searchParams.set('code',ref.trim());url.searchParams.set('v','4');
    return url.href;
  }
  function qrData(ref) {
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:-10000px;top:-10000px;width:190px;height:190px';
    document.body.appendChild(host);
    try {
      new global.QRCode(host,{text:badgeUrl(ref),width:190,height:190,correctLevel:global.QRCode.CorrectLevel.H});
      const canvas=host.querySelector('canvas');
      if (!canvas) throw new Error('Impossible de générer le QR '+ref);
      return canvas.toDataURL('image/png');
    } finally { host.remove(); }
  }
  function draw(doc,row,index) {
    const col=index%2, r=Math.floor((index%4)/2);
    const x=12+col*95, y=15+r*138, w=91,h=132;
    doc.setDrawColor(225,185,30);doc.setLineWidth(1.1);doc.roundedRect(x,y,w,h,4,4);
    doc.setFillColor(232,247,255);doc.roundedRect(x+1,y+1,w-2,25,3,3,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(18,61,120);
    doc.text('G10 TRANSPORT SCOLAIRE',x+5,y+11,{maxWidth:w-10});
    doc.setFontSize(9);doc.setTextColor(0,118,68);doc.text('BADGE SCOLAIRE',x+5,y+19);
    doc.setTextColor(18,61,120);doc.setFontSize(12);
    const name=String(row.name||'Nom non renseigné');
    doc.text(doc.splitTextToSize(name,w-10).slice(0,2),x+5,y+34);
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(60,80,95);
    const school=String(row.school||'École non renseignée');
    doc.text(doc.splitTextToSize(school,w-10).slice(0,2),x+5,y+49);
    doc.text(String(row.className||''),x+5,y+59,{maxWidth:w-10});
    const img=qrData(row.qrRef);
    doc.addImage(img,'PNG',x+26,y+63,39,39);
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(0,118,68);
    doc.text(String(row.qrRef).trim(),x+w/2,y+111,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(80,95,110);
    doc.text('Présenter au chauffeur',x+w/2,y+119,{align:'center'});
  }
  let running=false;
  async function exportPdf() {
    if(running)return;
    const auth=global.firebase?.auth?.();
    if(!auth?.currentUser)throw new Error('Connexion Firebase requise avant export.');
    const roleSnap=await global.firebase.database().ref('g10TransportScolaireV3/roles/'+auth.currentUser.uid).once('value');
    const role=roleSnap.val();
    if(!role || role.enabled!==true || !['direction','admin'].includes(role.role))throw new Error('Accès Direction/Administration requis.');
    const data=existingBadges(global.st);
    if(!data.ready.length)throw new Error('Aucun badge QR déjà attribué. Aucun QR créé automatiquement.');
    if(data.skipped && !global.confirm(data.skipped+' dossier(s) sans QR valide seront exclus. Continuer avec '+data.ready.length+' badges ?'))return;
    running=true;
    try {
      await Promise.all([global.QRCode ? Promise.resolve() : load(QR_LIB,'g10-v161-qr-lib'),global.jspdf?.jsPDF ? Promise.resolve() : load(PDF_LIB,'g10-v161-pdf-lib')]);
      const doc=new global.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      data.ready.forEach((row,i)=>{if(i && i%4===0)doc.addPage();draw(doc,row,i);});
      doc.save('G10-badges-QR-'+new Date().toISOString().slice(0,10)+'.pdf');
      return {exported:data.ready.length,excluded:data.skipped};
    } finally {running=false;}
  }
  function install() {
    if(document.getElementById('g10-export-all-badges'))return;
    const btn=document.createElement('button');btn.id='g10-export-all-badges';btn.type='button';
    btn.textContent='Télécharger tous les badges (PDF)';
    btn.style.cssText='margin:8px;padding:12px;background:#eaf2ff;color:#123d78;border:1px solid #bcd8f2;border-radius:10px;font-weight:700;cursor:pointer';
    const msg=document.createElement('span');msg.id='g10-badges-status';msg.style.cssText='font-size:12px;display:block;margin:4px 8px';
    btn.onclick=async()=>{
      btn.disabled=true;msg.textContent='Préparation du PDF, sans modification des dossiers…';
      try {const result=await exportPdf();msg.textContent=result?'PDF prêt : '+result.exported+' badges ; '+result.excluded+' dossiers exclus.':'Export annulé.';}
      catch(e){msg.textContent='Export non réalisé : '+e.message;}
      finally{btn.disabled=false;}
    };
    const root=document.getElementById('adminBody')||document.body;
    root.prepend(msg);root.prepend(btn);
  }
  global.G10BadgePdfV161=Object.freeze({existingBadges,badgeUrl,exportPdf,install});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window);
