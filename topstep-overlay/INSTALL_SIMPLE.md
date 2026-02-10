# Installation TopstepOverlay

## Version 1: Tampermonkey (RECOMMANDÉ - plus simple)

### Installation:
1. Installe Tampermonkey: https://www.tampermonkey.net/
2. Clique sur l'icône Tampermonkey → "Créer un nouveau script"
3. Copie TOUT le contenu de `topstep-overlay.user.js`
4. Colle-le dans l'éditeur Tampermonkey
5. Clique "Fichier" → "Enregistrer" (ou Ctrl+S)
6. Va sur https://trader.tradovate.com/

### Résultat attendu:
- Overlay visible en haut à droite
- Console: lignes `[TOPSTEPOVERLAY]` visibles

---

## Version 2: Extension Chrome

### Installation:
1. Ouvre Chrome et va sur `chrome://extensions/`
2. Active "Mode développeur" (en haut à droite)
3. Clique "Charger l'extension non empaquetée"
4. Sélectionne le dossier `topstep-overlay/`
5. Clique "Détails" sur l'extension → "Accès au site" → "Sur tous les sites"
6. Va sur https://trader.tradovate.com/
7. Recharge la page (Ctrl+Shift+R)

### Résultat attendu:
- Overlay visible en haut à droite
- Console: lignes `[TOPSTEPOVERLAY]` visibles

---

## Debug

### Console (F12 → Console):
Filtre: `TOPSTEPOVERLAY`

Tu dois voir:
```
[TOPSTEPOVERLAY] ✅ Script injected - URL: https://trader.tradovate.com/...
[TOPSTEPOVERLAY] init() appelé
[TOPSTEPOVERLAY] ✅ Chart trouvé: canvas
[TOPSTEPOVERLAY] ✅ Chart ready - création overlay
[TOPSTEPOVERLAY] ✅ Overlay UI ajouté au DOM
[TOPSTEPOVERLAY] ✅✅✅ OVERLAY ACTIVÉ ET VISIBLE ✅✅✅
```

### Overlay visible:
- 🤖 AI Trading Bot [ON/OFF]
- 📍 URL détectée
- ✅ Injected
- ⏳ Searching price... (ou ✅ Price found)
- 📋 Copy Debug

### Bouton "Copy Debug":
Clique dessus et colle le résultat pour debug

---

## Problème?

1. **Overlay n'apparaît pas:**
   - Vérifie Console (F12) → filtre `TOPSTEPOVERLAY`
   - Clique "Copy Debug" et envoie le résultat

2. **Extension pas chargée:**
   - chrome://extensions/ → Recharger
   - Détails → Accès au site → "Sur tous les sites"

3. **Tampermonkey pas déclenché:**
   - Icône Tampermonkey → Tableau de bord
   - Vérifie que le script est activé (vert)
