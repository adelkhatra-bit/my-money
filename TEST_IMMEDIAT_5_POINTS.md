# TEST IMMÉDIAT - 5 POINTS À VÉRIFIER

## 🚀 RAFRAÎCHIS LA PAGE ET TESTE ÇA :

---

## 1️⃣ LONG/SHORT - 30 secondes

**Action :**
1. Active le bot
2. Attends un signal SHORT
3. Regarde Entry, TP1, TP2, SL

**Vérification :**
```
Si TP1 < Entry ET SL > Entry → SHORT ✅
Si TP1 > Entry ET SL < Entry → LONG ✅
```

**Exemple attendu SHORT :**
```
Entry:   ~71007
TP1:     ~70507 (en-dessous)
TP2:     ~70157 (en-dessous)
SL:      ~72065 (au-dessus)
Label:   SHORT ✅
```

---

## 2️⃣ DOUBLONS - 1 minute

**Action :**
1. Active le bot
2. Accepte un signal (OK)
3. Regarde le statut en haut

**Vérification :**
```
Status doit afficher :
"Position en cours - Aucun nouveau scan" ✅
```

**Si ça continue à scanner → BUG**
**Si ça s'arrête → CORRECT**

---

## 3️⃣ PNL TEMPS RÉEL - 10 secondes

**Action :**
1. Ouvre une position
2. Regarde la barre du bas (Balance / PnL)
3. Attends 5-10 secondes
4. Regarde si les chiffres bougent

**Vérification :**
```
Balance :   $XXXXX ← Change
PnL :       +$XX ou -$XX ← Change toutes les 5 sec
Gains :     X ← Reste fixe (positions fermées)
Pertes :    X ← Reste fixe (positions fermées)
Winrate :   XX% ← Reste fixe sauf nouvelle position fermée
```

**Si PnL bouge → CORRECT ✅**
**Si PnL figé → BUG**

---

## 4️⃣ BOT OFF - 10 secondes

**Action :**
1. Active le bot (ON)
2. Attends 3 secondes (scan commence)
3. Désactive le bot (OFF)
4. Regarde ce qui se passe

**Vérification :**
```
Scan doit s'arrêter immédiatement ✅
Status doit s'effacer ✅
Popups doivent se fermer ✅
Plus aucune activité ✅
```

**Si quelque chose continue → BUG**
**Si tout s'arrête → CORRECT**

---

## 5️⃣ REFUS SIGNAL - 30 secondes

**Action :**
1. Active le bot
2. Attends un signal (popup orange)
3. Note tes crédits (ex: 10 crédits restants)
4. Clique sur "Refuser"
5. Regarde tes crédits

**Vérification :**
```
AVANT :    10 crédits
APRÈS :    9 crédits ✅
Status :   "Signal refusé - 1 crédit débité" ✅
```

**Si crédit ne diminue pas → BUG**
**Si crédit -1 → CORRECT**

---

## ⏱️ TEMPS TOTAL : 2 MINUTES

Tu peux tout vérifier en moins de 2 minutes.

---

## ✅ SI TOUS LES TESTS PASSENT

→ **Tout est réglé définitivement**

---

## 🔴 SI UN TEST ÉCHOUE

→ Envoie moi :
1. Quel test a échoué (1-5)
2. Ce que tu as vu
3. Ce que tu attendais
4. Screenshot si possible

---

## 🎯 GO TESTER MAINTENANT

**Rafraîchis la page → Commence par le test #1**
