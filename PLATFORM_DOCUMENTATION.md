# AI Trading Platform - Documentation Complète

## Vue d'ensemble

Plateforme de trading intelligente avec IA qui génère des signaux de trading basés sur l'analyse technique pour BTC, ETH, NASDAQ et GOLD.

**Important**: Cette plateforme est un **outil d'aide à la décision** uniquement - elle ne trade PAS automatiquement.

## Fonctionnalités Principales

### 1. Analyse Intelligente du Marché
- **Indicateurs techniques**: RSI, MACD, EMA, SMA
- **Détection des structures**: Order Blocks, Supports/Résistances
- **Analyse de tendance**: Uptrend, Downtrend, Range
- **Confluence de signaux**: Multiple confirmations requises avant signal

### 2. Génération de Signaux
- Signaux LONG/SHORT avec zone d'entrée (pas un prix unique)
- Stop Loss et Take Profit calculés intelligemment
- Niveau de confiance (minimum 70%)
- Risk/Reward minimum de 1.5:1
- Timer de validité (10 minutes) pour chaque signal
- Cooldown de 10 minutes entre signaux

### 3. Validation des Horaires de Marché
- **BTC/ETH**: Marché 24/7
- **NASDAQ/GOLD**: Fermé le week-end et hors horaires de trading
- Aucun signal généré quand le marché est fermé
- Message clair indiquant le statut du marché

### 4. Gestion Multi-Comptes
- Support de plusieurs comptes par utilisateur
- Comptes personnels (Binance, Bybit, Coinbase)
- Comptes prop firm (FTMO, TopStep, Apex)
- Configuration individuelle par compte:
  - Capital
  - Risque par trade (%)
  - Perte max journalière
  - Perte max totale

### 5. Calcul Automatique du Risque
- Taille de position calculée automatiquement
- Basée sur:
  - Capital du compte
  - Distance du Stop Loss
  - Risque configuré (%)
  - Règles de la plateforme (tick size, point value)
- Avertissements si risque excessif

### 6. Système de Crédits/Abonnements
- Paiement par nombre de positions (pas mensuel)
- Crédits par marché (BTC, ETH, NASDAQ, GOLD)
- 1 crédit consommé par signal accepté
- Gestion par le Super Admin

### 7. Interface Graphique Professionnelle
- Chart TradingView-like avec:
  - Drag/Pan/Zoom
  - Support & Résistance tracés
  - Entry/SL/TP visibles
  - Espacement correct (right padding)
  - Bouton plein écran
  - Bouton recentrer

### 8. Popup de Signal Complet
- Animation d'apparition
- Timer avec compte à rebours
- Toutes les informations du trade:
  - Direction (LONG/SHORT)
  - Zone d'entrée
  - Stop Loss
  - Take Profit 1 & 2
  - Taille de position recommandée
  - Risque en $ et %
  - Profit potentiel
  - Risk/Reward
  - Confiance (%)
  - Raisons de l'entrée
- Boutons ACCEPTER / REFUSER
- Signal expiré = entrée bloquée

### 9. Alertes Audio
- Bip lors de l'arrivée d'un signal
- Son différent pour TP touché
- Son différent pour SL touché
- Volume ajustable
- Activable/désactivable

### 10. Statistiques & Tracking
- Balance
- PnL total
- Nombre de trades
- Gains / Pertes
- Winrate
- Historique complet des positions
- Visible pour l'utilisateur
- Visible pour le Super Admin

### 11. Super Admin Panel
- Vue sur tous les utilisateurs
- Stats globales
- Ajout de crédits par utilisateur et par marché
- Vue des performances de chaque utilisateur
- Gestion complète de la plateforme

### 12. Conformité Légale (UE)
- Disclaimer trading complet
- Avertissement sur les risques
- Pas de promesse de gains
- Responsabilité utilisateur
- Acceptation obligatoire avant utilisation

## Architecture Technique

### Base de Données (Supabase)
- `user_profiles`: Profils utilisateurs
- `trading_accounts`: Comptes de trading multi-plateformes
- `position_credits`: Crédits par marché
- `signals`: Signaux générés par l'IA
- `positions`: Positions acceptées et résultats
- `market_config`: Configuration des marchés
- `platform_config`: Configuration des plateformes

### Services
- `marketData.js`: Connexion WebSocket Binance, données en temps réel
- `marketHours.js`: Validation horaires de marché
- `indicators.js`: Calcul RSI, MACD, EMA, SMA, Order Blocks
- `signalEngine.js`: Génération intelligente de signaux
- `riskCalculator.js`: Calcul automatique de la taille de position
- `audioAlerts.js`: Gestion des sons

### Composants React
- `TradingDashboard`: Interface principale
- `TradingChart`: Graphique professionnel
- `SignalPopup`: Popup de signal avec timer
- `AccountManagement`: Gestion des comptes
- `SuperAdmin`: Panel administrateur
- `LegalDisclaimer`: Avertissements légaux

### Sélection des Plateformes
- BTC/ETH: Binance, Bybit, Coinbase
- NASDAQ/GOLD: FTMO, TopStep
- Graduation correcte selon la plateforme
- Prix synchronisés

## Workflow Utilisateur

1. **Inscription / Connexion**
   - Création de compte avec email/mot de passe
   - Acceptation du disclaimer légal

2. **Configuration d'un Compte de Trading**
   - Aller dans "Gestion des Comptes"
   - Créer un compte (nom, plateforme, marché, capital, risque)
   - Activer le compte

3. **Obtention de Crédits**
   - Le Super Admin ajoute des crédits par marché
   - Exemple: 25 positions BTC

4. **Trading**
   - Sélectionner marché + plateforme + timeframe
   - Activer le mode AUTO (optionnel) ou cliquer "Scanner"
   - Attendre qu'un signal apparaisse
   - **POPUP avec timer**: Lire les informations
   - ACCEPTER ou REFUSER
   - Si accepté: position enregistrée, crédit débité, tracé sur chart

5. **Suivi des Performances**
   - Stats en bas de l'écran (Balance, PnL, Winrate, etc.)
   - Historique des positions dans le profil

## Points Importants

### Protections Intégrées
- Pas de signal si marché fermé
- Pas de signal si confiance < 70%
- Pas de signal si RR < 1.5:1
- Cooldown entre signaux
- Timer de validité
- Blocage si crédits épuisés
- Avertissement si risque élevé

### Philosophie du Robot
- **Décision, pas conseil**: Le robot propose une action claire
- **Anti-émotion**: Empêche l'overthinking et le sur-trading
- **Transparence**: Explique pourquoi il entre
- **Respect du temps humain**: Zone d'entrée + timer
- **Intelligent**: Vérifie corrélations et confluences

### Cohérence des Prix
- Le prix sur le chart = le prix du signal = le prix de la plateforme
- Graduation correcte selon la plateforme sélectionnée
- Pas de mélange de sources

## Commandes

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start

# Build de production
npm run build
```

## Variables d'Environnement

```
REACT_APP_SUPABASE_URL=https://votre-projet.supabase.co
REACT_APP_SUPABASE_ANON_KEY=votre-cle-anonyme
```

## Prochaines Étapes Possibles

1. Intégration Stripe pour paiements automatiques
2. Corrélations DXY (Dollar Index) pour confirmations
3. Support de plus de marchés (ETH, EUR/USD, etc.)
4. Mode semi-automatique (exécution automatique après acceptation)
5. Notifications mobiles
6. API pour connexion broker réel
7. Backtesting des signaux
8. Machine Learning pour amélioration continue

## Support & Aide

Pour toute question ou problème:
- Vérifier que le marché est ouvert
- Vérifier que vous avez des crédits
- Vérifier que votre compte est configuré et actif
- Vérifier que la plateforme correspond au marché

## Avertissement Final

⚠️ **Le trading comporte des risques importants de perte en capital.**

Cette plateforme est un outil d'aide à la décision. Vous êtes seul responsable de vos décisions de trading. Ne tradez qu'avec des fonds que vous pouvez vous permettre de perdre.
