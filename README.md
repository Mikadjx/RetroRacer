<p align="center">
  <img src="https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 9.0"/>
  <img src="https://img.shields.io/badge/ASP.NET_Core-MVC-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt="ASP.NET Core"/>
  <img src="https://img.shields.io/badge/SQL_Server-LocalDB-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" alt="SQL Server"/>
  <img src="https://img.shields.io/badge/JavaScript-Canvas_2D-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
</p>

<h1 align="center">RETRO RACER</h1>

<p align="center">
  <strong>Soumission Game Jam - Thème : RETRO</strong><br/>
  <em>Une recréation d'un jeu d'arcade façon années 90</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Thème-RETRO-ff00ff?style=flat-square" alt="Theme"/>
  <img src="https://img.shields.io/badge/Genre-Arcade_Racing-00ffff?style=flat-square" alt="Genre"/>
  <img src="https://img.shields.io/badge/Inspiration-OutRun_/_Top_Gear-ffff00?style=flat-square" alt="Inspiration"/>
</p>

---

## Table des matières

- [Prérequis](#-prérequis)
- [Installation pas à pas](#-installation-pas-à-pas)
- [Lancer le jeu](#-lancer-le-jeu)
- [Contrôles](#-contrôles)
- [Concept du jeu](#-concept-du-jeu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Structure du projet](#-structure-du-projet)
- [API Leaderboard](#-api-leaderboard)
- [Améliorations futures](#-améliorations-futures)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les logiciels suivants :

| Logiciel | Version | Téléchargement |
|----------|---------|----------------|
| **Visual Studio 2022** | 17.8+ (Community, Pro ou Enterprise) | [Télécharger](https://visualstudio.microsoft.com/fr/downloads/) |
| **SQL Server 2022** | Express ou Developer (gratuit) | [Télécharger](https://www.microsoft.com/fr-fr/sql-server/sql-server-downloads) |
| **SQL Server Management Studio** | 19.x (optionnel, pour voir la BDD) | [Télécharger](https://learn.microsoft.com/fr-fr/sql/ssms/download-sql-server-management-studio-ssms) |

### Configuration Visual Studio 2022

Lors de l'installation de Visual Studio, sélectionnez les **workloads** suivants :

- **Développement web et ASP.NET**
- **Développement .NET Desktop** (inclut SQL Server LocalDB)

> **Note :** SQL Server LocalDB est installé automatiquement avec Visual Studio 2022 si vous sélectionnez les workloads ci-dessus. Vous n'avez pas besoin d'installer SQL Server séparément pour tester le jeu.

---

## Installation pas à pas

### Étape 1 : Installer Visual Studio 2022

1. Téléchargez [Visual Studio 2022 Community](https://visualstudio.microsoft.com/fr/downloads/) (gratuit)
2. Lancez l'installateur
3. Cochez les workloads suivants :
   - **Développement web et ASP.NET**
   - **Développement .NET Desktop**
4. Cliquez sur **Installer** et patientez

### Étape 2 : Installer SQL Server (optionnel)

> **Si vous avez installé Visual Studio avec les workloads recommandés, LocalDB est déjà installé. Passez à l'étape 3.**

Pour une installation SQL Server complète :

1. Téléchargez [SQL Server 2022 Express](https://www.microsoft.com/fr-fr/sql-server/sql-server-downloads)
2. Choisissez **Installation basique**
3. Acceptez les termes et installez
4. Notez le nom de l'instance (ex: `SQLEXPRESS`)

### Étape 3 : Cloner ou télécharger le projet

**Option A - Avec Git :**
```bash
git clone https://github.com/votre-repo/RetroRacer.git
cd RetroRacer
```

**Option B - Téléchargement direct :**
1. Téléchargez le ZIP du projet
2. Extrayez-le dans un dossier de votre choix

### Étape 4 : Ouvrir le projet

1. Double-cliquez sur `RetroRacer.csproj` **OU**
2. Ouvrez Visual Studio → **Fichier** → **Ouvrir** → **Projet/Solution** → sélectionnez `RetroRacer.csproj`

### Étape 5 : Restaurer les packages NuGet

Visual Studio devrait restaurer automatiquement les packages. Sinon :

1. Clic droit sur la solution dans l'**Explorateur de solutions**
2. Sélectionnez **Restaurer les packages NuGet**

**Ou en ligne de commande :**
```bash
dotnet restore
```

---

## Lancer le jeu

### Méthode 1 : Via Visual Studio (recommandé)

1. Ouvrez `RetroRacer.csproj` dans Visual Studio 2022
2. Appuyez sur **F5** (ou cliquez sur le bouton vert **Démarrer**)
3. Le navigateur s'ouvre automatiquement sur `http://localhost:5085`
4. Jouez !

### Méthode 2 : En ligne de commande

```bash
cd RetroRacer
dotnet run
```

Puis ouvrez votre navigateur sur : `http://localhost:5085`

### Méthode 3 : Build puis exécution

```bash
dotnet build
dotnet run --no-build
```

---

## Contrôles

| Touche | Action |
|--------|--------|
| `←` `→` | Déplacer la voiture à gauche/droite |
| `↑` | Accélérer |
| `↓` | Freiner |
| `ESPACE` | Activer le Turbo |
| `P` | Pause |
| `M` | Couper/Activer la musique |
| `1` `2` `3` | Sélectionner la difficulté (menu) |
| `ENTRÉE` | Confirmer / Rejouer |
| `ÉCHAP` | Retour au menu |

---

## Concept du jeu

### L'idée

Recréer l'ambiance des jeux d'arcade des années 90 comme **OutRun** ou **Top Gear**, avec un vrai système de progression qui donne envie de rejouer.

Pas juste "survivez le plus longtemps possible", mais **"atteignez l'objectif pour gagner"** :

| Difficulté | Objectif | Étoiles |
|------------|----------|---------|
| **Facile** | Tenez 30 secondes | ⭐ |
| **Moyen** | Tenez 45 secondes | ⭐⭐ |
| **Difficile** | Tenez 60 secondes | ⭐⭐⭐ |

### Interprétation du thème RETRO

Un jeu d'arcade des années 90 avec :
- Esthétique synthwave (magenta, cyan, jaune)
- Effet CRT authentique (lignes de balayage)
- Sons 8-bit générés procéduralement
- Gameplay nerveux et addictif

---

## Fonctionnalités

### Trois modes de jeu

| Mode | Description |
|------|-------------|
| **Classique** | Survivez sans limite de temps, battez votre high score |
| **Arcade** | Score maximum en temps limité |
| **Défi** | Atteignez l'objectif pour débloquer des étoiles |

### Power-ups

| Power-up | Icône | Effet |
|----------|-------|-------|
| **Bouclier** | `S` | 5 secondes d'invincibilité |
| **Ralenti** | `T` | Tout ralentit sauf vous |
| **Recharge Turbo** | `F` | Recharge instantanée du turbo |
| **Bonus Score** | `+` | Points bonus pour le classement |

### Effets visuels

- **Effet CRT** : Lignes de balayage d'écran cathodique
- **Particules** : Explosions, traînées de turbo
- **Perspective** : Route avec effet de profondeur
- **Palette Synthwave** : Couleurs néon années 80-90

### Système de leaderboard

- Sauvegarde locale (localStorage)
- Leaderboard en ligne via API REST
- Classement par mode de jeu

---

## Architecture technique

### Stack

| Couche | Technologie |
|--------|-------------|
| **Frontend** | JavaScript vanilla + Canvas 2D + Web Audio API |
| **Backend** | ASP.NET Core 9.0 MVC |
| **Base de données** | SQL Server (Entity Framework Core 9.0) |
| **Stockage local** | localStorage (scores hors-ligne) |

### Classes JavaScript

Le moteur de jeu est organisé en **7 classes modulaires** :

```
┌─────────────────────────────────────────────────────┐
│                   GameManager                        │
│            (Orchestration principale)                │
├──────────┬──────────┬──────────┬───────────────────┤
│  Audio   │  Render  │  Entity  │    Particle       │
│ Manager  │  Engine  │  Manager │    System         │
├──────────┴──────────┴──────────┴───────────────────┤
│              UIManager + GameState                   │
└─────────────────────────────────────────────────────┘
```

| Classe | Responsabilité |
|--------|----------------|
| `GameManager` | Boucle de jeu, coordination générale |
| `RenderEngine` | Rendu Canvas 2D, effet de perspective, CRT |
| `AudioManager` | Génération procédurale des sons 8-bit |
| `EntityManager` | Gestion des ennemis et power-ups |
| `ParticleSystem` | Effets visuels (explosions, traînées) |
| `UIManager` | Écrans de menu, pause, game over |
| `GameState` | État du jeu, scores, progression |

---

## Structure du projet

```
RetroRacer/
├── Controllers/
│   ├── HomeController.cs        # Sert la page du jeu
│   └── LeaderboardController.cs # API REST pour les scores
├── Data/
│   └── GameDbContext.cs         # Context Entity Framework
├── Models/
│   └── LeaderboardEntry.cs      # Modèle de données (scores)
├── Views/
│   └── Home/
│       └── Index.cshtml         # Page HTML du jeu
├── wwwroot/
│   ├── css/
│   │   └── style.css            # Styles synthwave
│   └── js/
│       └── game.js              # Moteur de jeu complet
├── Properties/
│   └── launchSettings.json      # Config de lancement
├── appsettings.json             # Configuration (connexion BDD)
├── Program.cs                   # Point d'entrée ASP.NET Core
├── RetroRacer.csproj            # Fichier projet
└── README.md                    # Ce fichier
```

---

## API Leaderboard

Le jeu expose une API REST pour le classement en ligne :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/leaderboard` | Récupère le top 10 |
| `GET` | `/api/leaderboard?mode=classic` | Top 10 par mode |
| `POST` | `/api/leaderboard` | Ajoute un score |
| `GET` | `/api/leaderboard/rank/{score}` | Calcule le rang d'un score |

### Exemple de requête POST

```json
{
  "initials": "ABC",
  "score": 12500,
  "gameMode": "arcade"
}
```

---

## Dépannage

### Le projet ne compile pas

```bash
# Vérifiez la version de .NET
dotnet --version
# Doit afficher 9.0.x

# Restaurez les packages
dotnet restore
```

### Erreur de base de données

La base de données est créée automatiquement au premier lancement. Si vous avez une erreur :

1. Vérifiez que LocalDB est installé :
   ```bash
   sqllocaldb info
   ```

2. Si LocalDB n'est pas installé, modifiez `appsettings.json` pour pointer vers votre instance SQL Server :
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=.\\SQLEXPRESS;Database=RetroRacerDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
   }
   ```

### Le navigateur ne s'ouvre pas

Ouvrez manuellement : `http://localhost:5085`

---

## Améliorations futures

- [ ] Leaderboard mondial avec authentification
- [ ] Nouveaux types d'ennemis (camions, motos, obstacles)
- [ ] Thèmes visuels (nuit, désert, neige, ville)
- [ ] Éditeur de niveaux personnalisés
- [ ] Mode multijoueur local (split-screen)
- [ ] Succès et trophées à débloquer
- [ ] Sauvegarde cloud du progrès

---

## Crédits

**Développé pour la Game Jam**

| Élément | Détail |
|---------|--------|
| **Thème imposé** | RETRO |
| **Interprétation** | Jeu d'arcade années 90 avec progression moderne |
| **Inspiration** | OutRun, Top Gear, Road Fighter |
| **Technologie** | .NET 9, ASP.NET Core, JavaScript, SQL Server |

---

<p align="center">
  <strong>Le jeu est entièrement jouable au clavier</strong><br/>
  <em>Tous les contrôles sont affichés à l'écran</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-passion-ff00ff?style=for-the-badge" alt="Made with passion"/>
</p>
