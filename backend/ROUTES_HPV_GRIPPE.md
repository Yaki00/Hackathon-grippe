# 📋 NOUVELLES ROUTES - HPV & GRIPPE DÉTAILLÉE

**Version:** 3.0.0  
**Date:** 21 Octobre 2025

---

## 🎯 OBJECTIF

Fournir des données détaillées de couverture vaccinale pour :
- **HPV** (Papillomavirus) : Filles et Garçons, Doses 1 et 2
- **GRIPPE** : Toutes les catégories (< 65 ans, 65+, EHPAD, professionnels...)

**Niveaux disponibles :**
- 🌍 National
- 🗺️ Régional (13 régions métropolitaines + DOM-TOM)
- 🏘️ Départemental (101 départements)

---

## 💉 ROUTES HPV (PAPILLOMAVIRUS)

### 1. National
```
GET /couverture/hpv/national?annee_debut=2022
```

**Paramètres:**
- `annee_debut` (optionnel): Année de début (défaut: 2022)

**Exemple:**
```bash
curl "http://localhost:8000/couverture/hpv/national?annee_debut=2022"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "niveau": "National",
    "periode": "2022 - présent",
    "data": [
      {
        "annee": "2022",
        "hpv_filles": {
          "dose_1": 47.0,
          "dose_2": 41.5
        },
        "hpv_garcons": {
          "dose_1": 12.8,
          "dose_2": 8.5
        }
      },
      {
        "annee": "2023",
        "hpv_filles": {
          "dose_1": 54.6,
          "dose_2": 44.7
        },
        "hpv_garcons": {
          "dose_1": 25.9,
          "dose_2": 15.8
        }
      },
      {
        "annee": "2024",
        "hpv_filles": {
          "dose_1": 58.4,
          "dose_2": 48.0
        },
        "hpv_garcons": {
          "dose_1": 36.9,
          "dose_2": 24.5
        }
      }
    ]
  }
}
```

**Données disponibles:**
- Années HPV: 2011-2024
- Doses 1 et 2 pour filles et garçons
- Taux en %

---

### 2. Régional - Toutes les régions
```
GET /couverture/hpv/regional?annee_debut=2022
```

**Paramètres:**
- `annee_debut` (optionnel): Année de début (défaut: 2022)

**Exemple:**
```bash
curl "http://localhost:8000/couverture/hpv/regional?annee_debut=2023"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "niveau": "Régional",
    "periode": "2023 - présent",
    "regions": [
      {
        "code_region": "11",
        "nom_region": "Île-de-France",
        "data": [
          {
            "annee": "2023",
            "hpv_filles": {"dose_1": 48.6, "dose_2": 38.7},
            "hpv_garcons": {"dose_1": 27.2, "dose_2": 16.7}
          },
          {
            "annee": "2024",
            "hpv_filles": {"dose_1": 53.2, "dose_2": 41.3},
            "hpv_garcons": {"dose_1": 37.0, "dose_2": 24.5}
          }
        ]
      },
      {
        "code_region": "84",
        "nom_region": "Auvergne-Rhône-Alpes",
        "data": [...]
      }
      // ... 13 régions métropolitaines + DOM-TOM
    ]
  }
}
```

---

### 3. Régional - Une région spécifique
```
GET /couverture/hpv/regional/{code_region}?annee_debut=2022
```

**Paramètres:**
- `code_region` (path, requis): Code région (ex: "11" pour IDF)
- `annee_debut` (optionnel): Année de début (défaut: 2022)

**Exemple:**
```bash
curl "http://localhost:8000/couverture/hpv/regional/11?annee_debut=2023"
```

**Codes régions:**
- `11`: Île-de-France
- `84`: Auvergne-Rhône-Alpes
- `93`: Provence-Alpes-Côte d'Azur
- `76`: Occitanie
- `75`: Nouvelle-Aquitaine
- ... (voir `/couverture/regions` pour liste complète)

---

### 4. Départemental - Tous les départements
```
GET /couverture/hpv/departemental?annee_debut=2022
```

**Exemple:**
```bash
curl "http://localhost:8000/couverture/hpv/departemental?annee_debut=2023"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "niveau": "Départemental",
    "periode": "2023 - présent",
    "departements": [
      {
        "code_departement": "75",
        "nom_departement": "Paris",
        "code_region": "11",
        "nom_region": "Île-de-France",
        "data": [...]
      },
      // ... 101 départements
    ]
  }
}
```

---

### 5. Départemental - Un département spécifique
```
GET /couverture/hpv/departemental/{code_dept}?annee_debut=2022
```

**Paramètres:**
- `code_dept` (path, requis): Code département (ex: "75" pour Paris)
- `annee_debut` (optionnel): Année de début (défaut: 2022)

**Exemple:**
```bash
curl "http://localhost:8000/couverture/hpv/departemental/75?annee_debut=2023"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "code_departement": "75",
    "nom_departement": "Paris",
    "code_region": "11",
    "nom_region": "Île-de-France",
    "data": [
      {
        "annee": "2023",
        "hpv_filles": {"dose_1": 48.6, "dose_2": 38.7},
        "hpv_garcons": {"dose_1": 27.2, "dose_2": 16.7}
      },
      {
        "annee": "2024",
        "hpv_filles": {"dose_1": 53.2, "dose_2": 41.3},
        "hpv_garcons": {"dose_1": 37.0, "dose_2": 24.5}
      }
    ]
  }
}
```

---

## 🦠 ROUTES GRIPPE DÉTAILLÉE

### 1. National
```
GET /couverture/grippe/national?annee=2024
```

**Paramètres:**
- `annee` (optionnel): Année spécifique ou None pour toutes

**Exemple:**
```bash
curl "http://localhost:8000/couverture/grippe/national?annee=2024"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "niveau": "National",
    "data": [
      {
        "annee": "2024",
        "moins_65_ans": 25.3,
        "65_ans_et_plus": 53.7,
        "65_74_ans": 46.7,
        "75_ans_et_plus": 60.7,
        "residents_ehpad": null,
        "professionnels_sante": null
      }
    ]
  }
}
```

**Catégories disponibles:**
- `moins_65_ans`: Moins de 65 ans (tous)
- `65_ans_et_plus`: 65 ans et plus (tous)
- `65_74_ans`: 65-74 ans
- `75_ans_et_plus`: 75 ans et plus
- `residents_ehpad`: Résidents en EHPAD
- `professionnels_sante`: Professionnels de santé

**Note:** `null` = données non disponibles pour cette catégorie/année

---

### 2. Régional - Toutes les régions
```
GET /couverture/grippe/regional?annee=2024
```

**Paramètres:**
- `annee` (optionnel): Année spécifique ou None pour toutes

**Exemple:**
```bash
# Une année spécifique
curl "http://localhost:8000/couverture/grippe/regional?annee=2024"

# Toutes les années
curl "http://localhost:8000/couverture/grippe/regional"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "niveau": "Régional",
    "regions": [
      {
        "code_region": "11",
        "nom_region": "Île-de-France",
        "data": [
          {
            "annee": "2024",
            "moins_65_ans": 22.9,
            "65_ans_et_plus": 52.9,
            "65_74_ans": 45.7,
            "75_ans_et_plus": 60.3,
            "residents_ehpad": null,
            "professionnels_sante": null
          }
        ]
      },
      // ... autres régions
    ]
  }
}
```

---

### 3. Régional - Une région spécifique
```
GET /couverture/grippe/regional/{code_region}?annee=2024
```

**Paramètres:**
- `code_region` (path, requis): Code région
- `annee` (optionnel): Année spécifique

**Exemple:**
```bash
# Île-de-France 2024
curl "http://localhost:8000/couverture/grippe/regional/11?annee=2024"

# Toutes les années
curl "http://localhost:8000/couverture/grippe/regional/11"
```

---

### 4. Départemental - Tous les départements
```
GET /couverture/grippe/departemental?annee=2024
```

**Exemple:**
```bash
curl "http://localhost:8000/couverture/grippe/departemental?annee=2024"
```

---

### 5. Départemental - Un département spécifique
```
GET /couverture/grippe/departemental/{code_dept}?annee=2024
```

**Paramètres:**
- `code_dept` (path, requis): Code département
- `annee` (optionnel): Année spécifique

**Exemple:**
```bash
# Paris 2024
curl "http://localhost:8000/couverture/grippe/departemental/75?annee=2024"

# Toutes les années
curl "http://localhost:8000/couverture/grippe/departemental/75"
```

---

## 🛠️ ROUTES UTILITAIRES

### 1. Années disponibles
```
GET /couverture/annees
```

**Description:** Liste des années avec données HPV et Grippe

**Exemple:**
```bash
curl "http://localhost:8000/couverture/annees"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "hpv": ["2011", "2012", ..., "2024"],
    "grippe": ["2016", "2017", ..., "2024"]
  }
}
```

---

### 2. Liste des régions
```
GET /couverture/regions
```

**Description:** Liste de toutes les régions avec codes

**Exemple:**
```bash
curl "http://localhost:8000/couverture/regions"
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {"code": "11", "nom": "Île-de-France"},
    {"code": "24", "nom": "Centre-Val de Loire"},
    {"code": "27", "nom": "Bourgogne et Franche-Comté"},
    // ... 17 régions (13 métropole + 4 DOM-TOM)
  ]
}
```

**Régions disponibles:**
- **Métropolitaines (13):** IDF, Auvergne-Rhône-Alpes, PACA, Occitanie, Nouvelle-Aquitaine, Hauts-de-France, Grand Est, Bretagne, Pays de la Loire, Normandie, Bourgogne-FC, Centre-Val de Loire, Corse
- **DOM-TOM (4):** Guadeloupe, Martinique, Guyane, La Réunion

---

### 3. Liste des départements
```
GET /couverture/departements
```

**Description:** Liste de tous les départements avec codes et région

**Exemple:**
```bash
curl "http://localhost:8000/couverture/departements"
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "code": "75",
      "nom": "Paris",
      "region_code": "11",
      "region_nom": "Île-de-France"
    },
    {
      "code": "13",
      "nom": "Bouches-du-Rhône",
      "region_code": "93",
      "region_nom": "Provence-Alpes-Côte d'Azur"
    },
    // ... 101 départements
  ]
}
```

---

## 📊 DONNÉES DISPONIBLES

### HPV
- **Années:** 2011-2024 (14 ans)
- **Catégories:**
  - Filles: Dose 1, Dose 2
  - Garçons: Dose 1, Dose 2
- **Niveaux:** National, Régional (17), Départemental (101)
- **Unité:** Pourcentage (%)

### Grippe
- **Années:** 2016-2024 (9 ans)
- **Catégories:**
  - Moins de 65 ans (tous)
  - 65 ans et plus (tous)
  - 65-74 ans
  - 75 ans et plus
  - Résidents EHPAD
  - Professionnels de santé
- **Niveaux:** National, Régional (17), Départemental (101)
- **Unité:** Pourcentage (%)

---

## 🎯 CAS D'USAGE

### 1. Comparer HPV filles vs garçons sur 3 ans
```bash
curl "http://localhost:8000/couverture/hpv/national?annee_debut=2022"
```

**Analyse:**
```
2022: Filles 47.0% → Garçons 12.8% (écart: 34.2 pts)
2023: Filles 54.6% → Garçons 25.9% (écart: 28.7 pts)
2024: Filles 58.4% → Garçons 36.9% (écart: 21.5 pts)

✅ Réduction de l'écart de 12.7 points en 2 ans
```

---

### 2. Identifier régions faibles en grippe 65+
```bash
curl "http://localhost:8000/couverture/grippe/regional?annee=2024"
```

**Analyse:**
- Objectif: 70%
- National: 53.7%
- IDF: 52.9% ❌ Sous objectif
- Hauts-de-France: ... (à vérifier)

---

### 3. Évolution département Paris HPV 2023-2024
```bash
curl "http://localhost:8000/couverture/hpv/departemental/75?annee_debut=2023"
```

**Analyse:**
```
Filles Dose 1: 48.6% → 53.2% (+4.6 pts) ✅
Garçons Dose 1: 27.2% → 37.0% (+9.8 pts) ✅ Progression forte
```

---

### 4. Comparaison départementale dans une région
```bash
# Tous les départements d'IDF
curl "http://localhost:8000/couverture/grippe/departemental?annee=2024" | \
  jq '.data.departements[] | select(.code_region == "11")'
```

---

## 🔧 INTÉGRATION FRONTEND

### Exemple React/Next.js

```javascript
// Récupérer données HPV nationales
async function getHPVNational(anneeDebut = "2022") {
  const res = await fetch(
    `http://localhost:8000/couverture/hpv/national?annee_debut=${anneeDebut}`
  );
  const data = await res.json();
  return data.data;
}

// Récupérer grippe par région
async function getGrippeRegion(codeRegion, annee = "2024") {
  const res = await fetch(
    `http://localhost:8000/couverture/grippe/regional/${codeRegion}?annee=${annee}`
  );
  const data = await res.json();
  return data.data;
}

// Exemple d'utilisation
const hpvData = await getHPVNational("2022");
console.log("HPV 2024 Filles Dose 1:", hpvData.data[2].hpv_filles.dose_1);

const grippeIDF = await getGrippeRegion("11");
console.log("Grippe IDF 65+:", grippeIDF.data[0]["65_ans_et_plus"]);
```

---

## 📈 VISUALISATIONS SUGGÉRÉES

### 1. Graphique évolution HPV
- **Axe X:** Années (2022-2024)
- **Axe Y:** Taux (%)
- **Séries:** Filles D1, Filles D2, Garçons D1, Garçons D2
- **Type:** Ligne

### 2. Carte choroplèthe régionale
- **Données:** Grippe 65+ par région
- **Couleurs:** Vert (>70%), Orange (50-70%), Rouge (<50%)
- **Tooltip:** Détails catégories

### 3. Comparaison départementale
- **Type:** Barres horizontales
- **Axe X:** Taux (%)
- **Axe Y:** Départements
- **Tri:** Décroissant

### 4. Pyramide des âges grippe
- **Catégories:** <65, 65-74, 75+
- **Type:** Barres empilées
- **Comparaison:** 2023 vs 2024

---

## 🚨 NOTES IMPORTANTES

### Données manquantes
Certaines catégories peuvent retourner `null`:
- `residents_ehpad`: Souvent null avant 2020
- `professionnels_sante`: Données limitées
- **Toujours vérifier `!= null` dans le frontend**

### Performance
- Routes départementales (tous): Retournent ~101 objets
- Routes régionales (toutes): Retournent ~17 objets
- **Utiliser pagination si nécessaire**

### Mise en cache
- Données historiques: Cache 24h
- Données récentes: Cache 1h
- **Implémenter cache côté client**

---

## 📞 RÉSUMÉ

**Total de nouvelles routes:** 13
- HPV: 5 routes
- Grippe: 5 routes
- Utilitaires: 3 routes

**Données couvertes:**
- 17 régions
- 101 départements
- 14 ans HPV (2011-2024)
- 9 ans Grippe (2016-2024)

**Format réponse:** Toujours `{"success": true/false, "data": {...}}`

---

**Fin de la documentation** 🎉

*Version: 3.0.0 - 21 Octobre 2025*

