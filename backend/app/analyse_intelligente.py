"""
Module d'analyse intelligente pour les 4 objectifs stratégiques
Utilise les vraies données + IA locale (Ollama) pour recommandations
"""
import pandas as pd
import numpy as np
from pathlib import Path
import json
from typing import Dict, List, Optional
from scipy import stats
import requests

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "datagouve"
COUVERTURE_VACCINAL_DIR = DATA_DIR / "couverture_vaccinal"
PASSAGE_URGENCE_DIR = DATA_DIR / "passage_urgence"

# Objectif national
OBJECTIF_NATIONAL_65PLUS = 75.0  # 75% de couverture pour les 65+

# Configuration Ollama
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"  # ou mistral, phi3, etc.


# =============================================================================
# FONCTION OLLAMA - AGENT IA LOCAL
# =============================================================================

def appeler_agent_ia(prompt: str, temperature: float = 0.7) -> str:
    """
    Appelle l'agent IA local (Ollama) pour obtenir une analyse/recommandation.
    
    Args:
        prompt: Question ou contexte à analyser
        temperature: Créativité (0=factuel, 1=créatif)
    
    Returns:
        Réponse de l'IA
    """
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "temperature": temperature,
            "options": {
                "num_predict": 500  # Limiter la longueur de réponse
            }
        }
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            return f"Erreur IA (HTTP {response.status_code})"
            
    except requests.exceptions.ConnectionError:
        return "⚠️ Ollama non disponible. Lancez: ollama serve"
    except Exception as e:
        return f"⚠️ Erreur IA: {str(e)}"


# =============================================================================
# OBJECTIF 1 : IDENTIFIER ZONES SOUS-VACCINÉES
# =============================================================================

def identifier_zones_sous_vaccinees(annee: str = "2024", seuil_critique: float = 50.0) -> Dict:
    """
    Identifie les zones sous-vaccinées avec analyse IA.
    
    Args:
        annee: Année d'analyse
        seuil_critique: Seuil en dessous duquel c'est critique
    
    Returns:
        Analyse complète avec recommandations IA
    """
    # 1. Charger données régionales
    chemin = COUVERTURE_VACCINAL_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json"
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    # 2. Filtrer année cible
    df_annee = df[df['an_mesure'] == annee].copy()
    
    # 3. Calculer écarts et classifier
    df_annee['ecart_objectif'] = OBJECTIF_NATIONAL_65PLUS - df_annee['grip_65plus']
    df_annee['statut'] = df_annee['grip_65plus'].apply(lambda x: 
        'critique' if x < seuil_critique else 
        'sous_objectif' if x < OBJECTIF_NATIONAL_65PLUS else 
        'objectif_atteint'
    )
    
    # 4. Évolution historique par région
    evolutions = []
    for _, row in df_annee.iterrows():
        reg = row['reg']
        df_reg_hist = df[df['reg'] == reg].sort_values('an_mesure')
        
        # Calculer tendance sur 5 dernières années disponibles
        df_recent = df_reg_hist[df_reg_hist['an_mesure'].isin(['2019', '2020', '2021', '2022', '2023', '2024'])]
        df_recent = df_recent[df_recent['grip_65plus'].notna()]
        
        if len(df_recent) >= 3:
            # Régression linéaire simple
            x = np.arange(len(df_recent))
            y = df_recent['grip_65plus'].values
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            tendance = "hausse" if slope > 0.5 else "baisse" if slope < -0.5 else "stable"
            variation = slope
        else:
            tendance = "données_insuffisantes"
            variation = 0
        
        evolutions.append({
            'region': row['reglib'],
            'code_region': reg,
            'taux_actuel': float(row['grip_65plus']) if pd.notna(row['grip_65plus']) else None,
            'taux_moins_65': float(row['grip_moins65']) if pd.notna(row['grip_moins65']) else None,
            'ecart_objectif': float(row['ecart_objectif']) if pd.notna(row['ecart_objectif']) else None,
            'statut': row['statut'],
            'tendance': tendance,
            'variation_annuelle': round(variation, 2)
        })
    
    # 5. Trier par priorité (écart le plus grand)
    evolutions_sorted = sorted(evolutions, key=lambda x: x['ecart_objectif'] if x['ecart_objectif'] else 0, reverse=True)
    
    # 6. Identifier top 3 zones prioritaires
    zones_prioritaires = evolutions_sorted[:3]
    
    # 7. Générer recommandations IA pour chaque zone prioritaire
    for zone in zones_prioritaires:
        prompt = f"""Tu es un expert en santé publique. Analyse cette situation de vaccination contre la grippe:

Région: {zone['region']}
Taux de couverture actuel (65+): {zone['taux_actuel']}%
Objectif national: {OBJECTIF_NATIONAL_65PLUS}%
Écart: {zone['ecart_objectif']} points
Tendance: {zone['tendance']}

Donne 3 recommandations concrètes et chiffrées pour améliorer la couverture vaccinale.
Sois bref (3 lignes max par recommandation)."""

        zone['recommandations_ia'] = appeler_agent_ia(prompt, temperature=0.5)
    
    # 8. Synthèse nationale
    taux_moyen = df_annee['grip_65plus'].mean()
    regions_sous_objectif = len(df_annee[df_annee['grip_65plus'] < OBJECTIF_NATIONAL_65PLUS])
    
    return {
        "annee": annee,
        "objectif_national": OBJECTIF_NATIONAL_65PLUS,
        "synthese": {
            "taux_moyen_national": round(taux_moyen, 1),
            "regions_analysees": len(evolutions),
            "regions_sous_objectif": regions_sous_objectif,
            "regions_critiques": len([e for e in evolutions if e['statut'] == 'critique'])
        },
        "zones_prioritaires": zones_prioritaires,
        "toutes_regions": evolutions_sorted
    }


# =============================================================================
# OBJECTIF 2 : PRÉDIRE BESOINS EN VACCINS
# =============================================================================

def predire_besoins_vaccins(annee_cible: str = "2025") -> Dict:
    """
    Prédit les besoins en vaccins par région avec régression linéaire.
    
    Args:
        annee_cible: Année pour laquelle prédire
    
    Returns:
        Prédictions par région avec analyse IA
    """
    # 1. Charger données historiques
    chemin = COUVERTURE_VACCINAL_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json"
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    # 2. Populations estimées par région (65+) - Données INSEE approximatives
    populations_65plus = {
        "11": 1_200_000,  # Île-de-France
        "24": 550_000,    # Centre-Val de Loire
        "27": 630_000,    # Bourgogne-Franche-Comté
        "28": 770_000,    # Normandie
        "32": 1_180_000,  # Hauts-de-France
        "44": 1_200_000,  # Grand Est
        "52": 800_000,    # Pays de la Loire
        "53": 770_000,    # Bretagne
        "75": 1_450_000,  # Nouvelle-Aquitaine
        "76": 1_300_000,  # Occitanie
        "84": 1_800_000,  # Auvergne-Rhône-Alpes
        "93": 1_150_000,  # PACA
        "94": 80_000      # Corse
    }
    
    # 3. Prédictions par région
    predictions = []
    
    for reg_code, population in populations_65plus.items():
        df_reg = df[df['reg'] == reg_code].sort_values('an_mesure')
        
        # Filtrer 2019-2024 pour régression
        df_recent = df_reg[df_reg['an_mesure'].isin(['2019', '2020', '2021', '2022', '2023', '2024'])]
        df_recent = df_recent[df_recent['grip_65plus'].notna()]
        
        if len(df_recent) >= 4:
            # Régression linéaire
            annees_num = df_recent['an_mesure'].astype(int).values
            taux = df_recent['grip_65plus'].values
            
            slope, intercept, r_value, p_value, std_err = stats.linregress(annees_num, taux)
            
            # Prédiction pour année cible
            annee_cible_num = int(annee_cible)
            taux_predit = slope * annee_cible_num + intercept
            taux_predit = max(0, min(100, taux_predit))  # Limiter 0-100%
            
            # Calcul besoins
            personnes_a_vacciner = int(population * (taux_predit / 100))
            doses_necessaires = personnes_a_vacciner  # 1 dose par personne
            
            # Marge de sécurité 10%
            doses_avec_marge = int(doses_necessaires * 1.1)
            
            region_name = df_recent.iloc[0]['reglib']
            taux_2024 = df_recent[df_recent['an_mesure'] == '2024']['grip_65plus'].values[0] if '2024' in df_recent['an_mesure'].values else None
            
            predictions.append({
                'region': region_name,
                'code_region': reg_code,
                'population_65plus': population,
                'taux_2024': round(float(taux_2024), 1) if taux_2024 else None,
                'taux_predit_2025': round(taux_predit, 1),
                'evolution_prevue': round(taux_predit - (taux_2024 if taux_2024 else taux_predit), 1),
                'personnes_a_vacciner': personnes_a_vacciner,
                'doses_necessaires': doses_necessaires,
                'doses_avec_marge_10pct': doses_avec_marge,
                'confiance_prediction': round(r_value ** 2, 2)  # R²
            })
    
    # 4. Trier par besoins décroissants
    predictions_sorted = sorted(predictions, key=lambda x: x['doses_necessaires'], reverse=True)
    
    # 5. Analyse IA globale
    total_doses = sum(p['doses_avec_marge_10pct'] for p in predictions)
    
    prompt = f"""Tu es un expert en logistique vaccinale. Analyse ces prévisions pour {annee_cible}:

Total doses nécessaires France: {total_doses:,}
Nombre de régions: {len(predictions)}
Top 3 besoins:
1. {predictions_sorted[0]['region']}: {predictions_sorted[0]['doses_avec_marge_10pct']:,} doses
2. {predictions_sorted[1]['region']}: {predictions_sorted[1]['doses_avec_marge_10pct']:,} doses
3. {predictions_sorted[2]['region']}: {predictions_sorted[2]['doses_avec_marge_10pct']:,} doses

Donne 3 recommandations stratégiques pour la commande et la distribution.
Sois concret et chiffré."""

    analyse_ia = appeler_agent_ia(prompt, temperature=0.5)
    
    return {
        "annee_cible": annee_cible,
        "date_prediction": "2024",
        "synthese": {
            "total_doses_necessaires": total_doses,
            "total_personnes_ciblees": sum(p['personnes_a_vacciner'] for p in predictions),
            "population_totale_65plus": sum(p['population_65plus'] for p in predictions),
            "taux_moyen_predit": round(sum(p['taux_predit_2025'] for p in predictions) / len(predictions), 1)
        },
        "predictions_par_region": predictions_sorted,
        "recommandations_ia": analyse_ia,
        "methode": "Régression linéaire 2019-2024"
    }


# =============================================================================
# OBJECTIF 3 : OPTIMISER DISTRIBUTION (GASPILLAGE)
# =============================================================================

def optimiser_distribution_zones(annee: str = "2024") -> Dict:
    """
    Analyse l'efficacité de la distribution et identifie le gaspillage.
    
    Args:
        annee: Année d'analyse
    
    Returns:
        Analyse avec recommandations d'optimisation
    """
    # 1. Charger données IQVIA (doses distribuées vs actes)
    chemin = DATA_DIR / annee / f"couverture-{annee} (1).json"
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    # 2. Calculer par région
    analyses = []
    
    for code_region in df['code'].unique():
        df_reg = df[df['code'] == code_region]
        region_name = df_reg.iloc[0]['region']
        
        # Séparer par groupe d'âge
        doses_65plus = df_reg[(df_reg['variable'] == 'DOSES(J07E1)') & (df_reg['groupe'] == '65 ans et plus')]['valeur'].sum()
        actes_65plus = df_reg[(df_reg['variable'] == 'ACTE(VGP)') & (df_reg['groupe'] == '65 ans et plus')]['valeur'].sum()
        
        doses_moins65 = df_reg[(df_reg['variable'] == 'DOSES(J07E1)') & (df_reg['groupe'] == 'moins de 65 ans')]['valeur'].sum()
        actes_moins65 = df_reg[(df_reg['variable'] == 'ACTE(VGP)') & (df_reg['groupe'] == 'moins de 65 ans')]['valeur'].sum()
        
        # Totaux (en milliers)
        total_doses = doses_65plus + doses_moins65
        total_actes = actes_65plus + actes_moins65
        
        # Taux d'utilisation
        taux_utilisation = (total_actes / total_doses * 100) if total_doses > 0 else 0
        
        # Gaspillage
        doses_non_utilisees = total_doses - total_actes
        taux_gaspillage = (doses_non_utilisees / total_doses * 100) if total_doses > 0 else 0
        
        # Statut
        if taux_utilisation >= 80:
            statut = "optimal"
        elif taux_utilisation >= 65:
            statut = "acceptable"
        else:
            statut = "problematique"
        
        analyses.append({
            'region': region_name,
            'code_region': str(code_region),
            'doses_distribuees_milliers': round(total_doses, 1),
            'actes_realises_milliers': round(total_actes, 1),
            'doses_non_utilisees_milliers': round(doses_non_utilisees, 1),
            'taux_utilisation_pct': round(taux_utilisation, 1),
            'taux_gaspillage_pct': round(taux_gaspillage, 1),
            'statut': statut,
            'detail_65plus': {
                'doses': round(doses_65plus, 1),
                'actes': round(actes_65plus, 1),
                'utilisation': round((actes_65plus / doses_65plus * 100) if doses_65plus > 0 else 0, 1)
            },
            'detail_moins65': {
                'doses': round(doses_moins65, 1),
                'actes': round(actes_moins65, 1),
                'utilisation': round((actes_moins65 / doses_moins65 * 100) if doses_moins65 > 0 else 0, 1)
            }
        })
    
    # 3. Trier par gaspillage décroissant
    analyses_sorted = sorted(analyses, key=lambda x: x['taux_gaspillage_pct'], reverse=True)
    
    # 4. Top 3 zones à optimiser
    top_gaspillage = analyses_sorted[:3]
    
    # 5. Analyse IA pour optimisation
    for zone in top_gaspillage:
        prompt = f"""Tu es un expert en optimisation logistique. Analyse cette situation:

Région: {zone['region']}
Doses distribuées: {zone['doses_distribuees_milliers']*1000:,.0f}
Actes réalisés: {zone['actes_realises_milliers']*1000:,.0f}
Taux d'utilisation: {zone['taux_utilisation_pct']}%
Gaspillage: {zone['taux_gaspillage_pct']}%

Propose 3 actions concrètes pour réduire le gaspillage.
Sois chiffré et pragmatique."""

        zone['recommandations_ia'] = appeler_agent_ia(prompt, temperature=0.5)
    
    # 6. Calculs nationaux
    total_doses_national = sum(a['doses_distribuees_milliers'] for a in analyses) * 1000
    total_actes_national = sum(a['actes_realises_milliers'] for a in analyses) * 1000
    total_gaspillage = total_doses_national - total_actes_national
    taux_util_national = (total_actes_national / total_doses_national * 100) if total_doses_national > 0 else 0
    
    # Économie potentielle si on atteint 80% d'utilisation
    doses_optimales = total_actes_national / 0.8
    economie_potentielle = total_doses_national - doses_optimales
    
    return {
        "annee": annee,
        "synthese_nationale": {
            "doses_distribuees_total": int(total_doses_national),
            "actes_realises_total": int(total_actes_national),
            "doses_gaspillees": int(total_gaspillage),
            "taux_utilisation_moyen": round(taux_util_national, 1),
            "taux_gaspillage_moyen": round(100 - taux_util_national, 1),
            "economie_potentielle_doses": int(economie_potentielle),
            "valeur_gaspillage_euros": int(total_gaspillage * 10)  # ~10€ par dose
        },
        "zones_a_optimiser": top_gaspillage,
        "toutes_regions": analyses_sorted,
        "objectif_cible": "80% d'utilisation"
    }


# =============================================================================
# OBJECTIF 4 : ANTICIPER PASSAGES URGENCES
# =============================================================================

def anticiper_passages_urgences(periode: str = "hiver_2024") -> Dict:
    """
    Analyse la corrélation entre vaccination et passages aux urgences.
    Prédit l'impact d'une amélioration de la couverture vaccinale.
    
    Args:
        periode: Période d'analyse
    
    Returns:
        Corrélations et prédictions avec analyse IA
    """
    # 1. Charger données passages urgences régional
    chemin_urgences = PASSAGE_URGENCE_DIR / "grippe-passages-urgences-et-actes-sos-medecin_reg.json"
    with open(chemin_urgences, 'r', encoding='utf-8') as f:
        data_urgences = json.load(f)
    df_urgences = pd.DataFrame(data_urgences)
    
    # 2. Charger données couverture vaccinale
    chemin_couv = COUVERTURE_VACCINAL_DIR / "couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json"
    with open(chemin_couv, 'r', encoding='utf-8') as f:
        data_couv = json.load(f)
    df_couv = pd.DataFrame(data_couv)
    
    # 3. Analyser par région (focus sur 65+, période hivernale)
    correlations = []
    
    # Filtrer données hivernales 2024 (semaines 40-52 de 2023 et 1-20 de 2024)
    df_hiver = df_urgences[
        (df_urgences['semaine'].str.contains('2023-S4') | 
         df_urgences['semaine'].str.contains('2023-S5') |
         df_urgences['semaine'].str.contains('2024-S0') |
         df_urgences['semaine'].str.contains('2024-S1'))
    ]
    
    # Pour chaque région
    for reg_code in df_couv['reg'].unique():
        # Taux vaccination 2024
        taux_vaccin = df_couv[(df_couv['reg'] == reg_code) & (df_couv['an_mesure'] == '2024')]['grip_65plus'].values
        if len(taux_vaccin) == 0:
            continue
        taux_vaccin = float(taux_vaccin[0])
        
        region_name = df_couv[df_couv['reg'] == reg_code].iloc[0]['reglib']
        
        # Taux passages urgences moyen pour cette région (focus 65+)
        df_reg_urg = df_hiver[
            (df_hiver['region'] == reg_code) & 
            (df_hiver['sursaud_cl_age_gene'] == '65 ans et plus')
        ]
        
        if len(df_reg_urg) == 0:
            continue
        
        taux_urg_moyen = df_reg_urg['taux_passages_grippe_sau'].mean()
        taux_hospit_moyen = df_reg_urg['taux_hospit_grippe_sau'].mean()
        
        correlations.append({
            'region': region_name,
            'code_region': reg_code,
            'taux_vaccination_65plus': round(taux_vaccin, 1),
            'taux_passages_urgences_moyen': round(taux_urg_moyen, 2),
            'taux_hospitalisations_moyen': round(taux_hospit_moyen, 2),
            'nombre_semaines_analysees': len(df_reg_urg)
        })
    
    # 4. Calculer corrélation globale
    if len(correlations) > 3:
        taux_vacc = [c['taux_vaccination_65plus'] for c in correlations]
        taux_urg = [c['taux_passages_urgences_moyen'] for c in correlations]
        
        correlation, p_value = stats.pearsonr(taux_vacc, taux_urg)
        
        # Régression pour prédiction
        slope, intercept, r_value, p_val_reg, std_err = stats.linregress(taux_vacc, taux_urg)
        
        # Prédiction si on augmente vaccination de 10 points partout
        predictions_amelioration = []
        for c in correlations:
            taux_actuel = c['taux_vaccination_65plus']
            urg_actuelles = c['taux_passages_urgences_moyen']
            
            nouveau_taux = min(taux_actuel + 10, 75)  # +10 points, max 75%
            urg_predites = slope * nouveau_taux + intercept
            reduction = urg_actuelles - urg_predites
            reduction_pct = (reduction / urg_actuelles * 100) if urg_actuelles > 0 else 0
            
            predictions_amelioration.append({
                'region': c['region'],
                'taux_vaccination_actuel': taux_actuel,
                'taux_vaccination_ameliore': round(nouveau_taux, 1),
                'urgences_actuelles': round(urg_actuelles, 2),
                'urgences_predites': round(max(0, urg_predites), 2),
                'reduction_absolue': round(reduction, 2),
                'reduction_pct': round(reduction_pct, 1)
            })
        
        # Trier par réduction potentielle
        predictions_sorted = sorted(predictions_amelioration, key=lambda x: x['reduction_pct'], reverse=True)
        
        # 5. Analyse IA
        prompt = f"""Tu es un expert en épidémiologie. Analyse cette corrélation:

Corrélation vaccination/urgences: {correlation:.2f} (p={p_value:.3f})
Plus la vaccination augmente, les urgences {"diminuent" if correlation < 0 else "augmentent"}.

Top 3 régions bénéficiaires d'une amélioration:
1. {predictions_sorted[0]['region']}: {predictions_sorted[0]['reduction_pct']:.1f}% de réduction
2. {predictions_sorted[1]['region']}: {predictions_sorted[1]['reduction_pct']:.1f}% de réduction
3. {predictions_sorted[2]['region']}: {predictions_sorted[2]['reduction_pct']:.1f}% de réduction

Donne 3 recommandations stratégiques pour réduire la pression sur les urgences via la vaccination."""

        analyse_ia = appeler_agent_ia(prompt, temperature=0.5)
        
        return {
            "periode": periode,
            "analyse_statistique": {
                "correlation_pearson": round(correlation, 3),
                "p_value": round(p_value, 4),
                "interpretation": "Corrélation négative significative" if (correlation < -0.3 and p_value < 0.05) else "Corrélation faible ou non significative",
                "equation_regression": f"Urgences = {slope:.2f} × Vaccination + {intercept:.2f}"
            },
            "impact_simulation": {
                "scenario": "Augmentation de 10 points de couverture vaccinale",
                "regions_analysees": len(predictions_amelioration),
                "reduction_moyenne_pct": round(sum(p['reduction_pct'] for p in predictions_amelioration) / len(predictions_amelioration), 1)
            },
            "predictions_par_region": predictions_sorted,
            "recommandations_ia": analyse_ia,
            "donnees_analysees": {
                "regions": len(correlations),
                "periode_urgences": "Hiver 2023-2024",
                "annee_vaccination": "2024"
            }
        }
    else:
        return {
            "periode": periode,
            "erreur": "Données insuffisantes pour analyse de corrélation",
            "regions_disponibles": len(correlations)
        }

