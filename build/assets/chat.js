(()=>{const $=s=>document.querySelector(s);
  $("#ask")?.addEventListener("click", async ()=>{
    const q=$("#q").value.trim(); const guard = NL.guardChat(q);
    if(guard){ $("#a").innerHTML = "<div class=badge warn>"+guard+"</div>"; return; }
    const r=await fetch("/chat/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q})});
    const d=await r.json(); $("#a").innerHTML = "<div class='card'><strong>Réponse</strong><p>"+(d?.a||"")+"</p></div>";
  });
})();
