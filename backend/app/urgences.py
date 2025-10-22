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


def get_urgences_par_departement(code_departement: str = None, annee: str = None, limit: int = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences par département (version optimisée avec agrégation)
    
    Args:
        code_departement: Code département (61, 75, etc.) ou None pour tous
        annee: Année (2020, 2021, etc.) ou None pour toutes
        limit: Limite du nombre de départements à retourner (None = tous, avec agrégation)
        
    Returns:
        Dict avec données d'urgences départementales AGRÉGÉES
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
    
    # Grouper et AGRÉGER par département (ne pas garder tous les détails)
    departements = {}
    for item in data:
        dep = item.get('dep', 'Inconnu')
        if dep not in departements:
            departements[dep] = {
                "code_departement": dep,
                "nom_departement": item.get('libgeo', 'Inconnu'),
                "region": item.get('reglib', 'Inconnue'),
                "code_region": item.get('reg', 'Inconnu'),
                "taux_passages_list": [],
                "taux_hospit_list": [],
                "taux_actes_sos_list": [],
                "nb_enregistrements": 0
            }
        
        # Agréger les taux au lieu de garder tous les détails
        taux_passages = item.get('taux_passages_grippe_sau')
        taux_hospit = item.get('taux_hospit_grippe_sau')
        taux_actes = item.get('taux_actes_grippe_sos')
        
        if taux_passages is not None:
            departements[dep]["taux_passages_list"].append(taux_passages)
        if taux_hospit is not None:
            departements[dep]["taux_hospit_list"].append(taux_hospit)
        if taux_actes is not None:
            departements[dep]["taux_actes_sos_list"].append(taux_actes)
        
        departements[dep]["nb_enregistrements"] += 1
    
    # Calculer les statistiques agrégées pour chaque département
    departements_finaux = []
    for dep_code, dep_data in departements.items():
        taux_passages = dep_data["taux_passages_list"]
        taux_hospit = dep_data["taux_hospit_list"]
        taux_actes = dep_data["taux_actes_sos_list"]
        
        departements_finaux.append({
            "code_departement": dep_data["code_departement"],
            "nom_departement": dep_data["nom_departement"],
            "region": dep_data["region"],
            "code_region": dep_data["code_region"],
            "nb_enregistrements": dep_data["nb_enregistrements"],
            "statistiques": {
                "taux_passages": {
                    "moyenne": round(sum(taux_passages) / len(taux_passages), 2) if taux_passages else 0,
                    "min": round(min(taux_passages), 2) if taux_passages else 0,
                    "max": round(max(taux_passages), 2) if taux_passages else 0
                },
                "taux_hospitalisations": {
                    "moyenne": round(sum(taux_hospit) / len(taux_hospit), 2) if taux_hospit else 0,
                    "min": round(min(taux_hospit), 2) if taux_hospit else 0,
                    "max": round(max(taux_hospit), 2) if taux_hospit else 0
                },
                "taux_actes_sos": {
                    "moyenne": round(sum(taux_actes) / len(taux_actes), 2) if taux_actes else 0,
                    "min": round(min(taux_actes), 2) if taux_actes else 0,
                    "max": round(max(taux_actes), 2) if taux_actes else 0
                }
            }
        })
    
    # Limiter le nombre de résultats si demandé
    if limit:
        departements_finaux = departements_finaux[:limit]
    
    # Calculer les statistiques globales
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "departements": departements_finaux,
        "total_departements": len(departements_finaux),
        "total_enregistrements_source": len(data),
        "periode": get_periode_donnees(data),
        "statistiques": statistiques,
        "note": "Données agrégées pour optimisation - moyennes par département"
    }


def get_urgences_par_region(code_region: str = None, annee: str = None, limit: int = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences par région (version optimisée avec agrégation)
    
    Args:
        code_region: Code région (11, 84, etc.) ou None pour toutes
        annee: Année (2020, 2021, etc.) ou None pour toutes
        limit: Limite du nombre de régions à retourner (None = toutes, avec agrégation)
        
    Returns:
        Dict avec données d'urgences régionales AGRÉGÉES
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
    
    # Grouper et AGRÉGER par région (ne pas garder tous les détails)
    regions = {}
    for item in data:
        reg = item.get('region', 'Inconnue')
        if reg not in regions:
            regions[reg] = {
                "code_region": reg,
                "nom_region": item.get('reglib', 'Inconnue'),
                "taux_passages_list": [],
                "taux_hospit_list": [],
                "taux_actes_sos_list": [],
                "nb_enregistrements": 0
            }
        
        # Agréger les taux
        taux_passages = item.get('taux_passages_grippe_sau')
        taux_hospit = item.get('taux_hospit_grippe_sau')
        taux_actes = item.get('taux_actes_grippe_sos')
        
        if taux_passages is not None:
            regions[reg]["taux_passages_list"].append(taux_passages)
        if taux_hospit is not None:
            regions[reg]["taux_hospit_list"].append(taux_hospit)
        if taux_actes is not None:
            regions[reg]["taux_actes_sos_list"].append(taux_actes)
        
        regions[reg]["nb_enregistrements"] += 1
    
    # Calculer les statistiques agrégées pour chaque région
    regions_finales = []
    for reg_code, reg_data in regions.items():
        taux_passages = reg_data["taux_passages_list"]
        taux_hospit = reg_data["taux_hospit_list"]
        taux_actes = reg_data["taux_actes_sos_list"]
        
        regions_finales.append({
            "code_region": reg_data["code_region"],
            "nom_region": reg_data["nom_region"],
            "nb_enregistrements": reg_data["nb_enregistrements"],
            "statistiques": {
                "taux_passages": {
                    "moyenne": round(sum(taux_passages) / len(taux_passages), 2) if taux_passages else 0,
                    "min": round(min(taux_passages), 2) if taux_passages else 0,
                    "max": round(max(taux_passages), 2) if taux_passages else 0
                },
                "taux_hospitalisations": {
                    "moyenne": round(sum(taux_hospit) / len(taux_hospit), 2) if taux_hospit else 0,
                    "min": round(min(taux_hospit), 2) if taux_hospit else 0,
                    "max": round(max(taux_hospit), 2) if taux_hospit else 0
                },
                "taux_actes_sos": {
                    "moyenne": round(sum(taux_actes) / len(taux_actes), 2) if taux_actes else 0,
                    "min": round(min(taux_actes), 2) if taux_actes else 0,
                    "max": round(max(taux_actes), 2) if taux_actes else 0
                }
            }
        })
    
    # Limiter le nombre de résultats si demandé
    if limit:
        regions_finales = regions_finales[:limit]
    
    # Calculer les statistiques globales
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "regions": regions_finales,
        "total_regions": len(regions_finales),
        "total_enregistrements_source": len(data),
        "periode": get_periode_donnees(data),
        "statistiques": statistiques,
        "note": "Données agrégées pour optimisation - moyennes par région"
    }


def get_urgences_nationales(annee: str = None) -> Dict[str, Any]:
    """
    Récupère les données d'urgences nationales (version optimisée avec agrégation)
    
    Args:
        annee: Année (2020, 2021, etc.) ou None pour toutes
        
    Returns:
        Dict avec données d'urgences nationales AGRÉGÉES (uniquement statistiques)
    """
    # Utiliser les données régionales pour le national
    data = charger_donnees_urgences_regionales()
    
    if not data:
        return {
            "donnees_nationales": {},
            "periode": None,
            "statistiques": {}
        }
    
    # Filtrer par année si spécifiée
    if annee:
        data = [item for item in data if item.get('date_complet', '').startswith(annee)]
    
    # Agréger par groupe d'âge (au lieu de tout lister)
    groupes_age = {}
    for item in data:
        groupe = item.get('sursaud_cl_age_gene', 'Tous âges')
        if groupe not in groupes_age:
            groupes_age[groupe] = {
                "groupe_age": groupe,
                "taux_passages_list": [],
                "taux_hospit_list": [],
                "taux_actes_sos_list": [],
                "nb_enregistrements": 0
            }
        
        taux_passages = item.get('taux_passages_grippe_sau')
        taux_hospit = item.get('taux_hospit_grippe_sau')
        taux_actes = item.get('taux_actes_grippe_sos')
        
        if taux_passages is not None:
            groupes_age[groupe]["taux_passages_list"].append(taux_passages)
        if taux_hospit is not None:
            groupes_age[groupe]["taux_hospit_list"].append(taux_hospit)
        if taux_actes is not None:
            groupes_age[groupe]["taux_actes_sos_list"].append(taux_actes)
        
        groupes_age[groupe]["nb_enregistrements"] += 1
    
    # Calculer les statistiques par groupe d'âge
    donnees_par_groupe = []
    for groupe, data_groupe in groupes_age.items():
        taux_passages = data_groupe["taux_passages_list"]
        taux_hospit = data_groupe["taux_hospit_list"]
        taux_actes = data_groupe["taux_actes_sos_list"]
        
        donnees_par_groupe.append({
            "groupe_age": groupe,
            "nb_enregistrements": data_groupe["nb_enregistrements"],
            "statistiques": {
                "taux_passages": {
                    "moyenne": round(sum(taux_passages) / len(taux_passages), 2) if taux_passages else 0,
                    "min": round(min(taux_passages), 2) if taux_passages else 0,
                    "max": round(max(taux_passages), 2) if taux_passages else 0
                },
                "taux_hospitalisations": {
                    "moyenne": round(sum(taux_hospit) / len(taux_hospit), 2) if taux_hospit else 0,
                    "min": round(min(taux_hospit), 2) if taux_hospit else 0,
                    "max": round(max(taux_hospit), 2) if taux_hospit else 0
                },
                "taux_actes_sos": {
                    "moyenne": round(sum(taux_actes) / len(taux_actes), 2) if taux_actes else 0,
                    "min": round(min(taux_actes), 2) if taux_actes else 0,
                    "max": round(max(taux_actes), 2) if taux_actes else 0
                }
            }
        })
    
    # Calculer les statistiques globales
    statistiques = calculer_statistiques_urgences(data)
    
    return {
        "donnees_par_groupe_age": donnees_par_groupe,
        "total_enregistrements": len(data),
        "periode": get_periode_donnees(data),
        "statistiques_globales": statistiques,
        "note": "Données agrégées pour optimisation - moyennes nationales par groupe d'âge"
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
            "moyenne": round(sum(taux_passages) / len(taux_passages), 2) if taux_passages else 0,
            "minimum": round(min(taux_passages), 2) if taux_passages else 0,
            "maximum": round(max(taux_passages), 2) if taux_passages else 0,
            "nombre_valides": len(taux_passages),
            "unite": "pour 100 000 habitants",
            "note": "Taux de passages aux urgences pour grippe (pas des pourcentages)"
        },
        "taux_hospitalisations": {
            "moyenne": round(sum(taux_hospit) / len(taux_hospit), 2) if taux_hospit else 0,
            "minimum": round(min(taux_hospit), 2) if taux_hospit else 0,
            "maximum": round(max(taux_hospit), 2) if taux_hospit else 0,
            "nombre_valides": len(taux_hospit),
            "unite": "pour 100 000 habitants",
            "note": "Taux d'hospitalisations pour grippe (pas des pourcentages)"
        },
        "taux_actes_sos": {
            "moyenne": round(sum(taux_actes) / len(taux_actes), 2) if taux_actes else 0,
            "minimum": round(min(taux_actes), 2) if taux_actes else 0,
            "maximum": round(max(taux_actes), 2) if taux_actes else 0,
            "nombre_valides": len(taux_actes),
            "unite": "pour 100 000 habitants",
            "note": "Taux d'actes SOS Médecins pour grippe (pas des pourcentages)"
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
    Récupère les données d'urgences par zone (A, B, C) - version optimisée avec agrégation
    
    Args:
        zone_code: Code zone (A, B, C)
        annee: Année ou None pour toutes
        
    Returns:
        Dict avec données d'urgences de la zone AGRÉGÉES
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
    
    # Grouper et AGRÉGER par région (ne pas garder tous les détails)
    regions = {}
    for item in data_zone:
        reg = item.get('region', 'Inconnue')
        if reg not in regions:
            regions[reg] = {
                "code_region": reg,
                "nom_region": item.get('reglib', 'Inconnue'),
                "taux_passages_list": [],
                "taux_hospit_list": [],
                "taux_actes_sos_list": [],
                "nb_enregistrements": 0
            }
        
        # Agréger les taux
        taux_passages = item.get('taux_passages_grippe_sau')
        taux_hospit = item.get('taux_hospit_grippe_sau')
        taux_actes = item.get('taux_actes_grippe_sos')
        
        if taux_passages is not None:
            regions[reg]["taux_passages_list"].append(taux_passages)
        if taux_hospit is not None:
            regions[reg]["taux_hospit_list"].append(taux_hospit)
        if taux_actes is not None:
            regions[reg]["taux_actes_sos_list"].append(taux_actes)
        
        regions[reg]["nb_enregistrements"] += 1
    
    # Calculer les statistiques agrégées pour chaque région
    regions_finales = []
    for reg_code, reg_data in regions.items():
        taux_passages = reg_data["taux_passages_list"]
        taux_hospit = reg_data["taux_hospit_list"]
        taux_actes = reg_data["taux_actes_sos_list"]
        
        regions_finales.append({
            "code_region": reg_data["code_region"],
            "nom_region": reg_data["nom_region"],
            "nb_enregistrements": reg_data["nb_enregistrements"],
            "statistiques": {
                "taux_passages": {
                    "moyenne": round(sum(taux_passages) / len(taux_passages), 2) if taux_passages else 0,
                    "min": round(min(taux_passages), 2) if taux_passages else 0,
                    "max": round(max(taux_passages), 2) if taux_passages else 0
                },
                "taux_hospitalisations": {
                    "moyenne": round(sum(taux_hospit) / len(taux_hospit), 2) if taux_hospit else 0,
                    "min": round(min(taux_hospit), 2) if taux_hospit else 0,
                    "max": round(max(taux_hospit), 2) if taux_hospit else 0
                },
                "taux_actes_sos": {
                    "moyenne": round(sum(taux_actes) / len(taux_actes), 2) if taux_actes else 0,
                    "min": round(min(taux_actes), 2) if taux_actes else 0,
                    "max": round(max(taux_actes), 2) if taux_actes else 0
                }
            }
        })
    
    # Calculer les statistiques globales de la zone
    statistiques = calculer_statistiques_urgences(data_zone)
    
    return {
        "zone": zone_code,
        "regions": regions_finales,
        "total_regions": len(regions_finales),
        "total_enregistrements": len(data_zone),
        "periode": get_periode_donnees(data_zone),
        "statistiques": statistiques,
        "note": "Données agrégées pour optimisation - moyennes par région de la zone"
    }
