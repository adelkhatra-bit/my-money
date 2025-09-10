(()=>{const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  async function refresh(){
    const s=await (await fetch("/admin/state")).json();
    $("#c_succ").value=s?.commissions?.succession??0;
    $("#c_loyers").value=s?.commissions?.loyers??0;
    $("#m_chat").checked=!!s?.modules?.chat; $("#m_locks").checked=!!s?.modules?.locks; $("#m_esign").checked=!!s?.modules?.esign;
    const tb=$("#notairesTbl tbody"); tb.innerHTML=""; (s?.notaires||[]).forEach((n,i)=>{const tr=document.createElement("tr");
      tr.innerHTML=`<td>${n.name||""}</td><td>${n.email||""}</td><td>${n.phone||""}</td>
      <td><button class="btn danger" data-i="${i}">Supprimer</button></td>`; tb.appendChild(tr);});
    $$("#notairesTbl .btn.danger").forEach(b=>b.onclick=async()=>{await fetch("/admin/notaires/"+b.dataset.i,{method:"DELETE"}); refresh();});
  }
  $("#n_add").onclick=async()=>{const body={name:$("#n_name").value,email:$("#n_email").value,phone:$("#n_phone").value};
    await fetch("/admin/notaires",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); $("#n_name").value=$("#n_email").value=$("#n_phone").value=""; refresh();};
  $("#c_save").onclick=async()=>{await fetch("/admin/save",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({commissions:{succession:+$("#c_succ").value||0, loyers:+$("#c_loyers").value||0}, modules:{chat:$("#m_chat").checked,locks:$("#m_locks").checked,esign:$("#m_esign").checked}})}); NL.toast("Enregistré");};
  refresh();
})();
