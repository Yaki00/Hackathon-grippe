"""
Module PREDICTION
Prédiction des besoins en doses de vaccin par zone
Utilise les données historiques 2021-2024
"""
import pandas as pd
import json
from pathlib import Path
from datetime import datetime, timedelta
from app.config import REGIONS_ZONES

DATA_DIR = Path(__file__).parent.parent / "data" / "datagouve"


def charger_donnees_historiques():
    """
    Charge toutes les données historiques de doses-actes (2021-2024)
    
    Returns:
        DataFrame avec colonnes: campagne, date, jour, variable, groupe, valeur
    """
    all_data = []
    
    # Charger CSV (2021, 2022)
    for annee in ["2021", "2022"]:
        fichier = DATA_DIR / annee / f"doses-actes-{annee}.csv"
        if fichier.exists():
            try:
                df = pd.read_csv(fichier)
                all_data.append(df)
                print(f"✅ Chargé {annee}: {len(df)} lignes")
            except Exception as e:
                print(f"⚠️  Erreur {annee}: {e}")
    
    # Charger JSON (2023, 2024)
    for annee in ["2023", "2024"]:
        fichier = DATA_DIR / annee / f"doses-actes-{annee}.json"
        if not fichier.exists():
            fichier = DATA_DIR / annee / f"doses-actes-{annee} (1).json"
        
        if fichier.exists():
            try:
                with open(fichier, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
                all_data.append(df)
                print(f"✅ Chargé {annee}: {len(df)} lignes")
            except Exception as e:
                print(f"⚠️  Erreur {annee}: {e}")
    
    if not all_data:
        print("❌ Aucune donnée historique trouvée")
        return pd.DataFrame()
    
    # Fusionner toutes les données
    df_final = pd.concat(all_data, ignore_index=True)
    
    # Convertir date en datetime
    if 'date' in df_final.columns:
        df_final['date'] = pd.to_datetime(df_final['date'], errors='coerce')
    
    print(f"📊 Total chargé: {len(df_final)} lignes")
    return df_final


def calculer_stats_mensuelles(df):
    """
    Calcule les statistiques mensuelles de doses distribuées
    
    Returns:
        dict avec stats par mois
    """
    if df.empty:
        return {}
    
    # Filtrer uniquement les DOSES distribuées
    df_doses = df[df['variable'] == 'DOSES(J07E1)'].copy()
    
    # Extraire mois/année
    df_doses['mois'] = df_doses['date'].dt.to_period('M')
    
    # Agréger par mois
    stats_mensuelles = df_doses.groupby('mois')['valeur'].agg([
        ('total_doses', 'sum'),
        ('moyenne_jour', 'mean'),
        ('max_jour', 'max')
    ]).to_dict('index')
    
    return stats_mensuelles


def predire_besoins_prochains_mois(zone_code=None, horizon_mois=1):
    """
    Prédit les besoins en doses pour les prochains mois
    Méthode: Moyenne mobile + tendance + saisonnalité
    
    Args:
        zone_code: Code zone (A, B, C) ou None pour national
        horizon_mois: Nombre de mois à prédire (1-3)
    
    Returns:
        dict avec prédictions
    """
    # Charger données historiques
    df = charger_donnees_historiques()
    
    if df.empty:
        return generer_prediction_fallback(zone_code, horizon_mois)
    
    # Filtrer DOSES uniquement
    df_doses = df[df['variable'] == 'DOSES(J07E1)'].copy()
    
    # Agréger par mois
    df_doses['annee_mois'] = df_doses['date'].dt.to_period('M')
    doses_mensuelles = df_doses.groupby('annee_mois')['valeur'].sum()
    
    if len(doses_mensuelles) < 3:
        return generer_prediction_fallback(zone_code, horizon_mois)
    
    # Calculer moyenne mobile sur 3 derniers mois
    moyenne_3_mois = doses_mensuelles.tail(3).mean()
    
    # Calculer tendance (évolution)
    if len(doses_mensuelles) >= 6:
        derniers_6 = doses_mensuelles.tail(6).values
        premiers_3 = derniers_6[:3].mean()
        derniers_3 = derniers_6[3:].mean()
        tendance_pct = ((derniers_3 - premiers_3) / premiers_3 * 100) if premiers_3 > 0 else 0
    else:
        tendance_pct = 0
    
    # Identifier pic saisonnier (octobre-décembre)
    mois_actuel = datetime.now().month
    facteur_saisonnier = 1.0
    
    if 10 <= mois_actuel <= 12:  # Pic de campagne
        facteur_saisonnier = 1.3
    elif 1 <= mois_actuel <= 2:  # Fin de campagne
        facteur_saisonnier = 0.7
    elif 3 <= mois_actuel <= 9:  # Hors campagne
        facteur_saisonnier = 0.2
    
    # Prédiction = moyenne × tendance × saisonnalité
    prediction_base = moyenne_3_mois * (1 + tendance_pct / 100) * facteur_saisonnier
    
    # Ajuster par zone si spécifié
    if zone_code:
        facteur_zone = calculer_facteur_zone(zone_code)
        prediction_base *= facteur_zone
    
    # Générer prédictions pour les N prochains mois
    predictions = []
    date_debut = datetime.now()
    
    for i in range(horizon_mois):
        mois_futur = date_debut + timedelta(days=30 * (i + 1))
        mois_num = mois_futur.month
        
        # Ajuster saisonnalité pour chaque mois
        if 10 <= mois_num <= 12:
            facteur_mois = 1.3
        elif 1 <= mois_num <= 2:
            facteur_mois = 0.7
        else:
            facteur_mois = 0.2
        
        prediction_mois = int(prediction_base * facteur_mois)
        
        predictions.append({
            "mois": mois_futur.strftime("%Y-%m"),
            "mois_nom": mois_futur.strftime("%B %Y"),
            "doses_necessaires": prediction_mois,
            "doses_necessaires_min": int(prediction_mois * 0.85),  # Intervalle confiance
            "doses_necessaires_max": int(prediction_mois * 1.15),
            "confiance": "haute" if len(doses_mensuelles) >= 12 else "moyenne"
        })
    
    # Statistiques historiques
    total_historique = int(doses_mensuelles.sum())
    moyenne_mensuelle_hist = int(doses_mensuelles.mean())
    max_mensuel_hist = int(doses_mensuelles.max())
    
    return {
        "zone": f"Zone {zone_code}" if zone_code else "National",
        "date_prediction": datetime.now().strftime("%Y-%m-%d"),
        "predictions": predictions,
        "statistiques_historiques": {
            "total_doses_distribuees": total_historique,
            "moyenne_mensuelle": moyenne_mensuelle_hist,
            "pic_mensuel": max_mensuel_hist,
            "tendance": f"{tendance_pct:+.1f}%",
            "periode_analysee": f"{doses_mensuelles.index[0]} à {doses_mensuelles.index[-1]}"
        },
        "contexte": {
            "mois_actuel": datetime.now().strftime("%B %Y"),
            "saison": determiner_saison(mois_actuel),
            "facteur_saisonnier": facteur_saisonnier
        },
        "source": "Données historiques IQVIA 2021-2024",
        "methode": "Moyenne mobile + Tendance + Saisonnalité"
    }


def calculer_facteur_zone(zone_code):
    """
    Calcule le facteur de population par zone
    """
    populations = {
        "A": sum([info["population"] for code, info in REGIONS_ZONES.items() if info["zone"] == "A"]),
        "B": sum([info["population"] for code, info in REGIONS_ZONES.items() if info["zone"] == "B"]),
        "C": sum([info["population"] for code, info in REGIONS_ZONES.items() if info["zone"] == "C"])
    }
    
    total_pop = sum(populations.values())
    return populations.get(zone_code, 1) / total_pop


def determiner_saison(mois):
    """
    Détermine la saison de vaccination
    """
    if 10 <= mois <= 12:
        return "Pic de campagne (oct-déc)"
    elif 1 <= mois <= 2:
        return "Fin de campagne (jan-fév)"
    else:
        return "Hors campagne (mars-sept)"


def generer_prediction_fallback(zone_code, horizon_mois):
    """
    Génère une prédiction de secours si pas assez de données
    """
    # Estimation basée sur population cible
    from app.config import POURCENTAGE_CIBLE
    
    if zone_code:
        pop_zone = sum([info["population"] for code, info in REGIONS_ZONES.items() if info["zone"] == zone_code])
    else:
        pop_zone = sum([info["population"] for code, info in REGIONS_ZONES.items()])
    
    pop_cible = int(pop_zone * POURCENTAGE_CIBLE)
    
    # Estimation: 1.5 doses par personne sur la campagne (oct-fév = 5 mois)
    doses_par_mois = int(pop_cible * 1.5 / 5)
    
    predictions = []
    date_debut = datetime.now()
    
    for i in range(horizon_mois):
        mois_futur = date_debut + timedelta(days=30 * (i + 1))
        
        predictions.append({
            "mois": mois_futur.strftime("%Y-%m"),
            "mois_nom": mois_futur.strftime("%B %Y"),
            "doses_necessaires": doses_par_mois,
            "doses_necessaires_min": int(doses_par_mois * 0.8),
            "doses_necessaires_max": int(doses_par_mois * 1.2),
            "confiance": "faible (estimé)"
        })
    
    return {
        "zone": f"Zone {zone_code}" if zone_code else "National",
        "date_prediction": datetime.now().strftime("%Y-%m-%d"),
        "predictions": predictions,
        "source": "Estimation basée sur population cible",
        "methode": "Calcul approximatif (données insuffisantes)",
        "avertissement": "Prédiction estimée - données historiques insuffisantes"
    }


def get_stock_actuel_simule(zone_code=None):
    """
    Simule le stock actuel de doses
    TODO: Connecter à une vraie API de gestion de stock
    """
    # Pour le hackathon, on simule
    if zone_code:
        pop_zone = sum([info["population"] for code, info in REGIONS_ZONES.items() if info["zone"] == zone_code])
        facteur = pop_zone / 65_000_000
    else:
        facteur = 1.0
    
    stock_base = 2_500_000  # 2.5M doses en stock national
    
    return {
        "zone": f"Zone {zone_code}" if zone_code else "National",
        "stock_disponible": int(stock_base * facteur),
        "stock_reserve": int(stock_base * facteur * 0.2),
        "stock_distribue": int(stock_base * facteur * 0.6),
        "date_maj": datetime.now().strftime("%Y-%m-%d"),
        "statut": "simulé (pour démo)"
    }

