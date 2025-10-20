"""
Module pour charger les données depuis fichiers locaux ET APIs
Combine les deux sources pour avoir les meilleures infos
"""
import pandas as pd
from pathlib import Path
import json

DATA_DIR = Path(__file__).parent.parent / "data" / "datagouve"


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


def get_donnees_vaccination_region(code_region, annee="2024"):
    """
    Récupère les données de vaccination d'une région.
    Combine fichiers locaux + APIs si disponibles.
    
    Returns:
        dict avec taux, nombre_vaccines, etc.
    """
    # 1. Essayer fichiers locaux
    df_couverture = charger_fichier_local(annee, "couverture")
    taux_local = extraire_taux_couverture_region(df_couverture, code_region)
    
    # 2. TODO: Ajouter appel API pour données temps réel
    # taux_api = appeler_api_couverture(code_region)
    
    # 3. Prendre la meilleure source
    if taux_local is not None:
        return {
            "taux_vaccination": taux_local,
            "source": "fichier_local",
            "annee": annee
        }
    else:
        # Fallback: simuler si pas de données
        return {
            "taux_vaccination": 55.0 + (hash(code_region) % 20),
            "source": "simule",
            "annee": annee
        }

