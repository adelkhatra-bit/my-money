(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Gère ouverture des dialogs
  $$('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dlg = document.getElementById(btn.dataset.open);
      dlg?.showModal();
    });
  });

  // Ferme si clic dehors
  $$('dialog').forEach(dlg => {
    dlg.addEventListener('click', e => {
      const rect = dlg.getBoundingClientRect();
      if (!(e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom)) {
        dlg.close('cancel');
      }
    });
  });

  // Langue (mock simple)
  $('#lang')?.addEventListener('change', e => {
    localStorage.setItem('lang', e.target.value);
  });
  const saved = localStorage.getItem('lang'); if (saved) $('#lang').value = saved;

  // Chat (test endpoint)
  $('#openChat')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/chat?hello=1');
      const data = await res.json();
      alert(data?.message || 'Chat prêt');
    } catch {
      alert('Chat indisponible (endpoint manquant)');
    }
  });
})();
