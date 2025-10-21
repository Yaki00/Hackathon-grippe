"""
Module COUVERTURES VACCINALES DÉTAILLÉES
HPV + Grippe (toutes catégories)
Par niveau : National, Régional, Départemental
"""
import json
from pathlib import Path
from typing import Optional, List, Dict

DATA_DIR = Path(__file__).parent.parent / "data" / "datagouve" / "couverture_vaccinal"

# Fichiers sources
FICHIER_NATIONAL = DATA_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-france.json"
FICHIER_REGIONAL = DATA_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json"
FICHIER_DEPARTEMENTAL = DATA_DIR / "couvertures-vaccinales-des-adolescent-et-adultes-departement.json"


def charger_donnees_nationales():
    """Charge les données nationales"""
    try:
        with open(FICHIER_NATIONAL, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"❌ Erreur chargement national: {e}")
        return []


def charger_donnees_regionales():
    """Charge les données régionales"""
    try:
        with open(FICHIER_REGIONAL, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"❌ Erreur chargement régional: {e}")
        return []


def charger_donnees_departementales():
    """Charge les données départementales"""
    try:
        with open(FICHIER_DEPARTEMENTAL, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"❌ Erreur chargement départemental: {e}")
        return []


# ============================================================================
# NIVEAU NATIONAL
# ============================================================================

def get_hpv_national(annee_debut: str = "2022") -> Dict:
    """
    Récupère les données HPV au niveau national depuis une année donnée
    
    Returns:
        Dict avec évolution HPV filles/garçons par année
    """
    data = charger_donnees_nationales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Filtrer par année >= annee_debut
    filtered = [d for d in data if d.get('an_mesure') and int(d['an_mesure']) >= int(annee_debut)]
    
    # Organiser par année
    result = []
    for row in sorted(filtered, key=lambda x: x['an_mesure']):
        result.append({
            "annee": row['an_mesure'],
            "hpv_filles": {
                "dose_1": row.get('hpv1_f'),
                "dose_2": row.get('hpv2_f')
            },
            "hpv_garcons": {
                "dose_1": row.get('hpv1_g'),
                "dose_2": row.get('hpv2_g')
            }
        })
    
    return {
        "niveau": "National",
        "periode": f"{annee_debut} - présent",
        "data": result
    }


def get_grippe_national(annee: Optional[str] = None) -> Dict:
    """
    Récupère les données grippe détaillées au niveau national
    
    Returns:
        Dict avec toutes les catégories grippe
    """
    data = charger_donnees_nationales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Si année spécifiée, filtrer
    if annee:
        filtered = [d for d in data if d.get('an_mesure') == annee]
    else:
        # Prendre toutes les années avec données grippe
        filtered = [d for d in data if d.get('grip_65plus') is not None]
    
    result = []
    for row in sorted(filtered, key=lambda x: x.get('an_mesure', '0')):
        result.append({
            "annee": row['an_mesure'],
            "moins_65_ans": row.get('grip_moins65'),
            "65_ans_et_plus": row.get('grip_65plus'),
            "65_74_ans": row.get('grip_6574'),
            "75_ans_et_plus": row.get('grip_75plus'),
            "residents_ehpad": row.get('grip_resid'),
            "professionnels_sante": row.get('grip_pro')
        })
    
    return {
        "niveau": "National",
        "data": result
    }


# ============================================================================
# NIVEAU RÉGIONAL
# ============================================================================

def get_hpv_regional(code_region: Optional[str] = None, annee_debut: str = "2022") -> Dict:
    """
    Récupère les données HPV au niveau régional
    
    Args:
        code_region: Code région (ex: "11") ou None pour toutes
        annee_debut: Année de début (défaut: 2022)
    
    Returns:
        Dict avec données HPV par région
    """
    data = charger_donnees_regionales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Filtrer par année
    filtered = [d for d in data if d.get('an_mesure') and int(d['an_mesure']) >= int(annee_debut)]
    
    # Filtrer par région si spécifié
    if code_region:
        filtered = [d for d in filtered if d.get('reg') == code_region]
    
    # Grouper par région
    regions = {}
    for row in filtered:
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if reg_code not in regions:
            regions[reg_code] = {
                "code_region": reg_code,
                "nom_region": reg_name,
                "data": []
            }
        
        regions[reg_code]["data"].append({
            "annee": row['an_mesure'],
            "hpv_filles": {
                "dose_1": row.get('hpv1_f'),
                "dose_2": row.get('hpv2_f')
            },
            "hpv_garcons": {
                "dose_1": row.get('hpv1_g'),
                "dose_2": row.get('hpv2_g')
            }
        })
    
    # Trier les données par année
    for reg in regions.values():
        reg["data"] = sorted(reg["data"], key=lambda x: x['annee'])
    
    if code_region:
        return regions.get(code_region, {"error": f"Région {code_region} non trouvée"})
    else:
        return {
            "niveau": "Régional",
            "periode": f"{annee_debut} - présent",
            "regions": list(regions.values())
        }


def get_grippe_regional(code_region: Optional[str] = None, annee: Optional[str] = None) -> Dict:
    """
    Récupère les données grippe au niveau régional
    
    Args:
        code_region: Code région ou None pour toutes
        annee: Année spécifique ou None pour toutes
    """
    data = charger_donnees_regionales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Filtrer
    filtered = [d for d in data if d.get('grip_65plus') is not None]
    
    if annee:
        filtered = [d for d in filtered if d.get('an_mesure') == annee]
    
    if code_region:
        filtered = [d for d in filtered if d.get('reg') == code_region]
    
    # Grouper par région
    regions = {}
    for row in filtered:
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if reg_code not in regions:
            regions[reg_code] = {
                "code_region": reg_code,
                "nom_region": reg_name,
                "data": []
            }
        
        regions[reg_code]["data"].append({
            "annee": row['an_mesure'],
            "moins_65_ans": row.get('grip_moins65'),
            "65_ans_et_plus": row.get('grip_65plus'),
            "65_74_ans": row.get('grip_6574'),
            "75_ans_et_plus": row.get('grip_75plus'),
            "residents_ehpad": row.get('grip_resid'),
            "professionnels_sante": row.get('grip_pro')
        })
    
    # Trier
    for reg in regions.values():
        reg["data"] = sorted(reg["data"], key=lambda x: x['annee'])
    
    if code_region:
        return regions.get(code_region, {"error": f"Région {code_region} non trouvée"})
    else:
        return {
            "niveau": "Régional",
            "regions": list(regions.values())
        }


# ============================================================================
# NIVEAU DÉPARTEMENTAL
# ============================================================================

def get_hpv_departemental(code_dept: Optional[str] = None, annee_debut: str = "2022") -> Dict:
    """
    Récupère les données HPV au niveau départemental
    
    Args:
        code_dept: Code département (ex: "75") ou None pour tous
        annee_debut: Année de début
    """
    data = charger_donnees_departementales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Filtrer
    filtered = [d for d in data if d.get('an_mesure') and int(d['an_mesure']) >= int(annee_debut)]
    
    if code_dept:
        filtered = [d for d in filtered if d.get('dep') == code_dept]
    
    # Grouper par département
    departements = {}
    for row in filtered:
        dept_code = row.get('dep')
        dept_name = row.get('libgeo')
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if dept_code not in departements:
            departements[dept_code] = {
                "code_departement": dept_code,
                "nom_departement": dept_name,
                "code_region": reg_code,
                "nom_region": reg_name,
                "data": []
            }
        
        departements[dept_code]["data"].append({
            "annee": row['an_mesure'],
            "hpv_filles": {
                "dose_1": row.get('hpv1_f'),
                "dose_2": row.get('hpv2_f')
            },
            "hpv_garcons": {
                "dose_1": row.get('hpv1_g'),
                "dose_2": row.get('hpv2_g')
            }
        })
    
    # Trier
    for dept in departements.values():
        dept["data"] = sorted(dept["data"], key=lambda x: x['annee'])
    
    if code_dept:
        return departements.get(code_dept, {"error": f"Département {code_dept} non trouvé"})
    else:
        return {
            "niveau": "Départemental",
            "periode": f"{annee_debut} - présent",
            "departements": list(departements.values())
        }


def get_grippe_par_zones(annee: Optional[str] = None) -> Dict:
    """
    Récupère les données grippe groupées par zones (A, B, C)
    
    Args:
        annee: Année spécifique ou None pour toutes
    """
    # Récupérer toutes les données régionales
    data_regional = get_grippe_regional(code_region=None, annee=annee)
    
    if "error" in data_regional:
        return data_regional
    
    # Mapping des régions vers les zones
    zones_regions = {
        "A": ["11", "84", "93", "76", "75"],  # Grandes métropoles
        "B": ["32", "44", "53", "52"],        # Agglomérations moyennes  
        "C": ["28", "27", "24", "94"]         # Reste de la France
    }
    
    # Noms des zones
    zones_noms = {
        "A": "Grandes Métropoles",
        "B": "Agglomérations Moyennes", 
        "C": "Reste de la France"
    }
    
    # Grouper par zone
    zones_data = {}
    
    for zone_code, regions_codes in zones_regions.items():
        zones_data[zone_code] = {
            "zone_code": zone_code,
            "zone_nom": zones_noms[zone_code],
            "regions": [],
            "statistiques": {
                "total_regions": 0,
                "population_totale": 0,
                "taux_moyen_moins_65": 0,
                "taux_moyen_65_plus": 0,
                "taux_moyen_global": 0
            }
        }
        
        # Ajouter les régions de cette zone
        for region in data_regional.get("regions", []):
            if region["code_region"] in regions_codes:
                zones_data[zone_code]["regions"].append(region)
                zones_data[zone_code]["statistiques"]["total_regions"] += 1
        
        # Calculer les statistiques moyennes pour la zone
        if zones_data[zone_code]["regions"]:
            total_moins_65 = 0
            total_65_plus = 0
            count_moins_65 = 0
            count_65_plus = 0
            
            for region in zones_data[zone_code]["regions"]:
                for data_point in region.get("data", []):
                    if data_point.get("moins_65_ans") is not None:
                        total_moins_65 += data_point["moins_65_ans"]
                        count_moins_65 += 1
                    if data_point.get("65_ans_et_plus") is not None:
                        total_65_plus += data_point["65_ans_et_plus"]
                        count_65_plus += 1
            
            if count_moins_65 > 0:
                zones_data[zone_code]["statistiques"]["taux_moyen_moins_65"] = round(total_moins_65 / count_moins_65, 2)
            if count_65_plus > 0:
                zones_data[zone_code]["statistiques"]["taux_moyen_65_plus"] = round(total_65_plus / count_65_plus, 2)
            
            # Taux global moyen
            if count_moins_65 > 0 and count_65_plus > 0:
                zones_data[zone_code]["statistiques"]["taux_moyen_global"] = round(
                    (total_moins_65 + total_65_plus) / (count_moins_65 + count_65_plus), 2
                )
    
    return {
        "niveau": "Zones",
        "annee": annee,
        "zones": list(zones_data.values()),
        "statistiques_globales": {
            "total_zones": len(zones_data),
            "total_regions": sum(zone["statistiques"]["total_regions"] for zone in zones_data.values())
        }
    }


def get_grippe_departemental(code_dept: Optional[str] = None, annee: Optional[str] = None) -> Dict:
    """
    Récupère les données grippe au niveau départemental
    """
    data = charger_donnees_departementales()
    
    if not data:
        return {"error": "Données non disponibles"}
    
    # Filtrer
    filtered = [d for d in data if d.get('grip_65plus') is not None]
    
    if annee:
        filtered = [d for d in filtered if d.get('an_mesure') == annee]
    
    if code_dept:
        filtered = [d for d in filtered if d.get('dep') == code_dept]
    
    # Grouper par département
    departements = {}
    for row in filtered:
        dept_code = row.get('dep')
        dept_name = row.get('libgeo')
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if dept_code not in departements:
            departements[dept_code] = {
                "code_departement": dept_code,
                "nom_departement": dept_name,
                "code_region": reg_code,
                "nom_region": reg_name,
                "data": []
            }
        
        departements[dept_code]["data"].append({
            "annee": row['an_mesure'],
            "moins_65_ans": row.get('grip_moins65'),
            "65_ans_et_plus": row.get('grip_65plus'),
            "65_74_ans": row.get('grip_6574'),
            "75_ans_et_plus": row.get('grip_75plus'),
            "residents_ehpad": row.get('grip_resid'),
            "professionnels_sante": row.get('grip_pro')
        })
    
    # Trier
    for dept in departements.values():
        dept["data"] = sorted(dept["data"], key=lambda x: x['annee'])
    
    if code_dept:
        return departements.get(code_dept, {"error": f"Département {code_dept} non trouvé"})
    else:
        return {
            "niveau": "Départemental",
            "departements": list(departements.values())
        }


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def get_annees_disponibles() -> Dict:
    """Retourne les années disponibles pour chaque type de données"""
    data_nat = charger_donnees_nationales()
    
    annees_hpv = sorted(set([d['an_mesure'] for d in data_nat if d.get('hpv1_f') is not None]))
    annees_grippe = sorted(set([d['an_mesure'] for d in data_nat if d.get('grip_65plus') is not None]))
    
    return {
        "hpv": annees_hpv,
        "grippe": annees_grippe
    }


def get_liste_regions() -> List[Dict]:
    """Retourne la liste des régions disponibles"""
    data = charger_donnees_regionales()
    
    regions = {}
    for row in data:
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if reg_code and reg_code not in regions:
            regions[reg_code] = {
                "code": reg_code,
                "nom": reg_name
            }
    
    return sorted(list(regions.values()), key=lambda x: x['code'])


def get_liste_departements() -> List[Dict]:
    """Retourne la liste des départements disponibles"""
    data = charger_donnees_departementales()
    
    departements = {}
    for row in data:
        dept_code = row.get('dep')
        dept_name = row.get('libgeo')
        reg_code = row.get('reg')
        reg_name = row.get('reglib')
        
        if dept_code and dept_code not in departements:
            departements[dept_code] = {
                "code": dept_code,
                "nom": dept_name,
                "region_code": reg_code,
                "region_nom": reg_name
            }
    
    return sorted(list(departements.values()), key=lambda x: x['code'])

