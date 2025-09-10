(()=>{const $=s=>document.querySelector(s);
  $('#v_save')?.addEventListener('click', async ()=>{
    if(!$('#v_addr').value){ NL.modal("Adresse manquante","Merci de préciser l'adresse du bien."); return; }
    const form = new FormData();
    form.append('type',$('#v_type').value);
    form.append('addr',$('#v_addr').value);
    form.append('rente',$('#v_rente').value||0);
    if($('#v_acte').files[0]) form.append('acte',$('#v_acte').files[0]);
    for(const f of $('#v_estims').files) form.append('estims',f);
    for(const f of $('#v_photos').files) form.append('photos',f);
    const r = await fetch('/viager/submit',{method:'POST',body:form}); const d=await r.json();
    NL.toast(d?.ok ? "Viager enregistré (envoi notaire lors de validation)." : "Erreur.");
  });
})();
