# TEST TOPSTEPOVERLAY - DEBUG INJECTION

## INSTALLATION (3 MINUTES)

1. Ouvrir Chrome
2. Aller dans `chrome://extensions/`
3. Activer "Mode développeur" (coin supérieur droit)
4. Cliquer "Charger l'extension non empaquetée"
5. Sélectionner le dossier `topstep-overlay/`

## TEST SUR TRADOVATE

1. Ouvrir `https://trader.tradovate.com/` ou `https://demo.tradovate.com/`
2. Se connecter (si nécessaire)
3. Attendre le chargement du chart

## CE QUI DOIT APPARAÎTRE

### ÉTAPE 1 : Injection du script (IMMÉDIAT)
**Alert popup :**
```
TopstepOverlay injecté - attente du chart Tradovate...
```

👉 Si cette alert n'apparaît PAS :
- L'extension n'est pas chargée
- Vérifier dans `chrome://extensions/` que l'extension est activée
- Recharger la page Tradovate

### ÉTAPE 2 : Détection du chart (2-10 secondes)
**Alert popup :**
```
TopstepOverlay activé - switch BOT ON pour démarrer
```

**Élément visible :** Panel overlay en haut à droite avec :
- 🤖 AI Trading Bot
- Switch ON/OFF
- Bouton Scan

👉 Si cette alert n'apparaît PAS après 10s :
- Ouvrir DevTools (F12)
- Vérifier les logs console

### ÉTAPE 3 : Logs Console (DevTools)

Ouvrir DevTools (F12), onglet Console.

Logs attendus dans cet ordre :

```
[TOPSTEPOVERLAY] script injected
[TOPSTEPOVERLAY] init() appelé
[TOPSTEPOVERLAY] attente du chart via MutationObserver...
[TOPSTEPOVERLAY] chart détecté: canvas
[TOPSTEPOVERLAY] chart ready - création overlay
[TOPSTEPOVERLAY] création de l'overlay UI...
[TOPSTEPOVERLAY] overlay UI ajouté au DOM
[TOPSTEPOVERLAY] event listeners attachés
[TOPSTEPOVERLAY] création canvas overlay...
[TOPSTEPOVERLAY] canvas overlay créé et ajouté au chart
[TOPSTEPOVERLAY] monitoring prix démarré
[TOPSTEPOVERLAY] ✅ overlay activé
[TOPSTEPOVERLAY] prix détecté: 5850.25
```

## TEST BOT

1. Cliquer sur le switch pour passer à **ON**
2. Le statut doit passer de "OFF" (rouge) à "ON" (vert)
3. Le scan automatique démarre (toutes les 5 secondes)

**Logs attendus :**
```
[TOPSTEPOVERLAY] scan en cours...
[TOPSTEPOVERLAY] signal généré: {direction: "LONG", entry: "5850.25", ...}
```

**Visuel attendu :**
- Tracé ENTRY (ligne verte/rouge en pointillés)
- Tracé SL (ligne rouge)
- Tracé TP1 / TP2 (lignes vertes)
- Zone colorée autour de l'entry
- Labels à droite avec les prix

## RETOUR À FOURNIR

Si l'overlay n'apparaît pas, copier-coller **TOUS** les logs console :

1. Ouvrir DevTools (F12)
2. Filtrer par `[TOPSTEPOVERLAY]`
3. Copier tout
4. Me l'envoyer

Également :
- Quel URL exacte (trader / demo / live)
- À quel moment ça bloque (alert 1, alert 2, ou aucune alert)
- Capture d'écran si possible
