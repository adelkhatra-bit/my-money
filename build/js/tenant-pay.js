async function nvPayRent(){
  const amount = parseFloat(document.getElementById("rent_amount").value||"0");
  const ownerId = (document.getElementById("owner_id").value||"").trim();
  const tenantId = (document.getElementById("tenant_id").value||"").trim();
  if(!amount || !ownerId || !tenantId){
    alert("Montant / Propriétaire / Locataire requis");
    return;
  }
  const r = await fetch("/payments/charge",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({amount, ownerId, tenantId, meta:{period:document.getElementById("rent_period").value}})
  });
  const j = await r.json();
  if(j.ok){
    alert("Paiement enregistré \\nReçu n° "+j.receipt.id);
  }else{
    alert("Erreur paiement : "+(j.error||""));
  }
}
