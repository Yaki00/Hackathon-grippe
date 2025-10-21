# 📚 DOCUMENTATION COMPLÈTE - API GRIPPE

**Version:** 2.0.0  
**Date:** 21 Octobre 2025  
**Auteur:** Backend Hackathon Grippe

---

## 📑 TABLE DES MATIÈRES

1. [Architecture Générale](#architecture-générale)
2. [Routes API](#routes-api)
3. [Module Vaccination](#module-vaccination)
4. [Module Prédiction](#module-prédiction)
5. [Module Data Loader](#module-data-loader)
6. [Configuration](#configuration)
7. [Calculs et Formules](#calculs-et-formules)
8. [Sources de Données](#sources-de-données)

---

## 🏗️ ARCHITECTURE GÉNÉRALE

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # API FastAPI + Routes
│   ├── config.py            # Configuration zones A/B/C + populations
│   ├── vaccination.py       # Logique vaccination par zone
│   ├── prediction.py        # Prédiction besoins en doses
│   └── data_loader.py       # Chargement données locales + APIs
├── data/
│   └── datagouve/
│       ├── 2021/            # CSV historiques
│       ├── 2022/            # CSV historiques
│       ├── 2023/            # JSON historiques
│       ├── 2024/            # JSON historiques
│       ├── couverture_vaccinal/  # Taux officiels SPF
│       └── passage_urgence/      # Données urgences
└── requirements.txt
```

---

## 🚀 ROUTES API

### 📊 **1. VACCINATION**

#### `GET /vaccination/zones`
**Description:** Retourne les taux de vaccination pour les 3 zones (A, B, C)

**Paramètres:**
- `annee` (query, optionnel): Année (défaut: "2024")

**Exemple:**
```bash
curl "http://localhost:8000/vaccination/zones?annee=2024"
```

**Réponse:**
```json
{
  "success": true,
  "annee": "2024",
  "zones": [
    {
      "zone": "Zone A",
      "zone_code": "A",
      "population_totale": 37486830,
      "population_cible": 11246049,
      "nombre_vaccines": 3839256,
      "taux_vaccination": 34.1,
      "objectif": 70.0,
      "atteint": false,
      "nb_regions": 5,
      "regions": ["Île-de-France", "Auvergne-Rhône-Alpes", ...],
      "sources_donnees": {"Santé Publique France": 5}
    },
    ...
  ]
}
```

---

#### `GET /vaccination/zone/{zone_code}`
**Description:** Détails d'une zone spécifique (A, B ou C)

**Paramètres:**
- `zone_code` (path, requis): Code zone (A, B ou C)
- `annee` (query, optionnel): Année (défaut: "2024")

**Exemple:**
```bash
curl "http://localhost:8000/vaccination/zone/A?annee=2024"
```

**Réponse:** Même structure qu'une zone individuelle ci-dessus

---

#### `GET /vaccination/national`
**Description:** Statistiques nationales de vaccination

**Paramètres:**
- `annee` (query, optionnel): Année (défaut: "2024")

**Exemple:**
```bash
curl "http://localhost:8000/vaccination/national?annee=2024"
```

**Réponse:**
```json
{
  "success": true,
  "annee": "2024",
  "statistiques": {
    "population_france": 65162271,
    "population_cible": 19548681,
    "nombre_vaccines": 6671441,
    "taux_national": 34.1,
    "objectif": 70,
    "zones_a_risque": ["Zone A", "Zone B", "Zone C"]
  }
}
```

---

### 🔮 **2. PRÉDICTION**

#### `GET /prediction/doses`
**Description:** Prédiction des besoins en doses au niveau national

**Paramètres:**
- `horizon_mois` (query, optionnel): Nombre de mois à prédire (1-3, défaut: 1)

**Exemple:**
```bash
curl "http://localhost:8000/prediction/doses?horizon_mois=2"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "zone": "National",
    "date_prediction": "2025-10-21",
    "predictions": [
      {
        "mois": "2025-11",
        "mois_nom": "November 2025",
        "doses_necessaires": 276848,
        "doses_necessaires_min": 235320,
        "doses_necessaires_max": 318375,
        "confiance": "haute"
      }
    ],
    "statistiques_historiques": {
      "total_doses_distribuees": 45496791,
      "moyenne_mensuelle": 3033119,
      "pic_mensuel": 12146028,
      "tendance": "-76.9%",
      "periode_analysee": "2020-10 à 2023-02"
    },
    "contexte": {
      "mois_actuel": "October 2025",
      "saison": "Pic de campagne (oct-déc)",
      "facteur_saisonnier": 1.3
    },
    "source": "Données historiques IQVIA 2021-2024",
    "methode": "Moyenne mobile + Tendance + Saisonnalité"
  }
}
```

---

#### `GET /prediction/doses/zone/{zone_code}`
**Description:** Prédiction des besoins en doses par zone

**Paramètres:**
- `zone_code` (path, requis): Code zone (A, B ou C)
- `horizon_mois` (query, optionnel): Nombre de mois (1-3, défaut: 1)

**Exemple:**
```bash
curl "http://localhost:8000/prediction/doses/zone/A?horizon_mois=1"
```

**Réponse:** Même structure que national, ajusté pour la zone

---

#### `GET /prediction/stock`
**Description:** Stock actuel de doses disponibles

**Paramètres:**
- `zone_code` (query, optionnel): Code zone ou None pour national

**Exemple:**
```bash
curl "http://localhost:8000/prediction/stock"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "zone": "National",
    "stock_disponible": 2500000,
    "stock_reserve": 500000,
    "stock_distribue": 1500000,
    "date_maj": "2025-10-21",
    "statut": "simulé (pour démo)"
  }
}
```

---

## 💉 MODULE VACCINATION

**Fichier:** `app/vaccination.py`

### Fonction: `calculer_taux_par_zone(annee: str)`

**Rôle:** Calcule le taux de vaccination pour chaque zone (A, B, C)

**Processus:**

1. **Initialisation des zones**
   ```python
   zones = {
       "A": {"regions": [], "population": 0, "vaccines": 0, "sources": []},
       "B": {...},
       "C": {...}
   }
   ```

2. **Agrégation par zone**
   - Pour chaque région dans `REGIONS_ZONES`:
     - Récupère le code zone (A, B ou C)
     - Calcule population cible: `population × 30%` (65+ et à risque)
     - Appelle `get_donnees_vaccination_region()` pour obtenir le taux
     - Calcule nombre de vaccinés: `population_cible × (taux / 100)`
     - Agrège dans la zone correspondante

3. **Calcul des taux par zone**
   ```python
   taux_zone = (total_vaccines / population_cible) × 100
   ```

4. **Vérification de l'objectif**
   ```python
   atteint = taux_zone >= 70.0
   ```

**Sources de données:**
- Priorité 1: Taux officiels Santé Publique France
- Priorité 2: Calcul IQVIA (doses/actes)
- Fallback: Simulation

**Retour:** Liste de dictionnaires avec stats par zone

---

### Fonction: `get_details_zone(zone_code: str, annee: str)`

**Rôle:** Retourne les détails d'une zone spécifique

**Processus:**
1. Appelle `calculer_taux_par_zone(annee)`
2. Filtre pour la zone demandée
3. Retourne l'objet zone ou None

---

### Fonction: `get_statistiques_nationales(annee: str)`

**Rôle:** Calcule les statistiques nationales

**Processus:**
1. Appelle `calculer_taux_par_zone(annee)`
2. Agrège toutes les zones:
   ```python
   total_population = sum(zone["population_totale"] for zone in zones)
   total_cible = sum(zone["population_cible"] for zone in zones)
   total_vaccines = sum(zone["nombre_vaccines"] for zone in zones)
   ```
3. Calcule taux national:
   ```python
   taux_national = (total_vaccines / total_cible) × 100
   ```
4. Identifie zones à risque (taux < 70%)

**Retour:** Statistiques nationales agrégées

---

## 🔮 MODULE PRÉDICTION

**Fichier:** `app/prediction.py`

### Fonction: `charger_donnees_historiques()`

**Rôle:** Charge toutes les données historiques 2021-2024

**Processus:**

1. **Charger CSV (2021, 2022)**
   ```python
   for annee in ["2021", "2022"]:
       fichier = DATA_DIR / annee / f"doses-actes-{annee}.csv"
       df = pd.read_csv(fichier)
       all_data.append(df)
   ```

2. **Charger JSON (2023, 2024)**
   ```python
   for annee in ["2023", "2024"]:
       fichier = DATA_DIR / annee / f"doses-actes-{annee} (1).json"
       with open(fichier) as f:
           data = json.load(f)
       df = pd.DataFrame(data)
       all_data.append(df)
   ```

3. **Fusionner et nettoyer**
   ```python
   df_final = pd.concat(all_data, ignore_index=True)
   df_final['date'] = pd.to_datetime(df_final['date'])
   ```

**Retour:** DataFrame avec colonnes: `campagne, date, jour, variable, groupe, valeur`

---

### Fonction: `predire_besoins_prochains_mois(zone_code, horizon_mois)`

**Rôle:** Prédiction des besoins en doses avec méthode statistique

**Processus:**

#### **ÉTAPE 1: Chargement des données**
```python
df = charger_donnees_historiques()
df_doses = df[df['variable'] == 'DOSES(J07E1)']
```

#### **ÉTAPE 2: Agrégation mensuelle**
```python
df_doses['annee_mois'] = df_doses['date'].dt.to_period('M')
doses_mensuelles = df_doses.groupby('annee_mois')['valeur'].sum()
```

#### **ÉTAPE 3: Calcul de la moyenne mobile (3 mois)**
```python
moyenne_3_mois = doses_mensuelles.tail(3).mean()
```

**Exemple:**
- Octobre 2023: 8 500 000 doses
- Novembre 2023: 7 200 000 doses
- Décembre 2023: 6 800 000 doses
- **Moyenne = 7 500 000 doses**

#### **ÉTAPE 4: Calcul de la tendance**
```python
derniers_6 = doses_mensuelles.tail(6).values
premiers_3 = derniers_6[:3].mean()  # Ex: 5 000 000
derniers_3 = derniers_6[3:].mean()  # Ex: 7 500 000

tendance_pct = ((derniers_3 - premiers_3) / premiers_3) × 100
# Exemple: ((7.5M - 5M) / 5M) × 100 = +50%
```

#### **ÉTAPE 5: Facteur saisonnier**
```python
mois_actuel = datetime.now().month

if 10 <= mois_actuel <= 12:      # Oct-Déc (Pic)
    facteur_saisonnier = 1.3      # +30%
elif 1 <= mois_actuel <= 2:       # Jan-Fév (Fin)
    facteur_saisonnier = 0.7      # -30%
else:                              # Mars-Sept (Hors saison)
    facteur_saisonnier = 0.2      # -80%
```

#### **ÉTAPE 6: Prédiction finale**
```python
prediction_base = moyenne_3_mois × (1 + tendance_pct / 100) × facteur_saisonnier
```

**Exemple de calcul:**
```
Moyenne 3 mois = 7 500 000
Tendance = +50% → Facteur = 1.5
Saisonnier (Oct) = 1.3

Prédiction = 7 500 000 × 1.5 × 1.3 = 14 625 000 doses
```

#### **ÉTAPE 7: Ajustement par zone**
Si `zone_code` est spécifié:
```python
facteur_zone = population_zone / population_totale_france

# Exemple Zone A: 37M / 65M = 0.575
prediction_zone = prediction_base × 0.575
```

#### **ÉTAPE 8: Intervalle de confiance**
```python
doses_min = prediction × 0.85  # -15%
doses_max = prediction × 1.15  # +15%
```

**Retour:** Prédictions mensuelles avec intervalles de confiance

---

### Fonction: `calculer_facteur_zone(zone_code)`

**Rôle:** Calcule le poids d'une zone par rapport à la population totale

**Processus:**
```python
populations = {
    "A": 37 486 830,  # Somme des régions de zone A
    "B": 18 680 364,  # Somme des régions de zone B
    "C": 8 995 077    # Somme des régions de zone C
}

total_pop = 65 162 271

facteur_A = 37 486 830 / 65 162 271 = 0.575 (57.5%)
facteur_B = 18 680 364 / 65 162 271 = 0.287 (28.7%)
facteur_C = 8 995 077 / 65 162 271 = 0.138 (13.8%)
```

**Retour:** Facteur de pondération (float)

---

### Fonction: `get_stock_actuel_simule(zone_code)`

**Rôle:** Simule le stock actuel (pour démo)

**Processus:**
```python
stock_base = 2 500 000  # Stock national

if zone_code:
    facteur = population_zone / 65_000_000
    stock = stock_base × facteur

stock_disponible = stock
stock_reserve = stock × 0.2      # 20% en réserve
stock_distribue = stock × 0.6    # 60% distribué
```

**Retour:** Dictionnaire avec répartition du stock

---

## 📂 MODULE DATA LOADER

**Fichier:** `app/data_loader.py`

### Fonction: `charger_fichier_local(annee, type_fichier)`

**Rôle:** Charge un fichier CSV ou JSON local

**Processus:**
1. Vérifie si fichier JSON existe: `{type_fichier}-{annee} (1).json`
2. Sinon, vérifie CSV: `{type_fichier}-{annee}.csv`
3. Charge et retourne DataFrame

---

### Fonction: `charger_couverture_historique_region()`

**Rôle:** Charge les taux officiels Santé Publique France par région

**Source:** `couverture_vaccinal/couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json`

**Colonnes:**
- `an_mesure`: Année
- `reg`: Code région
- `reglib`: Nom région
- `grip_moins65`: Taux < 65 ans (%)
- `grip_65plus`: Taux 65+ ans (%)
- `grip_6574`: Taux 65-74 ans (%)
- `grip_75plus`: Taux 75+ ans (%)

**Retour:** DataFrame avec taux réels en %

---

### Fonction: `get_taux_couverture_reel_region(code_region, annee)`

**Rôle:** Récupère le taux de couverture OFFICIEL d'une région

**Processus:**

1. **Charger données historiques**
   ```python
   df = charger_couverture_historique_region()
   ```

2. **Filtrer par région et année**
   ```python
   region_data = df[
       (df['reg'] == code_region) & 
       (df['an_mesure'] == annee)
   ]
   ```

3. **Extraire les taux**
   ```python
   taux_moins_65 = region_data['grip_moins65'].iloc[0]
   taux_65_plus = region_data['grip_65plus'].iloc[0]
   ```

4. **Calculer taux global**
   ```python
   # Moyenne pondérée approximative
   # 70% population < 65 ans, 30% population 65+ ans
   taux_global = (taux_moins_65 × 0.7) + (taux_65_plus × 0.3)
   ```

**Exemple:**
```
Région Île-de-France (code 11), année 2024:
- Taux < 65 ans: 28.5%
- Taux 65+ ans: 52.3%
- Taux global = (28.5 × 0.7) + (52.3 × 0.3) = 35.6%
```

**Retour:** Dictionnaire avec tous les taux

---

### Fonction: `get_donnees_vaccination_region(code_region, annee)`

**Rôle:** Point d'entrée principal pour récupérer données d'une région

**Processus de priorisation:**

#### **PRIORITÉ 1: Données officielles Santé Publique France**
```python
taux_reel = get_taux_couverture_reel_region(code_region, annee)
if taux_reel is not None:
    return taux_reel  # ✅ Source la plus fiable
```

#### **PRIORITÉ 2: Calcul depuis fichiers IQVIA**
```python
df_couverture = charger_fichier_local(annee, "couverture")
taux_local = extraire_taux_couverture_region(df_couverture, code_region)

if taux_local is not None:
    # Calcul: (ACTES / DOSES) × 100
    return {"taux_vaccination": taux_local, "source": "IQVIA"}
```

#### **PRIORITÉ 3: Simulation (fallback)**
```python
return {
    "taux_vaccination": 55.0 + (hash(code_region) % 20),
    "source": "simule",
    "avertissement": "Données simulées - non fiables"
}
```

**Retour:** Dictionnaire avec taux et source

---

### Fonction: `extraire_taux_couverture_region(df, code_region)`

**Rôle:** Calcule le taux à partir des données IQVIA

**Processus:**

1. **Filtrer par région**
   ```python
   region_data = df[df['code'] == int(code_region)]
   ```

2. **Séparer ACTES et DOSES**
   ```python
   actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
   doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
   ```

3. **Calculer taux**
   ```python
   taux = (actes / doses) × 100
   ```

**Exemple:**
```
Région 11 (Île-de-France):
- ACTES (vaccinations) = 3 200 000
- DOSES (distribuées) = 4 500 000
- Taux = (3.2M / 4.5M) × 100 = 71.1%
```

**Note:** Ce n'est PAS le taux de couverture réel, mais le taux d'utilisation des doses

**Retour:** Float (taux en %) ou None

---

## ⚙️ CONFIGURATION

**Fichier:** `app/config.py`

### `REGIONS_ZONES`

**Structure:** Dictionnaire mapping codes région → zone

```python
REGIONS_ZONES = {
    # Zone A : Grandes métropoles (prix immobilier élevé)
    "11": {"zone": "A", "nom": "Île-de-France", "population": 12_278_210},
    "84": {"zone": "A", "nom": "Auvergne-Rhône-Alpes", "population": 8_078_652},
    "93": {"zone": "A", "nom": "Provence-Alpes-Côte d'Azur", "population": 5_081_101},
    "76": {"zone": "A", "nom": "Occitanie", "population": 6_014_915},
    "75": {"zone": "A", "nom": "Nouvelle-Aquitaine", "population": 6_033_952},
    
    # Zone B : Agglomérations moyennes
    "32": {"zone": "B", "nom": "Hauts-de-France", "population": 5_962_662},
    "44": {"zone": "B", "nom": "Grand Est", "population": 5_511_747},
    "53": {"zone": "B", "nom": "Bretagne", "population": 3_373_835},
    "52": {"zone": "B", "nom": "Pays de la Loire", "population": 3_832_120},
    
    # Zone C : Reste de la France
    "28": {"zone": "C", "nom": "Normandie", "population": 3_303_500},
    "27": {"zone": "C", "nom": "Bourgogne-Franche-Comté", "population": 2_783_039},
    "24": {"zone": "C", "nom": "Centre-Val de Loire", "population": 2_559_073},
    "94": {"zone": "C", "nom": "Corse", "population": 349_465},
}
```

**Totaux par zone:**
- **Zone A:** 37 486 830 habitants (57.5%)
- **Zone B:** 18 680 364 habitants (28.7%)
- **Zone C:** 8 995 077 habitants (13.8%)
- **TOTAL:** 65 162 271 habitants

**Note:** Périmètre = **France métropolitaine uniquement** (DOM-TOM non inclus ~2.2M hab)

---

### `POURCENTAGE_CIBLE`

**Valeur:** `0.30` (30%)

**Justification:**
- Personnes 65 ans et + : ~20% de la population
- Personnes à risque < 65 ans : ~10% supplémentaires
- **Total population cible : ~30%**

**Utilisation:**
```python
population_cible = population_totale × POURCENTAGE_CIBLE
```

---

## 🧮 CALCULS ET FORMULES

### 1. **Taux de vaccination par zone**

```
Taux_zone = (Nombre_vaccines / Population_cible) × 100
```

**Où:**
- `Nombre_vaccines` = Somme des vaccinés de toutes les régions de la zone
- `Population_cible` = Somme des populations × 30% de toutes les régions

**Exemple Zone A:**
```
Population totale Zone A = 37 486 830
Population cible (30%) = 11 246 049
Nombre de vaccinés = 3 839 256

Taux = (3 839 256 / 11 246 049) × 100 = 34.1%
```

---

### 2. **Nombre de vaccinés par région**

```
Vaccines_region = Population_cible_region × (Taux_region / 100)
```

**Où:**
- `Taux_region` = Taux officiel Santé Publique France ou calculé

**Exemple Île-de-France:**
```
Population IDF = 12 278 210
Population cible (30%) = 3 683 463
Taux IDF (officiel) = 35.6%

Vaccinés = 3 683 463 × (35.6 / 100) = 1 311 313
```

---

### 3. **Prédiction de doses (formule complète)**

```
Prédiction = Moyenne_3_mois × (1 + Tendance/100) × Facteur_saisonnier × Facteur_zone
```

**Décomposition:**

#### a) **Moyenne mobile 3 mois**
```
Moyenne_3_mois = (Mois_n-2 + Mois_n-1 + Mois_n) / 3
```

#### b) **Tendance (évolution 6 mois)**
```
Moyenne_premiers_3 = (Mois_n-5 + Mois_n-4 + Mois_n-3) / 3
Moyenne_derniers_3 = (Mois_n-2 + Mois_n-1 + Mois_n) / 3

Tendance_% = ((Moyenne_derniers_3 - Moyenne_premiers_3) / Moyenne_premiers_3) × 100
```

#### c) **Facteur saisonnier**
```
Si Oct ≤ Mois ≤ Déc : Facteur = 1.3  (+30%)
Si Jan ≤ Mois ≤ Fév : Facteur = 0.7  (-30%)
Sinon (Mars-Sept)    : Facteur = 0.2  (-80%)
```

#### d) **Facteur zone**
```
Facteur_A = 37_486_830 / 65_162_271 = 0.575
Facteur_B = 18_680_364 / 65_162_271 = 0.287
Facteur_C = 8_995_077 / 65_162_271 = 0.138
```

**Exemple complet (Novembre 2025, Zone A):**
```
Moyenne_3_mois = 7 500 000 doses
Tendance = -76.9% → Facteur = 0.231
Saisonnier (Nov) = 1.3
Facteur_zone_A = 0.575

Prédiction = 7_500_000 × 0.231 × 1.3 × 0.575
           = 1_033_350 doses pour Zone A
           
Intervalle:
  Min (-15%) = 878_347 doses
  Max (+15%) = 1_188_352 doses
```

---

### 4. **Intervalle de confiance**

```
Doses_min = Prédiction × 0.85
Doses_max = Prédiction × 1.15
```

**Niveau de confiance:**
- **Haute:** ≥ 12 mois de données historiques
- **Moyenne:** 3-11 mois de données
- **Faible:** < 3 mois (estimation)

---

### 5. **Stock simulé**

```
Stock_zone = Stock_base_national × Facteur_zone

Stock_disponible = Stock_zone
Stock_reserve = Stock_zone × 0.20      (20%)
Stock_distribue = Stock_zone × 0.60    (60%)
```

---

## 📊 SOURCES DE DONNÉES

### **1. Données Locales**

#### **a) Doses et actes (IQVIA)**
- **Fichiers:** `doses-actes-{année}.csv` ou `.json`
- **Période:** 2021-2024
- **Colonnes:**
  - `campagne`: Ex "2023-2024"
  - `date`: Date (format ISO)
  - `jour`: Jour de campagne
  - `variable`: "DOSES(J07E1)" ou "ACTE(VGP)"
  - `groupe`: "65 ans et plus" ou "moins de 65 ans"
  - `valeur`: Nombre (en milliers pour certains fichiers)

**Usage:**
- Calcul taux d'utilisation doses
- Prédiction besoins futurs

---

#### **b) Couverture vaccinale (Santé Publique France)**
- **Fichier:** `couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json`
- **Période:** 2011-2024
- **Colonnes:**
  - `an_mesure`: Année
  - `reg`: Code région
  - `reglib`: Nom région
  - `grip_moins65`: Taux < 65 ans (%)
  - `grip_65plus`: Taux 65+ ans (%)

**Usage:**
- **Source prioritaire** pour taux réels
- Historique long terme
- Données officielles validées

---

#### **c) Passages aux urgences**
- **Fichiers:** 
  - `grippe-passages-aux-urgences-et-actes-sos-medecins-departement.json`
  - `grippe-passages-urgences-et-actes-sos-medecin_reg.json`
- **Source:** Réseau OSCOUR
- **Usage:** Corrélation vaccination ↔ urgences (à implémenter)

---

### **2. APIs Temps Réel (à connecter)**

#### **a) Urgences et SOS Médecins**
```
Base: https://data.sante.gouv.fr/api/explore/v2.1/catalog/datasets/

- Départemental: grippe-passages-aux-urgences-et-actes-sos-medecins-departement/records
- Régional: grippe-passages-urgences-et-actes-sos-medecin_reg/records
- National: grippe-passages-aux-urgences-et-actes-sos-medecins-france/records
```

#### **b) Couverture vaccinale temps réel**
```
- Départemental: couvertures-vaccinales-des-adolescent-et-adultes-departement/records
- Régional: couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region/records
- National: couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-france/records
```

---

### **3. Populations (INSEE)**

**Source:** Recensement INSEE 2023

**Régions métropolitaines:**
| Région | Code | Population |
|--------|------|------------|
| Île-de-France | 11 | 12 278 210 |
| Auvergne-Rhône-Alpes | 84 | 8 078 652 |
| Provence-Alpes-Côte d'Azur | 93 | 5 081 101 |
| Occitanie | 76 | 6 014 915 |
| Nouvelle-Aquitaine | 75 | 6 033 952 |
| Hauts-de-France | 32 | 5 962 662 |
| Grand Est | 44 | 5 511 747 |
| Bretagne | 53 | 3 373 835 |
| Pays de la Loire | 52 | 3 832 120 |
| Normandie | 28 | 3 303 500 |
| Bourgogne-Franche-Comté | 27 | 2 783 039 |
| Centre-Val de Loire | 24 | 2 559 073 |
| Corse | 94 | 349 465 |
| **TOTAL** | | **65 162 271** |

---

## 🔄 FLUX DE DONNÉES

### **1. Vaccination par zone**

```
1. Requête HTTP → /vaccination/zones

2. main.py → calculer_taux_par_zone()

3. Pour chaque région:
   ├─ vaccination.py → get_donnees_vaccination_region()
   │
   ├─ data_loader.py → get_taux_couverture_reel_region()
   │   └─ Priorité 1: Fichiers SPF (taux officiels)
   │
   ├─ data_loader.py → extraire_taux_couverture_region()
   │   └─ Priorité 2: Calcul IQVIA (doses/actes)
   │
   └─ Priorité 3: Simulation (fallback)

4. Agrégation par zone (A, B, C)

5. Calcul taux global par zone

6. Retour JSON
```

---

### **2. Prédiction de doses**

```
1. Requête HTTP → /prediction/doses?horizon_mois=2

2. main.py → predire_besoins_prochains_mois()

3. prediction.py → charger_donnees_historiques()
   └─ Chargement CSV 2021-2022 + JSON 2023-2024

4. Filtrage: variable == 'DOSES(J07E1)'

5. Agrégation mensuelle

6. Calculs statistiques:
   ├─ Moyenne mobile (3 mois)
   ├─ Tendance (6 mois)
   └─ Facteur saisonnier (mois actuel)

7. Prédiction = Moyenne × Tendance × Saisonnier

8. Ajustement par zone (si spécifié)

9. Calcul intervalles de confiance

10. Retour JSON avec prédictions + historique
```

---

## 🎯 EXEMPLE COMPLET D'UTILISATION

### **Scénario: Planifier campagne Novembre 2025 en Zone A**

#### **1. Vérifier taux actuel Zone A**
```bash
curl "http://localhost:8000/vaccination/zone/A?annee=2024"
```

**Résultat:**
- Taux actuel: 34.1%
- Objectif: 70%
- Gap: -35.9 points
- Population cible: 11 246 049
- Vaccinés actuels: 3 839 256
- **Manquants: 7 406 793 personnes**

---

#### **2. Prédire besoins en doses**
```bash
curl "http://localhost:8000/prediction/doses/zone/A?horizon_mois=1"
```

**Résultat:**
- Doses nécessaires Novembre: 159 266
- Intervalle: 135 376 - 183 155
- Confiance: Haute

---

#### **3. Vérifier stock disponible**
```bash
curl "http://localhost:8000/prediction/stock?zone_code=A"
```

**Résultat:**
- Stock disponible Zone A: 1 437 500 doses
- **Stock suffisant pour Novembre: ✅ OUI**

---

#### **4. Calcul de l'impact si objectif atteint**

**Avec 70% de couverture:**
```
Personnes à vacciner = 11 246 049 × 0.70 = 7 872 234
Personnes manquantes = 7 872 234 - 3 839 256 = 4 032 978

Doses nécessaires (1.2 dose/personne) = 4 032 978 × 1.2 = 4 839 574 doses

Durée campagne = 5 mois (oct-fév)
Doses par mois = 4 839 574 / 5 = 967 915 doses/mois
```

**Conclusion:** Besoin de **968k doses/mois** en Zone A pour atteindre 70%

---

## 📈 MÉTRIQUES ET KPI

### **Indicateurs de performance**

#### **1. Couverture vaccinale**
```
Taux = (Vaccinés / Population_cible) × 100
Objectif: 70%
```

#### **2. Efficacité distribution**
```
Taux_utilisation = (Actes / Doses_distribuees) × 100
Objectif: > 80%
```

#### **3. Précision prédiction**
```
Erreur = |Prédiction - Réel| / Réel × 100
Objectif: < 15%
```

#### **4. Gap à combler**
```
Gap = Objectif - Taux_actuel
Gap_personnes = Population_cible × (Gap / 100)
```

---

## 🚧 LIMITATIONS ACTUELLES

### **1. Données**
- ❌ Pas de données temps réel (APIs non connectées)
- ❌ Fichiers 2023-2024 incomplets
- ❌ DOM-TOM non inclus
- ⚠️ Unités IQVIA parfois en milliers

### **2. Prédiction**
- ⚠️ Modèle simple (pas de ML avancé)
- ⚠️ Pas de prise en compte événements (Covid, etc.)
- ⚠️ Intervalle de confiance fixe (±15%)

### **3. Stock**
- ❌ Stock simulé (pas de vraies données)
- ❌ Pas de gestion logistique réelle

---

## 🔮 AMÉLIORATIONS FUTURES

### **Phase 1: Données**
- [ ] Connecter APIs temps réel
- [ ] Ajouter DOM-TOM
- [ ] Normaliser unités IQVIA

### **Phase 2: Prédiction**
- [ ] Intégrer Prophet/Darts
- [ ] Modèle ML avec features:
  - Météo
  - Épidémies passées
  - Événements calendrier
- [ ] Intervalle de confiance dynamique

### **Phase 3: Analyses**
- [ ] Corrélation vaccination ↔ urgences
- [ ] Optimisation distribution (algorithme)
- [ ] Simulation scénarios ("what-if")

### **Phase 4: Temps réel**
- [ ] Connexion stock réel
- [ ] Alertes automatiques
- [ ] Dashboard live

---

## 📞 SUPPORT

**Questions sur les calculs ?**
- Voir section [Calculs et Formules](#calculs-et-formules)

**Questions sur les données ?**
- Voir section [Sources de Données](#sources-de-données)

**Questions sur les routes ?**
- Voir section [Routes API](#routes-api)

---

**Fin de la documentation** 🎉

*Version: 2.0.0 - 21 Octobre 2025*

