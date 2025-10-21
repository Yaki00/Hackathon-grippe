"""
API Backend Grippe - Partie VACCINATION
Étape par étape, on ajoute les fonctionnalités
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.vaccination import (
    calculer_taux_par_zone,
    get_details_zone,
    get_statistiques_nationales,
    calculer_taux_par_departement,
    get_details_departement,
    get_statistiques_par_zone_et_departement
)
from app.prediction import (
    predire_besoins_prochains_mois,
    get_stock_actuel_simule,
    get_stock_vs_besoin_par_zone
)
from app.couverture_vaccins import (
    # HPV
    get_hpv_national,
    get_hpv_regional,
    get_hpv_departemental,
    # Grippe détaillée
    get_grippe_national,
    get_grippe_regional,
    get_grippe_departemental,
    get_grippe_par_zones,
    # Utilitaires
    get_annees_disponibles,
    get_liste_regions,
    get_liste_departements
)
from app.urgences import (
    get_urgences_par_departement,
    get_urgences_par_region,
    get_urgences_nationales,
    get_urgences_par_zone
)
from app.ia_analyzer import analyze_with_ai, get_ollama_status
from app.medecins_reels import (
    get_medecins_reels_par_region,
    get_medecins_reels_par_zone,
    get_statistiques_medecins_reels,
    rechercher_medecins_reels,
    get_comptage_medecins_par_region
)
from app.couts_reels import (
    get_couts_vaccination_grippe,
    get_couts_par_zone,
    get_couts_par_departement,
    get_scenarios_vaccination
)

# Application FastAPI
app = FastAPI(
    title="API Grippe - Vaccination",
    description="Backend pour la stratégie vaccinale grippe - Partie 1: Vaccination",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Page d'accueil."""
    return {
        "message": "API Grippe - Vaccination + Prédiction + Couvertures Détaillées",
        "version": "3.0.0",
        "endpoints": {
            "vaccination_zones": {
                "zones": "/vaccination/zones",
                "zone_details": "/vaccination/zone/{zone_code}",
                "national": "/vaccination/national",
                "departements": "/vaccination/departements",
                "departement_details": "/vaccination/departement/{code_dept}",
                "zones_avec_departements": "/vaccination/zones-departements"
            },
            "prediction": {
                "doses_nationales": "/prediction/doses",
                "doses_par_zone": "/prediction/doses/zone/{zone_code}",
                "stock_actuel": "/prediction/stock",
                "stock_vs_besoin": "/prediction/stock-vs-besoin"
            },
            "urgences": {
                "national": "/urgences/national",
                "regional": "/urgences/regional",
                "regional_detail": "/urgences/regional/{code_region}",
                "departemental": "/urgences/departemental",
                "departement_detail": "/urgences/departement/{code_departement}",
                "par_zone": "/urgences/zone/{zone_code}"
            },
            "ia_analysis": {
                "ollama_status": "/ai/status",
                "analyze_data": "/ai/analyze"
            },
            "medecins": {
                "comptage_regions": "/medecins/comptage",
                "par_zone": "/medecins/zone/{zone_code}",
                "par_region": "/medecins/region/{region_code}",
                "recherche": "/medecins/recherche",
                "statistiques": "/medecins/statistiques"
            },
            "couts_reels": {
                "national": "/couts/national",
                "par_zone": "/couts/zone/{zone_code}",
                "par_departement": "/couts/departement/{code_departement}",
                "scenarios": "/couts/scenarios"
            },
            "hpv": {
                "national": "/couverture/hpv/national",
                "regional": "/couverture/hpv/regional",
                "regional_detail": "/couverture/hpv/regional/{code_region}",
                "departemental": "/couverture/hpv/departemental",
                "departemental_detail": "/couverture/hpv/departemental/{code_dept}"
            },
            "grippe_detaillee": {
                "national": "/couverture/grippe/national",
                "regional": "/couverture/grippe/regional",
                "regional_detail": "/couverture/grippe/regional/{code_region}",
                "par_zones": "/couverture/grippe/zones",
                "departemental": "/couverture/grippe/departemental",
                "departemental_detail": "/couverture/grippe/departemental/{code_dept}"
            },
            "utilitaires": {
                "annees_disponibles": "/couverture/annees",
                "liste_regions": "/couverture/regions",
                "liste_departements": "/couverture/departements"
            }
        }
    }


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}


# ============================================
# PARTIE 1 : VACCINATION
# ============================================

@app.get("/vaccination/zones")
def get_vaccination_zones(annee: str = "2024"):
    """
    **Taux de vaccination par zone A, B, C**
    
    Retourne pour chaque zone :
    - Population totale et cible
    - Nombre de personnes vaccinées
    - Taux de vaccination (%)
    - Objectif et si atteint
    """
    try:
        zones = calculer_taux_par_zone(annee)
        
        return {
            "success": True,
            "annee": annee,
            "zones": zones
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/vaccination/zone/{zone_code}")
def get_vaccination_zone(zone_code: str, annee: str = "2024"):
    """
    **Détails d'une zone spécifique (A, B ou C)**
    """
    try:
        zone = get_details_zone(zone_code.upper(), annee)
        
        if not zone:
            return {
                "success": False,
                "error": f"Zone {zone_code} non trouvée"
            }
        
        return {
            "success": True,
            "annee": annee,
            "zone": zone
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/vaccination/national")
def get_vaccination_national(annee: str = "2024"):
    """
    **Statistiques nationales de vaccination**
    """
    try:
        stats = get_statistiques_nationales(annee)
        
        return {
            "success": True,
            "annee": annee,
            "statistiques": stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/vaccination/departements")
def get_vaccination_departements(annee: str = "2024", zone: str = None):
    """
    **📍 Taux de vaccination par département**
    
    Retourne pour chaque département :
    - Code et nom du département
    - Région et zone associées
    - Population totale et cible
    - Nombre de personnes vaccinées
    - Taux de vaccination (%)
    - Objectif et si atteint
    
    **Paramètres** :
    - `annee` : Année de référence (défaut: 2024)
    - `zone` : Filtre par zone (A, B ou C) ou None pour tous
    """
    try:
        if zone:
            zone = zone.upper()
            if zone not in ["A", "B", "C"]:
                return {
                    "success": False,
                    "error": "zone doit être A, B ou C"
                }
        
        departements = calculer_taux_par_departement(annee, zone_filter=zone)
        
        return {
            "success": True,
            "annee": annee,
            "zone_filtre": zone,
            "nb_departements": len(departements),
            "departements": departements
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/vaccination/departement/{code_dept}")
def get_vaccination_departement(code_dept: str, annee: str = "2024"):
    """
    **📍 Détails d'un département spécifique**
    
    **Paramètres** :
    - `code_dept` : Code département (ex: "75" pour Paris)
    - `annee` : Année de référence
    """
    try:
        dept = get_details_departement(code_dept, annee)
        
        if not dept:
            return {
                "success": False,
                "error": f"Département {code_dept} non trouvé"
            }
        
        return {
            "success": True,
            "annee": annee,
            "departement": dept
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/vaccination/zones-departements")
def get_vaccination_zones_avec_departements(annee: str = "2024"):
    """
    **📊 Statistiques par zone avec détails des départements**
    
    Vue agrégée par zone (A, B, C) avec liste des départements
    et leurs taux de vaccination respectifs
    
    **Paramètres** :
    - `annee` : Année de référence (défaut: 2024)
    """
    try:
        stats = get_statistiques_par_zone_et_departement(annee)
        
        return {
            "success": True,
            "annee": annee,
            "zones": stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 2 : PRÉDICTION DES BESOINS EN DOSES
# ============================================

@app.get("/prediction/doses")
def get_prediction_doses_nationales(horizon_mois: int = 1):
    """
    **📊 Prédiction des besoins en doses au niveau national**
    
    Prédiction basée sur :
    - Données historiques 2021-2024 (IQVIA)
    - Moyenne mobile + Tendance
    - Saisonnalité (pic oct-déc)
    
    **Paramètres** :
    - `horizon_mois` : Nombre de mois à prédire (1-3)
    
    **Retourne** :
    - Prédictions mensuelles
    - Statistiques historiques
    - Contexte saisonnier
    """
    try:
        if horizon_mois < 1 or horizon_mois > 3:
            return {
                "success": False,
                "error": "horizon_mois doit être entre 1 et 3"
            }
        
        prediction = predire_besoins_prochains_mois(zone_code=None, horizon_mois=horizon_mois)
        
        return {
            "success": True,
            "data": prediction
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/prediction/doses/zone/{zone_code}")
def get_prediction_doses_zone(zone_code: str, horizon_mois: int = 1):
    """
    **📊 Prédiction des besoins en doses par zone (A, B, C)**
    
    Prédiction ajustée par zone en fonction de la population
    
    **Paramètres** :
    - `zone_code` : Code zone (A, B ou C)
    - `horizon_mois` : Nombre de mois à prédire (1-3)
    """
    try:
        zone_code = zone_code.upper()
        
        if zone_code not in ["A", "B", "C"]:
            return {
                "success": False,
                "error": "zone_code doit être A, B ou C"
            }
        
        if horizon_mois < 1 or horizon_mois > 3:
            return {
                "success": False,
                "error": "horizon_mois doit être entre 1 et 3"
            }
        
        prediction = predire_besoins_prochains_mois(zone_code=zone_code, horizon_mois=horizon_mois)
        
        return {
            "success": True,
            "data": prediction
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/prediction/stock")
def get_stock_actuel(zone_code: str = None):
    """
    **📦 Estimation du stock de doses disponibles**
    
    Calcule une estimation du stock basée sur les données historiques :
    - Stock disponible en entrepôt
    - Réserve stratégique (15%)
    - Doses distribuées dans les centres (25%)
    - Doses en transit (5%)
    - Niveau d'alerte et recommandations
    - Autonomie en jours
    
    **Note** : Les valeurs sont estimées à partir des données de distribution.
    En production, cette route serait connectée à l'API de gestion de stock réelle.
    
    **Paramètres** :
    - `zone_code` : Code zone (A, B, C) ou None pour national
    """
    try:
        if zone_code:
            zone_code = zone_code.upper()
            if zone_code not in ["A", "B", "C"]:
                return {
                    "success": False,
                    "error": "zone_code doit être A, B ou C"
                }
        
        stock = get_stock_actuel_simule(zone_code=zone_code)
        
        return {
            "success": True,
            "data": stock
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/prediction/stock-vs-besoin")
def get_stock_vs_besoin():
    """
    **📊 Comparaison Stock vs Besoin par Zone**
    
    Tableau de bord comparant pour chaque zone (A, B, C) :
    - **Current Inventory** : Stock actuel disponible
    - **Forecasted Need (Next 30 Days)** : Besoin prévu sur 30 jours
    - **Surplus/Deficit** : Différence (positif = excédent, négatif = déficit)
    - Taux de couverture et autonomie en jours
    - Recommandations et alertes
    
    **Retourne** :
    - Données par zone
    - Total national
    - Alertes et recommandations
    """
    try:
        data = get_stock_vs_besoin_par_zone()
        
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 3 : COUVERTURES VACCINALES DÉTAILLÉES
# ============================================

# ------------------
# HPV (Papillomavirus)
# ------------------

@app.get("/couverture/hpv/national")
def get_couverture_hpv_national(annee_debut: str = "2022"):
    """
    **💉 Couverture vaccinale HPV au niveau national**
    
    Données HPV (filles et garçons, doses 1 et 2) depuis 2022
    
    **Paramètres** :
    - `annee_debut` : Année de début (défaut: 2022)
    
    **Retourne** :
    - Évolution annuelle HPV filles/garçons
    """
    try:
        data = get_hpv_national(annee_debut=annee_debut)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/hpv/regional")
def get_couverture_hpv_regional_tous(annee_debut: str = "2022"):
    """
    **💉 Couverture HPV toutes les régions**
    
    **Paramètres** :
    - `annee_debut` : Année de début (défaut: 2022)
    """
    try:
        data = get_hpv_regional(code_region=None, annee_debut=annee_debut)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/hpv/regional/{code_region}")
def get_couverture_hpv_regional_detail(code_region: str, annee_debut: str = "2022"):
    """
    **💉 Couverture HPV d'une région spécifique**
    
    **Paramètres** :
    - `code_region` : Code région (ex: "11" pour IDF)
    - `annee_debut` : Année de début (défaut: 2022)
    """
    try:
        data = get_hpv_regional(code_region=code_region, annee_debut=annee_debut)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/hpv/departemental")
def get_couverture_hpv_departemental_tous(annee_debut: str = "2022"):
    """
    **💉 Couverture HPV tous les départements**
    
    **Paramètres** :
    - `annee_debut` : Année de début (défaut: 2022)
    """
    try:
        data = get_hpv_departemental(code_dept=None, annee_debut=annee_debut)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/hpv/departemental/{code_dept}")
def get_couverture_hpv_departemental_detail(code_dept: str, annee_debut: str = "2022"):
    """
    **💉 Couverture HPV d'un département spécifique**
    
    **Paramètres** :
    - `code_dept` : Code département (ex: "75" pour Paris)
    - `annee_debut` : Année de début (défaut: 2022)
    """
    try:
        data = get_hpv_departemental(code_dept=code_dept, annee_debut=annee_debut)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ------------------
# GRIPPE DÉTAILLÉE
# ------------------

@app.get("/couverture/grippe/national")
def get_couverture_grippe_national_route(annee: str = None):
    """
    **🦠 Couverture vaccinale grippe détaillée au niveau national**
    
    Toutes les catégories :
    - Moins de 65 ans
    - 65 ans et plus
    - 65-74 ans
    - 75 ans et plus
    - Résidents EHPAD
    - Professionnels de santé
    
    **Paramètres** :
    - `annee` : Année spécifique ou None pour toutes les années
    """
    try:
        data = get_grippe_national(annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/grippe/regional")
def get_couverture_grippe_regional_tous(annee: str = None):
    """
    **🦠 Couverture grippe toutes les régions**
    
    **Paramètres** :
    - `annee` : Année spécifique ou None pour toutes
    """
    try:
        data = get_grippe_regional(code_region=None, annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/grippe/regional/{code_region}")
def get_couverture_grippe_regional_detail(code_region: str, annee: str = None):
    """
    **🦠 Couverture grippe d'une région spécifique**
    
    **Paramètres** :
    - `code_region` : Code région (ex: "11")
    - `annee` : Année spécifique ou None pour toutes
    """
    try:
        data = get_grippe_regional(code_region=code_region, annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/grippe/zones")
def get_couverture_grippe_par_zones(annee: str = None):
    """
    **🦠 Couverture grippe groupée par zones (A, B, C)**
    
    Regroupe les régions par zones géographiques :
    - Zone A : Grandes métropoles (Île-de-France, Auvergne-Rhône-Alpes, etc.)
    - Zone B : Agglomérations moyennes 
    - Zone C : Reste de la France
    
    **Paramètres** :
    - `annee` : Année spécifique ou None pour toutes
    
    **Retourne** :
    - Données groupées par zone
    - Statistiques moyennes par zone
    - Liste des régions dans chaque zone
    """
    try:
        data = get_grippe_par_zones(annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/grippe/departemental")
def get_couverture_grippe_departemental_tous(annee: str = None):
    """
    **🦠 Couverture grippe tous les départements**
    
    **Paramètres** :
    - `annee` : Année spécifique ou None pour toutes
    """
    try:
        data = get_grippe_departemental(code_dept=None, annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/grippe/departemental/{code_dept}")
def get_couverture_grippe_departemental_detail(code_dept: str, annee: str = None):
    """
    **🦠 Couverture grippe d'un département spécifique**
    
    **Paramètres** :
    - `code_dept` : Code département (ex: "75")
    - `annee` : Année spécifique ou None pour toutes
    """
    try:
        data = get_grippe_departemental(code_dept=code_dept, annee=annee)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ------------------
# UTILITAIRES
# ------------------

@app.get("/couverture/annees")
def get_annees_disponibles_route():
    """
    **📅 Liste des années disponibles**
    
    Retourne les années avec données HPV et Grippe
    """
    try:
        data = get_annees_disponibles()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/regions")
def get_liste_regions_route():
    """
    **🗺️ Liste de toutes les régions**
    
    Retourne la liste des régions avec codes
    """
    try:
        data = get_liste_regions()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 5 : URGENCES GRIPPE
# ============================================

@app.get("/urgences/national")
def get_urgences_nationales_route(annee: str = None):
    """
    **🚨 Urgences Nationales**
    
    Retourne les données de passages aux urgences pour la grippe au niveau national.
    
    **Paramètres** :
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données nationales d'urgences grippe
    - Statistiques calculées
    - Période des données
    """
    try:
        result = get_urgences_nationales(annee)
        
        return {
            "success": True,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/urgences/regional")
def get_urgences_regionales_route(annee: str = None):
    """
    **🚨 Urgences Régionales**
    
    Retourne les données de passages aux urgences pour la grippe par région.
    
    **Paramètres** :
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données régionales d'urgences grippe
    - Statistiques par région
    - Période des données
    """
    try:
        result = get_urgences_par_region(None, annee)
        
        return {
            "success": True,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/urgences/regional/{code_region}")
def get_urgences_region_detail_route(code_region: str, annee: str = None):
    """
    **🚨 Urgences par Région**
    
    Retourne les données de passages aux urgences pour la grippe d'une région spécifique.
    
    **Paramètres** :
    - code_region : Code région (11, 84, 93, etc.)
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données d'urgences de la région
    - Statistiques détaillées
    - Période des données
    """
    try:
        result = get_urgences_par_region(code_region, annee)
        
        if result["total_regions"] == 0:
            return {
                "success": False,
                "error": f"Aucune donnée d'urgence trouvée pour la région {code_region}"
            }
        
        return {
            "success": True,
            "region_code": code_region,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/urgences/departemental")
def get_urgences_departementales_route(annee: str = None):
    """
    **🚨 Urgences Départementales**
    
    Retourne les données de passages aux urgences pour la grippe par département.
    
    **Paramètres** :
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données départementales d'urgences grippe
    - Statistiques par département
    - Période des données
    """
    try:
        result = get_urgences_par_departement(None, annee)
        
        return {
            "success": True,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/urgences/departement/{code_departement}")
def get_urgences_departement_detail_route(code_departement: str, annee: str = None):
    """
    **🚨 Urgences par Département**
    
    Retourne les données de passages aux urgences pour la grippe d'un département spécifique.
    
    **Paramètres** :
    - code_departement : Code département (61, 75, 69, etc.)
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données d'urgences du département
    - Statistiques détaillées
    - Période des données
    """
    try:
        result = get_urgences_par_departement(code_departement, annee)
        
        if result["total_departements"] == 0:
            return {
                "success": False,
                "error": f"Aucune donnée d'urgence trouvée pour le département {code_departement}"
            }
        
        return {
            "success": True,
            "departement_code": code_departement,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/urgences/zone/{zone_code}")
def get_urgences_par_zone_route(zone_code: str, annee: str = None):
    """
    **🚨 Urgences par Zone**
    
    Retourne les données de passages aux urgences pour la grippe d'une zone spécifique (A, B, C).
    
    **Paramètres** :
    - zone_code : Code zone (A, B, C)
    - annee : Année (2020, 2021, 2022, 2023) ou None pour toutes les années
    
    **Retourne** :
    - Données d'urgences de la zone
    - Statistiques par région dans la zone
    - Période des données
    """
    try:
        if zone_code not in ["A", "B", "C"]:
            return {
                "success": False,
                "error": "Zone code doit être A, B ou C"
            }
        
        result = get_urgences_par_zone(zone_code, annee)
        
        return {
            "success": True,
            "zone": zone_code,
            "annee": annee,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 6 : IA OLLAMA
# ============================================

@app.get("/ai/status")
def get_ai_status():
    """
    **🤖 Statut de l'IA Ollama**
    
    Vérifie si Ollama est disponible et liste les modèles installés
    """
    try:
        status = get_ollama_status()
        
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/ai/analyze")
def analyze_vaccination_data(request: dict):
    """
    **🤖 Analyse IA des Données de Vaccination**
    
    Utilise Ollama (IA locale) pour analyser vos données de vaccination.
    
    **Corps de la requête** :
    ```json
    {
        "prompt": "Analyse les tendances de vaccination et donne des recommandations",
        "data_type": "zones|departements|national",
        "model": "llama3.2",
        "annee": "2024"
    }
    ```
    
    **Exemples de prompts** :
    - "Analyse les zones les moins vaccinées et propose des actions"
    - "Compare les taux de vaccination par région et identifie les disparités"
    - "Donne des recommandations pour améliorer la couverture vaccinale"
    - "Analyse l'évolution de la vaccination et prédit les tendances"
    
    **Retourne** :
    - Analyse détaillée de l'IA
    - Recommandations personnalisées
    - Modèle utilisé et timestamp
    """
    try:
        # Validation des paramètres
        prompt = request.get("prompt", "")
        data_type = request.get("data_type", "zones")
        model = request.get("model", "llama3.2")
        annee = request.get("annee", "2024")
        
        if not prompt.strip():
            return {
                "success": False,
                "error": "Le prompt est requis"
            }
        
        # Charger les données selon le type demandé
        data = {}
        
        if data_type == "zones":
            from app.vaccination import calculer_taux_par_zone
            zones = calculer_taux_par_zone(annee)
            data = {"zones": zones}
            
        elif data_type == "departements":
            from app.vaccination import calculer_taux_par_departement
            departements = calculer_taux_par_departement(annee)
            data = {"departements": departements}
            
        elif data_type == "national":
            from app.vaccination import get_statistiques_nationales
            stats = get_statistiques_nationales(annee)
            data = {"statistiques": stats}
            
        else:
            return {
                "success": False,
                "error": "data_type doit être 'zones', 'departements' ou 'national'"
            }
        
        # Analyser avec l'IA
        result = analyze_with_ai(prompt, data, model)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 7 : MÉDECINS RÉELS
# ============================================

@app.get("/medecins/comptage")
def get_comptage_medecins():
    """
    **📊 Comptage des Médecins par Région**
    
    Retourne le nombre de médecins par région + 10 exemples par région.
    **Optimisé** pour éviter de charger tous les médecins.
    
    **Retourne** :
    - Nombre total de médecins
    - Comptage par région
    - 10 exemples de médecins par région (avec GPS)
    - Top 10 des régions
    """
    try:
        comptage = get_comptage_medecins_par_region()
        
        return {
            "success": True,
            "data": comptage,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/medecins/zone/{zone_code}")
def get_medecins_par_zone_api(zone_code: str, limit: int = 100, offset: int = 0):
    """
    **🏥 Médecins par Zone (Paginé)**
    
    Retourne les médecins d'une zone spécifique avec pagination.
    
    **Paramètres** :
    - zone_code : Code zone (A, B, C)
    - limit : Nombre de médecins à retourner (max 100, défaut 100)
    - offset : Décalage pour la pagination (défaut 0)
    
    **Exemples** :
    - `/medecins/zone/A` → 100 premiers médecins Zone A
    - `/medecins/zone/A?limit=50&offset=100` → 50 médecins suivants
    
    **Retourne** :
    - Médecins de la zone avec coordonnées GPS
    - Informations de pagination
    """
    try:
        if zone_code not in ["A", "B", "C"]:
            return {
                "success": False,
                "error": "Zone code doit être A, B ou C"
            }
        
        if limit > 100:
            limit = 100  # Limite maximale
        
        result = get_medecins_reels_par_zone(zone_code, limit, offset)
        
        return {
            "success": True,
            "zone": zone_code,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/medecins/region/{region_code}")
def get_medecins_par_region_api(region_code: str, limit: int = 100, offset: int = 0):
    """
    **🏥 Médecins par Région (Paginé)**
    
    Retourne les médecins d'une région spécifique avec pagination.
    
    **Paramètres** :
    - region_code : Code région (11, 84, 93, etc.)
    - limit : Nombre de médecins à retourner (max 100, défaut 100)
    - offset : Décalage pour la pagination (défaut 0)
    
    **Exemples** :
    - `/medecins/region/11` → 100 premiers médecins Île-de-France
    - `/medecins/region/11?limit=50&offset=100` → 50 médecins suivants
    
    **Retourne** :
    - Médecins de la région avec coordonnées GPS
    - Informations de pagination
    """
    try:
        if limit > 100:
            limit = 100  # Limite maximale
        
        result = get_medecins_reels_par_region(region_code, limit, offset)
        
        if result["pagination"]["total"] == 0:
            return {
                "success": False,
                "error": f"Aucun médecin trouvé pour la région {region_code}"
            }
        
        return {
            "success": True,
            "region_code": region_code,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/medecins/recherche")
def rechercher_medecins_api(
    zone_code: str = None,
    region_code: str = None,
    departement: str = None,
    specialite: str = None,
    avec_gps: bool = None
):
    """
    **🔍 Recherche Avancée de Médecins**
    
    Recherche de médecins avec filtres multiples.
    
    **Paramètres de recherche** :
    - zone_code : Code zone (A, B, C)
    - region_code : Code région (11, 84, 93, etc.)
    - departement : Nom du département
    - specialite : Spécialité médicale
    - avec_gps : Avoir des coordonnées GPS (true/false)
    
    **Exemples** :
    - `/medecins/recherche?avec_gps=true&zone_code=A`
    - `/medecins/recherche?region_code=11&specialite=généraliste`
    - `/medecins/recherche?departement=Calvados`
    
    **Retourne** :
    - Médecins correspondant aux critères
    - Coordonnées GPS pour carte
    - Détails pratiques
    """
    try:
        medecins = rechercher_medecins_reels(
            zone_code=zone_code,
            region_code=region_code,
            departement=departement,
            specialite=specialite,
            avec_gps=avec_gps
        )
        
        return {
            "success": True,
            "filtres_appliques": {
                "zone_code": zone_code,
                "region_code": region_code,
                "departement": departement,
                "specialite": specialite,
                "avec_gps": avec_gps
            },
            "total_trouves": len(medecins),
            "medecins": medecins,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/medecins/statistiques")
def get_statistiques_medecins_api():
    """
    **📊 Statistiques des Médecins**
    
    Retourne les statistiques globales des médecins par zone et région.
    
    **Retourne** :
    - Nombre total de médecins
    - Capacité totale de vaccination
    - Répartition par zone
    - Statistiques par région
    """
    try:
        stats = get_statistiques_medecins_reels()
        
        return {
            "success": True,
            "statistiques": stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# PARTIE 8 : COÛTS RÉELS VACCINATION
# ============================================

@app.get("/couts/national")
def get_couts_nationaux():
    """
    **💰 Coûts Réels de la Vaccination Grippe - France**
    
    Calcule l'impact financier complet de la vaccination grippe :
    
    **Coûts Directs** :
    - Vaccins (6.20€) + Honoraire pharmacien (0.60€)
    - Consultations médicales (25€)
    - Remboursements Sécurité Sociale (65% vaccins, 70% consultations)
    
    **Coûts Indirects Évités** :
    - Consultations pour grippe (25€)
    - Médicaments (15€)
    - Arrêts maladie (5 jours × 50€ = 250€)
    - Hospitalisations (3 jours × 800€ = 2,400€)
    - Complications (500€)
    
    **Retourne** :
    - Coûts totaux vaccination
    - Économies générées
    - ROI (Return on Investment)
    - Répartition par acteur (Sécu, Mutuelles, Patients)
    - Impact économique (jours d'arrêt évités, hospitalisations évitées)
    """
    try:
        couts = get_couts_vaccination_grippe()
        
        return {
            "success": True,
            "data": couts,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couts/zone/{zone_code}")
def get_couts_par_zone_api(zone_code: str):
    """
    **💰 Coûts de la Vaccination par Zone**
    
    Calcule les coûts spécifiques à une zone géographique.
    
    **Paramètres** :
    - zone_code : Code zone (A, B, C)
    
    **Retourne** :
    - Population de la zone
    - Taux de vaccination zone
    - Coûts vaccination zone
    - Économies générées zone
    - ROI zone
    """
    try:
        if zone_code not in ["A", "B", "C"]:
            return {
                "success": False,
                "error": "Zone code doit être A, B ou C"
            }
        
        couts_zone = get_couts_par_zone(zone_code)
        
        return {
            "success": True,
            "zone": zone_code,
            "data": couts_zone,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couts/departement/{code_departement}")
def get_couts_par_departement_api(code_departement: str):
    """
    **💰 Coûts de la Vaccination par Département**
    
    Calcule les coûts spécifiques à un département.
    
    **Paramètres** :
    - code_departement : Code département (75, 13, 69, etc.)
    
    **Exemples** :
    - `/couts/departement/75` → Coûts Paris
    - `/couts/departement/13` → Coûts Bouches-du-Rhône
    - `/couts/departement/69` → Coûts Rhône
    
    **Retourne** :
    - Population département
    - Taux de vaccination département
    - Coûts vaccination département
    - Économies générées département
    - ROI département
    """
    try:
        couts_dept = get_couts_par_departement(code_departement)
        
        return {
            "success": True,
            "departement": code_departement,
            "data": couts_dept,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couts/scenarios")
def get_scenarios_vaccination_api():
    """
    **📊 Scénarios de Vaccination - Comparaison des Coûts**
    
    Compare différents taux de vaccination et leur impact financier.
    
    **Scénarios analysés** :
    - 20% : Taux actuel faible
    - 35% : Taux actuel moyen
    - 50% : Objectif intermédiaire
    - 70% : Objectif optimal
    - 85% : Objectif ambitieux
    
    **Retourne** :
    - Coûts par scénario
    - Économies par scénario
    - ROI par scénario
    - Recommandation du taux optimal
    - Justification économique
    """
    try:
        scenarios = get_scenarios_vaccination()
        
        return {
            "success": True,
            "data": scenarios,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/couverture/departements")
def get_liste_departements_route():
    """
    **🏘️ Liste de tous les départements**
    
    Retourne la liste des départements avec codes et régions
    """
    try:
        data = get_liste_departements()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }