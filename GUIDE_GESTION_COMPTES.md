# Guide - Gestion des Comptes de Trading

## ✅ Nouvelles fonctionnalités

### 1. **Pré-remplissage automatique des limites de risque**

Lorsque vous saisissez le capital de votre compte, les champs "Perte max journalière" et "Perte max totale" sont **automatiquement calculés** selon des paliers professionnels :

#### Paliers de risque :

| Capital | Perte max journalière | Perte max totale |
|---------|----------------------|------------------|
| 200 - 499 | 3% du capital | 15% du capital |
| 500 - 999 | 3% du capital | 15% du capital |
| 1 000 - 4 999 | 4% du capital | 20% du capital |
| 5 000 - 9 999 | 4% du capital | 20% du capital |
| 10 000+ | 5% du capital | 25% du capital |

#### Exemples concrets :

**Capital de 300 EUR :**
- Perte max journalière : 9.00 EUR (3%)
- Perte max totale : 45.00 EUR (15%)

**Capital de 2 500 USD :**
- Perte max journalière : 100.00 USD (4%)
- Perte max totale : 500.00 USD (20%)

**Capital de 15 000 GBP :**
- Perte max journalière : 750.00 GBP (5%)
- Perte max totale : 3 750.00 GBP (25%)

### 2. **Support multi-devises**

Vous pouvez maintenant créer des comptes dans **3 devises différentes** :

- 💵 **USD** - Dollar américain ($)
- 💶 **EUR** - Euro (€)
- 💷 **GBP** - Livre sterling (£)

**Important** : Le capital minimum recommandé est de **200** dans la devise choisie.

### 3. **Affichage des pourcentages**

Les champs affichent automatiquement le pourcentage du capital que représente chaque limite :

```
Perte max journalière (EUR)
[100.00]
3.0% du capital
```

Cela vous aide à comprendre immédiatement le niveau de risque configuré.

### 4. **Modification manuelle possible**

Même si les valeurs sont pré-remplies, vous pouvez **toujours les modifier manuellement** pour adapter le risque à votre stratégie personnelle.

## 🎯 Comment créer un compte ?

### Étape 1 : Accéder à la gestion des comptes
- Cliquez sur "Comptes" dans la navbar

### Étape 2 : Cliquer sur "+ Ajouter un compte"

### Étape 3 : Remplir le formulaire

1. **Nom du compte** *
   - Ex : "Binance Personnel", "FTMO Challenge 1"

2. **Plateforme** *
   - Binance, Bybit, Coinbase, FTMO, TopStep, Apex

3. **Marché** *
   - BTC, ETH, NASDAQ, GOLD

4. **Devise** *
   - USD, EUR ou GBP

5. **Capital** *
   - Minimum : 200 dans la devise choisie
   - Les limites de risque se calculent automatiquement dès la saisie

6. **Risque par trade (%)** *
   - Par défaut : 0.5%
   - Recommandé : 0.5% - 2%

7. **Perte max journalière**
   - Pré-rempli automatiquement
   - Modifiable selon vos préférences

8. **Perte max totale**
   - Pré-rempli automatiquement
   - Modifiable selon vos préférences

### Étape 4 : Créer le compte
- Cliquez sur "Créer le compte"
- Le compte apparaît dans la liste avec toutes ses informations

## 📊 Affichage des comptes

Chaque compte affiche :
- ✅ **Statut** : Actif / Inactif (bouton cliquable)
- 🏢 **Plateforme** : Binance, FTMO, etc.
- 📈 **Marché** : BTC, ETH, NASDAQ, GOLD
- 💰 **Capital** : Montant avec devise (ex: "10000.00 USD")
- ⚠️ **Risque/trade** : Pourcentage (ex: "0.5%")
- 📉 **Perte max/jour** : Si configurée (ex: "400.00 USD")
- 🛑 **Perte max totale** : Si configurée (ex: "2000.00 USD")

## 🎨 Design et expérience utilisateur

### Indicateurs visuels :
- **Texte d'aide vert** : Guide l'utilisateur en temps réel
- **Minimum recommandé** : Affiché sous le champ capital
- **Pourcentages dynamiques** : Calculés et affichés en temps réel
- **Hover effects** : Cards interactives au survol

### Messages d'aide contextuels :
```
Minimum recommandé : 200 EUR
```
```
3.0% du capital
```
```
Calculé automatiquement selon votre capital
```

## 🔒 Sécurité et validation

### Validations frontend :
- ✅ Capital minimum : 200 (dans la devise choisie)
- ✅ Tous les champs obligatoires marqués d'un `*`
- ✅ Format numérique avec décimales
- ✅ Devise valide (USD, EUR, GBP uniquement)

### Validations backend :
- ✅ Contrainte CHECK sur la colonne `currency`
- ✅ RLS activée sur `trading_accounts`
- ✅ Utilisateurs peuvent uniquement voir/modifier leurs propres comptes
- ✅ Super admins ont accès complet

## 💡 Bonnes pratiques

### Gestion du risque :
1. **Ne jamais dépasser 2% de risque par trade** pour la majorité des stratégies
2. **Perte max journalière** : Arrêter de trader si atteinte
3. **Perte max totale** : Fermer tous les trades et analyser la stratégie

### Configuration recommandée pour débutants :
- Capital : 500-1000 (dans votre devise)
- Risque par trade : 0.5%
- Utiliser les limites pré-remplies automatiquement

### Configuration pour traders expérimentés :
- Capital : 5000+
- Risque par trade : 1-2%
- Ajuster les limites selon votre stratégie et historique

## 🚀 Architecture technique

### Base de données :
**Table `trading_accounts`** - Nouvelle colonne ajoutée :
```sql
currency text DEFAULT 'USD' NOT NULL
CHECK (currency IN ('USD', 'EUR', 'GBP'))
```

### Algorithme de calcul :
```javascript
// Paliers de risque professionnels
if (capital < 500) {
  dailyPercent = 3%;
  totalPercent = 15%;
}
else if (capital < 5000) {
  dailyPercent = 4%;
  totalPercent = 20%;
}
else {
  dailyPercent = 5%;
  totalPercent = 25%;
}

max_daily_loss = capital × dailyPercent
max_total_loss = capital × totalPercent
```

### Composants React :
- **State management** : `useState` pour le formulaire
- **Auto-calcul** : `handleCapitalChange()` déclenché sur onChange
- **Helper texts** : Affichage dynamique des pourcentages
- **Validation** : Minimum 200 + format numérique

## 📈 Prochaines améliorations

### À venir :
1. ✨ **Dashboard par compte** : Stats détaillées par compte
2. 📊 **Graphique d'évolution** : Courbe du capital dans le temps
3. 🔔 **Alertes de risque** : Notifications quand approche des limites
4. 📱 **Export PDF** : Résumé des comptes avec stats
5. 🔄 **Synchronisation API** : Import automatique depuis les plateformes
6. 💹 **Multi-timeframe** : Limites hebdomadaires et mensuelles
7. 🎯 **Objectifs de profit** : Définir des cibles de gain

## 🐛 Résolution de problèmes

### Le formulaire ne pré-remplit pas les valeurs
- Vérifiez que le capital est ≥ 200
- Attendez 1 seconde après la saisie

### La devise ne s'affiche pas
- Anciens comptes : Devise par défaut USD
- Nouveaux comptes : Devise sélectionnée dans le formulaire

### Erreur lors de la création
- Vérifiez tous les champs obligatoires (*)
- Capital minimum : 200
- Risque par trade : Valeur positive

## 📞 Support

Pour toute question ou problème :
1. Vérifiez la console du navigateur (F12)
2. Consultez les logs Supabase
3. Contactez le support technique

---

**Version** : 1.0.0
**Dernière mise à jour** : 8 février 2026
**Compatibilité** : Tous les navigateurs modernes
