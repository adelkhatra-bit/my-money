(()=>{const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const heirsWrap = $('#s_heirs'); $('#s_addHeir')?.addEventListener('click',()=>{
    const row=document.createElement('div'); row.className='row cols-3 card';
    row.innerHTML = `<div><label>Nom</label><input type="text"/></div>
                     <div><label>Prénom</label><input type="text"/></div>
                     <div><label>Adresse</label><input type="text"/></div>
                     <div><label>Pièce d'identité (original)</label><input type="file" accept=".pdf,.jpg,.jpeg,.png"/></div>`;
    heirsWrap.appendChild(row);
  });
  $('#s_submit')?.addEventListener('click', async ()=>{
    // validation très simple
    const miss = [];
    if(!$('#s_nom').value) miss.push("Nom");
    if(!$('#s_prenom').value) miss.push("Prénom");
    if(!$('#s_acte').files.length) miss.push("Acte de propriété");
    if(miss.length){ NL.modal("Champs manquants", "<p>Merci de compléter :</p><ul><li>"+miss.join("</li><li>")+"</li></ul>"); return; }
    NL.toast("Envoi en cours…");
    const form = new FormData();
    form.append('nom',$('#s_nom').value);
    form.append('prenom',$('#s_prenom').value);
    form.append('dob',$('#s_dob').value);
    form.append('addr',$('#s_addr').value);
    form.append('acte',$('#s_acte').files[0]);
    for(const f of $('#s_estims').files) form.append('estims',f);
    for(const f of $('#s_av').files) form.append('assv',f);
    const res = await fetch('/succession/submit',{method:'POST',body:form});
    const data = await res.json();
    NL.toast(data?.ok ? "Transmis au notaire." : "Erreur d'envoi");
  });
})();
