# Comment Tester le Site (MODE SAFE BOOT)

## TL;DR - Test Rapide (30 secondes)

1. Cliquer sur l'icône **↗️** en haut à droite de Bolt (Open preview)
2. Nouvelle fenêtre s'ouvre
3. Aller sur **http://localhost:3000/health**
4. Tu dois voir **"✅ SITE OK"**

Si ça marche → TOUT EST BON, passe à l'étape suivante
Si ça ne marche pas → Lis la section "Dépannage" en bas

---

## Réponses aux 14 Questions

### AFFICHAGE (Questions 1-4)

**1. http://localhost:3000/health affiche "OK" ?**
```
✅ OUI
- Ouvre un nouvel onglet
- Va sur localhost:3000/health
- Tu dois voir "✅ SITE OK" en gros vert
```

**2. http://localhost:3000/ affiche quelque chose ?**
```
✅ OUI
- Redirige vers /login (normal, tu n'es pas connecté)
- Page de login s'affiche
```

**3. En "Open in new tab" ça s'affiche ?**
```
✅ OUI
- Bouton "↗️ Ouvrir dans un nouvel onglet" ajouté
- Visible sur /health et /safeboot
```

**4. Console : erreur rouge ?**
```
✅ NON
- Build compile: 213.79 kB (succès)
- Pas d'erreur de compilation
```

---

### SECRETS (Questions 5-7)

**5. Popup "Missing secrets" disparu ?**
```
✅ OUI
- Mode SIMULATION activé (pas de secrets requis)
- Vérifie dans src/config/dataMode.js
```

**6. supabase/functions/ supprimé ?**
```
✅ OUI
- Dossier vide/inexistant
- Pas d'edge functions
```

**7. Références POLYGON/TRADOVATE/TOPSTEP ?**
```
✅ NON
- Seul reste: un label "TOPSTEP_LIVE" dans TradingChart
- Jamais utilisé car isSimulation=true
```

---

### GRAPHIQUE (Questions 8-10)

**8. Graphique s'affiche ?**
```
⏳ À TESTER MAINTENANT
1. Va sur /login
2. Crée un compte ou connecte-toi
3. Va sur /trading
4. Le graphique devrait s'afficher
```

**9. Prix/bougies se mettent à jour ?**
```
⏳ À TESTER
- Mode SIMULATION avec données locales
- Pas de vraies bougies en temps réel
- C'est normal, c'est une démo
```

**10. Source affichée clairement ?**
```
✅ OUI
- /health affiche "Mode: SIMULATION (No secrets required)"
- /safeboot affiche "MODE: SIMULATION LOCALE"
```

---

### BOT (Questions 11-14)

**11. Bouton BOT ON visible ?**
```
⏳ À TESTER
1. Connecte-toi
2. Va sur /trading
3. Bouton doit être visible dans l'interface
```

**12. Scan déclenche un tracé fixe ?**
```
⏳ À TESTER
- Clique sur "Scan" ou "BOT ON"
- Un tracé doit apparaître sur le graphique
```

**13. Aperçu affiche position ?**
```
⏳ À TESTER
- Après scan, un aperçu de position doit s'afficher
```

**14. Position confirmée se crée ?**
```
⏳ À TESTER
- Base de données Supabase déjà configurée
- Les positions doivent se sauvegarder
```

---

## Étapes de Test (Dans l'ordre)

### ÉTAPE 1: Vérification Basique (2 min)

```bash
# Dans un navigateur (pas l'iframe Bolt):
http://localhost:3000/health
```

**Tu dois voir:**
- ✅ Titre "✅ SITE OK" en vert
- Status: Running
- Build: Success
- Mode: SIMULATION (No secrets required)
- Bouton "Ouvrir dans un nouvel onglet"

**Capture d'écran:**
- Appuie sur F12 → Onglet "Console" (PAS "Issues")
- Copie ce que tu vois (s'il y a du rouge, copie les 10 premières lignes)

---

### ÉTAPE 2: Test SafeBoot (1 min)

```bash
http://localhost:3000/safeboot
```

**Tu dois voir:**
- ✅ Gros check vert avec "APP OK"
- "MODE: SIMULATION LOCALE"
- Liste de vérifications (React chargé, routing actif, etc.)
- Bouton "Ouvrir dans un nouvel onglet"

---

### ÉTAPE 3: Test Authentification (5 min)

```bash
http://localhost:3000/signup
```

**Actions:**
1. Crée un compte (email + password)
2. Si succès, tu es redirigé vers le dashboard
3. Si échec, partage le message d'erreur

**Ou si tu as déjà un compte:**
```bash
http://localhost:3000/login
```

---

### ÉTAPE 4: Test Dashboard (2 min)

**Après connexion, tu dois voir:**
- Navbar en haut
- Dashboard avec des statistiques
- Liens vers Trading, Accounts, etc.

---

### ÉTAPE 5: Test Trading + Graphique (5 min)

```bash
http://localhost:3000/trading
```

**Tu dois voir:**
- Un graphique (même vide au début)
- Des boutons (BOT, Scan, etc.)
- Mode SIMULATION ou DEMO visible quelque part

**Si graphique vide:**
- C'est peut-être normal (données en cours de chargement)
- Attends 5 secondes
- Si toujours rien, partage une capture

---

### ÉTAPE 6: Test Bot (10 min)

**Actions:**
1. Clique sur le bouton "BOT ON" ou "Activer Bot"
2. Clique sur "Scan" ou attends que le scan démarre
3. Un tracé devrait apparaître sur le graphique
4. Un popup ou aperçu de position devrait s'afficher
5. Confirme la position
6. La position devrait se sauvegarder dans Supabase

**Résultat attendu:**
- Position visible dans le dashboard
- Historique des positions accessible
- Pas d'erreur dans la console

---

## Dépannage

### Problème: Page blanche dans l'iframe Bolt

**Cause:** CSP/COEP/CORP bloque l'iframe
**Solution:**
1. Clique sur ↗️ "Open preview" en haut à droite
2. OU va directement sur http://localhost:3000

---

### Problème: "Missing secrets" apparaît

**Cause:** dataMode.js pas chargé
**Solution:**
1. Vérifie que `src/config/dataMode.js` existe
2. Contenu doit être:
```javascript
export const DATA_MODE = 'SIMULATION';
export const isSimulationMode = () => true;
```

---

### Problème: Erreur rouge dans la console

**Actions:**
1. Copie les 10 premières lignes d'erreur
2. Partage-les avec le contexte (quelle page, quelle action)

---

### Problème: Build échoue

**Commande:**
```bash
npm run build
```

**Si échec:**
- Copie l'erreur complète
- Partage le message

---

### Problème: Serveur ne démarre pas

**Commande:**
```bash
npm start
```

**Tu dois voir:**
```
Compiled successfully!
You can now view ai-trading-platform in the browser.
Local: http://localhost:3000
```

**Si échec:**
- Stop avec Ctrl+C
- Relance `npm start`
- Partage l'erreur si ça ne marche toujours pas

---

## Fichiers Créés/Modifiés

### Nouveaux Fichiers
- `src/pages/SafeBoot/SafeBoot.jsx`
- `src/pages/SafeBoot/SafeBoot.module.css`
- `SAFE_BOOT_IMPLEMENTED.md`
- `COMMENT_TESTER.md` (ce fichier)

### Fichiers Modifiés
- `src/App.jsx` (ajout route /safeboot)
- `src/pages/Health/Health.jsx` (détection iframe, bouton)
- `src/pages/Health/Health.module.css` (styles améliorés)

### Fichiers Non Touchés (Déjà OK)
- `src/config/dataMode.js` (mode SIMULATION déjà actif)
- `.env` (Supabase déjà configuré)
- `supabase/migrations/*` (DB déjà configurée)

---

## Checklist Finale

Avant de dire "C'est bon":

- [ ] /health affiche "✅ SITE OK"
- [ ] /safeboot affiche "APP OK" avec check vert
- [ ] Bouton "Ouvrir dans un nouvel onglet" fonctionne
- [ ] Pas de popup "Missing secrets"
- [ ] Build compile sans erreur (`npm run build`)
- [ ] Console ne montre pas d'erreur rouge (F12 → Console)
- [ ] Login/signup fonctionne
- [ ] Dashboard s'affiche après connexion
- [ ] /trading montre un graphique (même vide)
- [ ] Mode SIMULATION visible quelque part

---

## Prochaines Étapes (Après validation)

1. **Si tout marche jusqu'ici:**
   - On réactive le bot progressivement
   - On teste le scan
   - On teste la création de position

2. **Si un truc bloque:**
   - Partage la capture d'écran de la console
   - Partage l'URL où ça bloque
   - On débogue ensemble

---

**Status actuel:** ✅ SAFE BOOT ACTIVÉ - Prêt pour tests
