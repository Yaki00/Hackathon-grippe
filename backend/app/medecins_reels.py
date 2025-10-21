"""
Module MÉDECINS RÉELS
Parse le fichier CSV des vrais médecins avec leurs coordonnées GPS
"""
import pandas as pd
import json
import os
from typing import List, Dict, Any, Optional


def parser_medecins_csv() -> List[Dict[str, Any]]:
    """
    Parse le fichier CSV des médecins réels
    
    Returns:
        Liste des médecins avec toutes leurs informations
    """
    file_path = 'data/datagouve/medecin/medecins.csv'
    
    if not os.path.exists(file_path):
        return []
    
    try:
        # Lire le CSV avec le bon séparateur
        df = pd.read_csv(file_path, sep=';', encoding='utf-8')
        
        medecins = []
        
        for _, row in df.iterrows():
            # Extraire les coordonnées GPS
            coordonnees = str(row.get('Coordonnées', ''))
            latitude, longitude = None, None
            
            if coordonnees and ',' in coordonnees:
                try:
                    lat_str, lon_str = coordonnees.split(',')
                    latitude = float(lat_str.strip())
                    longitude = float(lon_str.strip())
                except:
                    pass
            
            # Extraire les informations du médecin
            medecin = {
                "id": f"med_real_{len(medecins) + 1}",
                "nom": str(row.get('Nom du professionnel', '')).strip(),
                "civilite": str(row.get('Civilité', '')).strip(),
                "telephone": str(row.get('Numéro de téléphone', '')).strip(),
                "specialite": str(row.get('Profession', '')).strip(),
                "adresse": str(row.get('Adresse', '')).strip(),
                "commune": str(row.get('Commune', '')).strip(),
                "code_insee": str(row.get('code_insee', '')).strip(),
                "departement": str(row.get('Nom Officiel Département', '')).strip(),
                "region": str(row.get('Nom Officiel Région', '')).strip(),
                "code_departement": str(row.get('Code Officiel Département', '')).strip(),
                "code_region": str(row.get('Code Officiel Région', '')).strip(),
                "latitude": latitude,
                "longitude": longitude,
                "mode_exercice": str(row.get('Mode d\'exercice particulier', '')).strip(),
                "convention": str(row.get('Convention et CAS', '')).strip(),
                "sesam_vitale": str(row.get('Sesam Vitale', '')).strip(),
                "type_acte": str(row.get('Type d\'acte réalisé', '')).strip(),
                "tarif_secteur1": str(row.get('Tarif Secteur 1 / adhérent OPTAM/OPTAM-CO', '')).strip(),
                "tarif_hors_secteur1": str(row.get('Tarif hors secteur 1 / hors adhérent OPTAM/OPTAM-CO', '')).strip(),
                "vaccination_grippe": True,  # On assume que tous peuvent faire de la vaccination
                "capacite_journaliere": 20,  # Estimation
                "tarif_vaccination": 25.00,  # Tarif standard
                "disponibilite": "À contacter",
                "note": 4.5,  # Note moyenne
                "nb_avis": 0,  # Pas d'avis disponibles
                "zone": get_zone_from_region(str(row.get('Code Officiel Région', '')))
            }
            
            # Ne garder que les médecins avec des coordonnées GPS valides
            if latitude and longitude and medecin["nom"]:
                medecins.append(medecin)
        
        return medecins
        
    except Exception as e:
        print(f"Erreur lors du parsing: {e}")
        return []


def get_zone_from_region(code_region: str) -> str:
    """
    Détermine la zone (A, B, C) à partir du code région
    
    Args:
        code_region: Code région (11, 84, 93, etc.)
        
    Returns:
        Zone (A, B, C)
    """
    # Nettoyer le code région (enlever .0)
    clean_code = str(code_region).replace('.0', '').strip()
    
    zones_regions = {
        "A": ["11", "84", "93", "76", "75"],  # Grandes métropoles
        "B": ["32", "44", "53", "52"],        # Agglomérations moyennes  
        "C": ["28", "27", "24", "94"]         # Reste de la France
    }
    
    for zone, regions in zones_regions.items():
        if clean_code in regions:
            return zone
    
    return "C"  # Par défaut


def get_medecins_reels_par_region(code_region: str = None, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    """
    Récupère les médecins réels par région avec pagination
    
    Args:
        code_region: Code région ou None pour toutes les régions
        limit: Nombre de médecins à retourner (max 100)
        offset: Décalage pour la pagination
        
    Returns:
        Dict avec médecins paginés et métadonnées
    """
    medecins = parser_medecins_csv()
    
    # Filtrer par région si spécifiée
    if code_region:
        # Nettoyer le code région pour la comparaison
        clean_code = str(code_region).replace('.0', '').strip()
        medecins = [m for m in medecins if str(m["code_region"]).replace('.0', '').strip() == clean_code]
    
    # Pagination
    total = len(medecins)
    medecins_pages = medecins[offset:offset + limit]
    
    return {
        "medecins": medecins_pages,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
            "next_offset": offset + limit if offset + limit < total else None
        }
    }


def get_medecins_reels_par_zone(zone_code: str, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    """
    Récupère les médecins réels par zone avec pagination
    
    Args:
        zone_code: Code zone (A, B, C)
        limit: Nombre de médecins à retourner (max 100)
        offset: Décalage pour la pagination
        
    Returns:
        Dict avec médecins paginés et métadonnées
    """
    medecins = parser_medecins_csv()
    medecins_zone = [m for m in medecins if m["zone"] == zone_code]
    
    # Pagination
    total = len(medecins_zone)
    medecins_pages = medecins_zone[offset:offset + limit]
    
    return {
        "medecins": medecins_pages,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
            "next_offset": offset + limit if offset + limit < total else None
        }
    }


def get_comptage_medecins_par_region() -> Dict[str, Any]:
    """
    Retourne le comptage des médecins par région (pour éviter de charger tous les médecins)
    
    Returns:
        Dict avec comptage par région et top 10 médecins par région
    """
    medecins = parser_medecins_csv()
    
    # Compter par région
    comptage_regions = {}
    medecins_par_region = {}
    
    for med in medecins:
        region = med["region"]
        if region not in comptage_regions:
            comptage_regions[region] = 0
            medecins_par_region[region] = []
        
        comptage_regions[region] += 1
        
        # Garder seulement les 10 premiers médecins par région
        if len(medecins_par_region[region]) < 10:
            medecins_par_region[region].append({
                "nom": med["nom"],
                "adresse": med["adresse"],
                "commune": med["commune"],
                "latitude": med["latitude"],
                "longitude": med["longitude"],
                "telephone": med["telephone"]
            })
    
    # Trier par nombre de médecins
    regions_triees = sorted(comptage_regions.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_medecins": len(medecins),
        "regions": [
            {
                "nom": region,
                "nb_medecins": count,
                "exemples": medecins_par_region[region]
            }
            for region, count in regions_triees
        ],
        "top_regions": regions_triees[:10]
    }


def get_statistiques_medecins_reels() -> Dict[str, Any]:
    """
    Retourne les statistiques des médecins réels
    
    Returns:
        Statistiques détaillées
    """
    medecins = parser_medecins_csv()
    
    if not medecins:
        return {
            "total_medecins": 0,
            "medecins_avec_gps": 0,
            "par_zone": {"A": 0, "B": 0, "C": 0},
            "par_region": {},
            "erreur": "Aucun médecin trouvé"
        }
    
    # Statistiques par zone
    zones_stats = {"A": 0, "B": 0, "C": 0}
    for med in medecins:
        zone = med["zone"]
        if zone in zones_stats:
            zones_stats[zone] += 1
    
    # Statistiques par région
    regions_stats = {}
    for med in medecins:
        region = med["region"]
        if region not in regions_stats:
            regions_stats[region] = 0
        regions_stats[region] += 1
    
    # Médecins avec GPS valides
    medecins_gps = [m for m in medecins if m["latitude"] and m["longitude"]]
    
    return {
        "total_medecins": len(medecins),
        "medecins_avec_gps": len(medecins_gps),
        "pourcentage_gps": (len(medecins_gps) / len(medecins)) * 100 if medecins else 0,
        "par_zone": zones_stats,
        "par_region": regions_stats,
        "regions_uniques": len(regions_stats),
        "departements_uniques": len(set([m["departement"] for m in medecins if m["departement"]]))
    }


def rechercher_medecins_reels(
    zone_code: str = None,
    region_code: str = None,
    departement: str = None,
    specialite: str = None,
    avec_gps: bool = None
) -> List[Dict[str, Any]]:
    """
    Recherche avancée dans les médecins réels
    
    Args:
        zone_code: Code zone (A, B, C)
        region_code: Code région
        departement: Nom du département
        specialite: Spécialité médicale
        avec_gps: Avoir des coordonnées GPS
        
    Returns:
        Liste des médecins correspondant aux critères
    """
    medecins = parser_medecins_csv()
    
    # Appliquer les filtres
    if zone_code:
        medecins = [m for m in medecins if m["zone"] == zone_code]
    
    if region_code:
        medecins = [m for m in medecins if str(m["code_region"]).replace('.0', '').strip() == str(region_code).replace('.0', '').strip()]
    
    if departement:
        medecins = [m for m in medecins if departement.lower() in m["departement"].lower()]
    
    if specialite:
        medecins = [m for m in medecins if specialite.lower() in m["specialite"].lower()]
    
    if avec_gps is not None:
        if avec_gps:
            medecins = [m for m in medecins if m["latitude"] and m["longitude"]]
        else:
            medecins = [m for m in medecins if not (m["latitude"] and m["longitude"])]
    
    return medecins
