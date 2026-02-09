# SCHÉMA DU SYSTÈME - ÉTAT ACTUEL VS REQUIS

## 🔴 PROBLÈMES IDENTIFIÉS

### 1. POPUPS TROP GROSSES
```
ACTUEL:
[================================]  ← Popup géante
[================================]
[================================]

REQUIS:
[============]  ← Popup compacte
[============]
```

### 2. FLUX LOGIQUE CASSÉ

```
ACTUEL (FAUX):
┌─────────────────────────────────────────┐
│ Bot Scan                                │
│   ↓                                     │
│ Signal trouvé → Popup                   │
│   ↓                                     │
│ Position ouverte                        │
│   ↓                                     │
│ ❌ Bot continue à scanner               │
│ ❌ Plusieurs positions en même temps    │
│ ❌ Pas d'historique                     │
│ ❌ PnL pas mis à jour                   │
│ ❌ SL/TP pas surveillés                 │
└─────────────────────────────────────────┘

REQUIS (CORRECT):
┌─────────────────────────────────────────┐
│ 1. Bot Scan (si AUCUNE position active) │
│   ↓                                     │
│ 2. Signal trouvé                        │
│   ↓                                     │
│ 3. Popup confirmation + données         │
│   ↓                                     │
│ 4. Position ouverte                     │
│   ↓                                     │
│ 5. ⛔ STOP SCAN tant que position active│
│   ↓                                     │
│ 6. Surveillance en temps réel:          │
│    • Prix actuel                        │
│    • Distance TP1/TP2                   │
│    • Distance SL                        │
│    • PnL en live                        │
│   ↓                                     │
│ 7. Si TP1 touché:                       │
│    • Popup "TP1 atteint"                │
│    • Instruction: déplacer SL en BE     │
│    • Continuer surveillance TP2         │
│   ↓                                     │
│ 8. Si TP2 ou SL touché:                 │
│    • Clôture position                   │
│    • Déplacement vers HISTORIQUE        │
│    • Mise à jour PnL, balance, stats    │
│   ↓                                     │
│ 9. ✅ Scan peut reprendre               │
└─────────────────────────────────────────┘
```

### 3. DONNÉES NON BRANCHÉES

```
ACTUEL:
┌──────────────────┐
│ Mes Comptes      │
│ • Capital        │  ❌ Pas utilisé pour calculs
│ • Risque %       │  ❌ Pas utilisé pour SL
│ • Perte max jour │  ❌ Pas surveillé
│ • Perte max total│  ❌ Pas surveillé
└──────────────────┘

┌──────────────────┐
│ Barre du bas     │
│ • Balance        │  ❌ Pas mis à jour
│ • PnL            │  ❌ Pas en temps réel
│ • Gains cumulés  │  ❌ Statique
│ • Pertes cumulés │  ❌ Statique
│ • Nb trades      │  ❌ Statique
└──────────────────┘

REQUIS:
┌──────────────────┐
│ Mes Comptes      │
│ • Capital        │ ──┐
│ • Risque %       │   ├─→ Calcul SL automatique
│ • Perte max jour │   │   Calcul taille position
│ • Perte max total│   │   Surveillance limites
└──────────────────┘   │
                       │
┌──────────────────┐   │
│ Position active  │ ←─┘
│ • Entry          │   │
│ • SL calculé     │   │
│ • TP1/TP2        │   │
│ • PnL en live    │ ──┤
└──────────────────┘   │
                       │
┌──────────────────┐   │
│ Barre du bas     │ ←─┘
│ • Balance live   │   (mise à jour continue)
│ • PnL live       │
│ • Gains cumulés  │
│ • Pertes cumulés │
│ • Nb trades      │
└──────────────────┘
```

### 4. HISTORIQUE MANQUANT

```
ACTUEL:
Position clôturée → ❌ Disparaît

REQUIS:
Position clôturée → ✅ Va dans historique

┌─────────────────────────────────────────┐
│ POSITION EN COURS                       │
│ • BTC SHORT                             │
│ • Entry: 71390                          │
│ • SL: 71748                             │
│ • TP1: 70507 | TP2: 70157              │
│ • PnL: +245 USD                         │
│ • Statut: En cours                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ HISTORIQUE                              │
├─────────────────────────────────────────┤
│ ✅ BTC LONG | +523 USD | 08/02 19:23   │
│ ❌ NASDAQ SHORT | -185 USD | 08/02 18:45│
│ ✅ BTC SHORT | +412 USD | 08/02 17:12  │
│ ✅ NASDAQ LONG | +298 USD | 08/02 15:34│
└─────────────────────────────────────────┘
```

### 5. GESTION POSITION MANQUANTE

```
ACTUEL:
Position ouverte → ❌ Rien ne se passe
                   ❌ SL pas surveillé
                   ❌ TP pas surveillé
                   ❌ Prix pas mis à jour

REQUIS:
Position ouverte → ✅ Surveillance toutes les 5 secondes
                   ↓
                   Récupération prix actuel
                   ↓
                   Calcul PnL en temps réel:
                   • LONG: PnL = (prix actuel - entry) × taille
                   • SHORT: PnL = (entry - prix actuel) × taille
                   ↓
                   Vérification conditions:
                   • TP1 touché? → Popup + instruction SL→BE
                   • TP2 touché? → Clôture + gain
                   • SL touché? → Clôture + perte
                   ↓
                   Mise à jour affichage:
                   • Prix actuel
                   • PnL (vert si +, rouge si -)
                   • Distance TP/SL
                   • Barre du bas
```

### 6. RÈGLES DE PROTECTION MANQUANTES

```
ACTUEL:
❌ Pas de limite positions simultanées
❌ Pas de surveillance perte max journalière
❌ Pas de surveillance perte max totale
❌ SL/TP pas automatiques

REQUIS:
✅ UNE SEULE position max
✅ Si perte jour > limite profil → STOP bot
✅ Si perte totale > limite profil → STOP bot
✅ SL/TP surveillés en continu
✅ Si TP1 → popup obligatoire "Déplacer SL"
```

## 📋 PLAN DE CORRECTION

### PRIORITÉ 1 - POPUPS
- Réduire taille toutes popups (50% hauteur/largeur)
- Taille uniforme

### PRIORITÉ 2 - FLUX UNE POSITION
- Bloquer scan si position active
- Surveillance temps réel (5s)
- Vérification TP/SL
- Clôture automatique

### PRIORITÉ 3 - HISTORIQUE
- Table historique persistante
- Affichage sous graphique
- Tous les détails (entry, SL, TP, résultat)

### PRIORITÉ 4 - BARRE DU BAS
- Calcul PnL temps réel
- Mise à jour balance
- Gains/pertes cumulés
- Compteur trades

### PRIORITÉ 5 - SÉCURITÉ
- Une seule position max (code + UI)
- Surveillance limites pertes
- Calcul SL depuis profil
- Popup TP1 obligatoire
