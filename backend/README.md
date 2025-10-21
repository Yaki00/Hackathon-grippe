# Backend API Stratégie Vaccinale Grippe 🏥

Backend FastAPI simple - à compléter progressivement.

## 📁 Structure

```
backend/
├── app/
│   ├── main.py              # Application FastAPI (point d'entrée)
│   ├── core/                # Configuration (à ajouter)
│   ├── routers/             # Routes API (à ajouter)
│   ├── schemas/             # Schémas Pydantic (à ajouter)
│   ├── ingestion/           # Chargement données (à ajouter)
│   ├── transformation/      # Nettoyage données (à ajouter)
│   └── prediction/          # Modèle prédiction (à ajouter)
├── data/                    # Fichiers CSV/JSON (à ajouter)
├── requirements.txt         # Dépendances Python
└── README.md               # Ce fichier
```

## 🚀 Installation rapide

### Pour les nouveaux développeurs qui clonent le projet :

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd Hackathon-grippe/backend

# 2. Créer un environnement virtuel (OBLIGATOIRE)
python3 -m venv venv

# 3. Activer l'environnement virtuel
source venv/bin/activate      # macOS/Linux
# OU
venv\Scripts\activate         # Windows

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Lancer le serveur
uvicorn app.main:app --reload
```

**⚠️ IMPORTANT** : 
- Le dossier `venv/` n'est PAS inclus dans git (ignoré par `.gitignore`)
- Chaque développeur DOIT créer son propre `venv/` localement
- Ne JAMAIS commiter le dossier `venv/` sur git

## 🔌 API disponible

Une fois lancé, accédez à :
- **API** : http://localhost:8000
- **Documentation interactive** : http://localhost:8000/docs
- **Health check** : http://localhost:8000/health

## 📝 Prochaines étapes

1. Ajouter les endpoints API dans `app/main.py`
2. Créer les schémas Pydantic dans `app/schemas/`
3. Ajouter les données dans `data/`
4. Implémenter la logique métier

## 🧪 Test rapide

```bash
# Vérifier que ça fonctionne
curl http://localhost:8000/health
```

**Prêt à ajouter vos endpoints et données ! 🎉**
