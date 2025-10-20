"""
Module VACCINATION
Gère les données de vaccination par zone
Utilise fichiers locaux + APIs pour les vraies données
"""
from app.config import REGIONS_ZONES, POURCENTAGE_CIBLE
from app.data_loader import get_donnees_vaccination_region


def calculer_taux_par_zone(annee: str = "2024"):
    """
    Calcule le taux de vaccination par zone A, B, C.
    Utilise les VRAIES DONNÉES (fichiers + APIs)
    
    Returns:
        dict: Données par zone avec taux de vaccination
    """
    # Initialiser les 3 zones : A, B, C
    zones = {
        "A": {"regions": [], "population": 0, "vaccines": 0, "sources": []},
        "B": {"regions": [], "population": 0, "vaccines": 0, "sources": []},
        "C": {"regions": [], "population": 0, "vaccines": 0, "sources": []}
    }
    
    # Agréger par zone avec VRAIES DONNÉES
    for code_region, info in REGIONS_ZONES.items():
        zone = info["zone"]
        population = info["population"]
        population_cible = int(population * POURCENTAGE_CIBLE)
        
        # ✅ VRAIES DONNÉES : fichiers locaux + APIs
        donnees = get_donnees_vaccination_region(code_region, annee)
        taux_reel = donnees["taux_vaccination"]
        
        # Calculer nombre de vaccinés
        vaccines = int(population_cible * (taux_reel / 100))
        
        zones[zone]["regions"].append(info["nom"])
        zones[zone]["population"] += population
        zones[zone]["vaccines"] += vaccines
        zones[zone]["sources"].append(donnees["source"])
    
    # Calculer les taux par zone
    resultats = []
    for zone_code in ["A", "B", "C"]:
        data = zones[zone_code]
        population_cible = int(data["population"] * POURCENTAGE_CIBLE)
        taux = (data["vaccines"] / population_cible * 100) if population_cible > 0 else 0
        
        # Déterminer sources de données
        sources_count = {}
        for s in data["sources"]:
            sources_count[s] = sources_count.get(s, 0) + 1
        
        resultats.append({
            "zone": f"Zone {zone_code}",
            "zone_code": zone_code,
            "population_totale": data["population"],
            "population_cible": population_cible,
            "nombre_vaccines": data["vaccines"],
            "taux_vaccination": round(taux, 1),
            "objectif": 70.0,
            "atteint": taux >= 70.0,
            "nb_regions": len(data["regions"]),
            "regions": data["regions"],
            "sources_donnees": sources_count  # Indique d'où viennent les données
        })
    
    return resultats


def get_details_zone(zone_code: str, annee: str = "2024"):
    """Détails d'une zone spécifique."""
    toutes_zones = calculer_taux_par_zone(annee)
    
    for zone in toutes_zones:
        if zone["zone_code"] == zone_code:
            return zone
    
    return None


def get_statistiques_nationales(annee: str = "2024"):
    """Statistiques nationales de vaccination."""
    zones = calculer_taux_par_zone(annee)
    
    total_pop = sum(z["population_totale"] for z in zones)
    total_cible = sum(z["population_cible"] for z in zones)
    total_vaccines = sum(z["nombre_vaccines"] for z in zones)
    taux_national = (total_vaccines / total_cible * 100) if total_cible > 0 else 0
    
    return {
        "population_france": total_pop,
        "population_cible": total_cible,
        "nombre_vaccines": total_vaccines,
        "taux_national": round(taux_national, 1),
        "objectif": 70.0,
        "zones_a_risque": [z["zone"] for z in zones if z["taux_vaccination"] < 60.0]
    }

