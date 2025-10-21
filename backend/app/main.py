"""
API Backend Grippe - Partie VACCINATION
Étape par étape, on ajoute les fonctionnalités
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.vaccination import (
    calculer_taux_par_zone,
    get_details_zone,
    get_statistiques_nationales
)
from app.prediction import (
    predire_besoins_prochains_mois,
    get_stock_actuel_simule
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
    # Utilitaires
    get_annees_disponibles,
    get_liste_regions,
    get_liste_departements
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
                "national": "/vaccination/national"
            },
            "prediction": {
                "doses_nationales": "/prediction/doses",
                "doses_par_zone": "/prediction/doses/zone/{zone_code}",
                "stock_actuel": "/prediction/stock"
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
    **📦 Stock actuel de doses disponibles**
    
    Retourne le stock actuel simulé (pour démo)
    
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