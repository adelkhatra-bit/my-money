window.NL = (()=> {
  const t = {
    fr:{dashboard:"Tableau de bord", succession:"Créer ma succession", viager:"Proposer un viager", proprietaire:"Propriétaire", locataire:"Locataire", chat:"Assistance", superadmin:"Super Admin"},
    en:{dashboard:"Dashboard", succession:"Create my estate plan", viager:"Offer a life annuity", proprietaire:"Owner", locataire:"Tenant", chat:"Support", superadmin:"Super Admin"},
    ar:{dashboard:"لوحة التحكم", succession:"إنشاء الميراث", viager:"عرض بيع بالانتفاع", proprietaire:"المالك", locataire:"المستأجر", chat:"الدعم", superadmin:"المشرف"}
  };
  let lang = localStorage.getItem('nl_lang') || 'fr';
  function setLang(l){ lang=l; localStorage.setItem('nl_lang',l); translate(); }
  function translate(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k=el.getAttribute('data-i18n');
      el.textContent = (t[lang]&&t[lang][k])||el.textContent;
    });
    document.documentElement.setAttribute('lang',lang);
  }
  function toast(msg){ const b=document.getElementById('toast'); if(!b) return; b.textContent=msg; b.style.display='block'; setTimeout(()=>b.style.display='none',2200); }
  function modal(title,html){ const m=document.getElementById('modal'); const p=m.querySelector('.panel'); p.querySelector('h3').textContent=title; p.querySelector('.body').innerHTML=html; m.style.display='flex'; }
  function closeModal(){ document.getElementById('modal').style.display='none'; }
  function guardChat(question){
    const allow = /succession|hérit|viager|propriét|loyer|locataire|serrure|sécurité|notaire|bail|signature/i.test(question);
    return allow ? null : "Désolé, je ne réponds qu'aux questions liées à NovaLuce (succession, viager, location, sécurité).";
  }
  window.addEventListener('load', translate);
  return {setLang, translate, toast, modal, closeModal, guardChat};
})();
