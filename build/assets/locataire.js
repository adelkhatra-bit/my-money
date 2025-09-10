(()=>{const $=s=>document.querySelector(s);
  $("#getContractBtn")?.addEventListener("click", async ()=>{
    const r=await fetch("/tenant/contract"); const d=await r.json();
    if(d?.pdfBase64){ const b=atob(d.pdfBase64); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([u],{type:"application/pdf"})); const a=$("#dlContract"); a.href=url; a.style.display="inline-flex";
      NL.toast("Contrat prêt.");
    }
  });
  $("#sendIdBtn")?.addEventListener("click", async ()=>{
    const f=$("#idFile")?.files?.[0]; const s=$("#idStatus"); if(!f){s.textContent="Sélectionne une pièce"; return;}
    s.textContent="Envoi"; const b64=await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(String(fr.result).split(",")[1]||""); fr.readAsDataURL(f);});
    const r=await fetch("/tenant/upload-id",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:f.name,mime:f.type,data:b64})});
    s.textContent=(await r.json())?.ok?"Reçu, merci.":"Erreur.";
  });
})();
