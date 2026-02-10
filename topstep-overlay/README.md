# 🤖 AI Trading Bot Overlay - Extension Chrome

Extension Chrome qui s'injecte sur Topstep/Tradovate pour afficher des signaux de trading en overlay.

---

## 📦 INSTALLATION (5 minutes)

### Étape 1 : Télécharger l'extension
Tous les fichiers sont dans le dossier `topstep-overlay/`

### Étape 2 : Charger l'extension dans Chrome

1. **Ouvrir Chrome** et aller sur `chrome://extensions/`

2. **Activer le mode développeur** (switch en haut à droite)

3. **Cliquer sur "Charger l'extension non empaquetée"**

4. **Sélectionner le dossier** `topstep-overlay/`

5. **L'extension est installée** ✅

### Étape 3 : Utilisation

1. **Ouvrir Tradovate** :
   - `https://trader.tradovate.com/`
   - OU `https://live.tradovate.com/`
   - OU `https://demo.tradovate.com/`

2. **L'overlay apparaît** automatiquement en haut à droite

3. **Activer le bot** :
   - Cliquer sur le switch ON/OFF
   - Le scan automatique démarre (toutes les 5 secondes)

4. **Ou scanner manuellement** :
   - Cliquer sur le bouton "🔍 Scan"

---

## ✅ VALIDATION

### Ce que tu dois voir :

**✅ Badge "AI Trading Bot" visible** en haut à droite

**✅ BOT ON → Badge vert + scan auto**

**✅ Scan → Tracé fixe sur le chart** :
- Zone d'entrée (rectangle semi-transparent)
- Ligne Entry (verte ou rouge selon direction)
- Ligne SL (rouge)
- Lignes TP1 et TP2 (vertes)
- Labels avec prix
- Horodatage du scan

**✅ Panneau Signal** :
- Direction (LONG/SHORT)
- Prix Entry, SL, TP1, TP2
- Risk/Reward ratio

**✅ Aperçu Position** :
- Symbole (MES)
- Direction
- Taille (1 contrat)
- P&L en temps réel

---

## 🎯 DONNÉES UTILISÉES

### Prix réel Topstep/Tradovate
- **Lecture DOM** : Scraping du prix affiché sur la page
- **Aucune API externe** : Pas de clé, pas de Polygon
- **Mise à jour** : Toutes les 100ms

### Tracé
- **Canvas overlay** : Dessin par-dessus le chart existant
- **Position absolute** : Ne perturbe pas le chart natif
- **Responsive** : S'adapte au redimensionnement

---

## 🔒 SÉCURITÉ

- ✅ **Aucun login/mot de passe** dans l'extension
- ✅ **Aucune exfiltration** : Tout reste local
- ✅ **Lecture seule** : Ne modifie pas la page Tradovate
- ✅ **Zero API payante** : Pas de clé externe

---

## 🐛 DÉPANNAGE

### L'overlay n'apparaît pas
1. Vérifier que l'extension est activée dans `chrome://extensions/`
2. Rafraîchir la page Tradovate (F5)
3. Ouvrir la console Chrome (F12) et chercher :
   ```
   🤖 AI Trading Bot Overlay - Initialisation...
   ✅ AI Trading Bot Overlay activé
   ```

### Le tracé n'apparaît pas
1. Vérifier que le canvas est bien créé (F12 → Inspecter)
2. Cliquer sur "🔍 Scan" manuellement
3. Vérifier les logs dans la console

### Le prix est incorrect
1. L'extension scrape le DOM pour trouver le prix
2. Si Tradovate change son interface, il faut ajuster les sélecteurs
3. Ouvrir la console et vérifier `priceData.lastPrice`

---

## 📊 ARCHITECTURE

```
topstep-overlay/
├── manifest.json           (Config extension)
├── content-script.js       (Script principal injecté)
├── overlay-styles.css      (Styles UI)
├── icons/                  (Icônes extension)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               (Ce fichier)
```

### Flux de données

```
Page Tradovate
    ↓
DOM Scraping (prix + symbole)
    ↓
Overlay UI (badge + contrôles)
    ↓
Scan automatique (5s) ou manuel
    ↓
Génération signal (Entry, SL, TP)
    ↓
Canvas overlay (tracé fixe)
    ↓
Aperçu position (P&L temps réel)
```

---

## 🚀 PROCHAINES ÉTAPES (Phase 2)

1. **Bridge local** (optionnel) :
   - Service Node.js sur ton PC
   - Reçoit les données de l'overlay
   - Envoie au site principal
   - Miroir du chart dans notre interface

2. **Amélioration lecture prix** :
   - Accès aux données OHLC si disponibles
   - Calcul de volatilité réelle
   - Détection de tendance

3. **Signaux avancés** :
   - Connexion à notre IA (antoMarketEngine)
   - Analyse multi-timeframe
   - Filtres qualité signal

---

## 📝 NOTES TECHNIQUES

### URLs ciblées
- `https://trader.tradovate.com/*`
- `https://live.tradovate.com/*`
- `https://demo.tradovate.com/*`

### Lecture prix (DOM)
Sélecteurs testés :
- `[class*="price"]`
- `[class*="last"]`
- `.price-display`
- `.last-price`
- Fallback : regex sur tout le texte de la page

### Dessin (Canvas)
- Position : `absolute` sur le chart container
- Z-index : `9999` (au-dessus de tout)
- Pointer-events : `none` (ne bloque pas les clics)
- Responsive : redimensionnement automatique

---

## ✅ CHECKLIST VALIDATION FINALE

- [ ] Extension installée dans Chrome
- [ ] Overlay visible sur Tradovate
- [ ] BOT ON → scan automatique
- [ ] Tracé fixe apparaît sur le chart
- [ ] Labels prix corrects
- [ ] Aperçu position affiche P&L
- [ ] Prix overlay = prix Tradovate (±0 tick)
- [ ] Aucune popup "Missing secrets"
- [ ] Tout fonctionne sans clé API

---

**🎯 OBJECTIF ATTEINT : Miroir réel Topstep sans API payante**
