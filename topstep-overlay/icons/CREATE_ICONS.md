# Création des icônes

Pour que l'extension soit complète, tu dois créer 3 icônes :

## Option 1 : Icônes simples (rapide)

Utilise un outil en ligne comme :
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

Télécharge une image de robot/AI (🤖) et génère les 3 tailles :
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

## Option 2 : Icônes placeholder (pour tester)

Si tu veux juste tester l'extension rapidement, tu peux :
1. Créer 3 fichiers PNG vides
2. Ou télécharger des icônes gratuites sur https://www.flaticon.com/

## Option 3 : Générer avec code

Utilise Canvas pour créer des icônes programmatiquement :

```html
<!DOCTYPE html>
<html>
<body>
<canvas id="icon" width="128" height="128"></canvas>
<script>
const canvas = document.getElementById('icon');
const ctx = canvas.getContext('2d');

// Fond
ctx.fillStyle = '#3b82f6';
ctx.fillRect(0, 0, 128, 128);

// Texte
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 64px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🤖', 64, 64);

// Télécharger
const link = document.createElement('a');
link.download = 'icon128.png';
link.href = canvas.toDataURL();
link.click();
</script>
</body>
</html>
```

Sauvegarde ce fichier en `.html` et ouvre-le dans Chrome.
Répète avec width/height de 16, 48 et 128.

---

**NOTE** : L'extension fonctionnera même sans icônes, Chrome affichera juste une icône par défaut.
