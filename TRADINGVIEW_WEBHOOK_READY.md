# TradingView Webhook - PRÊT À L'EMPLOI

## ✅ Webhook Déployé

Votre Edge Function est maintenant déployée et opérationnelle.

## 🔗 URL du Webhook

Pour configurer vos alertes TradingView, utilisez cette URL:

```
https://xvqjynhbgdlqmapqtxdi.supabase.co/functions/v1/tradingview-webhook
```

## 📋 Format des Messages

### Message LONG (exemple)

```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": 21450.50,
  "stop_loss": 21400.00,
  "take_profit_1": 21500.00,
  "take_profit_2": 21550.00,
  "platform": "topstep",
  "market": "NASDAQ"
}
```

### Message SHORT (exemple)

```json
{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "SHORT",
  "entry": 21450.50,
  "stop_loss": 21500.00,
  "take_profit_1": 21400.00,
  "take_profit_2": 21350.00,
  "platform": "topstep",
  "market": "NASDAQ"
}
```

### Avec Variables TradingView

```json
{
  "symbol": "{{ticker}}",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": {{close}},
  "stop_loss": {{low}},
  "take_profit_1": {{high}},
  "take_profit_2": null,
  "timestamp": "{{time}}",
  "platform": "topstep",
  "market": "NASDAQ"
}
```

## 🎯 Configuration dans TradingView

### Étape 1: Créer une Alerte

1. Sur votre graphique TradingView
2. Clic droit → **Ajouter une alerte** (ou icône horloge en haut)
3. Configurez votre condition

### Étape 2: Paramètres de l'Alerte

**Nom:** Bot Trading - LONG MNQ 5m

**Condition:** [Votre indicateur ou condition]

**Options:**
- ✅ Une fois par barre fermée
- ❌ Alertes répétitives (non recommandé)

### Étape 3: Webhook

**Dans la section "Notifications":**

1. Cochez **Webhook URL**

2. Collez l'URL:
   ```
   https://xvqjynhbgdlqmapqtxdi.supabase.co/functions/v1/tradingview-webhook
   ```

3. Dans le champ **Message**, collez un message JSON valide (voir exemples ci-dessus)

4. Cliquez **Créer**

## ✅ Validation Automatique

Le webhook vérifie automatiquement:

### 1. Champs Requis
- ✅ symbol
- ✅ timeframe
- ✅ direction (LONG ou SHORT)
- ✅ entry
- ✅ stop_loss

### 2. Logique des Prix

**Pour LONG:**
- ✅ TP1 > Entry > SL
- ❌ Si TP ≤ Entry → Rejeté
- ❌ Si Entry ≤ SL → Rejeté

**Pour SHORT:**
- ✅ SL > Entry > TP1
- ❌ Si SL ≤ Entry → Rejeté
- ❌ Si Entry ≤ TP → Rejeté

### 3. Formats Acceptés

Le webhook accepte plusieurs formats pour compatibilité:

```javascript
// Format 1
{
  "direction": "LONG",
  "entry": 21450,
  "stop_loss": 21400,
  "take_profit_1": 21500
}

// Format 2 (alias)
{
  "side": "LONG",
  "entry_min": 21450,
  "sl": 21400,
  "tp1": 21500
}
```

## 🧪 Tester le Webhook

### Avec curl (terminal)

```bash
curl -X POST https://xvqjynhbgdlqmapqtxdi.supabase.co/functions/v1/tradingview-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "CME_MINI:MNQ1!",
    "timeframe": "5m",
    "direction": "LONG",
    "entry": 21450.50,
    "stop_loss": 21400.00,
    "take_profit_1": 21500.00
  }'
```

### Réponse Attendue (Succès)

```json
{
  "success": true,
  "message": "Alert received and stored",
  "alert_id": "uuid-de-l-alerte",
  "data": {
    "symbol": "CME_MINI:MNQ1!",
    "timeframe": "5m",
    "direction": "LONG",
    "entry": 21450.5,
    "sl": 21400,
    "tp1": 21500,
    "tp2": null
  }
}
```

### Réponse Attendue (Erreur Prix Incohérents)

```json
{
  "error": "Invalid price logic",
  "message": "For LONG: TP must be above Entry, Entry must be above SL",
  "received": {
    "direction": "LONG",
    "entry": 21450,
    "sl": 21460,
    "tp1": 21500
  }
}
```

## 📊 Vérifier les Alertes Reçues

Les alertes sont stockées dans la table `tradingview_alerts`.

### Via l'Interface

1. Aller sur `/trading`
2. Ouvrir le composant **TradingView Alerts**
3. Voir les alertes en temps réel

### Via SQL

```sql
SELECT
  id,
  symbol,
  timeframe,
  side,
  entry,
  sl,
  tp1,
  tp2,
  status,
  created_at
FROM tradingview_alerts
ORDER BY created_at DESC
LIMIT 10;
```

## 🔐 Sécurité

### Ce qui est PUBLIC (webhook accessible sans auth)

- ✅ Webhook URL (publique pour TradingView)
- ✅ Réception alertes JSON

### Ce qui est PROTÉGÉ

- 🔒 Lecture des alertes (authentification requise)
- 🔒 Modification des alertes (authentification requise)
- 🔒 Exécution des trades (authentification requise)

### Pourquoi verify_jwt = false ?

Le webhook **doit** être public pour que TradingView puisse envoyer les alertes.

**Sécurité additionnelle recommandée:**

1. Ajoutez un champ `api_key` dans votre message JSON
2. Validez cette clé dans le webhook
3. Rejetez les alertes sans clé valide

**Exemple avec clé API:**

```json
{
  "api_key": "votre-cle-secrete-unique",
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": 21450.50,
  "stop_loss": 21400.00,
  "take_profit_1": 21500.00
}
```

## 📝 Exemples Complets

### Alerte LONG avec MACD

**Condition:** MACD croise au-dessus de la ligne de signal

```json
{
  "symbol": "{{ticker}}",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": {{close}},
  "stop_loss": {{low}},
  "take_profit_1": {{close}} * 1.01,
  "take_profit_2": {{close}} * 1.02,
  "platform": "topstep",
  "market": "NASDAQ",
  "indicator": "MACD",
  "timestamp": "{{time}}"
}
```

### Alerte SHORT avec RSI

**Condition:** RSI > 70 (surachat)

```json
{
  "symbol": "{{ticker}}",
  "timeframe": "15m",
  "direction": "SHORT",
  "entry": {{close}},
  "stop_loss": {{high}},
  "take_profit_1": {{close}} * 0.99,
  "take_profit_2": {{close}} * 0.98,
  "platform": "topstep",
  "market": "NASDAQ",
  "indicator": "RSI",
  "timestamp": "{{time}}"
}
```

## 🎬 Prochaines Étapes

1. ✅ Webhook déployé et fonctionnel
2. ⏳ Trouve ton symbole exact (haut gauche du graphique)
3. ⏳ Crée ta première alerte sur TradingView
4. ⏳ Configure le webhook avec l'URL ci-dessus
5. ⏳ Teste avec un message simple
6. ⏳ Vérifie la réception dans `/trading`

## 🆘 Dépannage

### Erreur: "Missing required fields"

**Cause:** Un champ obligatoire manque

**Solution:** Vérifie que tu as bien:
- symbol
- timeframe
- direction (ou side)
- entry (ou entry_min)
- stop_loss (ou sl)

### Erreur: "Invalid price logic"

**Cause:** Les prix sont incohérents

**Pour LONG:**
- TP doit être AU-DESSUS de Entry
- Entry doit être AU-DESSUS de SL

**Pour SHORT:**
- SL doit être AU-DESSUS de Entry
- Entry doit être AU-DESSUS de TP

### Aucune alerte reçue

**Vérifications:**

1. URL correcte ?
   ```
   https://xvqjynhbgdlqmapqtxdi.supabase.co/functions/v1/tradingview-webhook
   ```

2. Message JSON valide ?
   - Teste sur [jsonlint.com](https://jsonlint.com)

3. Alerte activée sur TradingView ?
   - Vérifie que l'alerte est bien enregistrée
   - Vérifie que la condition est remplie

4. Teste manuellement avec curl

---

**Tu es prêt !** Il ne reste plus qu'à configurer ta première alerte TradingView.
