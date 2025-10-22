"""
Module pour charger les données depuis fichiers locaux ET APIs
Combine les deux sources pour avoir les meilleures infos
"""
import pandas as pd
from pathlib import Path
import json

DATA_DIR = Path(__file__).parent.parent / "data" / "datagouve"
COUVERTURE_VACCINAL_DIR = DATA_DIR / "couverture_vaccinal"


def charger_couverture_historique_region():
    """
    Charge les données de couverture vaccinale historique par région depuis Santé Publique France.
    Ces données contiennent les VRAIS taux de couverture vaccinale en pourcentages.
    
    Returns:
        DataFrame avec colonnes: an_mesure, reg, reglib, grip_moins65, grip_65plus, grip_6574, grip_75plus
    """
    try:
        chemin = COUVERTURE_VACCINAL_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json"
        if chemin.exists():
            with open(chemin, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            return df
        else:
            print(f"❌ Fichier historique région introuvable: {chemin}")
            return pd.DataFrame()
    except Exception as e:
        print(f"❌ Erreur chargement données historiques région: {e}")
        return pd.DataFrame()


def charger_couverture_historique_france():
    """
    Charge les données de couverture vaccinale historique nationale depuis Santé Publique France.
    
    Returns:
        DataFrame avec colonnes: an_mesure, grip_moins65, grip_65plus, grip_6574, grip_75plus
    """
    try:
        chemin = COUVERTURE_VACCINAL_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-france.json"
        if chemin.exists():
            with open(chemin, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            return df
        else:
            print(f"❌ Fichier historique France introuvable: {chemin}")
            return pd.DataFrame()
    except Exception as e:
        print(f"❌ Erreur chargement données historiques France: {e}")
        return pd.DataFrame()


def charger_fichier_local(annee: str, type_fichier: str):
    """
    Charge un fichier CSV ou JSON local.
    
    Args:
        annee: "2021", "2022", "2023", "2024"
        type_fichier: "couverture", "doses-actes", "campagne"
    """
    try:
        # Chemins possibles
        chemins = [
            DATA_DIR / annee / f"{type_fichier}-{annee} (1).json",
            DATA_DIR / annee / f"{type_fichier}-{annee}.json",
            DATA_DIR / annee / f"{type_fichier}-{annee}.csv",
        ]
        
        for chemin in chemins:
            if chemin.exists():
                if chemin.suffix == ".json":
                    # Lire JSON
                    with open(chemin, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Convertir en DataFrame
                    if isinstance(data, dict):
                        df = pd.DataFrame(data)
                    else:
                        df = pd.DataFrame(data)
                    
                    return df
                else:
                    # Lire CSV
                    return pd.read_csv(chemin, sep=';')
        
        print(f"❌ Aucun fichier trouvé pour {type_fichier} {annee}")
        return pd.DataFrame()
        
    except Exception as e:
        print(f"❌ Erreur chargement {type_fichier} {annee}: {e}")
        return pd.DataFrame()


def extraire_taux_couverture_region(df, code_region):
    """
    Extrait le taux de couverture d'une région depuis le DataFrame.
    Format data.gouv.fr : colonnes 'code', 'variable', 'groupe', 'valeur'
    ACTE = vaccinations, DOSES = doses distribuées
    Taux = ACTE / DOSES * 100
    """
    if df.empty:
        return None
    
    try:
        # Filtrer par code région
        code_int = int(code_region)
        region_data = df[df['code'] == code_int]
        
        if region_data.empty:
            return None
        
        # Calculer taux : ACTE / DOSES * 100
        # On prend tous les groupes d'âge
        actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
        doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
        
        if doses > 0:
            taux = (actes / doses) * 100
            return round(taux, 1)
        
        return None
        
    except Exception as e:
        print(f"⚠️  Erreur extraction région {code_region}: {e}")
        return None


def extraire_donnees_doses_region(df, code_region):
    """
    Extrait les données de doses et prescriptions d'une région depuis le DataFrame.
    
    Returns:
        dict avec doses_distribuees, actes_vaccination, taux_utilisation
    """
    if df.empty:
        return None
    
    try:
        # Filtrer par code région
        code_int = int(code_region)
        region_data = df[df['code'] == code_int]
        
        if region_data.empty:
            return None
        
        # Séparer par groupe d'âge
        moins_65 = region_data[region_data['groupe'] == 'moins de 65 ans']
        plus_65 = region_data[region_data['groupe'] == '65 ans et plus']
        
        # Calculer totaux
        doses_moins_65 = moins_65[moins_65['variable'] == 'DOSES(J07E1)']['valeur'].sum()
        actes_moins_65 = moins_65[moins_65['variable'] == 'ACTE(VGP)']['valeur'].sum()
        
        doses_plus_65 = plus_65[plus_65['variable'] == 'DOSES(J07E1)']['valeur'].sum()
        actes_plus_65 = plus_65[plus_65['variable'] == 'ACTE(VGP)']['valeur'].sum()
        
        # Totaux généraux
        total_doses = doses_moins_65 + doses_plus_65
        total_actes = actes_moins_65 + actes_plus_65
        
        # Taux d'utilisation des doses
        taux_utilisation = (total_actes / total_doses * 100) if total_doses > 0 else 0
        
        return {
            "doses_distribuees": {
                "moins_65_ans": int(doses_moins_65),
                "plus_65_ans": int(doses_plus_65),
                "total": int(total_doses)
            },
            "actes_vaccination": {
                "moins_65_ans": int(actes_moins_65),
                "plus_65_ans": int(actes_plus_65),
                "total": int(total_actes)
            },
            "taux_utilisation_doses": round(taux_utilisation, 1),
            "doses_non_utilisees": int(total_doses - total_actes)
        }
        
    except Exception as e:
        print(f"⚠️  Erreur extraction doses région {code_region}: {e}")
        return None


def get_taux_couverture_reel_region(code_region, annee="2024"):
    """
    Récupère le taux de couverture vaccinale REEL depuis les données Santé Publique France.
    Ces données sont des pourcentages directs, pas des calculs.
    
    Returns:
        dict avec taux_moins_65, taux_65_plus, taux_global
    """
    try:
        df_historique = charger_couverture_historique_region()
        
        if df_historique.empty:
            return None
        
        # Filtrer par région et année
        region_data = df_historique[
            (df_historique['reg'] == str(code_region)) & 
            (df_historique['an_mesure'] == annee)
        ]
        
        if region_data.empty:
            return None
        
        # Extraire les taux (déjà en pourcentages)
        taux_moins_65 = region_data['grip_moins65'].iloc[0]
        taux_65_plus = region_data['grip_65plus'].iloc[0]
        taux_6574 = region_data.get('grip_6574', pd.Series([None])).iloc[0]
        taux_75plus = region_data.get('grip_75plus', pd.Series([None])).iloc[0]
        
        # Convertir None en valeurs utilisables
        taux_moins_65 = float(taux_moins_65) if pd.notna(taux_moins_65) else None
        taux_65_plus = float(taux_65_plus) if pd.notna(taux_65_plus) else None
        taux_6574 = float(taux_6574) if pd.notna(taux_6574) else None
        taux_75plus = float(taux_75plus) if pd.notna(taux_75plus) else None
        
        # Calculer taux global (moyenne pondérée approximative)
        if taux_moins_65 and taux_65_plus:
            taux_global = (taux_moins_65 * 0.7 + taux_65_plus * 0.3)  # Approximation
        elif taux_65_plus:
            taux_global = taux_65_plus
        elif taux_moins_65:
            taux_global = taux_moins_65
        else:
            taux_global = None
        
        return {
            "taux_moins_65": taux_moins_65,
            "taux_65_plus": taux_65_plus,
            "taux_65_74": taux_6574,
            "taux_75_plus": taux_75plus,
            "taux_global": round(taux_global, 1) if taux_global else None,
            "source": "Santé Publique France (données officielles)",
            "annee": annee
        }
        
    except Exception as e:
        print(f"⚠️  Erreur extraction taux réel région {code_region}: {e}")
        return None


def calculer_taux_reel_depuis_actes(annee="2024"):
    """
    Calcule le VRAI taux de vaccination de la population générale 
    en utilisant les données ACTE (vaccinations réellement effectuées).
    
    IMPORTANT: Les taux grip_65plus et grip_moins65 concernent uniquement 
    les POPULATIONS À RISQUE, pas la population générale.
    
    Returns:
        dict avec taux_reel_65plus, taux_reel_moins65, taux_reel_global
    """
    try:
        # Charger les données de doses-actes (vaccinations réelles)
        df_doses = charger_fichier_local(annee, "doses-actes")
        
        if df_doses.empty:
            return None
        
        # Total des vaccinations réelles (ACTE)
        total_actes_65plus = df_doses[
            (df_doses['variable'] == 'ACTE(VGP)') & 
            (df_doses['groupe'] == '65 ans et plus')
        ]['valeur'].sum()
        
        total_actes_moins65 = df_doses[
            (df_doses['variable'] == 'ACTE(VGP)') & 
            (df_doses['groupe'] == 'moins de 65 ans')
        ]['valeur'].sum()
        
        # Population française estimée
        POPULATION_FRANCE = 67_000_000
        POPULATION_65_PLUS = int(POPULATION_FRANCE * 0.20)  # ~20% ont 65+
        POPULATION_MOINS_65 = POPULATION_FRANCE - POPULATION_65_PLUS
        
        # Calculer les VRAIS taux (population générale, pas uniquement à risque)
        taux_reel_65plus = (total_actes_65plus / POPULATION_65_PLUS) * 100
        taux_reel_moins65 = (total_actes_moins65 / POPULATION_MOINS_65) * 100
        taux_reel_global = ((total_actes_65plus + total_actes_moins65) / POPULATION_FRANCE) * 100
        
        return {
            "taux_reel_65plus": float(round(taux_reel_65plus, 1)),
            "taux_reel_moins65": float(round(taux_reel_moins65, 1)),
            "taux_reel_global": float(round(taux_reel_global, 1)),
            "total_vaccinations_65plus": int(total_actes_65plus),
            "total_vaccinations_moins65": int(total_actes_moins65),
            "total_vaccinations": int(total_actes_65plus + total_actes_moins65),
            "population_france": POPULATION_FRANCE,
            "source": "ACTE (vaccinations réelles) - population générale",
            "annee": annee,
            "note": "Taux calculés sur la population TOTALE, pas uniquement populations à risque"
        }
        
    except Exception as e:
        print(f"⚠️  Erreur calcul taux réel depuis ACTE: {e}")
        return None


def get_donnees_vaccination_region(code_region, annee="2024"):
    """
    Récupère les données de vaccination d'une région.
    Calcule le taux réel basé sur les données départementales.
    
    Returns:
        dict avec taux, nombre_vaccines, etc.
    """
    # 1. PRIORITE: Calculer le taux réel depuis les données départementales
    from app.vaccination import calculer_taux_par_departement
    from app.config import REGIONS_ZONES
    
    # Obtenir tous les départements de cette région
    tous_departements = calculer_taux_par_departement(annee)
    region_departements = [d for d in tous_departements if d["code_region"] == str(code_region)]
    
    if region_departements:
        # Calculer les totaux pour la région
        total_population = sum(d["population_totale"] for d in region_departements)
        total_vaccines = sum(d["nombre_vaccines"] for d in region_departements)
        
        # Calculer le taux régional
        taux_regional = (total_vaccines / total_population) * 100 if total_population > 0 else 0
        
        # Calculer les taux par âge (estimation basée sur le taux national)
        taux_actes = calculer_taux_reel_depuis_actes(annee)
        ratio_regional = taux_regional / taux_actes["taux_reel_global"] if taux_actes else 1
        
        return {
            "taux_vaccination": float(round(taux_regional, 1)),
            "taux_65_plus": float(round(taux_actes["taux_reel_65plus"] * ratio_regional, 1)) if taux_actes else None,
            "taux_moins_65": float(round(taux_actes["taux_reel_moins65"] * ratio_regional, 1)) if taux_actes else None,
            "taux_global": float(round(taux_regional, 1)),
            "population_totale": int(total_population),
            "nombre_vaccines": int(total_vaccines),
            "nb_departements": len(region_departements),
            "source": "ACTE (vaccinations réelles) - calculé par département",
            "annee": annee,
            "note": "Taux calculé sur données départementales réelles"
        }
    
    # 2. Fallback: Utiliser le taux national si pas de données départementales
    taux_actes = calculer_taux_reel_depuis_actes(annee)
    
    if taux_actes is not None:
        # Utiliser le taux global comme taux de vaccination pour cette région
        return {
            "taux_vaccination": taux_actes["taux_reel_global"],
            "taux_65_plus": taux_actes["taux_reel_65plus"],
            "taux_moins_65": taux_actes["taux_reel_moins65"],
            "taux_global": taux_actes["taux_reel_global"],
            "source": taux_actes["source"] + " (fallback national)",
            "annee": annee,
            "note": taux_actes["note"]
        }
    
    # 3. Fallback: Essayer calcul depuis fichiers IQVIA
    df_couverture = charger_fichier_local(annee, "couverture")
    taux_local = extraire_taux_couverture_region(df_couverture, code_region)
    
    if taux_local is not None:
        return {
            "taux_vaccination": taux_local,
            "source": "IQVIA (calcul approximatif)",
            "annee": annee,
            "avertissement": "Données IQVIA en milliers - taux calculé approximatif"
        }
    
    # 4. Dernier recours: simuler
    return {
        "taux_vaccination": 55.0 + (hash(code_region) % 20),
        "source": "simule",
        "annee": annee,
        "avertissement": "Données simulées - non fiables"
    }


def get_donnees_doses_region(code_region, annee="2024"):
    """
    Récupère les données de doses et prescriptions d'une région.
    
    Returns:
        dict avec doses distribuées, actes, taux d'utilisation
    """
    # 1. Charger données de couverture (contient doses et actes)
    df_couverture = charger_fichier_local(annee, "couverture")
    donnees_doses = extraire_donnees_doses_region(df_couverture, code_region)
    
    # 2. TODO: Ajouter données temps réel si disponibles
    # donnees_api = appeler_api_doses(code_region)
    
    # 3. Retourner données ou simulation
    if donnees_doses is not None:
        return {
            **donnees_doses,
            "source": "fichier_local",
            "annee": annee
        }
    else:
        # Fallback: simuler si pas de données
        base_doses = 5000 + (hash(code_region) % 3000)
        base_actes = int(base_doses * 0.7)  # 70% d'utilisation
        
        return {
            "doses_distribuees": {
                "moins_65_ans": int(base_doses * 0.3),
                "plus_65_ans": int(base_doses * 0.7),
                "total": base_doses
            },
            "actes_vaccination": {
                "moins_65_ans": int(base_actes * 0.3),
                "plus_65_ans": int(base_actes * 0.7),
                "total": base_actes
            },
            "taux_utilisation_doses": 70.0,
            "doses_non_utilisees": base_doses - base_actes,
            "source": "simule",
            "annee": annee
        }

