# Configuration Topstep Live Data

## Architecture

L'application utilise un système à 3 niveaux pour les données de marché :

1. **TOPSTEP LIVE** (priorité 1) - Données temps réel via Tradovate API
2. **POLYGON FALLBACK** (priorité 2) - Données alternatives si Topstep indisponible
3. **SIMULATION** (priorité 3) - Données déterministes générées localement

## Credentials Requis

Pour activer le mode **TOPSTEP LIVE**, vous devez configurer ces variables d'environnement dans Supabase :

### Via Supabase Dashboard > Edge Functions > Secrets

```bash
# Mode de données (LIVE ou SIMULATION)
TOPSTEP_DATA_MODE=LIVE

# Credentials Tradovate (utilisé par Topstep)
TRADOVATE_USERNAME=votre_username
TRADOVATE_PASSWORD=votre_password
TRADOVATE_CID=votre_cid
TRADOVATE_DEVICE_ID=trading-platform-device-id
TRADOVATE_BASE_URL=https://live.tradovateapi.com/v1

# Optionnel (si vous utilisez API key au lieu de username/password)
TRADOVATE_API_KEY=votre_api_key
TRADOVATE_API_SECRET=votre_api_secret
```

## Comment obtenir les credentials Tradovate

1. **Compte Topstep** : Vous devez avoir un compte Topstep actif
2. **Accès Tradovate** : Topstep utilise Tradovate comme datafeed
3. **CID (Client ID)** : Disponible dans votre dashboard Tradovate
4. **Username/Password** : Vos identifiants de connexion Tradovate

### Liens utiles

- [Tradovate API Documentation](https://api.tradovate.com/)
- [Topstep Dashboard](https://topstep.com/)
- [Tradovate Developer Portal](https://developer.tradovate.com/)

## Vérification du Mode Actif

### Dans l'application :

- **Badge ROUGE clignotant** = Mode SIMULATION
- **Badge VERT** = Mode TOPSTEP LIVE

### Dans les logs console :

```javascript
// Mode SIMULATION
"🔴 [Market Data] No API configured - falling back to SIMULATION"

// Mode LIVE
"✅ [Market Data] TOPSTEP LIVE DATA from TOPSTEP_TRADOVATE_LIVE"
```

### Dans les preuves JSON (bouton "Copier preuve") :

```json
{
  "dataSource": "TOPSTEP_LIVE",  // ou "SIMULATION"
  "provider": "TOPSTEP_TRADOVATE_LIVE",
  ...
}
```

## Validation Prix Topstep

Une fois configuré, vérifiez que :

1. Le prix MNQ dans l'app ≈ prix Topstep (tolérance ±5 ticks)
2. Les bougies 1m se construisent en temps réel
3. Le badge affiche "✅ TOPSTEP LIVE"

## Symboles Mappés

| App Symbol | Topstep | Tradovate Contract |
|------------|---------|-------------------|
| MNQ        | MNQ     | MNQH6 (Mars 2026) |
| NQ         | NQ      | NQH6              |
| MES        | MES     | MESH6             |
| ES         | ES      | ESH6              |
| MYM        | MYM     | MYMH6             |
| MGC        | MGC     | MGCJ6 (Avril 2026)|

## Endpoints Disponibles

### Edge Function: `topstep-live-provider`

```bash
# Récupérer les bougies OHLC
GET /topstep-live-provider/candles?symbol=MNQ&timeframe=1m&limit=500

# Récupérer le prix actuel
GET /topstep-live-provider/price?symbol=MNQ

# Récupérer les specs du contrat
GET /topstep-live-provider/contract-specs?symbol=MNQ
```

## Troubleshooting

### Erreur "Topstep live mode not enabled"
→ Vérifier que `TOPSTEP_DATA_MODE=LIVE` est bien configuré

### Erreur "Tradovate credentials not configured"
→ Vérifier que `TRADOVATE_USERNAME`, `TRADOVATE_PASSWORD`, `TRADOVATE_CID` sont configurés

### Erreur "Tradovate auth failed: 401"
→ Vérifier que vos identifiants sont corrects

### Prix incohérents vs Topstep
→ Vérifier le mapping des symboles (MNQ = MNQH6)
→ Vérifier que vous utilisez le même datafeed (Tradovate)

### Badge reste ROUGE malgré la config
→ Ouvrir la console (F12) et vérifier les logs
→ Vérifier que les variables sont dans Supabase Edge Functions (pas .env local)

## Support

Si après configuration complète le badge reste rouge :
1. Ouvrir console (F12)
2. Filtrer par "[Market Data]"
3. Copier les logs d'erreur
4. Vérifier que l'edge function `topstep-live-provider` est bien déployée

---

**IMPORTANT** : Les credentials ne doivent JAMAIS être commités dans le code. Ils sont configurés uniquement côté Supabase backend (Edge Functions Secrets).
