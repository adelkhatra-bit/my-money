// app.js — ping LIA
const $ = (q)=>document.querySelector(q);
#btn-ping?.addEventListener('click', async ()=>{
  const out = #out;
  out.textContent = '… ping en cours';
  try{
    const r = await fetch('/api/lia/health');
    const j = await r.json();
    out.textContent = JSON.stringify(j,null,2);
  }catch(e){
    out.textContent = 'Erreur: '+e;
  }
});
