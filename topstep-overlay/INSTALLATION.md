# ⚡ INSTALLATION RAPIDE - 3 MINUTES

## ÉTAPE 1 : Générer les icônes (optionnel)

1. Ouvrir `icons/generate-icons.html` dans Chrome
2. Cliquer sur "Download All Icons"
3. Les 3 fichiers PNG seront téléchargés dans ton dossier Downloads
4. Déplacer les 3 fichiers dans le dossier `icons/`

**OU** sauter cette étape (Chrome utilisera une icône par défaut)

---

## ÉTAPE 2 : Installer l'extension

### Chrome / Edge / Brave

1. **Ouvrir** :
   - Chrome : `chrome://extensions/`
   - Edge : `edge://extensions/`
   - Brave : `brave://extensions/`

2. **Activer le "Mode développeur"** (switch en haut à droite)

3. **Cliquer** sur "Charger l'extension non empaquetée"

4. **Sélectionner** le dossier `topstep-overlay/`

5. ✅ **L'extension est installée !**

---

## ÉTAPE 3 : Utiliser l'overlay

1. **Aller sur Tradovate** :
   - https://trader.tradovate.com/
   - OU https://live.tradovate.com/
   - OU https://demo.tradovate.com/

2. **Se connecter** avec ton compte Topstep/Tradovate

3. **Ouvrir un chart** (n'importe quel marché)

4. **L'overlay apparaît automatiquement** en haut à droite (badge "🤖 AI Trading Bot")

---

## ÉTAPE 4 : Activer le bot

### Mode automatique (recommandé)

1. Cliquer sur le **switch ON/OFF** pour activer
2. Le badge passe en **vert**
3. **Scan auto démarre** (toutes les 5 secondes)
4. Les tracés apparaissent automatiquement

### Mode manuel

1. Laisser le bot **OFF**
2. Cliquer sur **"🔍 Scan"** quand tu veux
3. Le tracé apparaît

---

## ✅ VALIDATION

Tu dois voir :

### Dans l'overlay (panneau haut droite)
- ✅ Badge "🤖 AI Trading Bot"
- ✅ Switch ON/OFF
- ✅ Bouton "🔍 Scan"
- ✅ "Dernier scan: HH:MM:SS"
- ✅ Panneau "📍 Signal détecté" avec :
  - Direction (LONG/SHORT)
  - Entry, SL, TP1, TP2
  - Risk/Reward
- ✅ Panneau "📊 Aperçu Position" avec :
  - Symbole
  - Direction
  - Taille
  - P&L en temps réel

### Sur le chart
- ✅ Rectangle zone d'entrée (semi-transparent)
- ✅ Ligne Entry (verte ou rouge)
- ✅ Ligne SL (rouge)
- ✅ Lignes TP1 et TP2 (vertes)
- ✅ Labels avec prix à droite
- ✅ Horodatage du scan en haut à gauche

---

## 🎯 WORKFLOW

```
BOT OFF
  ↓
Activer le switch (ON)
  ↓
Bot passe en vert
  ↓
Scan auto démarre (5s)
  ↓
Signal détecté
  ↓
Tracé FIXE apparaît sur le chart
  ↓
Panneau "Signal détecté" affiche les détails
  ↓
Aperçu position se met à jour en temps réel
  ↓
Attendre confirmation utilisateur
  ↓
Prochain scan dans 5s
```

---

## 🐛 PROBLÈMES COURANTS

### L'overlay n'apparaît pas

**Solution** :
1. Vérifier que l'extension est activée dans `chrome://extensions/`
2. Rafraîchir la page Tradovate (F5)
3. Ouvrir la console (F12) et chercher : "✅ AI Trading Bot Overlay activé"

### Le tracé ne s'affiche pas

**Solution** :
1. Cliquer manuellement sur "🔍 Scan"
2. Ouvrir la console (F12) et chercher des erreurs
3. Vérifier que le canvas est créé (Inspecter → Elements → chercher `#trading-overlay-canvas`)

### Le prix est incorrect ou bizarre

**Solution** :
1. L'overlay scrape le prix depuis le DOM de Tradovate
2. Si Tradovate a changé son interface, les sélecteurs doivent être ajustés
3. Pour l'instant, le système génère des signaux en simulation
4. Phase 2 : bridge local pour prix réels

### L'extension ne se charge pas

**Solution** :
1. Vérifier que tous les fichiers sont dans le dossier `topstep-overlay/`
2. Vérifier le fichier `manifest.json`
3. Regarder les erreurs dans `chrome://extensions/`

---

## 📊 DONNÉES

### Prix actuels
- **Source** : Scraping DOM de Tradovate
- **Mise à jour** : Toutes les 100ms
- **Aucune API externe**

### Signaux
- **Génération** : Algorithme local (simulation pour MVP)
- **Critères** : Direction, volatilité, R/R
- **Tracé** : Canvas overlay

### P&L
- **Calcul** : (Prix actuel - Entry) × ContractValue
- **Mise à jour** : Temps réel
- **Affichage** : Panneau "Aperçu Position"

---

## 🚀 PROCHAINE ÉTAPE (Phase 2)

Une fois le MVP validé :
1. **Bridge local** (service Node.js)
2. **Connexion au site principal**
3. **Signaux IA avancés**
4. **Historique des trades**

---

## 📝 NOTES

- **Sécurité** : Aucun login/mot de passe dans l'extension
- **Confidentialité** : Tout reste local, aucune exfiltration
- **Performance** : Overlay léger, pas d'impact sur Tradovate
- **Compatibilité** : Chrome, Edge, Brave (Manifest V3)

---

**🎯 OBJECTIF : MIROIR RÉEL TOPSTEP SANS API PAYANTE ✅**
