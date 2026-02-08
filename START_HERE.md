# 🚀 DÉMARRAGE RAPIDE - 3 ÉTAPES

## Le serveur n'est PAS en cours d'exécution !

### ✅ ÉTAPE 1: Ouvrir un Terminal

**Mac :**
- Applications → Utilitaires → Terminal
- Ou `Cmd + Espace` → tapez "Terminal"

**Windows :**
- Menu Démarrer → tapez "cmd" ou "PowerShell"
- Ou `Win + R` → tapez "cmd"

**Linux :**
- `Ctrl + Alt + T`

---

### ✅ ÉTAPE 2: Aller dans le Dossier du Projet

Dans le terminal, tapez (en remplaçant le chemin si nécessaire) :

```bash
cd /tmp/cc-agent/63506077/project
```

Vérifiez que vous êtes au bon endroit :
```bash
ls
```

Vous devriez voir : `package.json`, `src`, `public`, etc.

---

### ✅ ÉTAPE 3: Démarrer le Serveur

```bash
npm start
```

**Attendez 30-60 secondes...**

Vous verrez :
```
Compiled successfully!

You can now view ai-trading-platform in the browser.

  Local:            http://localhost:3000
```

---

## 🎉 C'EST TOUT !

Votre navigateur devrait s'ouvrir automatiquement sur http://localhost:3000

**Si ce n'est pas le cas, ouvrez manuellement :**
- Chrome/Edge/Firefox
- Tapez : `http://localhost:3000`

---

## 🔴 Si ça ne fonctionne toujours pas

1. **Vérifiez que Node.js est installé :**
   ```bash
   node --version
   npm --version
   ```

   Si erreur → Installez Node.js : https://nodejs.org/

2. **Installez les dépendances (première fois uniquement) :**
   ```bash
   npm install
   ```

   Puis relancez :
   ```bash
   npm start
   ```

3. **Videz le cache du navigateur :**
   - `Ctrl + Shift + Delete` (Windows)
   - `Cmd + Shift + Delete` (Mac)
   - Cochez "Cache" et effacez

4. **Consultez :**
   - `RESOLUTION_PAGE_BLANCHE.md` pour un diagnostic complet
   - `GUIDE_DEMARRAGE_RAPIDE.md` pour utiliser la plateforme

---

## ⚠️ À SAVOIR

- **Le terminal doit rester ouvert** pendant que vous utilisez l'application
- Pour arrêter le serveur : `Ctrl + C`
- Pour redémarrer : `npm start`

---

## 🎯 Prochaine Étape

Une fois que http://localhost:3000 s'ouvre :

1. **Cliquez sur "S'inscrire"**
2. **Créez un compte** (email + mot de passe)
3. **Consultez `GUIDE_DEMARRAGE_RAPIDE.md`** pour la suite

**C'est parti ! 🚀**