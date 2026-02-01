# RETRO RACER - Soumission Game Jam

**Ma recréation d'un jeu d'arcade retro façon 1994**

---

## Pour tester rapidement

1. Ouvrez **RetroRacer.csproj** dans Visual Studio
2. Appuyez sur **F5**
3. Le jeu s'ouvre dans votre navigateur
4. **Choisissez un niveau** (Facile, Moyen, Dur) → appuyez sur **1, 2 ou 3**
5. Évitez les voitures, utilisez le turbo, tenez le plus longtemps possible !

## L'idée derrière le jeu

Je voulais recréer l'ambiance des jeux d'arcade des années 90 comme OutRun ou Top Gear, mais avec un vrai système de progression qui donne envie de rejouer.

Pas juste "survivez le plus longtemps possible", mais **"atteignez l'objectif pour gagner"** :
- **Facile** : Tenez 30 secondes
- **Moyen** : Tenez 45 secondes  
- **Dur** : Tenez 60 secondes

## Ce que j'ai développé en plus du concept de base

### 1. Une vraie progression avec étoiles
Avant : juste un score qui monte.  
Maintenant : des niveaux, des étoiles à débloquer, une sensation d'accomplissement quand on réussit.

### 2. Trois modes de jeu différents
- **Mode Classique** : l'original, survivez sans limite de temps
- **Mode Arcade** : score maximum en temps limité  
- **Mode Défi** : notre nouveau mode avec objectifs à atteindre

### 3. Des power-ups qui changent le gameplay
On a ajouté des bonus qui ont un impact réel :
- **Bouclier (S)** : 5 secondes d'invincibilité
- **Ralenti (T)** : tout ralentit sauf vous
- **Recharge turbo (F)** : pour les situations critiques
- **Bonus score (+)** : pour monter dans le classement

### 4. L'ambiance retro travaillée
- Effets CRT (lignes de balayage d'écran cathodique)
- Sons 8-bit générés en direct par le navigateur
- Palette de couleurs synthwave (magenta, cyan, jaune)
- Police pixel art authentique

### Ma stack technique
- **Frontend** : JavaScript pur (pas de framework) + Canvas 2D
- **Backend** : ASP.NET Core (juste pour servir la page HTML)
- **Stockage** : localStorage pour sauvegarder les scores
- **Audio** : Web Audio API (on génère les sons en JavaScript)

### L'organisation du code
J'ai séparé le jeu en 12 classes JavaScript bien distinctes :
- GameManager : orchestre toute la logique du jeu
- RenderEngine : gère tout ce qui est dessiné à l'écran  
- AudioManager : s'occupe des sons et de la musique
- EntityManager : gère les ennemis et les bonus
- ParticleSystem : crée les effets visuels (explosions, turbos)
- UIManager : contrôle tous les écrans et menus

  ### Améliorations
- Un leaderboard en ligne pour comparer les scores
- Plus de types d'ennemis avec des comportements différents
- Des thèmes visuels supplémentaires (nuit, désert, neige)
- Un éditeur de niveaux pour créer ses propres circuits

**Thème imposé** : RETRO  
**Mon interprétation** : un jeu d'arcade des années 90 avec un système moderne de progression

---

**Note pour les testeurs** : Le jeu est entièrement jouable au clavier, pas besoin de souris. Tous les contrôles sont affichés à l'écran.
