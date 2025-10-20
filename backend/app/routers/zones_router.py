"""
Router pour regrouper les données par ZONES A, B1, B2.
Étape par étape, on ajoute les routes.
"""
from fastapi import APIRouter
from typing import Dict
import logging

from app.core.data_loader import data_loader

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/zones",
    tags=["zones"],
)

# Mapping régions -> zones immobilières
REGION_TO_ZONE = {
    # Zone A : IDF + grandes métropoles
    "11": "A",   # Île-de-France (Paris)
    "84": "A",   # Auvergne-Rhône-Alpes (Lyon)
    "93": "A",   # PACA (Marseille, Nice)
    "76": "A",   # Occitanie (Toulouse, Montpellier)
    "75": "A",   # Nouvelle-Aquitaine (Bordeaux)
    
    # Zone B1 : Grandes agglomérations
    "32": "B1",  # Hauts-de-France (Lille)
    "44": "B1",  # Grand Est (Strasbourg)
    "53": "B1",  # Bretagne (Rennes)
    "52": "B1",  # Pays de la Loire (Nantes)
    
    # Zone B2 : Reste
    "28": "B2",  # Normandie
    "27": "B2",  # Bourgogne-Franche-Comté
    "24": "B2",  # Centre-Val de Loire
    "94": "B2",  # Corse
}


@router.get("/stock")
def get_zones_stock(year: str = "2024") -> Dict:
    """
    **ÉTAPE 1: Stock et besoins par zone A, B1, B2**
    
    Retourne pour chaque zone:
    - Nom de la zone
    - Stock actuel (doses)
    - Besoin prévu
    - Surplus ou déficit
    """
    try:
        # Récupérer prédictions
        prediction = data_loader.predire_besoins_vaccins(year=year, horizon_semaines=4)
        
        # Initialiser les zones
        zones_data = {
            "A": {"stock": 0, "besoin": 0, "regions": []},
            "B1": {"stock": 0, "besoin": 0, "regions": []},
            "B2": {"stock": 0, "besoin": 0, "regions": []}
        }
        
        # Agréger par zone
        for region_pred in prediction.get('besoins_par_region', []):
            region_code = region_pred.get('code_region', 'N/A')
            zone = REGION_TO_ZONE.get(region_code, "B2")  # Par défaut B2
            
            # Stock simulé
            taux = region_pred.get('taux_actuel', 50) / 100
            stock = int(1000000 * taux)
            besoin = region_pred.get('besoin_total', 0)
            
            zones_data[zone]["stock"] += stock
            zones_data[zone]["besoin"] += besoin
            zones_data[zone]["regions"].append(region_pred.get('nom_region', 'Inconnue'))
        
        # Construire résultat
        result = []
        for zone_name in ["A", "B1", "B2"]:
            data = zones_data[zone_name]
            surplus_deficit = data["stock"] - data["besoin"]
            
            result.append({
                "zone": f"Zone {zone_name}",
                "zone_code": zone_name,
                "current_inventory": data["stock"],
                "forecasted_need": data["besoin"],
                "surplus_deficit": surplus_deficit,
                "status": "surplus" if surplus_deficit > 0 else "deficit",
                "nb_regions": len(data["regions"]),
                "regions": data["regions"]
            })
        
        return {
            "success": True,
            "year": year,
            "zones": result
        }
        
    except Exception as e:
        logger.error(f"Erreur get_zones_stock: {e}", exc_info=True)
        return {"success": False, "error": str(e), "zones": []}


@router.get("/taux")
def get_zones_taux(year: str = "2024") -> Dict:
    """
    **ÉTAPE 2: Taux de vaccination par zone A, B1, B2**
    
    Retourne pour chaque zone:
    - Taux moyen de vaccination
    - Évaluation (BON, MOYEN, FAIBLE)
    """
    try:
        prediction = data_loader.predire_besoins_vaccins(year=year, horizon_semaines=4)
        
        zones_taux = {
            "A": [],
            "B1": [],
            "B2": []
        }
        
        # Récupérer les taux par région
        for region_pred in prediction.get('besoins_par_region', []):
            region_code = region_pred.get('code_region', 'N/A')
            zone = REGION_TO_ZONE.get(region_code, "B2")
            taux = region_pred.get('taux_actuel', 0)
            
            zones_taux[zone].append(taux)
        
        # Calculer moyennes
        result = []
        for zone_name in ["A", "B1", "B2"]:
            taux_list = zones_taux[zone_name]
            
            if taux_list:
                avg_taux = sum(taux_list) / len(taux_list)
                
                result.append({
                    "zone": f"Zone {zone_name}",
                    "zone_code": zone_name,
                    "vaccination_rate": round(avg_taux, 1),
                    "objective": 70.0,
                    "objective_met": avg_taux >= 70.0,
                    "evaluation": "BON" if avg_taux >= 65 else "MOYEN" if avg_taux >= 50 else "FAIBLE",
                    "nb_regions": len(taux_list)
                })
        
        avg_national = sum(z["vaccination_rate"] for z in result) / len(result) if result else 0
        
        return {
            "success": True,
            "year": year,
            "average_national": round(avg_national, 1),
            "zones": result
        }
        
    except Exception as e:
        logger.error(f"Erreur get_zones_taux: {e}", exc_info=True)
        return {"success": False, "error": str(e), "zones": []}


@router.get("/resume")
def get_zones_resume(year: str = "2024") -> Dict:
    """
    **ÉTAPE 3: Résumé complet des 3 zones**
    
    Combine stock + taux + priorités.
    """
    try:
        stock_data = get_zones_stock(year=year)
        taux_data = get_zones_taux(year=year)
        
        if not stock_data.get("success") or not taux_data.get("success"):
            return {"success": False, "error": "Erreur lors de la récupération des données"}
        
        zones_stock = {z["zone_code"]: z for z in stock_data.get("zones", [])}
        zones_taux = {z["zone_code"]: z for z in taux_data.get("zones", [])}
        
        # Construire résumé
        resume = []
        for zone_code in ["A", "B1", "B2"]:
            stock = zones_stock.get(zone_code, {})
            taux = zones_taux.get(zone_code, {})
            
            resume.append({
                "zone": f"Zone {zone_code}",
                "zone_code": zone_code,
                "stock": stock.get("current_inventory", 0),
                "besoin": stock.get("forecasted_need", 0),
                "deficit": stock.get("surplus_deficit", 0),
                "taux_vaccination": taux.get("vaccination_rate", 0),
                "evaluation": taux.get("evaluation", "N/A"),
                "nb_regions": stock.get("nb_regions", 0)
            })
        
        return {
            "success": True,
            "year": year,
            "zones": resume,
            "summary": {
                "zones_en_deficit": len([z for z in resume if z["deficit"] < 0]),
                "taux_moyen_national": taux_data.get("average_national", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Erreur get_zones_resume: {e}", exc_info=True)
        return {"success": False, "error": str(e)}

