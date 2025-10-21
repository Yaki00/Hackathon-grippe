"""
Module URGENCES
Gestion des données de passages aux urgences pour la grippe
"""
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


def charger_donnees_urgences_departementales() -> List[Dict[str, Any]]:
    """
    Charge les données d'urgences départementales
    
    Returns:
        Liste des données d'urgences par département
    """
    file_path = 'data/datagouve/passage_urgence/grippe-passages-aux-urgences-et-actes-sos-medecins-departement.json'
    
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lors du chargement des données départementales: {e}")
        return []


def charger_donnees_urgences_regionales() -> List[Dict[str, Any]]:
    """
    Charge les données d'urgences régionales
    
    Returns:
        Liste des données d'urgences par région
    """
    file_path = 'data/datagouve/passage_urgence/grippe-passages-urgences-et-actes-sos-medecin_reg.json'
    
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur lors du chargement des données régionales: {e}")
        return []


def get_urgences_par_departement(code_departement: str = None, annee: str = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences par département
    
    Args:
        code_departement: Code département (61, 75, etc.) ou None pour tous
        annee: Année (2020, 2021, etc.) ou None pour toutes
        
    Returns:
        Dict avec données d'urgences départementales
    """
    data = charger_donnees_urgences_departementales()
    
    if not data:
        return {
            "departements": [],
            "total_departements": 0,
            "periode": None,
            "statistiques": {}
        }
    
    # Filtrer par département si spécifié
    if code_departement:
        data = [item for item in data if item.get('dep') == code_departement]
    
    # Filtrer par année si spécifiée
    if annee:
        data = [item for item in data if item.get('date_complet', '').startswith(annee)]
    
    # Grouper par département
    departements = {}
    for item in data:
        dep = item.get('dep', 'Inconnu')
        if dep not in departements:
            departements[dep] = {
                "code_departement": dep,
                "nom_departement": item.get('libgeo', 'Inconnu'),
                "region": item.get('reglib', 'Inconnue'),
                "code_region": item.get('reg', 'Inconnu'),
                "donnees": []
            }
        
        departements[dep]["donnees"].append({
            "date": item.get('date_complet'),
            "semaine": item.get('semaine'),
            "groupe_age": item.get('sursaud_cl_age_gene'),
            "taux_passages": item.get('taux_passages_grippe_sau'),
            "taux_hospitalisations": item.get('taux_hospit_grippe_sau'),
            "taux_actes_sos": item.get('taux_actes_grippe_sos')
        })
    
    # Calculer les statistiques
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "departements": list(departements.values()),
        "total_departements": len(departements),
        "periode": get_periode_donnees(data),
        "statistiques": statistiques
    }


def get_urgences_par_region(code_region: str = None, annee: str = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences par région
    
    Args:
        code_region: Code région (11, 84, etc.) ou None pour toutes
        annee: Année (2020, 2021, etc.) ou None pour toutes
        
    Returns:
        Dict avec données d'urgences régionales
    """
    data = charger_donnees_urgences_regionales()
    
    if not data:
        return {
            "regions": [],
            "total_regions": 0,
            "periode": None,
            "statistiques": {}
        }
    
    # Filtrer par région si spécifiée
    if code_region:
        data = [item for item in data if item.get('region') == code_region]
    
    # Filtrer par année si spécifiée
    if annee:
        data = [item for item in data if item.get('date_complet', '').startswith(annee)]
    
    # Grouper par région
    regions = {}
    for item in data:
        reg = item.get('region', 'Inconnue')
        if reg not in regions:
            regions[reg] = {
                "code_region": reg,
                "nom_region": item.get('reglib', 'Inconnue'),
                "donnees": []
            }
        
        regions[reg]["donnees"].append({
            "date": item.get('date_complet'),
            "semaine": item.get('semaine'),
            "groupe_age": item.get('sursaud_cl_age_gene'),
            "taux_passages": item.get('taux_passages_grippe_sau'),
            "taux_hospitalisations": item.get('taux_hospit_grippe_sau'),
            "taux_actes_sos": item.get('taux_actes_grippe_sos')
        })
    
    # Calculer les statistiques
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "regions": list(regions.values()),
        "total_regions": len(regions),
        "periode": get_periode_donnees(data),
        "statistiques": statistiques
    }


def get_urgences_nationales(annee: str = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences nationales
    
    Args:
        annee: Année (2020, 2021, etc.) ou None pour toutes
        
    Returns:
        Dict avec données d'urgences nationales
    """
    # Utiliser les données régionales pour le national
    data = charger_donnees_urgences_regionales()
    
    if not data:
        return {
            "donnees_nationales": [],
            "periode": None,
            "statistiques": {}
        }
    
    # Filtrer par année si spécifiée
    if annee:
        data = [item for item in data if item.get('date_complet', '').startswith(annee)]
    
    # Agrégation nationale
    donnees_nationales = []
    for item in data:
        donnees_nationales.append({
            "date": item.get('date_complet'),
            "semaine": item.get('semaine'),
            "groupe_age": item.get('sursaud_cl_age_gene'),
            "taux_passages": item.get('taux_passages_grippe_sau'),
            "taux_hospitalisations": item.get('taux_hospit_grippe_sau'),
            "taux_actes_sos": item.get('taux_actes_grippe_sos'),
            "region": item.get('reglib', 'Inconnue')
        })
    
    # Calculer les statistiques
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "donnees_nationales": donnees_nationales,
        "periode": get_periode_donnees(data),
        "statistiques": statistiques
    }


def calculer_statistiques_urgences(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcule les statistiques des données d'urgences
    
    Args:
        data: Liste des données d'urgences
        
    Returns:
        Dict avec statistiques calculées
    """
    if not data:
        return {}
    
    # Extraire les taux valides
    taux_passages = [item.get('taux_passages_grippe_sau') for item in data 
                    if item.get('taux_passages_grippe_sau') is not None]
    taux_hospit = [item.get('taux_hospit_grippe_sau') for item in data 
                  if item.get('taux_hospit_grippe_sau') is not None]
    taux_actes = [item.get('taux_actes_grippe_sos') for item in data 
                 if item.get('taux_actes_grippe_sos') is not None]
    
    return {
        "total_entrees": len(data),
        "taux_passages": {
            "moyenne": sum(taux_passages) / len(taux_passages) if taux_passages else 0,
            "minimum": min(taux_passages) if taux_passages else 0,
            "maximum": max(taux_passages) if taux_passages else 0,
            "nombre_valides": len(taux_passages)
        },
        "taux_hospitalisations": {
            "moyenne": sum(taux_hospit) / len(taux_hospit) if taux_hospit else 0,
            "minimum": min(taux_hospit) if taux_hospit else 0,
            "maximum": max(taux_hospit) if taux_hospit else 0,
            "nombre_valides": len(taux_hospit)
        },
        "taux_actes_sos": {
            "moyenne": sum(taux_actes) / len(taux_actes) if taux_actes else 0,
            "minimum": min(taux_actes) if taux_actes else 0,
            "maximum": max(taux_actes) if taux_actes else 0,
            "nombre_valides": len(taux_actes)
        }
    }


def get_periode_donnees(data: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Détermine la période des données
    
    Args:
        data: Liste des données
        
    Returns:
        Dict avec date début et fin
    """
    if not data:
        return {"debut": None, "fin": None}
    
    dates = [item.get('date_complet') for item in data if item.get('date_complet')]
    if dates:
        return {
            "debut": min(dates),
            "fin": max(dates)
        }
    
    return {"debut": None, "fin": None}


def get_urgences_par_zone(zone_code: str, annee: str = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences par zone (A, B, C)
    
    Args:
        zone_code: Code zone (A, B, C)
        annee: Année ou None pour toutes
        
    Returns:
        Dict avec données d'urgences de la zone
    """
    # Mapping zones -> régions
    zones_regions = {
        "A": ["11", "84", "93", "76", "75"],  # Grandes métropoles
        "B": ["32", "44", "53", "52"],        # Agglomérations moyennes  
        "C": ["28", "27", "24", "94"]         # Reste de la France
    }
    
    regions_zone = zones_regions.get(zone_code, [])
    
    # Charger les données régionales
    data = charger_donnees_urgences_regionales()
    
    if not data:
        return {
            "zone": zone_code,
            "regions": [],
            "periode": None,
            "statistiques": {}
        }
    
    # Filtrer par zone et année
    data_zone = []
    for item in data:
        region_code = item.get('region', '')
        if region_code in regions_zone:
            if not annee or item.get('date_complet', '').startswith(annee):
                data_zone.append(item)
    
    # Grouper par région
    regions = {}
    for item in data_zone:
        reg = item.get('region', 'Inconnue')
        if reg not in regions:
            regions[reg] = {
                "code_region": reg,
                "nom_region": item.get('reglib', 'Inconnue'),
                "donnees": []
            }
        
        regions[reg]["donnees"].append({
            "date": item.get('date_complet'),
            "semaine": item.get('semaine'),
            "groupe_age": item.get('sursaud_cl_age_gene'),
            "taux_passages": item.get('taux_passages_grippe_sau'),
            "taux_hospitalisations": item.get('taux_hospit_grippe_sau'),
            "taux_actes_sos": item.get('taux_actes_grippe_sos')
        })
    
    # Calculer les statistiques
    statistiques = calculer_statistiques_urgences(data_zone)
    
    return {
        "zone": zone_code,
        "regions": list(regions.values()),
        "total_regions": len(regions),
        "periode": get_periode_donnees(data_zone),
        "statistiques": statistiques
    }
