# AI Trading Platform

Plateforme professionnelle de trading assisté par IA qui génère des signaux intelligents pour BTC, ETH, NASDAQ et GOLD.

## Fonctionnalités

- **Analyse technique IA** : RSI, MACD, Order Blocks, Support/Résistance
- **Signaux intelligents** : Confirmations multiples, confiance 70%+, RR 1.5:1+
- **Validation horaires de marché** : NASDAQ/GOLD fermés le week-end
- **Gestion multi-comptes** : Support Binance, Bybit, FTMO, TopStep
- **Calcul automatique du risque** : Position sizing selon capital et règles prop firm
- **Système de crédits** : Paiement par nombre de positions
- **Chart professionnel** : TradingView-like avec drag/zoom
- **Popup avec timer** : Zone d'entrée, SL, TP, countdown
- **Alertes audio** : Bip pour signaux, TP et SL
- **Stats complètes** : PnL, Winrate, Historique
- **Super Admin** : Gestion utilisateurs et crédits
- **Conformité UE** : Disclaimers légaux complets

## Installation

```bash
npm install
```

## Commandes

```bash
npm start           # Serveur de développement
npm run build       # Build de production
npm test            # Tests
```

## Configuration

Variables d'environnement requises dans `.env`:

```
REACT_APP_SUPABASE_URL=https://votre-projet.supabase.co
REACT_APP_SUPABASE_ANON_KEY=votre-cle-anonyme
```

## Architecture

- **Frontend** : React, React Router
- **Chart** : lightweight-charts (TradingView-like)
- **Backend** : Supabase (Database, Auth, RLS)
- **Market Data** : WebSocket Binance (temps réel)
- **Indicateurs** : technicalindicators library

## Documentation Complète

Voir `PLATFORM_DOCUMENTATION.md` pour la documentation détaillée.

## Avertissement

Cette plateforme est un outil d'aide à la décision uniquement. Le trading comporte des risques importants. Vous êtes seul responsable de vos décisions de trading.

## Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── TradingChart/   # Chart professionnel
│   ├── SignalPopup/    # Popup de signal
│   └── LegalDisclaimer/
├── pages/              # Pages principales
│   ├── TradingDashboard/
│   ├── AccountManagement/
│   ├── SuperAdmin/
│   └── Auth/
├── services/           # Logique métier
│   ├── marketData.js
│   ├── signalEngine.js
│   ├── indicators.js
│   ├── riskCalculator.js
│   └── audioAlerts.js
└── lib/
    └── supabaseClient.js
```

## Premiers Pas

1. Créer un compte via `/signup`
2. Accepter le disclaimer légal
3. Créer un compte de trading dans "Gestion des Comptes"
4. Contacter le Super Admin pour obtenir des crédits
5. Sélectionner marché + plateforme + timeframe
6. Activer le mode AUTO ou cliquer "Scanner"
7. Attendre un signal et ACCEPTER/REFUSER

## Support

Pour questions ou problèmes, vérifier:
- Marché ouvert
- Crédits disponibles
- Compte configuré et actif
- Plateforme correspond au marché
