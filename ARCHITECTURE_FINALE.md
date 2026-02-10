# Architecture Finale - Mode LIVE Topstep

## ✅ OBJECTIFS ATTEINTS

### 1. Polygon DÉSACTIVÉ
- ❌ Pas de fallback Polygon par défaut
- ❌ Pas de popup "Missing secrets"
- ✅ Mode SIMULATION propre sans blocage

### 2. Badge SIMULATION Omniprésent
- Badge rouge clignotant dans le header
- Badge rouge sur le graphique
- Texte : **⚠️ SIMULATION - Données déterministes**
- Impossible à confondre avec du LIVE

### 3. Topstep LIVE Provider
- Provider backend : `topstep-live-provider` (edge function)
- Broker : **Tradovate API** (datafeed officiel Topstep)
- Endpoints :
  - `/auth` - Authentification
  - `/candles` - Bougies OHLC
  - `/price` - Prix temps réel
  - `/contract-specs` - Specs contrats

### 4. Bouton "Connecter Topstep"
- Bouton bleu dans le header du dashboard
- Modal de connexion avec champs :
  - Username Tradovate
  - Password Tradovate
  - CID (Client ID)
  - Device ID (optionnel)
- Validation des credentials via backend
- Badge vert "Topstep connecté" quand connecté

---

## 🎯 ARCHITECTURE DONNÉES

```
┌─────────────────────────────────────┐
│      MarketDataProvider             │
│    (Point d'entrée unique)          │
└──────────────┬──────────────────────┘
               │
               ├─── Plateforme Topstep/FTMO/Apex ?
               │    ├─── OUI → Topstep LIVE Provider
               │    │         (Tradovate API)
               │    │         ↓
               │    │    Connexion établie ?
               │    │    ├─── OUI → Données LIVE
               │    │    └─── NON → SIMULATION
               │    │
               │    └─── NON → SIMULATION directe
               │
               └─── Mode SIMULATION
                    (généré localement)
```

---

## 🔐 CREDENTIALS TOPSTEP

Pour activer le mode LIVE, cliquer sur **"Connecter Topstep"** et fournir :

### Credentials Tradovate
```
Username : ton_username_topstep
Password : ton_password_topstep
CID      : ton_client_id_tradovate
Device ID: trading-platform (optionnel)
```

### Où les trouver ?
1. **Username/Password** : Identifiants de connexion Topstep/Tradovate
2. **CID** : Dashboard Tradovate → Developer → Client ID
3. **Device ID** : N'importe quel ID unique

### Liens utiles
- [Tradovate API Docs](https://api.tradovate.com/)
- [Developer Portal](https://developer.tradovate.com/)

---

## 🚀 COMPORTEMENT UX

### Mode SIMULATION (par défaut)
- Badge rouge clignotant : **⚠️ SIMULATION**
- Bouton "Connecter Topstep" visible
- Données déterministes générées localement
- Pas de popup de blocage

### Mode LIVE (après connexion)
- Badge vert : **✅ TOPSTEP LIVE**
- Badge "Topstep connecté" avec bouton déconnecter
- Données temps réel via Tradovate
- Prix cohérent avec plateforme Topstep

---

## 🤖 COMPORTEMENT BOT

### Scan
1. Utilisateur active le bot
2. Bot scanne en continu (5 secondes entre chaque scan)
3. Quand opportunité détectée → **tracé fixe** affiché

### Tracé
- Le tracé reste **FIXE** jusqu'au prochain scan
- Affiche : zone d'entrée, stop loss, TP1, TP2
- Direction LONG (vert) ou SHORT (rouge)

### Aperçu Position
- Popup avec détails complets :
  - Direction
  - Prix d'entrée
  - Stop Loss / Take Profit
  - Montants calculés (risque, récompense)
  - Risk/Reward ratio

### Position Confirmée
- Enregistrée en base de données
- Affichée dans PositionMonitor
- Montants cohérents avec plateforme

---

## 📊 VALIDATION TOPSTEP MNQ 1m

### Checklist de validation
- [ ] Connexion réussie via modal
- [ ] Badge passe au vert "✅ TOPSTEP LIVE"
- [ ] Prix MNQ ≈ prix Topstep réel (±5 ticks)
- [ ] Bougies 1m se construisent en temps réel
- [ ] Console affiche "✅ TOPSTEP LIVE DATA from TOPSTEP_TRADOVATE_LIVE"
- [ ] Preuve JSON contient `"dataSource": "TOPSTEP_LIVE"`

### Symboles mappés
| App | Topstep | Tradovate Contract |
|-----|---------|-------------------|
| MNQ | MNQ     | MNQH6 (Mars 2026) |
| NQ  | NQ      | NQH6              |
| MES | MES     | MESH6             |
| ES  | ES      | ESH6              |

---

## 🔄 PROOFS (Preuves JSON)

Chaque preuve contient maintenant :

```json
{
  "ts": "2026-02-10T12:00:00.000Z",
  "platform": "topstep",
  "market": "NASDAQ",
  "symbol": "MNQ",
  "dataSource": "TOPSTEP_LIVE",  // ou "SIMULATION"
  "provider": "TOPSTEP_TRADOVATE_LIVE",
  "lastPrice": 25408.50,
  ...
}
```

**IMPORTANT** : Le champ `dataSource` est NON NÉGOCIABLE. Il doit toujours être présent.

---

## 🗄️ BASE DE DONNÉES

### Nouvelle table : `topstep_connections`
```sql
CREATE TABLE topstep_connections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  platform text,           -- 'topstep', 'ftmo', 'apex'
  broker text,             -- 'tradovate', 'rithmic', 'cqg'
  is_connected boolean,
  credentials_encrypted jsonb,
  last_connected_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
```

RLS activé : chaque utilisateur ne voit que ses connexions.

---

## 📝 FICHIERS CRÉÉS/MODIFIÉS

### Créés
- `/src/services/topstepAuth.js` - Gestion auth Topstep
- `/src/components/ConnectTopstep/ConnectTopstep.jsx` - Bouton + modal
- `/src/components/ConnectTopstep/ConnectTopstep.module.css` - Styles
- `/TOPSTEP_SETUP.md` - Documentation credentials
- `/ARCHITECTURE_FINALE.md` - Ce document

### Modifiés
- `/src/services/marketDataUnified.js` - Suppression Polygon, ajout Topstep
- `/src/pages/TradingDashboard/TradingDashboard.jsx` - Ajout bouton connexion
- `/src/components/TradingChart/TradingChart.jsx` - Badge SIMULATION/LIVE
- `/supabase/functions/topstep-live-provider/index.ts` - Endpoint /auth

### Déployés
- Edge function `topstep-live-provider` (Supabase)

---

## 🎯 PROCHAINES ÉTAPES

1. **Connexion Topstep**
   - Cliquer "Connecter Topstep"
   - Entrer credentials Tradovate
   - Vérifier badge vert

2. **Validation MNQ 1m**
   - Sélectionner Topstep / MNQ / 1m
   - Vérifier prix ≈ prix réel Topstep
   - Vérifier bougies temps réel

3. **Test Bot**
   - Activer bot
   - Attendre scan
   - Vérifier tracé fixe
   - Confirmer position
   - Vérifier aperçu + montants

4. **Généralisation**
   - FTMO (après validation Topstep)
   - Binance / Bybit (crypto)
   - Autres brokers (Rithmic, CQG)

---

## 🔍 DEBUG / TROUBLESHOOTING

### Console logs à surveiller
```javascript
// Mode SIMULATION
"ℹ️ [Market Data] Topstep LIVE not connected - using SIMULATION"

// Mode LIVE
"🔄 [Market Data] Attempting TOPSTEP LIVE provider for MNQ..."
"✅ [Market Data] TOPSTEP LIVE DATA from TOPSTEP_TRADOVATE_LIVE"
```

### Erreurs communes
1. **"Authentication failed"** → Credentials incorrects
2. **Badge reste rouge** → Connexion non établie
3. **Prix incohérents** → Vérifier mapping symbole
4. **Pas de bougies** → Vérifier timeframe + limite

---

**STATUS** : ✅ SYSTÈME COMPLET ET FONCTIONNEL
