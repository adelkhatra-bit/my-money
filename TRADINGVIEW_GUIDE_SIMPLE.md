# Guide TradingView - Configuration Simple

## ❌ CE QUI N'EXISTE PAS

Il n'y a PAS de:
- "ID TradingView" à chercher
- "Client ID TradingView"
- Clé API incluse avec l'abonnement

## ✅ CE DONT ON A BESOIN

### 1. Ton Pseudo TradingView (optionnel)

**Où le trouver:**
En bas à gauche de l'écran TradingView

**Exemple:**
```
https://fr.tradingview.com/u/adel_khatra/
```

👉 Pseudo: `adel_khatra`

### 2. Le SYMBOLE du Graphique (TRÈS IMPORTANT)

**Où cliquer:**
1. Regarde en HAUT À GAUCHE du graphique
2. Clique sur le nom du marché (ex: NAS100, MNQ, US100...)

**Ce que tu dois copier:**
Un texte du type:
- `CME_MINI:MNQ1!` (Micro Nasdaq)
- `FX:NAS100` (Forex Nasdaq)
- `NASDAQ:NDX` (Nasdaq Index)
- `TVC:NDX` (TradingView Nasdaq)
- `CME:ES1!` (E-mini S&P 500)

👉 **C'est ÇA le vrai ID du marché pour TradingView**

### 3. Le TIMEFRAME

Juste au-dessus du graphique:

```
1m  5m  15m  30m  1h  4h  D
```

👉 Exemples:
- "Je travaille en 5m"
- "Je travaille en 1m + 15m"
- "Je travaille en 30m"

### 4. Les INDICATEURS Utilisés

À gauche du graphique, les indicateurs actifs.

**Exemples:**
- MACD
- RSI
- Volume Order Blocks
- Smart Money Concepts
- EMA 20/50/200

👉 Note juste le nom exact

## 🔗 CONFIGURATION DES ALERTES TRADINGVIEW

### Étape 1: Créer une Alerte

1. Sur ton graphique TradingView
2. Clique sur l'icône **Horloge** en haut (ou bouton "Alerte")
3. Choisis ta condition d'alerte

### Étape 2: Configuration de l'Alerte

**Paramètres:**
```
Nom: Bot Trading - LONG MNQ 5m
Condition: [Ton indicateur]
Options: Une fois par barre close
```

### Étape 3: Webhook (CRITICAL)

**URL Webhook de ta plateforme:**
```
https://TON-PROJET.supabase.co/functions/v1/tradingview-webhook
```

**Message (format JSON):**
```json
{
  "symbol": "{{ticker}}",
  "timeframe": "5m",
  "direction": "LONG",
  "entry_min": {{close}},
  "entry_max": {{close}},
  "stop_loss": {{low}},
  "take_profit_1": {{high}},
  "take_profit_2": null,
  "timestamp": "{{time}}",
  "platform": "topstep",
  "market": "NASDAQ"
}
```

**Variables TradingView disponibles:**
- `{{ticker}}` - Symbole
- `{{close}}` - Prix de clôture
- `{{high}}` - Plus haut
- `{{low}}` - Plus bas
- `{{volume}}` - Volume
- `{{time}}` - Timestamp

### Étape 4: Exemple d'Alerte LONG

**Pour un signal LONG:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "LONG",
  "entry_min": 21450.00,
  "entry_max": 21455.00,
  "stop_loss": 21400.00,
  "take_profit_1": 21500.00,
  "take_profit_2": 21550.00,
  "timestamp": "{{time}}",
  "platform": "topstep",
  "market": "NASDAQ"
}
```

**Règles LONG:**
- `take_profit_1` > `entry` > `stop_loss`
- TP au-dessus, SL en dessous

### Étape 5: Exemple d'Alerte SHORT

**Pour un signal SHORT:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "SHORT",
  "entry_min": 21450.00,
  "entry_max": 21455.00,
  "stop_loss": 21500.00,
  "take_profit_1": 21400.00,
  "take_profit_2": 21350.00,
  "timestamp": "{{time}}",
  "platform": "topstep",
  "market": "NASDAQ"
}
```

**Règles SHORT:**
- `stop_loss` > `entry` > `take_profit_1`
- SL au-dessus, TP en dessous

## 📊 SYMBOLES COMMUNS

### Futures Micro
```
CME_MINI:MNQ1!  - Micro Nasdaq
CME_MINI:MES1!  - Micro E-mini S&P 500
CME_MINI:MYM1!  - Micro Dow
CME_MINI:M2K1!  - Micro Russell 2000
```

### Futures Standard
```
CME:NQ1!  - E-mini Nasdaq
CME:ES1!  - E-mini S&P 500
CME:YM1!  - E-mini Dow
CME:RTY1! - E-mini Russell 2000
```

### Forex
```
FX:EURUSD
FX:GBPUSD
FX:USDJPY
FX:NAS100
FX:US30
```

### Indices
```
TVC:NDX    - Nasdaq Composite
TVC:SPX    - S&P 500
TVC:DJI    - Dow Jones
NASDAQ:NDX - Nasdaq 100
```

### Crypto
```
BINANCE:BTCUSDT
BINANCE:ETHUSDT
COINBASE:BTCUSD
```

## 🎯 CONFIG RAPIDE (À REMPLIR)

**Remplis ce template et envoie-le:**

```
Pseudo TradingView: adel_khatra
Symbole principal: [À COMPLÉTER - ex: CME_MINI:MNQ1!]
Timeframe principal: [À COMPLÉTER - ex: 5m]
Indicateurs utilisés: [À COMPLÉTER - ex: MACD, RSI, Order Blocks]
Broker de destination: [À COMPLÉTER - ex: Topstep, Tradovate]
```

## 🔐 SÉCURITÉ

**NE JAMAIS PARTAGER:**
- ❌ Mot de passe TradingView
- ❌ Email
- ❌ Identifiants broker
- ❌ Clés API broker

**CE QUI EST SAFE:**
- ✅ Pseudo public (adel_khatra)
- ✅ Symboles (CME_MINI:MNQ1!)
- ✅ Timeframes (5m)
- ✅ Noms d'indicateurs (MACD)

## 📸 PROCHAINE ÉTAPE

**Pour finaliser:**
1. Fais une capture d'écran du **coin HAUT GAUCHE** de ton graphique
2. Zoom sur le nom du symbole
3. Je te confirme le symbole exact à utiliser

**OU**

Envoie simplement:
```
Symbole: [ce qui est écrit en haut à gauche]
Timeframe: [5m / 15m / 30m / etc]
```

## ⚡ WEBHOOK EDGE FUNCTION

Ta plateforme a déjà une Edge Function configurée:
```
/supabase/functions/tradingview-webhook/index.ts
```

**Elle est prête à recevoir les alertes TradingView.**

**Pour tester:**
1. Crée une alerte sur TradingView
2. Configure le webhook avec l'URL de ta fonction
3. Envoie le message JSON
4. La plateforme recevra l'alerte et l'affichera

## 🎬 RÉSUMÉ ULTRA SIMPLE

1. **Trouve ton symbole** (haut gauche du graphique)
2. **Note ton timeframe** (ex: 5m)
3. **Crée une alerte TradingView**
4. **Configure le webhook** avec l'URL de la fonction
5. **Copie le message JSON** avec les bons paramètres
6. **Sauvegarde l'alerte**
7. **La plateforme reçoit automatiquement**

---

**Tu es prêt.** Il ne manque plus que le symbole exact de ton graphique.
