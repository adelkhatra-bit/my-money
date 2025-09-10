(()=>{const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const listEl=$('#propsList'), tpl=$('#propTemplate'); let state={properties:[]};
  const empty=()=>({name:"",address:"",types:{},locks:[]});
  function render(){
    listEl.innerHTML=""; state.properties.forEach((p,i)=>{
      const n = tpl.content.firstElementChild.cloneNode(true);
      $("[data-field=name]",n).value=p.name||""; $("[data-field=address]",n).value=p.address||"";
      $$("[data-type]",n).forEach(box=>{const k=box.getAttribute("data-type"); box.checked=!!p.types[k]; box.onchange=()=>{p.types[k]=box.checked};});
      $("[data-field=name]",n).oninput=e=>p.name=e.target.value; $("[data-field=address]",n).oninput=e=>p.address=e.target.value;
      const wrap=$("[data-locks]",n), lt=$("[data-lock-template]",n).content.firstElementChild; wrap.innerHTML="";
      (p.locks||[]).forEach((L,idx)=>{const ln=lt.cloneNode(true);
        $("[data-field=vendor]",ln).value=L.vendor||""; $("[data-field=apiKey]",ln).value=L.apiKey||"";
        $("[data-field=vendor]",ln).onchange=e=>L.vendor=e.target.value; $("[data-field=apiKey]",ln).oninput=e=>L.apiKey=e.target.value;
        $("[data-action=remove-lock]",ln).onclick=()=>{p.locks.splice(idx,1); render();}; wrap.appendChild(ln);
      });
      $("[data-action=add-lock]",n).onclick=()=>{p.locks.push({vendor:"",apiKey:""}); render();};
      $("[data-action=duplicate]",n).onclick=()=>{state.properties.splice(i+1,0,JSON.parse(JSON.stringify(p))); render();};
      $("[data-action=remove]",n).onclick=()=>{state.properties.splice(i,1); render();};
      listEl.appendChild(n);
    });
    if(state.properties.length===0){state.properties.push(empty()); render();}
  }
  $("#addPropBtn")?.addEventListener("click",()=>{state.properties.push(empty()); render();});
  $("#saveAllBtn")?.addEventListener("click",async()=>{const s=$("#saveStatus"); s.textContent="Enregistrement";
    const r=await fetch("/owner/properties",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({properties:state.properties})});
    const d=await r.json(); s.textContent=d?.ok?`Sauvé (${d.count})`:"Erreur"; setTimeout(()=>s.textContent="",2000);
  });
  (async()=>{try{const r=await fetch("/owner/properties");const d=await r.json(); if(Array.isArray(d.properties)) state.properties=d.properties;}catch{} render();})();
})();
