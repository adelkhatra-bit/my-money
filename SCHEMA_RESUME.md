# SCHÉMA COMPLET - RÉSUMÉ EXÉCUTIF

**Document complet**: `SCHEMA_COMPLET_APPLICATION.md` (40+ pages)

---

## CE QUI A ÉTÉ ANALYSÉ

### ✅ INVENTAIRE TOTAL
- **13 pages** analysées en détail
- **8 onglets** navbar documentés
- **~55-60 boutons** uniques inventoriés
- **14 composants** React principaux mappés
- **11 tables** Supabase documentées
- **10 services** métier décrits

---

## STRUCTURE DOCUMENT

### 1. CARTE DU SITE
Routes publiques (5) + Routes protégées (7) + Admin (1)

### 2. INVENTAIRE NAVBAR
- Brand + 7-8 onglets selon profil
- Bouton déconnexion

### 3. TABLEAU BOUTONS (FORMAT DÉTAILLÉ)
Pour **CHAQUE** bouton:
- Nom exact dans UI
- Page / section
- Condition d'affichage
- Fonction appelée (handler)
- Données lues
- Données écrites
- Endpoint / table
- Résultat UI attendu
- Cas d'erreur

**Exemples documentés**:
- Dashboard: 5 boutons/liens
- Trading: 7 boutons + 3 dropdowns
- Configuration: 2 boutons
- Signaux: 2 boutons par signal
- Mes Comptes: 8 boutons
- Parrainage: 6 boutons
- Profil: 6 boutons
- Super Admin: 9 boutons
- Login/Signup: 1 chacun

### 4. SCHÉMA COMPOSANTS PAR PAGE
Pour **CHAQUE** page:
- Liste composants React utilisés
- Structure hiérarchique (arbre)
- Inputs/Props de chaque composant
- State utilisé
- Source de données (RÉEL vs SIMULATION)
- Sortie (ce qui est affiché)

### 5. SCHÉMA DES DONNÉES (SOURCE DE VÉRITÉ)

#### Capital & Balance
```
Capital = trading_accounts.capital (FIXE - NEVER CHANGES)
Balance = capital + realized_pnl (DYNAMIQUE)
Wallet = Balance (ALIAS)
```

#### PnL
```
Realized PnL = Σ(positions fermées).pnl
Unrealized PnL = Σ(positions ouvertes).current_pnl (temps réel)
Total PnL = realized + unrealized
```

#### Stats
```
Wins = COUNT(TP1_HIT, TP2_HIT)
Losses = COUNT(SL_HIT)
Winrate = (wins / closed_trades) × 100
```

### 6. TABLES SUPABASE
Documentation complète de 11 tables:
- `user_profiles` - Profils utilisateurs
- `user_settings` - Préférences (audio, bot)
- `trading_accounts` - Comptes trading
- `position_credits` - Crédits positions
- `positions` - Positions ouvertes/fermées
- `signal_history` - Historique signaux
- `action_history` - Journal d'audit
- `free_trial_requests` - Demandes crédits gratuits
- `referrals` - Programme parrainage
- `topstep_connections` - Connexions Topstep
- `tradingview_alerts` - Alertes webhook TradingView
- `user_preferences` - Préférences last selections
- `admin_settings` - Paramètres admin globaux

Pour chaque table:
- Colonnes avec types
- Contraintes
- RLS Policies
- Index
- Migration créatrice

### 7. SERVICES & LOGIQUE MÉTIER
- `marketDataProvider`: Candles, prix live
- `signalEngine`: Génération signaux AI
- `positionManager`: Monitoring temps réel
- `positionService`: CRUD positions
- `tradingGate`: Validation conditions trading
- `userPreferencesService`: Gestion préférences
- `audioAlerts`: Sons notifications
- `riskCalculator`: Calculs taille position
- `trailingStop`: Trailing stop automatique
- `newsDetection`: Suspension news
- `marketHours`: Horaires marchés

### 8. SOURCES DE VÉRITÉ
- Mode SIMULATION vs RÉEL
- Récap sources par type de données
- **5 incohérences identifiées** avec solutions

---

## POINTS CLÉS DÉCOUVERTS

### ✅ COHÉRENT
- Architecture globale solide
- Séparation services/composants propre
- RLS policies bien définies
- Audit trail complet (action_history)

### ❌ INCOHÉRENCES IDENTIFIÉES

**1. Capital vs Balance - Confusion**
- Certains composants affichent capital au lieu de balance
- **Solution**: Toujours afficher `capital + realized_pnl`

**2. PnL Calculation - Double calcul**
- TradingDashboard ET PositionMonitor calculent PnL séparément
- **Solution**: Centraliser calcul dans 1 service

**3. Credits - Double source**
- State local + DB sans sync automatique
- **Solution**: Single source + real-time subscription

**4. Simulation Mode - Pas assez clair**
- Badge visible mais pas assez explicite
- **Solution**: Modal disclaimer + watermark

**5. Market Status - Pas toujours respecté**
- ✅ **CORRIGÉ aujourd'hui** (hard gates ajoutés)

---

## DONNÉES RÉEL vs SIMULATION

| Type | SIMULATION | RÉEL |
|------|------------|------|
| Candles | JSON fichier | API externe |
| Prix live | Mock généré | WebSocket temps réel |
| Capital | Mock 50000$ | `trading_accounts.capital` |
| Balance | Mock calculé | `capital + realized_pnl` |
| Positions | State local | Table `positions` |
| Crédits | Mock 5 | Table `position_credits` |
| Signaux | Aléatoires | `signalEngine` candles réels |
| User | Mock | Table `user_profiles` |
| Stats | Mock | DB via RPC |

---

## STATISTIQUES FINALES

- **Pages analysées**: 13
- **Composants React**: 14 principaux
- **Boutons uniques**: ~55-60
- **Tables DB**: 11
- **Services**: 10
- **Handler functions**: 38+
- **State variables**: 48+ (TradingDashboard seul)
- **Data sources**: 41+ (queries, services, APIs)

---

## UTILISATION DE CE DOCUMENT

1. ✅ **Référence pour refactoring**
   - Comprendre exactement ce qui existe
   - Identifier ce qui est fake/mock
   - Savoir ce qui manque

2. ✅ **Documentation développeurs**
   - Onboarding nouveaux devs
   - Maintenance code
   - Debug

3. ✅ **Base pour tests E2E**
   - Tous les boutons sont documentés
   - Tous les flows sont mappés

4. ✅ **Validation logique métier**
   - Formules PnL validées
   - Sources de vérité clarifiées

---

## PROCHAINES ÉTAPES RECOMMANDÉES

1. **Valider ce schéma** (toi + équipe)
2. **Corriger incohérences** (Capital/Balance, PnL, etc.)
3. **Ajouter tests unitaires** (formules PnL critiques)
4. **Refactoring progressif** (page par page)
5. **Clarifier simulation** (modal disclaimer)

---

**DOCUMENT COMPLET**: Voir `SCHEMA_COMPLET_APPLICATION.md`

**Ce résumé**: Vue d'ensemble rapide (5 min lecture)
**Document complet**: Référence exhaustive (40+ pages)
