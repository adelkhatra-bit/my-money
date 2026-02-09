# 🚨 FAIRE MAINTENANT - v3.0.6

## TON PROBLÈME

```
Balance: $5,652,529.38  ❌
PnL: +$5,552,529.38  ❌
Entry: 25261.91668  ❌ (décimales longues)
```

**CAUSE:** Données corrompues en base de données

---

## SOLUTION (3 ÉTAPES)

### 1️⃣ VIDER CACHE
```
Ctrl + Shift + R
```

### 2️⃣ RESET COMPLET (OBLIGATOIRE)
```
http://localhost:3000/reset
Clique "Supprimer toutes mes données"
Confirme 2 fois
```

**Résultat attendu:**
```
✅ Balance: $100,000.00
✅ PnL: $0.00
✅ Total Trades: 0
```

### 3️⃣ NOUVEAU COMPTE

**Va sur `/accounts`:**
1. Supprime ancien compte "teste"
2. Crée nouveau compte:
   - Nom: BTC-Clean
   - Marché: BTC
   - Plateforme: Binance
   - Capital: $100,000
   - Risque: 0.25%
3. Active le compte (toggle vert)

---

## TEST POSITION

**Dashboard Trading:**
1. Sélectionne BTC + Binance + 5m
2. Clique "APERÇU"
3. **Vérifie prix avec 2 décimales MAX:**
   ```
   ✅ Entry: 25261.92 (pas .91668)
   ✅ SL: 25135.61 (pas .60710)
   ✅ TP1: 25514.54 (pas .53585)
   ```
4. Ouvre position
5. **Vérifie PnL réaliste:**
   ```
   ✅ PnL: +$12.50 (exemple)
   PAS ❌ PnL: +$5,552,529.38
   ```

---

## SI ÇA NE MARCHE PAS

1. **Version pas v3.0.6?**
   - Ferme navigateur complètement
   - Rouvre
   - Ctrl+Shift+R encore

2. **PnL encore aberrant?**
   - Reset VRAIMENT fait?
   - Stats à zéro après reset?
   - Nouveau compte créé?

3. **Décimales encore longues?**
   - Cache pas vidé correctement
   - Console (F12): cherche `main.4ef0b756.js`
   - Si autre build → Cache encore actif

---

## CHECKLIST

- [ ] Ctrl+Shift+R fait
- [ ] Reset complet fait
- [ ] Stats à zéro (Balance $100k, PnL $0)
- [ ] Ancien compte supprimé
- [ ] Nouveau compte créé
- [ ] Position test: 2 décimales max
- [ ] PnL réaliste (<$100)

---

**POURQUOI RESET OBLIGATOIRE?**

Les anciennes positions ont des valeurs ABERRANTES déjà stockées en base de données. Le code corrigé ne peut pas "réparer" les données existantes. Il FAUT tout supprimer et repartir propre.

**C'est comme formater un disque corrompu - on ne répare pas, on efface et on recommence.**

---

## APRÈS RESET = TOUT PROPRE

✅ Décimales: 2 max
✅ PnL: Réaliste ($0-$500 par trade)
✅ Balance: Capital + PnL fermé
✅ Tracking temps réel OK

**Le système fonctionne maintenant correctement avec des données propres!**
