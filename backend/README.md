# Backend API Grippe 💉

Backend FastAPI pour la stratégie vaccinale grippe.

## 🚀 Installation

```bash
# 1. Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 2. Installer dépendances
pip install -r requirements.txt
```

## ▶️ Démarrage

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

API disponible sur : http://localhost:8000

Documentation : http://localhost:8000/docs

## 📊 Partie 1 : VACCINATION

### Endpoints disponibles

#### 1. Taux par zone
```bash
GET /vaccination/zones?annee=2024
```

Retourne les taux de vaccination pour les 3 zones (A, B1, B2).

#### 2. Détails d'une zone
```bash
GET /vaccination/zone/A?annee=2024
GET /vaccination/zone/B?annee=2024
GET /vaccination/zone/C?annee=2024
```

#### 3. Statistiques nationales
```bash
GET /vaccination/national?annee=2024
```

## 🗺️ Zones

- **Zone A** : IDF + grandes métropoles (Paris, Lyon, Marseille, Toulouse, Bordeaux)
- **Zone B** : Grandes agglomérations (Lille, Strasbourg, Rennes, Nantes)
- **Zone C** : Reste de la France

## 📁 Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # API FastAPI
│   ├── config.py        # Configuration zones
│   └── vaccination.py   # Module vaccination
├── data/                # Données CSV/JSON
├── requirements.txt
└── README.md
```

## 🔜 Prochaines parties

- Partie 2 : Urgences
- Partie 3 : Distribution
- Partie 4 : Prédictions

