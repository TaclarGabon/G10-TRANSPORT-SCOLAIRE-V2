/* G10 V2 — export local PDF de tous les badges QR déjà attribués.
 * Aucun accès réseau aux données, aucune écriture, aucune attribution de QR.
 * Prévu pour être chargé dans le document interne de l'application V2.
 */
(function (root) {
  'use strict';
  const BADGE_COLS = 2, BADGE_ROWS = 4;
  function selectBadges(state) {
    if (!state || !Array.isArray(state.subs)) throw Error('Liste des abonnés V2 indisponible.');
    const rows = state.subs.map((s, i) => ({
      id: String(s.id ?? ''),
      name: String(s.name ?? '').trim(),
      school: String(s.school ?? '').trim(),
      className: String(s.className ?? '').trim(),
      qrRef: String(s.qrRef ?? '').trim()
    }));
    if (!rows.length) throw Error('Aucun abonné : aucun PDF généré.');
    const incomplete = rows.filter(x => !x.id || !x.name || !/^G10-TP-SCOL-QR\d+$/i.test(x.qrRef));
    if (incomplete.length) throw Error(incomplete.length + ' badge(s) incomplet(s) ou sans QR : export bloqué. Vérifier les fiches sans créer de QR automatiquement.');
    const ids = new Set(), refs = new Set();
    for (const row of rows) {
      const key = row.qrRef.toUpperCase();
      if (ids.has(row.id) || refs.has(key)) throw Error('Doublon de fiche ou de référence QR : export bloqué.');
      ids.add(row.id); refs.add(key);
    }
    return rows;
  }
  function badgeUrl(ref, locationHref) {
    const url = new URL('qr-test.html', locationHref);
    url.searchParams.set('code', ref);
    url.searchParams.set('v', '4');
    return url.href;
  }
  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) { // Un chargement en cours ne garantit pas la présence du module.
        const existing = document.getElementById(id);
        if (existing.dataset.ready === 'yes') return resolve();
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', () => reject(Error('Chargement bibliothèque impossible')), {once:true});
        return;
      }
      const s = document.createElement('script');
      s.id = id; s.src = src; s.async = true;
      s.onload = () => { s.dataset.ready = 'yes'; resolve(); };
      s.onerror = () => reject(Error('Bibliothèque PDF/QR indisponible : aucune donnée exportée.'));
      document.head.appendChild(s);
    });
  }
  async function libraries() {
    if (!root.QRCode) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js','g10-bulk-qrcode');
    if (!root.jspdf?.jsPDF) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','g10-bulk-jspdf');
    if (!root.QRCode || !root.jspdf?.jsPDF) throw Error('Bibliothèques de création PDF indisponibles.');
  }
  function qrCanvas(url) {
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
    document.body.appendChild(div);
    try {
      new root.QRCode(div,{text:url,width:200,height:200,correctLevel:root.QRCode.CorrectLevel.H});
      const c = div.querySelector('canvas');
      if (!c) throw Error('QR non généré : export interrompu.');
      const copy = document.createElement('canvas');
      copy.width = c.width;copy.height = c.height;
      copy.getContext('2d').drawImage(c,0,0);
      return copy;
    } finally { div.remove(); }
  }
  function wrapText(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = []; let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines-1];
      while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0,-1);
      lines[maxLines-1] = last + '…';
    }
    return lines;
  }
  function drawBadge(badge, origin) {
    const c = document.createElement('canvas');
    c.width=900;c.height=540;
    const g = c.getContext('2d');
    g.fillStyle='#ffffff';g.fillRect(0,0,900,540);
    g.strokeStyle='#e5b83d';g.lineWidth=9;g.strokeRect(5,5,890,530);
    g.fillStyle='#eaf6ff';g.fillRect(10,10,880,120);
    g.fillStyle='#123d78';g.font='bold 36px Arial,sans-serif';
    g.fillText('G10 TRANSPORT SCOLAIRE',30,72);
    g.fillStyle='#087a43';g.font='bold 19px Arial,sans-serif';g.fillText('BADGE ÉLÈVE',32,108);
    const qr=qrCanvas(badgeUrl(badge.qrRef,origin));
    g.fillStyle='#fff';g.fillRect(625,150,235,235);
    g.drawImage(qr,640,160,205,205);
    g.fillStyle='#123d78';g.font='bold 31px Arial,sans-serif';
    wrapText(g,badge.name,565,3).forEach((line,i)=>g.fillText(line,30,205+i*41));
    g.fillStyle='#465d73';g.font='24px Arial,sans-serif';
    wrapText(g,badge.school,550,2).forEach((line,i)=>g.fillText(line,30,353+i*31));
    g.font='22px Arial,sans-serif';g.fillText(badge.className,30,441);
    g.fillStyle='#087a43';g.font='bold 22px Arial,sans-serif';
    g.fillText(badge.qrRef,610,422);
    g.fillStyle='#5d7184';g.font='17px Arial,sans-serif';
    g.fillText('Présenter au chauffeur lors du ramassage',30,504);
    return c;
  }
  let running=false;
  async function exportBadges() {
    if (running) return;
    running=true;
    const btn=document.getElementById('g10-bulk-badges-button');
    const msg=document.getElementById('g10-bulk-badges-status');
    if (btn) btn.disabled=true;
    try {
      const badges=selectBadges(root.st); // Vérification AVANT chargement externe.
      if (msg) msg.textContent='Préparation de '+badges.length+' badges…';
      await libraries();
      const pdf=new root.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const perPage=BADGE_COLS*BADGE_ROWS;
      for (let i=0;i<badges.length;i++) {
        if (i>0 && i%perPage===0) pdf.addPage();
        const slot=i%perPage, x=9+(slot%BADGE_COLS)*98, y=9+Math.floor(slot/BADGE_COLS)*71;
        pdf.addImage(drawBadge(badges[i],location.href).toDataURL('image/png'),'PNG',x,y,93,60);
        if (msg && (i%4===0 || i===badges.length-1)) msg.textContent=(i+1)+' / '+badges.length+' badges préparés…';
      }
      pdf.save('G10-badges-QR-'+new Date().toISOString().slice(0,10)+'.pdf');
      if (msg) msg.textContent=badges.length+' badges exportés. Vérifier le PDF avant impression.';
    } catch(e) {
      if (msg) msg.textContent='Export impossible : '+(e?.message || String(e));
    } finally {running=false;if(btn)btn.disabled=false;}
  }
  function insertButton() {
    const host=document.getElementById('adminBody');
    if (!host || !root.st || !Array.isArray(root.st.subs) || host.querySelector('#g10-bulk-badges-button')) return;
    const panel=document.createElement('div');
    panel.className='g10v146-card';
    panel.style.cssText='padding:12px;border:1px solid #dce6f0;background:#eef9ff;border-radius:12px;margin:10px 0';
    const b=document.createElement('button');
    b.id='g10-bulk-badges-button';b.className='btn light';b.type='button';
    b.textContent='Télécharger tous les badges en PDF';
    b.addEventListener('click',exportBadges);
    const status=document.createElement('p');
    status.id='g10-bulk-badges-status';status.setAttribute('role','status');
    status.style.cssText='font-size:12px;margin:6px 0 0';
    status.textContent='Lecture des références QR déjà attribuées, sans modifier les données.';
    panel.appendChild(b);panel.appendChild(status);host.prepend(panel);
  }
  function boot() {
    if (!root.adminTab || !root.st) return setTimeout(boot,250);
    const original=root.adminTab;
    root.adminTab=function(tab) {
      const result=original.apply(this,arguments);
      if(tab==='abonnes') setTimeout(insertButton,120);
      return result;
    };
    insertButton();
  }
  const api=Object.freeze({selectBadges,badgeUrl});
  if(typeof module==='object' && module.exports) module.exports=api;
  if (typeof document!=='undefined') boot();
})(typeof window!=='undefined'?window:globalThis);
