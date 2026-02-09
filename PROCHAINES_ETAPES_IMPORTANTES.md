# PROCHAINES ÉTAPES - FONCTIONNALITÉS AVANCÉES

Date: 09/02/2026 03:50
Statut: À implémenter

---

## ✅ DÉJÀ CORRIGÉ (v3.0)

- ✅ Détection LONG/SHORT infaillible
- ✅ Calcul SL depuis profil client
- ✅ UI navbar compacte
- ✅ Popups réduits
- ✅ Bip sonore automatique
- ✅ Formatage prix lisible
- ✅ Branchement comptes actifs

---

## 🔄 FONCTIONNALITÉS À IMPLÉMENTER

### 1. HISTORIQUE DES POSITIONS

**Besoin:**
- Afficher TOUTES les positions fermées sous le graphique
- Une seule position active maximum à la fois
- Position active visible avec statut "En cours"
- Positions fermées déplacées automatiquement dans historique

**Affichage requis:**
```
┌─── POSITION EN COURS ───┐
│ 🔴 SHORT GOLD          │
│ Entrée: 71,390         │
│ SL: 71,750  TP1: 70,507│
│ Status: EN COURS       │
└────────────────────────┘

┌─── HISTORIQUE ─────────┐
│ ✅ LONG BTC            │
│ Entrée: 42,500         │
│ Clôture: 43,200 (TP1)  │
│ Résultat: +$1,250      │
│ Date: 08/02 14:30      │
├────────────────────────┤
│ ❌ SHORT ETH           │
│ Entrée: 2,850          │
│ Clôture: 2,900 (SL)    │
│ Résultat: -$500        │
│ Date: 08/02 12:15      │
└────────────────────────┘
```

**Colonnes historique:**
- Direction (LONG/SHORT) avec icône
- Marché
- Prix d'entrée
- Prix de clôture (TP1/TP2/SL)
- Résultat (gain/perte en USD)
- Date/heure
- Durée position

**Logique:**
- UNE seule position active maximum
- Tant qu'une position est active:
  - Aucun nouveau scan
  - Aucun nouveau signal
  - Aucune nouvelle position
- Une fois clôturée:
  - Déplacée dans historique
  - Nouveau scan autorisé

**Fichiers à modifier:**
- `src/pages/TradingDashboard/TradingDashboard.jsx`
- `src/components/PositionHistory/PositionHistory.jsx` (déjà existe)
- Requête Supabase pour récupérer positions fermées

---

### 2. BARRE STATISTIQUES EN BAS (TEMPS RÉEL)

**Besoin:**
Comme TopStep/FTMO, une barre en bas affichant:

```
┌────────────────────────────────────────────────────────────┐
│ 💰 Balance: $100,000  |  📈 PNL Jour: +$450 (+0.45%)      │
│ ✅ Gains: $1,850  |  ❌ Pertes: -$1,400  |  📊 Trades: 8 │
└────────────────────────────────────────────────────────────┘
```

**Données à afficher:**
- **Balance actuelle**: Capital + PNL cumulé
- **PNL journalier**: Gain/perte du jour (en $ et %)
- **Gains cumulés**: Total des positions gagnantes
- **Pertes cumulées**: Total des positions perdantes
- **Nombre de trades**: Total positions (jour/semaine/total)
- **Winrate**: % de positions gagnantes

**Source des données:**
- `user_profiles.balance` (balance actuelle)
- `positions` table (historique complet)
- Calcul temps réel PNL position ouverte
- Agrégations par jour/semaine/mois

**Mise à jour:**
- Temps réel toutes les 5 secondes
- Refresh immédiat à la clôture position
- Couleur dynamique (vert si gain, rouge si perte)

**Fichiers à créer/modifier:**
- `src/components/StatsBar/StatsBar.jsx` (nouveau)
- `src/components/StatsBar/StatsBar.module.css` (nouveau)
- `src/services/statsCalculator.js` (nouveau)
- Intégration dans `TradingDashboard.jsx`

---

### 3. GESTION SL AUTOMATIQUE ET BREAK-EVEN

**Besoin:**
- Si prix touche SL → clôture immédiate automatique
- Si TP1 atteint → passer SL à Break-Even (ou léger gain)
- Popup notification utilisateur

**Logique Break-Even:**
```
Position SHORT:
- Entrée: 71,390
- SL initial: 71,750 (au-dessus)
- TP1: 70,507

Quand prix atteint 70,507 (TP1):
→ SL passe à 71,390 (Break-Even)
→ ou 71,340 (léger gain +0.07%)
→ Popup: "TP1 ATTEINT - SL déplacé à BE"
→ Son: takeProfitAlert()
```

**Cas d'usage:**
1. **TP1 touché:**
   - Clôturer 50% position (optionnel)
   - Déplacer SL à BE ou +0.1%
   - Notifier utilisateur
   - Log action

2. **SL touché:**
   - Clôture position immédiate
   - Calcul PNL
   - Enregistrement historique
   - Son stopLossAlert()

3. **TP2 touché:**
   - Clôture totale
   - Calcul PNL final
   - Enregistrement historique
   - Son takeProfitAlert()

**Fichiers à modifier:**
- `src/services/positionManager.js` (monitoring prix)
- `src/services/trailingStop.js` (gestion BE)
- `src/pages/TradingDashboard/TradingDashboard.jsx` (popup notifications)

---

### 4. TRAÇAGE GRAPHIQUE AVANT POPUP

**Besoin:**
Avant d'afficher le popup, tracer les niveaux sur le graphique:
- Ligne entrée (bleue/rouge selon direction)
- Ligne SL (rouge)
- Ligne TP1 (verte)
- Ligne TP2 (verte pointillée)

Ces lignes restent PERMANENTES jusqu'à:
- Acceptation signal → position ouverte
- Refus signal → lignes supprimées
- Expiration signal → lignes supprimées

**Workflow:**
```
1. Signal détecté
   ↓
2. Tracer niveaux sur graphique (permanent)
   ↓
3. Bip sonore
   ↓
4. Afficher popup avec countdown
   ↓
5. Utilisateur accepte/refuse
   ↓
6. Si accepté: lignes restent (position ouverte)
   Si refusé: lignes supprimées
```

**Fichiers à modifier:**
- `src/components/TradingChart/TradingChart.jsx`
- `src/pages/TradingDashboard/TradingDashboard.jsx`
- Ajouter état `previewLines` pour les lignes avant confirmation

---

### 5. SAUVEGARDE MARCHÉ/PLATEFORME

**Besoin:**
Sauvegarder le marché et plateforme sélectionnés:
- Dans user_settings (DB)
- Restaurer au chargement page
- Persister même après déconnexion

**Logique:**
```javascript
// Quand utilisateur change marché/plateforme
const handleMarketChange = async (newMarket) => {
  setMarket(newMarket);

  // Sauvegarder dans DB
  await supabase
    .from('user_settings')
    .update({
      last_market: newMarket,
      last_platform: platform
    })
    .eq('user_id', userId);
};

// Au chargement page
useEffect(() => {
  const loadSettings = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('last_market, last_platform')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setMarket(data.last_market || 'BTC');
      setPlatform(data.last_platform || 'binance');
    }
  };

  loadSettings();
}, [userId]);
```

**Migration à créer:**
```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS last_market text DEFAULT 'BTC',
ADD COLUMN IF NOT EXISTS last_platform text DEFAULT 'binance';
```

---

### 6. VALIDATION CONFIRMATIONS

**Besoin:**
Aucune position ne doit être ouverte sans confirmation COMPLÈTE:
- RSI (suracheté/survendu)
- MACD (croisement/tendance)
- Structure (support/résistance)
- Tendance (pas de LONG en marché baissier)

**Règles strictes:**
```javascript
// Interdire LONG si marché baissier
if (trend === 'downtrend' && direction === 'LONG') {
  return {
    signal: null,
    reason: 'Marché baissier - LONG interdit'
  };
}

// Interdire SHORT si marché haussier
if (trend === 'uptrend' && direction === 'SHORT') {
  return {
    signal: null,
    reason: 'Marché haussier - SHORT interdit'
  };
}

// Exiger confirmations multiples
if (confidence < 75) {
  return {
    signal: null,
    reason: 'Confiance insuffisante - Confirmations manquantes'
  };
}
```

**Déjà partiellement implémenté:**
- Le système calcule déjà confidence
- Le système détecte déjà trend
- Il faut juste ajouter filtres stricts

---

## 📊 PRIORITÉS

### Critique (Phase 1)
1. ✅ Direction LONG/SHORT (FAIT)
2. ✅ Calcul SL profil (FAIT)
3. ✅ UI compacte (FAIT)
4. ⏳ Historique positions (À FAIRE)
5. ⏳ Barre statistiques (À FAIRE)

### Important (Phase 2)
6. ⏳ SL automatique + BE (À FAIRE)
7. ⏳ Traçage avant popup (À FAIRE)
8. ⏳ Validation confirmations strictes (À FAIRE)

### Confort (Phase 3)
9. ⏳ Sauvegarde marché/plateforme (À FAIRE)
10. ⏳ Notifications desktop (À FAIRE)
11. ⏳ Export historique CSV (À FAIRE)

---

## 🎯 OBJECTIF FINAL

**Plateforme 100% professionnelle type TopStep:**

```
┌────────────────────────────────────────────────────┐
│  [Navbar compacte]                     [v3.0.0]  │
├────────────────────────────────────────────────────┤
│  📊 COMPTE ACTIF: GOLD/topstep - $100,000        │
├────────────────────────────────────────────────────┤
│  [Graphique avec position en cours + niveaux]    │
├────────────────────────────────────────────────────┤
│  📈 POSITION EN COURS                             │
│  🔴 SHORT - Entry: 71,390 | SL: 71,750           │
│  TP1: 70,507 ✓ | TP2: 70,157 (en cours)         │
│  PNL: +$883 (+0.88%)                             │
├────────────────────────────────────────────────────┤
│  📜 HISTORIQUE (20 dernières positions)          │
│  ✅ LONG BTC | +$1,250 | 08/02 14:30            │
│  ❌ SHORT ETH | -$500 | 08/02 12:15             │
│  ✅ LONG NASDAQ | +$750 | 07/02 16:45           │
├────────────────────────────────────────────────────┤
│  💰 Balance: $100,883 | 📈 PNL Jour: +$883      │
│  ✅ Gains: $2,000 | ❌ Pertes: -$1,117          │
│  📊 Trades: 3 | 🎯 Winrate: 66.7%               │
└────────────────────────────────────────────────────┘
```

**Fonctionnalités actives:**
- ✅ Signaux précis (direction infaillible)
- ✅ Money management strict
- ✅ UI professionnelle compacte
- ✅ Alertes sonores
- ⏳ Historique complet
- ⏳ Stats temps réel
- ⏳ Gestion automatique SL/BE
- ⏳ Traçage graphique préalable

---

## 📝 NOTES TECHNIQUES

### Base de données
Tables existantes à exploiter:
- `positions` - Positions actives et historique
- `user_profiles` - Balance utilisateur
- `trading_accounts` - Comptes actifs
- `user_settings` - Préférences (à étendre)

### Performance
- Requêtes optimisées (index sur user_id, status, created_at)
- Agrégations côté DB (stats)
- Cache local (last 20 positions)
- Update temps réel PNL (5s interval)

### Sécurité
- RLS policies strictes
- Vérification ownership
- Validation côté serveur
- Logs audit trail

---

## 🚀 CONCLUSION

**PHASE 1 TERMINÉE (v3.0):**
- Direction LONG/SHORT infaillible ✅
- Money management professionnel ✅
- UI compacte et efficace ✅

**PHASE 2 À COMMENCER:**
- Historique positions
- Barre statistiques temps réel
- Gestion automatique SL/BE

Une fois la Phase 2 terminée, la plateforme sera 100% identique à TopStep/FTMO en termes de fonctionnalités et comportement professionnel.
