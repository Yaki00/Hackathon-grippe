# 📊 API D'ANALYSE INTELLIGENTE - VACCINATION GRIPPE

## 🎯 Vue d'ensemble

Cette API fournit **4 analyses stratégiques** basées sur les vraies données officielles **+ recommandations IA locale (Ollama)**.

---

## 🚀 Démarrage rapide

### 1. Installation des dépendances
```powershell
cd backend
pip install -r requirements.txt
```

### 2. Installation Ollama (optionnel mais recommandé)
- Télécharger : https://ollama.com/download/windows
- Installer et lancer : `ollama serve`
- Télécharger modèle : `ollama pull llama3.2`

### 3. Lancer le serveur
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Accéder à la documentation
- **API** : http://localhost:8000
- **Swagger** : http://localhost:8000/docs

---

## 📡 Routes API

### Routes de vaccination (existantes)
- `GET /vaccination/zones` - Taux par zone
- `GET /vaccination/zone/{code}` - Détails zone
- `GET /vaccination/national` - Stats nationales

### ⭐ **Nouvelles routes d'analyse intelligente**

#### 1️⃣ Identifier zones sous-vaccinées
```
GET /analyse/zones-sous-vaccinees?annee=2024&seuil_critique=50.0
```

**Réponse** :
```json
{
  "success": true,
  "objectif": "Identifier les zones sous-vaccinées",
  "data": {
    "annee": "2024",
    "objectif_national": 75.0,
    "synthese": {
      "taux_moyen_national": 53.7,
      "regions_analysees": 17,
      "regions_sous_objectif": 17,
      "regions_critiques": 3
    },
    "zones_prioritaires": [
      {
        "region": "Corse",
        "taux_actuel": 46.0,
        "ecart_objectif": 29.0,
        "statut": "critique",
        "tendance": "stable",
        "recommandations_ia": "..."
      },
      ...
    ]
  }
}
```

**Données utilisées** : Santé Publique France (taux officiels 2011-2024)

**IA recommande** : Actions concrètes pour chaque région prioritaire


#### 2️⃣ Prédire besoins en vaccins
```
GET /analyse/prediction-besoins?annee_cible=2025
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "annee_cible": "2025",
    "synthese": {
      "total_doses_necessaires": 10500000,
      "total_personnes_ciblees": 9800000,
      "taux_moyen_predit": 54.2
    },
    "predictions_par_region": [
      {
        "region": "Auvergne-Rhône-Alpes",
        "population_65plus": 1800000,
        "taux_2024": 53.1,
        "taux_predit_2025": 53.5,
        "doses_necessaires": 963000,
        "doses_avec_marge_10pct": 1059300,
        "confiance_prediction": 0.85
      },
      ...
    ],
    "recommandations_ia": "...",
    "methode": "Régression linéaire 2019-2024"
  }
}
```

**Méthode** :
1. Régression linéaire sur historique 2019-2024
2. Extrapolation pour 2025
3. Calcul : Besoins = Population × Taux_prédit
4. Marge sécurité 10%

**IA recommande** : Stratégie de commande et distribution


#### 3️⃣ Optimiser distribution
```
GET /analyse/optimisation-distribution?annee=2024
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "annee": "2024",
    "synthese_nationale": {
      "doses_distribuees_total": 10835299,
      "actes_realises_total": 7820000,
      "doses_gaspillees": 3015299,
      "taux_utilisation_moyen": 72.2,
      "taux_gaspillage_moyen": 27.8,
      "economie_potentielle_doses": 1042500,
      "valeur_gaspillage_euros": 30152990
    },
    "zones_a_optimiser": [
      {
        "region": "...",
        "doses_distribuees_milliers": 5433,
        "actes_realises_milliers": 3930,
        "taux_utilisation_pct": 72.3,
        "taux_gaspillage_pct": 27.7,
        "statut": "acceptable",
        "recommandations_ia": "..."
      },
      ...
    ],
    "objectif_cible": "80% d'utilisation"
  }
}
```

**Calcul** :
- Taux utilisation = Actes / Doses × 100
- Gaspillage = Doses - Actes
- Économie potentielle si 80% atteint

**IA recommande** : Actions anti-gaspillage par zone


#### 4️⃣ Anticiper passages urgences
```
GET /analyse/prediction-urgences?periode=hiver_2024
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "periode": "hiver_2024",
    "analyse_statistique": {
      "correlation_pearson": -0.452,
      "p_value": 0.0234,
      "interpretation": "Corrélation négative significative",
      "equation_regression": "Urgences = -0.15 × Vaccination + 12.5"
    },
    "impact_simulation": {
      "scenario": "Augmentation de 10 points de couverture",
      "regions_analysees": 13,
      "reduction_moyenne_pct": 18.5
    },
    "predictions_par_region": [
      {
        "region": "Corse",
        "taux_vaccination_actuel": 46.0,
        "taux_vaccination_ameliore": 56.0,
        "urgences_actuelles": 8.5,
        "urgences_predites": 6.8,
        "reduction_absolue": 1.7,
        "reduction_pct": 20.0
      },
      ...
    ],
    "recommandations_ia": "..."
  }
}
```

**Analyse** :
1. Corrélation Pearson vaccination ↔ urgences
2. Test statistique (p-value)
3. Régression linéaire pour prédiction
4. Simulation impact amélioration

**IA recommande** : Stratégies de priorisation

---

## 🤖 Intégration IA Ollama

### Comment ça marche ?

Pour chaque analyse, l'IA locale reçoit :
- **Contexte** : Données chiffrées de la situation
- **Mission** : Type de recommandation attendue
- **Contraintes** : Être concret, chiffré, pragmatique

L'IA génère :
- 3 recommandations concrètes
- Chiffrées et actionnables
- Adaptées à chaque zone

### Exemple de prompt pour zones sous-vaccinées :
```
Tu es un expert en santé publique. Analyse cette situation:

Région: Corse
Taux actuel (65+): 46.0%
Objectif national: 75.0%
Écart: 29.0 points
Tendance: stable

Donne 3 recommandations concrètes pour améliorer la couverture.
```

### Si Ollama n'est pas disponible :
- L'API fonctionne normalement
- Les analyses statistiques sont complètes
- Message : "⚠️ Ollama non disponible"

---

## 📊 Sources de données

### 1. Santé Publique France (taux officiels)
**Fichiers** :
- `couvertures-vaccinales-...-region.json` (2011-2024)
- `couvertures-vaccinales-...-france.json` (national)
- `grippe-passages-urgences-...-reg.json` (urgences)

**Format** : Pourcentages directs (53.7 = 53.7%)

### 2. IQVIA (volumes pharmacies)
**Fichiers** :
- `couverture-2024 (1).json` (doses + actes par région)

**Format** : Milliers (3930 = 3,930,000)

---

## 🧪 Tests

### Test manuel avec curl

#### 1. Zones sous-vaccinées
```powershell
curl http://localhost:8000/analyse/zones-sous-vaccinees
```

#### 2. Prédiction besoins
```powershell
curl http://localhost:8000/analyse/prediction-besoins?annee_cible=2025
```

#### 3. Optimisation distribution
```powershell
curl http://localhost:8000/analyse/optimisation-distribution
```

#### 4. Prédiction urgences
```powershell
curl http://localhost:8000/analyse/prediction-urgences
```

### Test avec navigateur
- Ouvrir : http://localhost:8000/docs
- Tester interactivement chaque route

---

## 🎯 Performance

### Sans IA :
- Réponse : **< 2 secondes**
- Analyses statistiques complètes

### Avec IA (Ollama) :
- Réponse : **3-8 secondes**
- Analyses + recommandations personnalisées

### Optimisations possibles :
- Cache des résultats
- Température IA réduite (0.3)
- Limitation tokens (déjà implémentée : 500)

---

## 🔧 Configuration

### Changer le modèle IA

Dans `app/analyse_intelligente.py` :
```python
OLLAMA_MODEL = "llama3.2"  # ou "mistral", "phi3"
```

### Changer l'objectif national

```python
OBJECTIF_NATIONAL_65PLUS = 75.0  # 75%
```

### Changer les populations régionales

```python
populations_65plus = {
    "11": 1_200_000,  # Île-de-France
    ...
}
```

---

## 📈 Métriques clés

### Objectif 1
- **Métrique** : Écart à l'objectif (75%)
- **Seuil critique** : < 50%
- **Top priorité 2024** : Corse (46%), PACA (49.8%), IDF (52.9%)

### Objectif 2
- **Métrique** : R² régression
- **Seuil fiabilité** : R² > 0.7
- **Total besoins 2025** : ~10.5M doses

### Objectif 3
- **Métrique** : Taux utilisation
- **Objectif** : 80%
- **Gaspillage national** : ~27.8% (30M€)

### Objectif 4
- **Métrique** : Corrélation Pearson
- **Significatif si** : |r| > 0.3 et p < 0.05
- **Impact vaccination** : -18.5% urgences si +10 points

---

## 🐛 Dépannage

### Erreur "Module scipy not found"
```powershell
pip install scipy==1.11.4
```

### Erreur "Ollama non disponible"
```powershell
ollama serve
ollama pull llama3.2
```

### Erreur "File not found"
Vérifier structure :
```
backend/data/datagouve/
├── couverture_vaccinal/
│   ├── couvertures-vaccinales-...-region.json
│   └── ...
├── passage_urgence/
│   └── grippe-passages-urgences-...-reg.json
└── 2024/
    └── couverture-2024 (1).json
```

---

## 📝 Notes

- ✅ Toutes les analyses utilisent les **vraies données officielles**
- ✅ Pas de données simulées (sauf populations estimées)
- ✅ Méthodes statistiques robustes (régression, corrélation)
- ✅ IA en complément, pas en remplacement
- ✅ Fonctionne avec ou sans Ollama

---

## 🚀 Prochaines étapes

1. ✅ Implémenter les 4 objectifs
2. ✅ Intégrer IA Ollama
3. ✅ Créer routes API
4. ⏳ Tester en production
5. ⏳ Optimiser cache
6. ⏳ Ajouter visualisations
7. ⏳ Déployer

---

**Version** : 2.0.0  
**Auteur** : Équipe Backend Grippe  
**Date** : Octobre 2024

