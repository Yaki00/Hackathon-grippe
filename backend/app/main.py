"""
API Stratégie Vaccinale Grippe - Backend avec analyse de données réelles
"""
from fastapi import FastAPI, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging

from app.core.data_loader import data_loader
from app.core.urgences_api import urgences_api
from app.core.couverture_api import couverture_api

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer l'application FastAPI
app = FastAPI(
    title="API Stratégie Vaccinale Grippe",
    version="1.0.0",
    description="""
    Backend pour la stratégie vaccinale antigrippale.
    
    ## Fonctionnalités
    
    1. **Zones sous-vaccinées** : Identifier les régions nécessitant une attention prioritaire
    2. **Prédiction besoins** : Estimer les besoins futurs en vaccins
    3. **Optimisation distribution** : Proposer une allocation optimale par région
    4. **Anticipation urgences** : Prédire les risques de passages aux urgences
    """
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# ENDPOINTS DE BASE
# ============================================

@app.get("/")
async def root():
    """Page d'accueil de l'API."""
    return {
        "message": "API Stratégie Vaccinale Grippe",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "zones_sous_vaccinees": "/api/zones-sous-vaccinees",
            "prediction_besoins": "/api/prediction-besoins",
            "optimisation_distribution": "/api/optimisation-distribution",
            "anticipation_urgences": "/api/anticipation-urgences"
        }
    }


@app.get("/health")
async def health():
    """Vérification de l'état de l'API."""
    return {"status": "healthy", "message": "API opérationnelle"}


# ============================================
# OBJECTIF 1: IDENTIFIER LES ZONES SOUS-VACCINÉES
# ============================================

@app.get("/api/zones-sous-vaccinees")
async def get_zones_sous_vaccinees(
    year: str = Query("2024", description="Année de données"),
    seuil: float = Query(50.0, description="Seuil de couverture en %", ge=0, le=100)
):
    """
    Identifie les zones sous-vaccinées nécessitant une action prioritaire.
    
    - **year**: Année de données (2021-2024)
    - **seuil**: Seuil de couverture minimum en pourcentage
    
    Retourne les régions dont le taux de couverture est inférieur au seuil.
    """
    try:
        zones = data_loader.get_zones_sous_vaccinees(year=year, seuil=seuil)
        
        return {
            "success": True,
            "annee": year,
            "seuil_couverture": seuil,
            "nombre_zones_identifiees": len(zones),
            "zones_sous_vaccinees": zones,
            "message": f"{len(zones)} zone(s) identifiée(s) avec couverture < {seuil}%"
        }
    except Exception as e:
        logger.error(f"Erreur zones sous-vaccinées: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'identification des zones"
        }


# ============================================
# OBJECTIF 2: PRÉDIRE LES BESOINS EN VACCINS
# ============================================

@app.get("/api/prediction-besoins")
async def predict_besoins_vaccins(
    year: str = Query("2024", description="Année de référence"),
    horizon: int = Query(4, description="Horizon de prédiction en semaines", ge=1, le=52)
):
    """
    Prédit les besoins en vaccins pour les semaines à venir.
    
    - **year**: Année de référence
    - **horizon**: Nombre de semaines à prédire
    
    Calcule les besoins par région pour atteindre l'objectif de couverture.
    """
    try:
        prediction = data_loader.predire_besoins_vaccins(year=year, horizon_semaines=horizon)
        
        return {
            "success": True,
            "annee": year,
            "horizon_semaines": horizon,
            "total_besoins_national": prediction.get('total_besoins_national', 0),
            "besoins_par_region": prediction.get('besoins_par_region', []),
            "message": f"Prédiction générée pour {horizon} semaines"
        }
    except Exception as e:
        logger.error(f"Erreur prédiction besoins: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la prédiction"
        }


# ============================================
# OBJECTIF 3: OPTIMISER LA DISTRIBUTION PAR ZONES
# ============================================

@app.get("/api/optimisation-distribution")
async def optimiser_distribution(
    year: str = Query("2024", description="Année de données")
):
    """
    Propose une optimisation de la distribution des vaccins par région.
    
    - **year**: Année de référence
    
    Analyse la couverture actuelle et recommande des allocations optimales.
    """
    try:
        distribution = data_loader.optimiser_distribution(year=year)
        
        # Statistiques
        regions_urgentes = [d for d in distribution if "URGENT" in d['recommandation']]
        regions_prioritaires = [d for d in distribution if "PRIORITAIRE" in d['recommandation']]
        
        return {
            "success": True,
            "annee": year,
            "nombre_regions": len(distribution),
            "statistiques": {
                "regions_urgentes": len(regions_urgentes),
                "regions_prioritaires": len(regions_prioritaires),
                "regions_normales": len(distribution) - len(regions_urgentes) - len(regions_prioritaires)
            },
            "distribution_optimisee": distribution,
            "message": "Plan de distribution optimisé généré"
        }
    except Exception as e:
        logger.error(f"Erreur optimisation distribution: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'optimisation"
        }


# ============================================
# OBJECTIF 4: ANTICIPER LES PASSAGES AUX URGENCES
# ============================================

@app.get("/api/anticipation-urgences")
async def anticiper_passages_urgences(
    year: str = Query("2024", description="Année de données")
):
    """
    Anticipe les passages aux urgences liés à la grippe.
    
    - **year**: Année de référence
    
    Estime le risque d'afflux aux urgences par région selon la couverture vaccinale.
    """
    try:
        anticipation = data_loader.anticiper_urgences(year=year)
        
        regions_a_risque = anticipation.get('regions_a_risque', [])
        
        return {
            "success": True,
            "annee": year,
            "nombre_regions_a_risque": len(regions_a_risque),
            "risques_par_region": anticipation.get('risques_par_region', []),
            "regions_critiques": regions_a_risque,
            "message": f"{len(regions_a_risque)} région(s) à risque élevé identifiée(s)"
        }
    except Exception as e:
        logger.error(f"Erreur anticipation urgences: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'anticipation"
        }


# ============================================
# ENDPOINT DASHBOARD GLOBAL
# ============================================

@app.get("/api/dashboard")
async def get_dashboard(
    year: str = Query("2024", description="Année de données")
):
    """
    Retourne un dashboard complet avec tous les indicateurs.
    
    Combine les 4 objectifs en un seul endpoint pour le frontend.
    """
    try:
        zones_sous_vacc = data_loader.get_zones_sous_vaccinees(year=year, seuil=50.0)
        prediction = data_loader.predire_besoins_vaccins(year=year, horizon_semaines=4)
        distribution = data_loader.optimiser_distribution(year=year)
        urgences = data_loader.anticiper_urgences(year=year)
        
        return {
            "success": True,
            "annee": year,
            "dashboard": {
                "zones_sous_vaccinees": {
                    "count": len(zones_sous_vacc),
                    "data": zones_sous_vacc[:5]  # Top 5
                },
                "prediction_besoins": {
                    "total_national": prediction.get('total_besoins_national', 0),
                    "top_besoins": prediction.get('besoins_par_region', [])[:5]
                },
                "distribution": {
                    "regions_urgentes": len([d for d in distribution if "URGENT" in d['recommandation']]),
                    "top_priorites": distribution[:5]
                },
                "anticipation_urgences": {
                    "regions_a_risque": len(urgences.get('regions_a_risque', [])),
                    "top_risques": urgences.get('risques_par_region', [])[:5]
                }
            },
            "message": "Dashboard complet généré"
        }
    except Exception as e:
        logger.error(f"Erreur dashboard: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la génération du dashboard"
        }


# ============================================
# NOUVEAUX ENDPOINTS - DONNÉES TEMPS RÉEL URGENCES & SOS MÉDECINS
# ============================================

@app.get("/api/urgences/tendances/{region}")
async def get_tendances_urgences_region(
    region: str = Path(..., description="Code région (ex: '11', '32')"),
    semaines: int = Query(8, description="Nombre de semaines à analyser", ge=1, le=52)
):
    """
    Analyse les tendances des passages aux urgences pour la grippe (données temps réel).
    
    Source: Santé Publique France - SurSaUD
    
    - **region**: Code région
    - **semaines**: Nombre de semaines historiques à analyser
    
    Retourne les tendances, statistiques et niveau d'alerte.
    """
    try:
        analyse = await urgences_api.analyser_tendances_region(region=region, semaines=semaines)
        
        return {
            "success": True,
            "source": "Santé Publique France (SurSaUD)",
            "data": analyse
        }
    except Exception as e:
        logger.error(f"Erreur tendances urgences: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'analyse des tendances"
        }


@app.get("/api/urgences/comparaison-regions")
async def get_comparaison_regions():
    """
    Compare les taux de passages aux urgences entre toutes les régions.
    
    Source: Santé Publique France - SurSaUD
    
    Retourne un classement des régions par niveau de risque.
    """
    try:
        comparaison = await urgences_api.comparer_regions()
        
        # Statistiques
        regions_elevees = [r for r in comparaison if r['niveau'] == 'ÉLEVÉ']
        regions_moderees = [r for r in comparaison if r['niveau'] == 'MODÉRÉ']
        
        return {
            "success": True,
            "source": "Santé Publique France (SurSaUD)",
            "nombre_regions": len(comparaison),
            "statistiques": {
                "regions_niveau_eleve": len(regions_elevees),
                "regions_niveau_modere": len(regions_moderees),
                "regions_niveau_faible": len(comparaison) - len(regions_elevees) - len(regions_moderees)
            },
            "comparaison": comparaison
        }
    except Exception as e:
        logger.error(f"Erreur comparaison régions: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la comparaison"
        }


@app.get("/api/urgences/indicateurs-nationaux")
async def get_indicateurs_nationaux():
    """
    Retourne les indicateurs nationaux agrégés sur les passages aux urgences.
    
    Source: Santé Publique France - SurSaUD
    
    Indicateurs sur les 4 dernières semaines au niveau national.
    """
    try:
        indicateurs = await urgences_api.indicateurs_nationaux()
        
        return {
            "success": True,
            "source": "Santé Publique France (SurSaUD)",
            "data": indicateurs
        }
    except Exception as e:
        logger.error(f"Erreur indicateurs nationaux: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la récupération des indicateurs"
        }


@app.get("/api/urgences/raw/region/{region}")
async def get_raw_data_region(
    region: str = Path(..., description="Code région"),
    limit: int = Query(20, description="Nombre de résultats", ge=1, le=100)
):
    """
    Retourne les données brutes de l'API pour une région (debug/exploration).
    
    Utile pour voir les données originales de l'API Santé Publique France.
    """
    try:
        data = await urgences_api.get_donnees_region(limit=limit, region=region)
        
        return {
            "success": True,
            "source": "Santé Publique France (SurSaUD)",
            "total_count": data.get('total_count', 0),
            "results": data.get('results', [])
        }
    except Exception as e:
        logger.error(f"Erreur données brutes: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# ============================================
# ENDPOINTS COUVERTURE VACCINALE TEMPS RÉEL
# ============================================

@app.get("/api/couverture/national")
async def get_couverture_nationale():
    """
    Retourne les indicateurs nationaux de couverture vaccinale grippe.
    
    Source: Santé Publique France
    
    Données depuis 2011 avec évolution et comparaison aux objectifs OMS.
    """
    try:
        indicateurs = await couverture_api.indicateurs_nationaux_couverture()
        
        return {
            "success": True,
            "source": "Santé Publique France",
            "data": indicateurs
        }
    except Exception as e:
        logger.error(f"Erreur couverture nationale: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la récupération des indicateurs"
        }


@app.get("/api/couverture/region/{region}")
async def get_couverture_region(
    region: str = Path(..., description="Code région (ex: '11', '32')")
):
    """
    Analyse l'évolution de la couverture vaccinale grippe pour une région.
    
    Source: Santé Publique France
    
    - **region**: Code région
    
    Retourne l'historique depuis 2011, tendances et comparaison aux objectifs.
    """
    try:
        analyse = await couverture_api.analyser_couverture_grippe_region(region=region)
        
        return {
            "success": True,
            "source": "Santé Publique France",
            "data": analyse
        }
    except Exception as e:
        logger.error(f"Erreur couverture région: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'analyse de la couverture régionale"
        }


@app.get("/api/couverture/comparaison-regions")
async def get_comparaison_couverture_regions():
    """
    Compare la couverture vaccinale grippe entre toutes les régions.
    
    Source: Santé Publique France
    
    Retourne un classement des régions avec leurs taux de couverture actuels.
    """
    try:
        comparaison = await couverture_api.comparer_couverture_regions()
        
        # Statistiques
        regions_objectif = [r for r in comparaison if r.get('atteint_objectif', False)]
        regions_bon = [r for r in comparaison if r.get('evaluation') == 'BON']
        regions_faible = [r for r in comparaison if r.get('evaluation') == 'FAIBLE']
        
        return {
            "success": True,
            "source": "Santé Publique France",
            "nombre_regions": len(comparaison),
            "statistiques": {
                "regions_atteignant_objectif_75": len(regions_objectif),
                "regions_bon_niveau": len(regions_bon),
                "regions_niveau_faible": len(regions_faible)
            },
            "comparaison": comparaison
        }
    except Exception as e:
        logger.error(f"Erreur comparaison couverture: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la comparaison"
        }


# ============================================
# ENDPOINT DASHBOARD GLOBAL ÉTENDU
# ============================================

@app.get("/api/dashboard/complet")
async def get_dashboard_complet(
    year: str = Query("2024", description="Année de données historiques")
):
    """
    Dashboard complet combinant TOUTES les sources de données.
    
    Combine:
    - Données historiques (fichiers CSV/JSON locaux)
    - Passages aux urgences temps réel (API Santé Publique France)
    - Couverture vaccinale temps réel (API Santé Publique France)
    
    Vue d'ensemble complète pour le frontend.
    """
    try:
        # Données historiques
        zones_sous_vacc = data_loader.get_zones_sous_vaccinees(year=year, seuil=50.0)
        prediction = data_loader.predire_besoins_vaccins(year=year, horizon_semaines=4)
        
        # Données temps réel urgences
        indicateurs_urgences = await urgences_api.indicateurs_nationaux()
        
        # Données temps réel couverture
        indicateurs_couverture = await couverture_api.indicateurs_nationaux_couverture()
        
        return {
            "success": True,
            "timestamp": "now",
            "sources": {
                "historique": "Fichiers locaux 2021-2024",
                "urgences_temps_reel": "Santé Publique France - SurSaUD",
                "couverture_temps_reel": "Santé Publique France"
            },
            "dashboard": {
                "zones_sous_vaccinees": {
                    "count": len(zones_sous_vacc),
                    "top_5": zones_sous_vacc[:5]
                },
                "prediction_besoins": {
                    "total_national": prediction.get('total_besoins_national', 0),
                    "top_5_besoins": prediction.get('besoins_par_region', [])[:5]
                },
                "urgences_temps_reel": {
                    "tendance": indicateurs_urgences.get('indicateurs', {}).get('tendance', 'N/A'),
                    "taux_moyen_passages": indicateurs_urgences.get('indicateurs', {}).get('taux_moyen_passages_urgences', 0),
                    "derniere_mise_a_jour": indicateurs_urgences.get('derniere_mise_a_jour')
                },
                "couverture_temps_reel": {
                    "couverture_65plus": indicateurs_couverture.get('indicateurs', {}).get('couverture_65plus', 0),
                    "atteint_objectif": indicateurs_couverture.get('indicateurs', {}).get('atteint_objectif', False),
                    "tendance": indicateurs_couverture.get('evolution', {}).get('tendance', 'N/A'),
                    "derniere_annee": indicateurs_couverture.get('derniere_annee')
                }
            },
            "message": "Dashboard complet généré avec données historiques + temps réel"
        }
    except Exception as e:
        logger.error(f"Erreur dashboard complet: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de la génération du dashboard"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
