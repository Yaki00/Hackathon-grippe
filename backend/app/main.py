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
        "message": "API Grippe - Module Vaccination",
        "version": "1.0.0",
        "endpoints": {
            "vaccination_zones": "/vaccination/zones",
            "vaccination_zone": "/vaccination/zone/{zone_code}",
            "vaccination_national": "/vaccination/national"
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
