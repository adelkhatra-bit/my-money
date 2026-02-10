# Guide Super Admin - Configuration TradingView

## Acces au Module

1. Connecte-toi en tant que Super Admin
2. Va sur `/admin`
3. Clique sur l'onglet **"TradingView Config"**

---

## Configuration des Alertes TradingView

### Etape 1: Recuperer l'URL Webhook

Dans l'onglet "TradingView Config":
1. Copie l'URL webhook affichee en haut
2. Format: `https://[ton-url].supabase.co/functions/v1/tradingview-webhook`
3. Garde cette URL, tu vas en avoir besoin pour chaque alerte

---

### Etape 2: Symboles Configures

Les symboles suivants sont deja configures:

- **NASDAQ:** `CME_MINI:MNQ1!`
- **BTC:** `COINBASE:BTCUSD`
- **ETH:** `COINBASE:ETHUSD`
- **GOLD:** `TVC:GOLD`

Tu peux copier chaque symbole directement depuis l'interface.

---

### Etape 3: Creer une Alerte sur TradingView

#### 3.1 Ouvrir TradingView
1. Va sur [https://www.tradingview.com](https://www.tradingview.com)
2. Connecte-toi a ton compte
3. Ouvre le graphique du symbole souhaite (ex: CME_MINI:MNQ1!)

#### 3.2 Creer l'Alerte
1. Clique sur le bouton **"Alerte"** en haut a droite (icone reveil)
2. Configure ta condition d'alerte:
   - Ex: "Prix croise au-dessus d'une EMA 20"
   - Ex: "RSI sort de la zone de survente"
   - Ex: "Prix atteint un niveau cle"

#### 3.3 Configurer les Notifications
1. Dans la section **"Notifications"**, coche **"Webhook URL"**
2. Colle l'URL webhook copiee a l'etape 1

#### 3.4 Configurer le Message
Dans le champ **"Message"**, colle ce JSON (adapte selon ta strategie):

**Pour un signal LONG:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": {{close}},
  "sl": {{low}},
  "tp1": {{high}},
  "platform": "topstep",
  "market": "NASDAQ"
}
```

**Pour un signal SHORT:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "SHORT",
  "entry": {{close}},
  "sl": {{high}},
  "tp1": {{low}},
  "platform": "topstep",
  "market": "NASDAQ"
}
```

**Explications des variables TradingView:**
- `{{close}}` = Prix de cloture actuel
- `{{high}}` = Plus haut de la bougie
- `{{low}}` = Plus bas de la bougie
- `{{open}}` = Prix d'ouverture
- `{{volume}}` = Volume

**Parametres a adapter:**
- `symbol`: Change selon le marche (voir Etape 2)
- `timeframe`: "5m", "15m", "30m", "1h", etc.
- `direction`: "LONG" ou "SHORT"
- `entry`, `sl`, `tp1`: Utilise les variables TradingView ou des valeurs fixes
- `platform`: "topstep", "tradovate", etc.
- `market`: "NASDAQ", "BTC", "ETH", "GOLD"

#### 3.5 Finaliser
1. Donne un nom a ton alerte (ex: "NASDAQ Long EMA20")
2. Clique sur **"Creer"**

---

### Etape 4: Tester le Webhook

Retour dans l'interface Super Admin:

1. Clique sur **"Envoyer un Signal Test"**
2. Verifie que le signal apparait dans **"Signaux Recents"**
3. Le signal devrait afficher:
   - Symbole: CME_MINI:MNQ1!
   - Direction: LONG
   - Timeframe: 5m
   - Entry / SL / TP1
   - Statut: pending

Si ca fonctionne → tes alertes TradingView sont correctement configurees!

---

## Guides Visuels Integres

Dans l'interface Super Admin, clique sur:

### "Ou trouver le symbole ?"
- Explique comment localiser le symbole exact sur TradingView
- Format requis: EXCHANGE:SYMBOL

### "Creer une alerte TradingView"
- Pas a pas pour creer une alerte
- Comment configurer le webhook
- Ou coller le JSON

### "Format JSON requis"
- Structure exacte attendue
- Variables TradingView disponibles
- Exemples complets

---

## Exemples d'Alertes Courantes

### 1. Croisement d'EMA
**Condition:** Prix croise au-dessus de l'EMA 20

**JSON LONG:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "15m",
  "direction": "LONG",
  "entry": {{close}},
  "sl": {{low}},
  "tp1": {{close}} * 1.01,
  "platform": "topstep",
  "market": "NASDAQ"
}
```

### 2. Cassure de Resistance
**Condition:** Prix > 21500

**JSON LONG:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "30m",
  "direction": "LONG",
  "entry": 21500,
  "sl": 21450,
  "tp1": 21550,
  "platform": "topstep",
  "market": "NASDAQ"
}
```

### 3. RSI Survente
**Condition:** RSI < 30

**JSON LONG:**
```json
{
  "symbol": "COINBASE:BTCUSD",
  "timeframe": "1h",
  "direction": "LONG",
  "entry": {{close}},
  "sl": {{close}} * 0.98,
  "tp1": {{close}} * 1.02,
  "platform": "binance",
  "market": "BTC"
}
```

### 4. Signal Short sur MACD
**Condition:** MACD croise en dessous de la ligne de signal

**JSON SHORT:**
```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "SHORT",
  "entry": {{close}},
  "sl": {{high}},
  "tp1": {{close}} * 0.995,
  "platform": "topstep",
  "market": "NASDAQ"
}
```

---

## Verification et Monitoring

### Dans le Super Admin:

1. **Signaux Recents**
   - Les 10 derniers signaux recus
   - Symbole / Direction / Timeframe / Statut
   - Date et heure de reception

2. **Statuts Possibles**
   - `pending`: Signal recu, en attente de validation
   - `confirmed`: Signal confirme par l'utilisateur
   - `rejected`: Signal refuse
   - `executed`: Trade execute

### Cote Utilisateur (Page /signals):
- Les utilisateurs voient les signaux en temps reel
- Ils peuvent confirmer ou refuser chaque signal
- Le statut se met a jour automatiquement

---

## Timeframes Autorises

Tu peux utiliser ces timeframes dans tes alertes:
- `5` = 5 minutes
- `15` = 15 minutes
- `30` = 30 minutes
- `60` = 1 heure
- `240` = 4 heures
- `D` = 1 jour

---

## Troubleshooting

### Signal non recu ?
1. Verifie l'URL webhook (copie exacte)
2. Verifie le format JSON (pas d'erreur de syntaxe)
3. Verifie que l'alerte s'est bien declenchee sur TradingView
4. Regarde les logs dans Supabase Edge Functions

### Signal recu mais format incorrect ?
1. Verifie que le JSON respecte exactement la structure
2. Les champs obligatoires: symbol, timeframe, direction, entry, sl, market
3. direction doit etre "LONG" ou "SHORT" (majuscules)

### Variables TradingView ne fonctionnent pas ?
1. Utilise les doubles accolades: `{{close}}` pas `{close}`
2. Les variables disponibles: close, open, high, low, volume
3. Tu peux faire des calculs: `{{close}} * 1.01`

---

## Securite

- L'URL webhook est publique (requis pour TradingView)
- Les donnees sont stockees dans Supabase avec RLS
- Seuls les utilisateurs authentifies voient les signaux
- Le Super Admin voit tout

---

## Support

Si tu rencontres des problemes:
1. Teste d'abord avec le bouton "Envoyer un Signal Test"
2. Verifie les logs dans Supabase
3. Consulte la documentation TradingView sur les webhooks
4. Verifie le format JSON avec un validateur en ligne

---

## Bonnes Pratiques

1. **Commence Simple**
   - Cree 1-2 alertes pour tester
   - Valide qu'elles fonctionnent
   - Puis ajoute d'autres strategies

2. **Nomme tes Alertes Clairement**
   - Ex: "NASDAQ_LONG_EMA20_5m"
   - Ca aide a identifier la source du signal

3. **Utilise des Valeurs Coherentes**
   - SL logique (pas trop serre, pas trop large)
   - TP realiste selon la volatilite
   - Entry precise

4. **Surveille les Resultats**
   - Regarde quelles alertes generent les meilleurs trades
   - Ajuste tes conditions TradingView
   - Affine tes parametres (SL, TP)

---

## Recap Rapide

1. Copie URL webhook depuis Super Admin
2. Va sur TradingView
3. Cree une alerte avec webhook
4. Colle le JSON avec les bons parametres
5. Teste avec le bouton test
6. Surveille les signaux recents

C'est tout! Les utilisateurs recevront automatiquement les signaux.
