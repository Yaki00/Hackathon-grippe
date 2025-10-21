# Backend API Grippe 💉

Backend FastAPI pour la stratégie vaccinale grippe en France.

**Version:** 2.0.0 - Vaccination + Prédiction

---

## 📚 DOCUMENTATION COMPLÈTE

👉 **Voir [DOCUMENTATION.md](./DOCUMENTATION.md) pour:**
- ✅ Explication détaillée de **toutes les routes**
- ✅ **Logique de calcul** et formules mathématiques
- ✅ **Sources de données** (locales + APIs)
- ✅ **Exemples complets** d'utilisation
- ✅ **Flux de données** détaillés
- ✅ Métriques et KPI

---

## 🚀 Installation

### 1. Créer environnement virtuel
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# ou
venv\Scripts\activate     # Windows
```

### 2. Installer dépendances
```bash
pip install -r requirements.txt
```

**Dépendances:**
- `fastapi==0.111.0`
- `uvicorn[standard]==0.30.1`
- `pandas==2.2.2`
- `httpx==0.28.1`

---

## ▶️ Démarrage

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**URLs:**
- 🌐 API: http://localhost:8000
- 📖 Documentation interactive: http://localhost:8000/docs
- 📄 Spécification OpenAPI: http://localhost:8000/openapi.json

---

## 📊 ENDPOINTS DISPONIBLES

### **PARTIE 1 : VACCINATION** 💉

#### 1. Taux par zone (A, B, C)
```bash
GET /vaccination/zones?annee=2024
```
Retourne les taux de vaccination pour les 3 zones françaises.

#### 2. Détails d'une zone
```bash
GET /vaccination/zone/A?annee=2024
GET /vaccination/zone/B?annee=2024
GET /vaccination/zone/C?annee=2024
```
Détails complets d'une zone spécifique.

#### 3. Statistiques nationales
```bash
GET /vaccination/national?annee=2024
```
Vue d'ensemble nationale (65M habitants, 19.5M cibles).

---

### **PARTIE 2 : PRÉDICTION** 🔮

#### 1. Prédiction doses nationales
```bash
GET /prediction/doses?horizon_mois=2
```
Prédiction des besoins en doses pour les 1-3 prochains mois.

**Méthode:** Moyenne mobile + Tendance + Saisonnalité

#### 2. Prédiction par zone
```bash
GET /prediction/doses/zone/A?horizon_mois=1
GET /prediction/doses/zone/B?horizon_mois=1
GET /prediction/doses/zone/C?horizon_mois=1
```
Prédiction ajustée par zone selon la population.

#### 3. Stock actuel
```bash
GET /prediction/stock
GET /prediction/stock?zone_code=A
```
Stock de doses disponibles (simulé pour démo).

---

## 🗺️ ZONES GÉOGRAPHIQUES

Les 13 régions métropolitaines sont regroupées en 3 zones :

### **Zone A** - Grandes métropoles (57.5%)
- Île-de-France (12.3M)
- Auvergne-Rhône-Alpes (8.1M)
- Provence-Alpes-Côte d'Azur (5.1M)
- Occitanie (6.0M)
- Nouvelle-Aquitaine (6.0M)
- **Total: 37.5M habitants**

### **Zone B** - Agglomérations moyennes (28.7%)
- Hauts-de-France (6.0M)
- Grand Est (5.5M)
- Bretagne (3.4M)
- Pays de la Loire (3.8M)
- **Total: 18.7M habitants**

### **Zone C** - Reste de la France (13.8%)
- Normandie (3.3M)
- Bourgogne-Franche-Comté (2.8M)
- Centre-Val de Loire (2.6M)
- Corse (0.3M)
- **Total: 9.0M habitants**

**Population totale:** 65.2M habitants (France métropolitaine)

---

## 📁 ARCHITECTURE

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # API FastAPI + Routes
│   ├── config.py        # Configuration zones + populations
│   ├── vaccination.py   # Module vaccination
│   ├── prediction.py    # Module prédiction
│   └── data_loader.py   # Chargement données
├── data/
│   └── datagouve/
│       ├── 2021/        # Données historiques CSV
│       ├── 2022/        # Données historiques CSV
│       ├── 2023/        # Données historiques JSON
│       ├── 2024/        # Données historiques JSON
│       ├── couverture_vaccinal/  # Taux officiels SPF
│       └── passage_urgence/      # Données urgences
├── DOCUMENTATION.md     # 📚 Documentation complète
├── README.md            # Ce fichier
└── requirements.txt     # Dépendances
```

---

## 🎯 EXEMPLES D'UTILISATION

### Exemple 1: Vérifier taux Zone A
```bash
curl "http://localhost:8000/vaccination/zone/A?annee=2024" | jq
```

**Résultat:**
```json
{
  "success": true,
  "zone": {
    "zone": "Zone A",
    "population_totale": 37486830,
    "population_cible": 11246049,
    "taux_vaccination": 34.1,
    "objectif": 70.0
  }
}
```

### Exemple 2: Prédire besoins Novembre-Décembre
```bash
curl "http://localhost:8000/prediction/doses?horizon_mois=2" | jq
```

**Résultat:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "mois": "2025-11",
        "doses_necessaires": 276848,
        "confiance": "haute"
      },
      {
        "mois": "2025-12",
        "doses_necessaires": 276848,
        "confiance": "haute"
      }
    ],
    "methode": "Moyenne mobile + Tendance + Saisonnalité"
  }
}
```

### Exemple 3: Consulter statistiques nationales
```bash
curl "http://localhost:8000/vaccination/national" | jq
```

**Résultat:**
```json
{
  "success": true,
  "statistiques": {
    "population_france": 65162271,
    "population_cible": 19548681,
    "nombre_vaccines": 6671441,
    "taux_national": 34.1,
    "objectif": 70
  }
}
```

---

## 📊 SOURCES DE DONNÉES

### 1. **Données locales**
- Doses-actes IQVIA (2021-2024)
- Couverture vaccinale Santé Publique France
- Passages aux urgences OSCOUR

### 2. **APIs disponibles** (à connecter)
- `data.sante.gouv.fr` - Urgences temps réel
- Couverture vaccinale temps réel
- SOS Médecins consultations

### 3. **Populations**
- INSEE 2023 (recensement officiel)

---

## 🧮 MÉTHODE DE CALCUL

### Taux de vaccination
```
Taux = (Nombre_vaccines / Population_cible) × 100

Où:
- Population_cible = Population_totale × 30% (65+ et à risque)
- Nombre_vaccines = Σ vaccinés par région
```

### Prédiction de doses
```
Prédiction = Moyenne_3_mois × (1 + Tendance/100) × Facteur_saisonnier × Facteur_zone

Où:
- Moyenne_3_mois = Moyenne mobile sur 3 derniers mois
- Tendance = Évolution sur 6 mois (%)
- Facteur_saisonnier = 1.3 (oct-déc), 0.7 (jan-fév), 0.2 (mars-sept)
- Facteur_zone = Population_zone / Population_totale
```

**👉 Voir [DOCUMENTATION.md](./DOCUMENTATION.md) pour formules détaillées**

---

## 🔧 DÉVELOPPEMENT

### Ajouter une nouvelle route
1. Créer la fonction dans le module approprié
2. Ajouter la route dans `app/main.py`
3. Mettre à jour la documentation

### Tester localement
```bash
# Terminal 1: Lancer le serveur
uvicorn app.main:app --reload

# Terminal 2: Tester
curl "http://localhost:8000/vaccination/zones"
```

### Linter
```bash
pip install ruff
ruff check app/
```

---

## 📈 ROADMAP

- [x] Module vaccination par zone
- [x] Prédiction besoins en doses
- [x] Stock simulé
- [ ] Connexion APIs temps réel
- [ ] Module urgences (corrélations)
- [ ] Optimisation distribution
- [ ] Dashboard temps réel
- [ ] Modèle ML avancé (Prophet/Darts)

---

## 🐛 BUGS CONNUS / LIMITATIONS

- ❌ Stock simulé (pas de vraies données)
- ❌ DOM-TOM non inclus (~2.2M hab)
- ⚠️ Unités IQVIA parfois en milliers (nécessite normalisation)
- ⚠️ Intervalle de confiance fixe (±15%)

---

## 📞 SUPPORT

**Questions techniques ?**
- Voir [DOCUMENTATION.md](./DOCUMENTATION.md)
- Ouvrir une issue GitHub

**Déploiement ?**
```bash
# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📄 LICENCE

Ce projet est développé dans le cadre d'un hackathon.

---

**Dernière mise à jour:** 21 Octobre 2025  
**Version:** 2.0.0
