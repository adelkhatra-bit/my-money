(() => {
  const get = s=>document.querySelector(s);
  const issuerEl=get("[data-nv-prof=issuer]");
  const labelEl=get("[data-nv-prof=accountLabel]");
  const qrWrap=get("#nv-prof-2fa-qr");
  const qrImg=get("#nv-prof-qr-img");
  const load=()=>{try{const d=JSON.parse(localStorage.getItem("nv:twofa")||"{}");issuerEl.value=d.issuer||"Novaluce";labelEl.value=d.accountLabel||"";}catch(e){}};
  const save=(o)=>localStorage.setItem("nv:twofa",JSON.stringify(o));
  load();
  get("#nv-prof-2fa-activate")?.addEventListener("click",()=>{
    const issuer=(issuerEl.value||"Novaluce").trim();
    const label=(labelEl.value||"").trim();
    save({issuer,accountLabel:label});
    // Demo QR: on afficherait un vrai QR d'un otpauth:// (coté serveur plus tard)
    const demo="data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='#eee'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12'>QR 2FA</text></svg>`);
    qrImg.src=demo; qrWrap.style.display="block"; alert("2FA activé (démo).");
  });
  get("#nv-prof-2fa-disable")?.addEventListener("click",()=>{localStorage.removeItem("nv:twofa");qrWrap.style.display="none";alert("2FA désactivé (démo).");});
})();
