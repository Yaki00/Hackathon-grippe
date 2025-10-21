# 📊 ANALYSE COMPLÈTE DES DONNÉES

## Vue d'ensemble

Vous avez **3 grandes catégories** de données :
1. **Données IQVIA annuelles** (2021-2024) - Distribution vaccins en pharmacie
2. **Données Santé Publique France** (2011-2024) - Couverture vaccinale historique
3. **Données Passages aux urgences** (2020-2025) - Surveillance grippe

---

## 📁 PARTIE 1 : DONNÉES IQVIA (2021-2024)

### Source
- **IQVIA France** : Suivi pharmacies
- **Format** : CSV (2021-2022), JSON (2023-2024)
- **Période** : Campagnes annuelles de vaccination

### Fichiers par année

#### 📄 `campagne-XXXX.csv/json`
**Contenu** : Résumé national de la campagne
- **5 lignes** par année
- **Variables** :
  - `ACTE(VGP)` : Total actes de vaccination réalisés
  - `DOSES(J07E1)` : Total doses distribuées
  - `UNIVERS` : Nombre total de pharmacies
  - `PHARMACIES` : Pharmacies participantes
  - `POURCENTAGE` : % participation

**⚠️ ÉCHELLE** : Valeurs en **MILLIERS**
- Exemple 2024 : 10,835,299 actes = 10.8 millions

#### 📄 `couverture-XXXX.csv/json`
**Contenu** : Données par **région**
- **52 lignes** par année (13 régions × 2 variables × 2 groupes d'âge)
- **Colonnes** :
  - `region` : Nom de la région
  - `code` : Code région (11, 24, 27, 28, 32, 44, 52, 53, 75, 76, 84, 93, 94)
  - `variable` : `ACTE(VGP)` ou `DOSES(J07E1)`
  - `groupe` : "65 ans et plus" ou "moins de 65 ans"
  - `valeur` : Nombre (en milliers)

**Exemple 2024** :
```
Bretagne (53) - 65 ans et plus:
  - ACTE(VGP): 3,747 (milliers) = 3,747,000 actes
  - DOSES(J07E1): 6,097 (milliers) = 6,097,000 doses
```

#### 📄 `doses-actes-XXXX.csv/json`
**Contenu** : Évolution **jour par jour** national
- **~1000 lignes** par année
- **Colonnes** :
  - `campagne` : Ex: "2023-2024"
  - `date` : Date (timestamp ou format date)
  - `jour` : Jour de la semaine
  - `variable` : `ACTE(VGP)` ou `DOSES(J07E1)`
  - `groupe` : "65 ans et plus" ou "moins de 65 ans"
  - `valeur` : Nombre pour ce jour

**Utilité** : Suivi temporel de la campagne

---

## 📁 PARTIE 2 : COUVERTURE VACCINALE SANTÉ PUBLIQUE FRANCE (2011-2024)

### Source
- **Santé Publique France** (officiel)
- **Format** : JSON
- **Période** : 2011 à 2024 (14 ans d'historique)

### ⭐ **TRÈS IMPORTANT** : Ce sont des **POURCENTAGES DIRECTS**
Pas de calcul nécessaire, valeurs officielles !

#### 📄 `couvertures-vaccinales-...-france.json`
**Contenu** : Données **NATIONALES** par année
- **14 lignes** (une par année 2011-2024)
- **Colonnes clés pour grippe** :
  - `an_mesure` : Année
  - `grip_moins65` : **% couverture** moins de 65 ans
  - `grip_65plus` : **% couverture** 65 ans et plus
  - `grip_6574` : **% couverture** 65-74 ans
  - `grip_75plus` : **% couverture** 75 ans et plus

**Exemple 2024** :
```json
{
  "an_mesure": "2024",
  "grip_moins65": 25.3,     ← 25.3% de couverture
  "grip_65plus": 53.7,      ← 53.7% de couverture
  "grip_6574": 46.7,
  "grip_75plus": 60.7
}
```

**Évolution historique** :
- 2019 : 52.0% (65+)
- 2020 : 59.9% (65+) ← Pic COVID
- 2021 : 56.8% (65+)
- 2022 : 56.2% (65+)
- 2023 : 54.0% (65+)
- 2024 : 53.7% (65+)

#### 📄 `couvertures-vaccinales-...-region.json`
**Contenu** : Données par **RÉGION** par année
- **238 lignes** (17 régions × 14 ans)
- **Colonnes clés** :
  - `an_mesure` : Année
  - `reg` : Code région (ex: "53")
  - `reglib` : Nom région (ex: "Bretagne")
  - `grip_moins65` : % couverture moins de 65 ans
  - `grip_65plus` : % couverture 65 ans et plus
  - `grip_6574` : % couverture 65-74 ans
  - `grip_75plus` : % couverture 75 ans et plus

**Régions disponibles** :
- Auvergne et Rhône-Alpes
- Bourgogne et Franche-Comté
- Bretagne ⭐ (meilleur taux 2024: 59.5%)
- Centre-Val de Loire
- Corse
- Grand Est
- Guadeloupe
- Guyane
- Hauts-de-France
- Martinique
- Normandie
- Nouvelle Aquitaine
- Occitanie
- Pays de la Loire
- Provence-Alpes-Côte d'Azur
- Réunion
- Île-de-France

**Exemple Bretagne 2024** :
```json
{
  "an_mesure": "2024",
  "reg": "53",
  "reglib": "Bretagne",
  "grip_moins65": 28.0,     ← Champion national !
  "grip_65plus": 59.5,      ← Meilleur taux France
  "grip_6574": 52.8,
  "grip_75plus": 66.3
}
```

**Classement 2024 (65+)** :
1. Bretagne : 59.5%
2. Pays de la Loire : 58.1%
3. Normandie : 57.7%
...
17. Martinique : 11.5% ❌

#### 📄 `couvertures-vaccinales-...-departement.json`
**Contenu** : Données par **DÉPARTEMENT** par année
- **1,414 lignes** (110 départements × ~13 ans)
- **Colonnes** : Similaires région + `dep` (code), `libgeo` (nom)

**Utilité** : Analyse fine territoriale

---

## 📁 PARTIE 3 : PASSAGES AUX URGENCES (2020-2025)

### Source
- **Santé Publique France** : Réseau OSCOUR® + SOS Médecins
- **Format** : JSON
- **Période** : Semaine 2020-S01 à 2025-S41

#### 📄 `grippe-passages-urgences-...-reg.json`
**Contenu** : Données **hebdomadaires** par **région**
- **27,180 lignes**
- **Colonnes** :
  - `date_complet` : Date exacte
  - `semaine` : Format "2024-S42"
  - `region` : Code région
  - `reglib` : Nom région
  - `sursaud_cl_age_gene` : Classe d'âge
  - `taux_passages_grippe_sau` : Taux passages urgences pour grippe
  - `taux_hospit_grippe_sau` : Taux hospitalisations pour grippe
  - `taux_actes_grippe_sos` : Taux actes SOS Médecins pour grippe

**Utilité** : 
- Corréler vaccination ↔ passages urgences
- Prédire pics épidémiques
- Analyser impact régional

#### 📄 `grippe-passages-urgences-...-departement.json`
**Contenu** : Données **hebdomadaires** par **département**
- **157,040 lignes** (beaucoup de détail !)
- **Colonnes** : Similaires région + `dep`, `libgeo`

---

## 🎯 RECOMMANDATIONS POUR VOS OBJECTIFS

### 1️⃣ **Identifier zones sous-vaccinées**
**Données à utiliser** :
- ✅ `couvertures-vaccinales-...-region.json` (2024)
- ✅ Comparer avec objectif national (65+ : >75%)
- ✅ Évolution historique 2011-2024

**Calcul** :
- Écart à l'objectif = 75% - taux_65plus
- Régions prioritaires : Corse (46%), PACA (49.8%), IDF (52.9%)

### 2️⃣ **Prédire besoins en vaccins**
**Données à utiliser** :
- ✅ `couvertures-vaccinales-...-region.json` (historique 2011-2024)
- ✅ Tendance d'évolution par région
- ✅ Population cible (à estimer)

**Méthode** :
- Régression linéaire sur 2019-2024
- Extrapolation 2025
- Besoins = Population_cible × Taux_prédit

### 3️⃣ **Optimiser distribution**
**Données à utiliser** :
- ✅ `couverture-2024.json` (IQVIA) : doses distribuées vs actes
- ✅ Taux d'utilisation par région
- ✅ Identifier gaspillage

**Calcul** :
- Taux_utilisation = ACTE(VGP) / DOSES(J07E1) × 100
- Optimiser allocation selon taux couverture

### 4️⃣ **Anticiper passages urgences**
**Données à utiliser** :
- ✅ `grippe-passages-urgences-...-reg.json` (historique)
- ✅ `couvertures-vaccinales-...-region.json` (taux vaccination)
- ✅ Corrélation : vaccination ↑ = urgences ↓

**Analyse** :
- Corrélation Pearson par région
- Modèle prédictif : urgences = f(taux_vaccin, semaine, historique)

---

## ⚠️ POINTS D'ATTENTION

### Échelles différentes
1. **IQVIA** : Valeurs en **milliers**
   - 3,930 = 3,930,000 actes
2. **Santé Publique France** : Valeurs en **pourcentages**
   - 53.7 = 53.7%

### Sources complémentaires
- **IQVIA** : Bon pour volumes (doses, actes)
- **Santé Publique France** : Bon pour taux officiels ⭐

### Recommandation
✅ **Utiliser PRIORITAIREMENT Santé Publique France** pour les taux de couverture
✅ **Utiliser IQVIA** pour analyser distribution et gaspillage

---

## 📈 RÉSUMÉ EXÉCUTIF

### Données disponibles
- ✅ **14 ans d'historique** (2011-2024)
- ✅ **17 régions** + **110 départements**
- ✅ **5 ans de passages urgences** (2020-2025)
- ✅ **Données officielles fiables**

### Données exploitables
- ✅ Taux de couverture par zone
- ✅ Évolution temporelle
- ✅ Doses distribuées vs utilisées
- ✅ Corrélation vaccination/urgences

### Manques
- ❌ Population exacte par zone (à estimer)
- ❌ Données socio-économiques
- ❌ Facteurs de réticence vaccinale

