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

```bash
cd backend

# 1. Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 2. Installer dépendances
pip install -r requirements.txt

# 3. Lancer le serveur
uvicorn app.main:app --reload
```

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
