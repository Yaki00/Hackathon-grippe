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
# TODO: Ajouter analyse intelligente plus tard
# from app.analyse_intelligente import ...

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
        "message": "API Grippe - Module Vaccination + Analyse Intelligente",
        "version": "2.0.0",
        "endpoints": {
            "vaccination_zones": "/vaccination/zones",
            "vaccination_zone": "/vaccination/zone/{zone_code}",
            "vaccination_national": "/vaccination/national",
            "analyse_zones_sous_vaccinees": "/analyse/zones-sous-vaccinees",
            "prediction_besoins_vaccins": "/analyse/prediction-besoins",
            "optimisation_distribution": "/analyse/optimisation-distribution",
            "prediction_urgences": "/analyse/prediction-urgences"
        },
        "ia_locale": "Ollama (llama3.2)"
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


# =============================================================================
# PARTIE 2 : ANALYSES INTELLIGENTES avec IA
# =============================================================================

@app.get("/analyse/zones-sous-vaccinees")
def analyse_zones_sous_vaccinees_route(annee: str = "2024", seuil_critique: float = 50.0):
    """
    **🎯 OBJECTIF 1 : Identifier les zones sous-vaccinées**
    
    Analyse avec IA locale (Ollama) :
    - Écart par rapport à l'objectif national (75%)
    - Évolution historique 2011-2024
    - Régions prioritaires
    - Recommandations IA personnalisées
    
    **Paramètres** :
    - `annee` : Année d'analyse (défaut: 2024)
    - `seuil_critique` : Seuil critique en % (défaut: 50%)
    
    **Source données** : Santé Publique France (taux officiels)
    """
    try:
        resultat = identifier_zones_sous_vaccinees(annee, seuil_critique)
        return {
            "success": True,
            "objectif": "Identifier les zones sous-vaccinées",
            "data": resultat
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/analyse/prediction-besoins")
def prediction_besoins_vaccins_route(annee_cible: str = "2025"):
    """
    **🎯 OBJECTIF 2 : Prédire les besoins en vaccins**
    
    Analyse prédictive avec régression linéaire + IA :
    - Régression linéaire 2019-2024
    - Prédiction taux de couverture 2025
    - Calcul besoins en doses par région
    - Recommandations stratégiques IA
    
    **Paramètres** :
    - `annee_cible` : Année de prédiction (défaut: 2025)
    
    **Source données** : Historique Santé Publique France + Populations INSEE
    """
    try:
        resultat = predire_besoins_vaccins(annee_cible)
        return {
            "success": True,
            "objectif": "Prédire les besoins en vaccins",
            "data": resultat
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/analyse/optimisation-distribution")
def optimisation_distribution_route(annee: str = "2024"):
    """
    **🎯 OBJECTIF 3 : Optimiser la distribution par zones**
    
    Analyse d'efficacité avec IA :
    - Taux d'utilisation doses/actes par région
    - Identification du gaspillage
    - Zones à optimiser
    - Recommandations concrètes IA
    
    **Paramètres** :
    - `annee` : Année d'analyse (défaut: 2024)
    
    **Source données** : IQVIA (doses distribuées + actes réalisés)
    """
    try:
        resultat = optimiser_distribution_zones(annee)
        return {
            "success": True,
            "objectif": "Optimiser la distribution par zones",
            "data": resultat
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/analyse/prediction-urgences")
def prediction_urgences_route(periode: str = "hiver_2024"):
    """
    **🎯 OBJECTIF 4 : Anticiper les passages aux urgences**
    
    Analyse de corrélation + prédiction avec IA :
    - Corrélation vaccination ↔ passages urgences
    - Impact simulation (+10 points de couverture)
    - Prédiction par région
    - Stratégies de réduction avec IA
    
    **Paramètres** :
    - `periode` : Période d'analyse (défaut: hiver_2024)
    
    **Source données** : Passages urgences OSCOUR + Couverture vaccinale
    """
    try:
        resultat = anticiper_passages_urgences(periode)
        return {
            "success": True,
            "objectif": "Anticiper les passages aux urgences",
            "data": resultat
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }