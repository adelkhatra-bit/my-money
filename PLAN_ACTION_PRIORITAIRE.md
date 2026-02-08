# 📋 Plan d'Action Prioritaire - AI Trading Platform

## ✅ Corrections Déjà Appliquées

### 1. RLS (Row Level Security) - RÉSOLU ✅

**Problème**: `new row violates row-level security policy for table 'positions'`

**Solution appliquée**:
- ✅ Politiques RLS corrigées pour `positions`
- ✅ Politiques RLS corrigées pour `trading_accounts`
- ✅ Politiques RLS corrigées pour 6+ autres tables
- ✅ Build réussi sans erreurs

**Statut**: Les utilisateurs peuvent maintenant accepter des positions

**Documentation**: Voir `RLS_FIX_COMPLETE.md`

---

## 🔴 Bugs Critiques à Corriger IMMÉDIATEMENT

### 1. Inversion LONG/SHORT dans les signaux

**Priorité**: 🔴 CRITIQUE

**Problème**:
- Les positions SHORT ont le TP au-dessus du prix d'entrée (impossible!)
- La logique RSI génère presque uniquement des LONG
- Les SHORT ne peuvent jamais gagner

**Impact**:
- Expérience utilisateur catastrophique
- Positions SHORT perdantes systématiquement
- Crédibilité de la plateforme compromise

**Fichiers affectés**:
- `src/services/signalEngine.js` (lignes 78, 134, 179-181)

**Documentation complète**: Voir `BUG_LONG_SHORT_INVERSION.md`

**Corrections à appliquer**:

```javascript
// 1. Corriger la logique RSI
if (rsi < 30) {          // Au lieu de: rsi < 70
  direction = 'LONG';
  // ...
} else if (rsi > 70) {   // Au lieu de: rsi > 30
  direction = 'SHORT';
  // ...
}

// 2. Corriger les Take Profits SHORT
if (supports.length > 0) {
  takeProfit1 = supports[0] * 0.99;  // Au lieu de: * 1.01
  if (supports.length > 1) {
    takeProfit2 = supports[1] * 0.99;  // Au lieu de: * 1.01
  }
}
```

**Estimation**: 10 minutes de correction + 20 minutes de tests

---

### 2. PNL non mis à jour en temps réel

**Priorité**: 🟡 IMPORTANT

**Problème**:
- Balance reste à 0 même avec positions ouvertes
- PNL ne se met pas à jour en temps réel
- Gains et Winrate ne bougent pas
- Pas de détection automatique TP/SL

**Impact**:
- Aucun feedback pour l'utilisateur
- Impossible de savoir si on gagne ou perd
- Nécessite de rafraîchir manuellement

**Documentation complète**: Voir `BUG_PNL_TEMPS_REEL.md`

**Solution requise**:
1. Calculer PNL non réalisé pour positions OPEN
2. Mettre à jour les stats toutes les 5 secondes
3. Vérifier TP/SL toutes les 2 secondes
4. Fermer automatiquement les positions qui atteignent TP/SL
5. Jouer les alertes audio appropriées

**Estimation**: 2-3 heures d'implémentation + tests

---

## 🟢 Fonctionnalités Manquantes (Selon Specs)

### 3. Validation des heures de marché

**Priorité**: 🟡 IMPORTANT

**Problème**: Signaux envoyés pour NASDAQ le weekend (marché fermé)

**Solution**:
- ✅ La fonction `isMarketOpen()` existe déjà
- ✅ Elle est appelée dans `generateSignal()`
- ⚠️ Vérifier qu'elle fonctionne correctement pour NASDAQ weekends

**Fichiers**:
- `src/services/marketHours.js`
- `src/services/signalEngine.js`

**Estimation**: 30 minutes de vérification + ajustements

---

### 4. Système de crédits fonctionnel

**Statut**: Partiellement implémenté

**Ce qui fonctionne**:
- ✅ Table `position_credits` créée
- ✅ Déduction d'1 crédit à l'acceptation d'un signal
- ✅ Affichage du compteur de crédits

**Ce qui manque**:
- ❌ Super Admin ne peut pas ajouter de crédits
- ❌ Pas de packs de crédits (5 pos., 10 pos., 50 pos.)
- ❌ Pas d'interface d'achat de crédits
- ❌ Pas d'intégration Stripe (paiement)

**Estimation**: 4-6 heures pour système complet

---

### 5. Interface Super Admin

**Statut**: Tables créées mais pas d'interface

**Fonctionnalités requises**:
- ❌ Voir tous les utilisateurs
- ❌ Approuver/rejeter demandes d'essai gratuit
- ❌ Ajouter/retirer des crédits
- ❌ Voir statistiques globales
- ❌ Gérer les paramètres (spreads, commissions)

**Estimation**: 6-8 heures

---

### 6. Système de parrainage

**Statut**: Tables créées mais pas de logique

**Fonctionnalités requises**:
- ❌ Génération de code de parrainage unique
- ❌ Attribution de 2 positions gratuites au parrain
- ❌ Attribution de 2 positions gratuites au filleul
- ❌ Historique des parrainages
- ❌ Interface de partage

**Estimation**: 4-5 heures

---

### 7. Gestion multi-comptes

**Statut**: Table créée mais interface minimale

**Fonctionnalités requises**:
- ✅ Table `trading_accounts` créée
- ✅ Création de compte fonctionnelle
- ❌ Page "Gérer mes comptes" non fonctionnelle
- ❌ Sélection du compte actif
- ❌ Support prop firms (TopStep, FTMO, Apex)
- ❌ Paper trading mode

**Estimation**: 3-4 heures

---

### 8. Page Profil

**Statut**: Partiellement implémenté

**Ce qui manque**:
- ❌ Modification email
- ❌ Modification mot de passe
- ❌ Paramètres de notifications
- ❌ Préférences de trading
- ❌ Historique d'activité

**Estimation**: 2-3 heures

---

### 9. Tracés sur graphique

**Statut**: Composant TradingChart existe

**Fonctionnalités requises**:
- ⚠️ Vérifier si Entry/SL/TP sont bien tracés
- ⚠️ Vérifier si supports/resistances s'affichent
- ⚠️ Vérifier si order blocks s'affichent
- ❌ Masquage des tracés si pas de crédits (anti-abuse)

**Estimation**: 1-2 heures de vérification + ajustements

---

### 10. Système d'alertes en 2 étapes

**Statut**: Partiellement implémenté

**Ce qui fonctionne**:
- ✅ Composant `PreAlertPopup` existe
- ✅ Composant `SignalPopup` existe

**À vérifier**:
- ⚠️ Pré-alerte 2-5 min avant le signal
- ⚠️ Délai de 10 min pour accepter le signal
- ⚠️ Timer qui décompte
- ⚠️ Alertes audio différenciées

**Estimation**: 1 heure de vérification

---

## 📊 Plan de Travail Recommandé

### Phase 1: Corrections Critiques (URGENT - 1 jour)

1. **Fixer bug LONG/SHORT** (30 min)
   - Corriger logique RSI
   - Corriger calcul TP pour SHORT
   - Tester LONG et SHORT

2. **Implémenter PNL temps réel** (3-4h)
   - Calculer PNL non réalisé
   - Mise à jour périodique
   - Détection TP/SL automatique
   - Fermeture automatique positions

3. **Vérifier heures de marché** (30 min)
   - Tester NASDAQ weekend
   - Tester GOLD
   - Tester BTC 24/7

### Phase 2: Fonctionnalités Essentielles (2-3 jours)

4. **Gestion multi-comptes complète** (4h)
   - Page "Gérer mes comptes"
   - Sélection compte actif
   - Support prop firms

5. **Interface Super Admin** (8h)
   - Dashboard admin
   - Gestion utilisateurs
   - Gestion crédits
   - Approbation essais gratuits

6. **Système de parrainage** (5h)
   - Génération codes
   - Attribution bonus
   - Interface utilisateur

### Phase 3: Finitions (1-2 jours)

7. **Page Profil complète** (3h)
8. **Système de crédits/packs** (6h)
9. **Vérifications tracés graphique** (2h)
10. **Alertes audio et système 2 étapes** (1h)

---

## 🎯 Action Immédiate Recommandée

**COMMENCER PAR**:

1. ✅ **RLS déjà corrigé** - Tester acceptation position
2. 🔴 **Corriger bug LONG/SHORT** - CRITIQUE
3. 🟡 **Implémenter PNL temps réel** - IMPORTANT

Ces 3 éléments sont le minimum pour avoir une plateforme utilisable.

---

## 📝 Notes Importantes

### Données de Test Disponibles

Un utilisateur existe déjà dans la base:
```
Email: adel.khatra@live.fr
Profile ID: eb277aa5-055a-43d4-bfa3-fc79c8cc5ada
Auth ID: 2fb6d485-e64b-46a1-b0d5-4068a6d73dc1
Trading Account: setywey (70cbe791-ff9b-4728-bee9-0e1c98958cfc)
```

### Build Status

✅ Le projet compile sans erreurs
✅ Les migrations sont toutes appliquées
✅ La structure de base est solide

### Points d'Attention

⚠️ **Ne PAS oublier**:
- Tester sur plusieurs marchés (BTC, NASDAQ, GOLD)
- Tester les weekends pour NASDAQ
- Tester avec différents RSI (< 30, 30-70, > 70)
- Vérifier les calculs de position size
- Vérifier les alertes audio

---

## ❓ Questions à Clarifier

1. **Stripe**: Intégration paiement prévue pour quand ?
2. **Prop Firms**: Quels prop firms à supporter en priorité ?
3. **Abonnement**: Uniquement crédits ou aussi abonnement mensuel ?
4. **Marchés**: Autres marchés à ajouter (ETH, EUR/USD, etc.) ?
5. **Notifications**: Email, SMS, push notifications ?

---

**Document créé le**: 2026-02-08
**Dernière mise à jour**: Après correction RLS
**Prochaine action**: Corriger bug LONG/SHORT dans signalEngine.js
