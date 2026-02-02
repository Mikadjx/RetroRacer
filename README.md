# RETRO RACER

**Soumission Game Jam - Thème : RETRO**

Un jeu d'arcade façon années 90 inspiré de OutRun et Top Gear.

---

## Prérequis

| Logiciel | Téléchargement |
|----------|----------------|
| **Visual Studio 2022** | [Télécharger](https://visualstudio.microsoft.com/fr/downloads/) |
| **SQL Server 2022 Express** | [Télécharger](https://www.microsoft.com/fr-fr/sql-server/sql-server-downloads) |

---

## Installation

### 1. Installer Visual Studio 2022

1. Téléchargez Visual Studio 2022 Community (gratuit)
2. Lancez l'installateur
3. Cochez **"Développement web et ASP.NET"**
4. Cochez **"Développement .NET Desktop"** (installe LocalDB)
5. Cliquez sur **Installer**

> **Note :** LocalDB est inclus avec Visual Studio. Pas besoin d'installer SQL Server séparément.

### 2. Installer SQL Server (si LocalDB ne fonctionne pas)

1. Téléchargez SQL Server 2022 Express
2. Choisissez **Installation basique**
3. Installez avec les options par défaut
4. Modifiez `appsettings.json` :
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=RetroRacerDb;Trusted_Connection=True;TrustServerCertificate=True"
}
```

### 3. Ouvrir et lancer le jeu

1. Ouvrez `RetroRacer.csproj` dans Visual Studio
2. Appuyez sur **F5**
3. Le jeu s'ouvre dans votre navigateur
4. Jouez !

---

## Contrôles

| Touche | Action |
|--------|--------|
| `←` `→` | Déplacer la voiture |
| `↑` `↓` | Accélérer / Freiner |
| `ESPACE` | Turbo |
| `1` `2` `3` | Choisir la difficulté |
| `P` | Pause |
| `M` | Musique on/off |

---

## Le jeu

### Objectif

Évitez les voitures, utilisez le turbo, tenez le plus longtemps possible !

| Difficulté | Objectif |
|------------|----------|
| Facile | 30 secondes |
| Moyen | 45 secondes |
| Difficile | 60 secondes |

### Modes de jeu

- **Classique** : Survivez sans limite
- **Arcade** : Score max en temps limité
- **Défi** : Atteignez l'objectif pour gagner

### Power-ups

| Bonus | Effet |
|-------|-------|
| **S** | Bouclier (5 sec d'invincibilité) |
| **T** | Ralenti (tout ralentit sauf vous) |
| **F** | Recharge turbo |
| **+** | Bonus score |

---

## Stack technique

- **Frontend** : JavaScript + Canvas 2D
- **Backend** : ASP.NET Core 9.0
- **Base de données** : SQL Server / LocalDB
- **Audio** : Web Audio API (sons générés)

---

## Dépannage

**Erreur de base de données ?**
```bash
sqllocaldb info
```
Si LocalDB n'est pas listé, installez SQL Server Express et modifiez la connexion dans `appsettings.json`.

**Le navigateur ne s'ouvre pas ?**
Allez sur : `http://localhost:5085`

---

**Thème imposé** : RETRO
**Interprétation** : Jeu d'arcade années 90 avec système de progression moderne

*Le jeu est entièrement jouable au clavier.*
