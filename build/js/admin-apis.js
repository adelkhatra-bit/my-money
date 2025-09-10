async function loadConfig(){
  try{
    const r = await fetch("/admin/config");
    const cfg = await r.json();
    if(cfg.stripe){ 
      document.getElementById("stripe_secret").value = cfg.stripe.secret||"";
      document.getElementById("stripe_wh").value = cfg.stripe.webhook||"";
    }
    if(cfg.platform){ 
      document.getElementById("commission").value = cfg.platform.commission||"";
    }
    if(cfg.email){
      document.getElementById("sendgrid_key").value = cfg.email.key||"";
      document.getElementById("send_from").value = cfg.email.from||"";
    }
    if(cfg.sms){
      document.getElementById("tw_sid").value = cfg.sms.sid||"";
      document.getElementById("tw_token").value = cfg.sms.token||"";
      document.getElementById("tw_from").value = cfg.sms.from||"";
    }
    if(cfg.twofa){
      document.getElementById("twofa_issuer").value = cfg.twofa.issuer||"";
    }
  }catch(e){console.warn(e)}
}
loadConfig();

async function saveSection(section){
  const body = { section, data:{} };
  if(section==="stripe"){
    body.data.secret = document.getElementById("stripe_secret").value.trim();
    body.data.webhook = document.getElementById("stripe_wh").value.trim();
    body.data.commission = parseFloat(document.getElementById("commission").value||"0");
  }
  if(section==="email"){
    body.data.key = document.getElementById("sendgrid_key").value.trim();
    body.data.from = document.getElementById("send_from").value.trim();
  }
  if(section==="sms"){
    body.data.sid = document.getElementById("tw_sid").value.trim();
    body.data.token = document.getElementById("tw_token").value.trim();
    body.data.from = document.getElementById("tw_from").value.trim();
  }
  if(section==="twofa"){
    body.data.issuer = document.getElementById("twofa_issuer").value.trim();
  }
  const r = await fetch("/admin/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j = await r.json();
  alert(j.ok? "Enregistré " : "Erreur ");
}

async function ping(){
  const el = document.getElementById("ping");
  el.textContent = "Test";
  try{
    const r = await fetch("/health"); 
    const j = await r.json();
    el.textContent = j.ok ? "API OK " : "API KO ";
    el.className = j.ok ? "ok" : "warn";
  }catch{ el.textContent = "API KO ❌"; el.className="warn"; }
}
