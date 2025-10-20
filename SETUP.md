# 🚀 Guide de Setup - Hackathon Grippe

Guide rapide pour installer et lancer le projet après avoir cloné depuis Git.

## 📋 Prérequis

- Python 3.9+ installé
- Git installé
- Connexion Internet (pour les APIs temps réel)

## 🔧 Installation Backend

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd Hackathon-grippe
```

### 2. Setup Backend (FastAPI)

```bash
cd backend

# Créer un environnement virtuel (chaque dev doit le faire)
python3 -m venv venv

# Activer l'environnement
source venv/bin/activate          # macOS/Linux
# OU
venv\Scripts\activate             # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Lancer le serveur Backend

```bash
# S'assurer que venv est activé
uvicorn app.main:app --reload
```

Le backend sera accessible sur : **http://localhost:8000**

Documentation API : **http://localhost:8000/docs**

## 📊 Données

Le projet utilise :
- **Données historiques** : Fichiers CSV/JSON dans `backend/data/`
- **Données temps réel** : APIs Santé Publique France (automatique)

## ✅ Vérification

Pour tester que tout fonctionne :

```bash
# Test API
curl http://localhost:8000/health

# Devrait retourner : {"status":"healthy"}
```

## 🔄 Workflow Git

### Quand vous modifiez le code :

```bash
# Ajouter vos modifications
git add .

# Commiter
git commit -m "votre message"

# Push
git push origin main
```

### Quand vous pullez les modifications d'autres :

```bash
# Pull les dernières modifications
git pull origin main

# Si de nouvelles dépendances ont été ajoutées dans requirements.txt :
pip install -r requirements.txt
```

## ⚠️ Points importants

### ❌ À NE JAMAIS commiter sur Git :
- `venv/` (environnement virtuel)
- `__pycache__/` (cache Python)
- `.env` (variables d'environnement sensibles)
- Fichiers temporaires (`.pyc`, `.log`, etc.)

### ✅ À commiter sur Git :
- Code source (`.py`)
- `requirements.txt` (liste des dépendances)
- Documentation (`.md`)
- Données CSV/JSON si nécessaires
- Fichiers de configuration

## 🆘 Problèmes courants

### "ModuleNotFoundError"
→ Vérifiez que le venv est activé et les dépendances installées
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### "Port 8000 already in use"
→ Un autre serveur utilise le port, changez-le :
```bash
uvicorn app.main:app --reload --port 8001
```

### Erreur Prophet
→ Prophet nécessite des dépendances système sur certains OS :
```bash
# macOS
brew install cmake

# Puis réinstaller
pip install prophet
```

## 📚 Structure du projet

```
Hackathon-grippe/
├── backend/              # Backend FastAPI
│   ├── venv/            # ❌ PAS sur Git (créé localement)
│   ├── app/             # ✅ Code source
│   ├── data/            # ✅ Données
│   ├── requirements.txt # ✅ Dépendances
│   └── README.md        # ✅ Documentation
├── front/               # Frontend (à venir)
├── .gitignore           # ✅ Fichiers à ignorer
└── README.md            # ✅ Doc principale
```

## 🎯 Endpoints API principaux

Une fois le backend lancé :

- `GET /` - Informations API
- `GET /health` - Status
- `GET /docs` - Documentation interactive
- `GET /api/dashboard/complet` - Dashboard complet
- `GET /api/urgences/indicateurs-nationaux` - Urgences temps réel
- `GET /api/couverture/national` - Couverture vaccinale temps réel

**C'est prêt ! Bon développement ! 🎉**

