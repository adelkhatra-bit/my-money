# SYSTÈME DE CALCUL DU STOP LOSS BASÉ SUR LE RISQUE DU COMPTE

## ✅ NOUVEAU SYSTÈME ACTIVÉ

Le Stop Loss est maintenant **calculé automatiquement** en fonction du **risque par trade** configuré dans votre compte.

---

## 🎯 Principe de fonctionnement

### Formule de calcul

```
Distance SL (%) = Risque par trade (%) × Multiplicateur
```

### Table des multiplicateurs

| Risque par trade | Multiplicateur | Distance SL |
|------------------|----------------|-------------|
| ≤ 0.5% | 1.5× | 0.75% |
| 0.5% - 1.0% | 2.0× | 1.0% - 2.0% |
| 1.0% - 1.5% | 2.5× | 2.5% - 3.75% |
| > 1.5% | 3.0× | Maximum 3.0% |

---

## 📊 Exemples concrets

### Exemple 1 : Risque conservateur (0.5%)

**Configuration du compte :**
- Capital : 1000 EUR
- Risque par trade : 0.5%
- Montant à risquer : 5 EUR

**Calcul du SL :**
- Multiplicateur : 1.5×
- Distance SL : 0.5% × 1.5 = **0.75%**

**Position LONG sur BTC :**
- Prix d'entrée : 50,000
- Stop Loss : 50,000 × (1 - 0.0075) = **49,625**
- Distance : 375 points

**Position SHORT sur BTC :**
- Prix d'entrée : 50,000
- Stop Loss : 50,000 × (1 + 0.0075) = **50,375**
- Distance : 375 points

---

### Exemple 2 : Risque modéré (1.0%)

**Configuration du compte :**
- Capital : 2500 USD
- Risque par trade : 1.0%
- Montant à risquer : 25 USD

**Calcul du SL :**
- Multiplicateur : 2.0×
- Distance SL : 1.0% × 2.0 = **2.0%**

**Position LONG sur ETH :**
- Prix d'entrée : 3,000
- Stop Loss : 3,000 × (1 - 0.02) = **2,940**
- Distance : 60 points

**Position SHORT sur ETH :**
- Prix d'entrée : 3,000
- Stop Loss : 3,000 × (1 + 0.02) = **3,060**
- Distance : 60 points

---

### Exemple 3 : Risque agressif (2.0%)

**Configuration du compte :**
- Capital : 5000 GBP
- Risque par trade : 2.0%
- Montant à risquer : 100 GBP

**Calcul du SL :**
- Multiplicateur : 3.0×
- Distance SL : 2.0% × 3.0 = 6.0%
- **Plafonné à 3.0%** (sécurité maximale)

**Position LONG sur GOLD :**
- Prix d'entrée : 2,050
- Stop Loss : 2,050 × (1 - 0.03) = **1,988.50**
- Distance : 61.50 points

---

## 🛡️ Règles de sécurité

### Limites appliquées :

1. **Distance minimale** : 0.5%
   - Évite les SL trop serrés qui seraient touchés par la volatilité normale

2. **Distance maximale** : 3.0%
   - Protection contre des SL trop larges qui exposeraient trop de capital

3. **Placement intelligent** :
   - **LONG** : SL **EN DESSOUS** du prix d'entrée ✅
   - **SHORT** : SL **AU-DESSUS** du prix d'entrée ✅

---

## 📈 Avantages du système

### 1. Cohérence
- Votre risque réel correspond à ce que vous avez configuré
- Chaque trade respecte votre plan de trading

### 2. Automatisation
- Pas besoin de calculer manuellement
- Le système adapte le SL à votre profil de risque

### 3. Protection
- Distance minimale garantie (0.5%)
- Plafond de sécurité (3.0%)
- Impossible de prendre trop de risque par erreur

### 4. Transparence
- Console affiche tous les détails du calcul
- Formule claire et traçable

---

## 🔍 Logs dans la console

Chaque fois qu'un signal est généré, vous verrez :

```javascript
💰 SL CALCULÉ DEPUIS PROFIL:
{
  capital: 1000,
  currency: 'EUR',
  riskPercent: 0.5,
  slMultiplier: 1.5,
  slPercent: '0.750',
  slPrice: '49625.00000',
  direction: 'LONG',
  placement: 'EN DESSOUS entry',
  formula: 'Risque 0.5% × 1.5 = 0.75% SL'
}
```

---

## ⚙️ Configuration recommandée

### Pour débutants :
- **Risque par trade** : 0.5%
- **Distance SL** : 0.75%
- Capital recommandé : 500 - 1000

### Pour traders intermédiaires :
- **Risque par trade** : 1.0%
- **Distance SL** : 2.0%
- Capital recommandé : 1000 - 5000

### Pour traders expérimentés :
- **Risque par trade** : 1.5% - 2.0%
- **Distance SL** : 2.25% - 3.0%
- Capital recommandé : 5000+

---

## 🎯 Compatibilité avec le Trailing Stop

Ce système calcule le **SL initial** du signal.

Une fois la position ouverte, le **Trailing Stop automatique** prend le relais :
1. ✅ SL initial calculé selon votre risque
2. ✅ Position ouverte
3. ✅ Trailing Stop surveille et sécurise les gains
4. ✅ SL déplacé automatiquement au-dessus de l'entrée dès que possible

---

## 💡 Bonnes pratiques

### DO ✅
- Configurer un risque adapté à votre capital
- Laisser le système calculer le SL automatiquement
- Respecter le SL défini par le système
- Vérifier les logs pour comprendre le calcul

### DON'T ❌
- Ne jamais désactiver manuellement le SL
- Ne pas modifier le SL sans raison valide
- Ne pas augmenter le risque après des pertes
- Ne pas ignorer les alertes de sécurité

---

## 🔧 Modification du risque

Pour changer le comportement du SL :

1. Accédez à **"Comptes"** dans la navbar
2. Sélectionnez votre compte actif
3. Modifiez **"Risque par trade (%)"**
4. Le prochain signal utilisera la nouvelle valeur

---

## 📊 Impact sur la taille de position

Le SL calculé influence directement la **taille de position** :

```
Taille de position = Montant à risquer ÷ Distance SL
```

**Exemple :**
- Capital : 1000 EUR
- Risque : 0.5% = 5 EUR
- SL distance : 0.75% = 375 EUR sur BTC à 50,000
- Taille position : 5 ÷ 375 = **0.0133 BTC**

Plus le SL est large, plus la taille de position est petite (et inversement).

---

## 🚀 Activation

Le système est **TOUJOURS ACTIF** dès que vous avez :
1. ✅ Un compte de trading créé
2. ✅ Un risque par trade configuré
3. ✅ Un capital défini

Aucune configuration supplémentaire nécessaire !

---

## 📝 Notes importantes

- Le calcul se fait **à la génération du signal**
- Le SL est **fixe jusqu'au Trailing Stop**
- La **devise du compte** n'affecte pas le calcul (pourcentage universel)
- Les **supports/résistances** ne sont pas pris en compte pour le SL initial
- Le **Trailing Stop** prendra ensuite en compte les niveaux techniques

---

## ✨ Résumé

| Élément | Valeur |
|---------|--------|
| Méthode de calcul | Risque × Multiplicateur |
| Distance minimale | 0.5% |
| Distance maximale | 3.0% |
| Position LONG | SL en dessous |
| Position SHORT | SL au-dessus |
| Trailing Stop | Activé après ouverture |

---

**Version** : 2.0.0
**Date** : 8 février 2026
**Statut** : ✅ Opérationnel
