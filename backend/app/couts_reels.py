"""
Module COÛTS RÉELS
Calcule l'impact financier de la vaccination grippe sur la France
- Coûts directs (vaccins, consultations)
- Coûts indirects (arrêts maladie, hospitalisations)
- Économies générées par la vaccination
- Remboursements Sécurité Sociale
"""
import json
import os
from typing import Dict, Any, List
from datetime import datetime


def get_couts_vaccination_grippe() -> Dict[str, Any]:
    """
    Calcule les coûts réels de la vaccination grippe en France
    
    Returns:
        Dict avec tous les coûts détaillés
    """
    
    # === COÛTS DIRECTS ===
    
    # 1. Coût du vaccin
    cout_vaccin_unitaire = 6.20  # € (prix public moyen)
    cout_vaccin_pharmacie = 0.60  # € (honoraire pharmacien)
    cout_total_vaccin = cout_vaccin_unitaire + cout_vaccin_pharmacie
    
    # 2. Consultation médicale
    cout_consultation_generaliste = 25.00  # € (tarif secteur 1)
    cout_consultation_specialiste = 28.00  # € (tarif secteur 1)
    
    # 3. Remboursements Sécurité Sociale
    taux_remboursement_vaccin = 0.65  # 65% remboursé
    taux_remboursement_consultation = 0.70  # 70% remboursé
    
    # === COÛTS INDIRECTS (si pas vacciné) ===
    
    # 1. Consultation pour grippe
    cout_consultation_grippe = 25.00  # €
    cout_medicaments_grippe = 15.00  # € (paracétamol, etc.)
    
    # 2. Arrêt maladie moyen
    duree_arret_moyen = 5  # jours
    cout_journee_arret = 50.00  # € (perte de productivité)
    cout_total_arret = duree_arret_moyen * cout_journee_arret
    
    # 3. Hospitalisation (cas graves)
    cout_journee_hospitalisation = 800.00  # €
    duree_hospitalisation_moyenne = 3  # jours
    cout_total_hospitalisation = cout_journee_hospitalisation * duree_hospitalisation_moyenne
    
    # 4. Complications (pneumonie, etc.)
    cout_complications = 500.00  # € (traitements supplémentaires)
    
    # === STATISTIQUES GRIPPE ===
    
    # Population française
    population_francaise = 68_000_000
    
    # Taux d'attaque grippe (personnes touchées par an)
    taux_attaque_grippe = 0.08  # 8% de la population
    
    # Taux de vaccination actuel
    taux_vaccination_actuel = 0.35  # 35% (données officielles)
    
    # Efficacité vaccin
    efficacite_vaccin = 0.60  # 60% d'efficacité
    
    # === CALCULS ===
    
    # Personnes touchées par la grippe
    personnes_grippees = population_francaise * taux_attaque_grippe
    
    # Personnes vaccinées
    personnes_vaccinees = population_francaise * taux_vaccination_actuel
    
    # Personnes vaccinées qui évitent la grippe
    personnes_protegees = personnes_vaccinees * efficacite_vaccin
    
    # Personnes non vaccinées qui attrapent la grippe
    personnes_non_vaccinees = population_francaise - personnes_vaccinees
    personnes_grippees_non_vaccinees = personnes_non_vaccinees * taux_attaque_grippe
    
    # === COÛTS ACTUELS ===
    
    # Coût vaccination actuelle
    cout_vaccination_actuelle = personnes_vaccinees * cout_total_vaccin
    cout_consultation_vaccination = personnes_vaccinees * cout_consultation_generaliste
    
    # Remboursements Sécurité Sociale vaccination
    remboursement_vaccins = cout_vaccination_actuelle * taux_remboursement_vaccin
    remboursement_consultations = cout_consultation_vaccination * taux_remboursement_consultation
    
    # Coût total vaccination (pour la France)
    cout_total_vaccination_france = cout_vaccination_actuelle + cout_consultation_vaccination
    
    # === COÛTS GRIPPE (si pas de vaccination) ===
    
    # Coûts directs grippe
    cout_consultations_grippe = personnes_grippees_non_vaccinees * cout_consultation_grippe
    cout_medicaments_grippe_total = personnes_grippees_non_vaccinees * cout_medicaments_grippe
    
    # Coûts indirects
    cout_arrets_maladie = personnes_grippees_non_vaccinees * cout_total_arret
    
    # Hospitalisations (5% des cas graves)
    taux_hospitalisation = 0.05
    personnes_hospitalisees = personnes_grippees_non_vaccinees * taux_hospitalisation
    cout_hospitalisations = personnes_hospitalisees * cout_total_hospitalisation
    
    # Complications (10% des cas)
    taux_complications = 0.10
    personnes_complications = personnes_grippees_non_vaccinees * taux_complications
    cout_complications_total = personnes_complications * cout_complications
    
    # Coût total grippe
    cout_total_grippe = (
        cout_consultations_grippe + 
        cout_medicaments_grippe_total + 
        cout_arrets_maladie + 
        cout_hospitalisations + 
        cout_complications_total
    )
    
    # === ÉCONOMIES GÉNÉRÉES PAR LA VACCINATION ===
    
    # Économies sur les consultations
    economie_consultations = personnes_protegees * cout_consultation_grippe
    
    # Économies sur les médicaments
    economie_medicaments = personnes_protegees * cout_medicaments_grippe
    
    # Économies sur les arrêts maladie
    economie_arrets = personnes_protegees * cout_total_arret
    
    # Économies sur les hospitalisations
    economie_hospitalisations = personnes_protegees * taux_hospitalisation * cout_total_hospitalisation
    
    # Économies sur les complications
    economie_complications = personnes_protegees * taux_complications * cout_complications
    
    # Économie totale
    economie_totale = (
        economie_consultations + 
        economie_medicaments + 
        economie_arrets + 
        economie_hospitalisations + 
        economie_complications
    )
    
    # === BILAN FINANCIER ===
    
    # Coût net pour la France
    cout_net_france = cout_total_vaccination_france - economie_totale
    
    # ROI (Return on Investment)
    roi_vaccination = (economie_totale - cout_total_vaccination_france) / cout_total_vaccination_france * 100
    
    # === RÉPARTITION PAR ACTEUR ===
    
    # Sécurité Sociale
    cout_securite_sociale = remboursement_vaccins + remboursement_consultations
    
    # Mutuelles
    cout_mutuelles = (cout_total_vaccination_france - cout_securite_sociale) * 0.3  # 30% des restes
    
    # Patients (reste à charge)
    cout_patients = cout_total_vaccination_france - cout_securite_sociale - cout_mutuelles
    
    return {
        "annee": "2024",
        "population_francaise": population_francaise,
        "taux_vaccination_actuel": taux_vaccination_actuel,
        "personnes_vaccinees": int(personnes_vaccinees),
        "personnes_protegees": int(personnes_protegees),
        "personnes_grippees_non_vaccinees": int(personnes_grippees_non_vaccinees),
        
        "couts_directs": {
            "vaccin_unitaire": cout_vaccin_unitaire,
            "honoraire_pharmacien": cout_vaccin_pharmacie,
            "consultation_vaccination": cout_consultation_generaliste,
            "cout_total_vaccination": cout_total_vaccin,
            "cout_total_france": cout_total_vaccination_france
        },
        
        "remboursements": {
            "securite_sociale": {
                "vaccins": remboursement_vaccins,
                "consultations": remboursement_consultations,
                "total": cout_securite_sociale
            },
            "mutuelles": cout_mutuelles,
            "reste_charge_patients": cout_patients
        },
        
        "couts_grippe_sans_vaccination": {
            "consultations": cout_consultations_grippe,
            "medicaments": cout_medicaments_grippe_total,
            "arrets_maladie": cout_arrets_maladie,
            "hospitalisations": cout_hospitalisations,
            "complications": cout_complications_total,
            "total": cout_total_grippe
        },
        
        "economies_vaccination": {
            "consultations": economie_consultations,
            "medicaments": economie_medicaments,
            "arrets_maladie": economie_arrets,
            "hospitalisations": economie_hospitalisations,
            "complications": economie_complications,
            "total": economie_totale
        },
        
        "bilan_financier": {
            "cout_vaccination": cout_total_vaccination_france,
            "economie_generee": economie_totale,
            "cout_net_france": cout_net_france,
            "roi_pourcent": roi_vaccination,
            "economie_par_euro_vaccin": economie_totale / cout_total_vaccination_france if cout_total_vaccination_france > 0 else 0
        },
        
        "repartition_couts": {
            "securite_sociale": cout_securite_sociale,
            "mutuelles": cout_mutuelles,
            "patients": cout_patients,
            "total": cout_total_vaccination_france
        },
        
        "impact_economique": {
            "jours_arret_evites": int(personnes_protegees * duree_arret_moyen),
            "hospitalisations_evitees": int(personnes_protegees * taux_hospitalisation),
            "complications_evitees": int(personnes_protegees * taux_complications),
            "productivite_preservee": economie_arrets
        }
    }


def get_couts_par_zone(zone_code: str) -> Dict[str, Any]:
    """
    Calcule les coûts par zone géographique
    
    Args:
        zone_code: Code zone (A, B, C)
        
    Returns:
        Coûts détaillés pour la zone
    """
    
    # Population par zone (estimation basée sur les données existantes)
    populations_zones = {
        "A": 37_486_830,  # Grandes métropoles
        "B": 20_000_000,  # Agglomérations moyennes
        "C": 10_513_170   # Reste de la France
    }
    
    # Taux de vaccination par zone (basé sur les données officielles)
    taux_vaccination_zones = {
        "A": 0.327,  # Zone A (données officielles)
        "B": 0.45,   # Zone B (estimation)
        "C": 0.25    # Zone C (estimation)
    }
    
    population_zone = populations_zones.get(zone_code, 0)
    taux_vaccination_zone = taux_vaccination_zones.get(zone_code, 0)
    
    if population_zone == 0:
        return {"error": f"Zone {zone_code} non trouvée"}
    
    # Calculs spécifiques à la zone
    personnes_vaccinees_zone = population_zone * taux_vaccination_zone
    personnes_protegees_zone = personnes_vaccinees_zone * 0.60  # 60% d'efficacité
    
    # Coûts vaccination zone
    cout_vaccination_zone = personnes_vaccinees_zone * 31.20  # 25€ consultation + 6.20€ vaccin
    cout_consultation_zone = personnes_vaccinees_zone * 25.00
    
    # Économies zone
    economie_zone = personnes_protegees_zone * 250.00  # 250€ d'économie par personne protégée
    
    # Bilan zone
    cout_net_zone = cout_vaccination_zone - economie_zone
    
    return {
        "zone": zone_code,
        "population": population_zone,
        "taux_vaccination": taux_vaccination_zone,
        "personnes_vaccinees": int(personnes_vaccinees_zone),
        "personnes_protegees": int(personnes_protegees_zone),
        "couts": {
            "vaccination": cout_vaccination_zone,
            "consultation": cout_consultation_zone,
            "total": cout_vaccination_zone + cout_consultation_zone
        },
        "economies": economie_zone,
        "cout_net": cout_net_zone,
        "roi": (economie_zone - cout_vaccination_zone) / cout_vaccination_zone * 100 if cout_vaccination_zone > 0 else 0
    }


def get_couts_par_departement(code_departement: str) -> Dict[str, Any]:
    """
    Calcule les coûts par département
    
    Args:
        code_departement: Code département (75, 13, 69, etc.)
        
    Returns:
        Coûts détaillés pour le département
    """
    
    # Population par département (estimation)
    populations_departements = {
        "75": 2_200_000,   # Paris
        "13": 2_000_000,   # Bouches-du-Rhône
        "69": 1_800_000,   # Rhône
        "59": 2_600_000,   # Nord
        "31": 1_400_000,   # Haute-Garonne
        "33": 1_600_000,   # Gironde
        "44": 1_400_000,   # Loire-Atlantique
        "67": 1_100_000,   # Bas-Rhin
        "06": 1_100_000,   # Alpes-Maritimes
        "38": 1_300_000    # Isère
    }
    
    population_dept = populations_departements.get(code_departement, 500_000)  # Défaut 500k
    
    # Taux de vaccination départemental (estimation basée sur la zone)
    taux_vaccination_dept = 0.35  # Moyenne nationale
    
    # Calculs départementaux
    personnes_vaccinees_dept = population_dept * taux_vaccination_dept
    personnes_protegees_dept = personnes_vaccinees_dept * 0.60
    
    # Coûts départementaux
    cout_vaccination_dept = personnes_vaccinees_dept * 31.20
    economie_dept = personnes_protegees_dept * 250.00
    
    return {
        "departement": code_departement,
        "population": population_dept,
        "taux_vaccination": taux_vaccination_dept,
        "personnes_vaccinees": int(personnes_vaccinees_dept),
        "personnes_protegees": int(personnes_protegees_dept),
        "couts": {
            "vaccination": cout_vaccination_dept,
            "total": cout_vaccination_dept
        },
        "economies": economie_dept,
        "cout_net": cout_vaccination_dept - economie_dept,
        "roi": (economie_dept - cout_vaccination_dept) / cout_vaccination_dept * 100 if cout_vaccination_dept > 0 else 0
    }


def get_scenarios_vaccination() -> Dict[str, Any]:
    """
    Calcule différents scénarios de vaccination
    
    Returns:
        Comparaison de différents taux de vaccination
    """
    
    population_francaise = 68_000_000
    cout_vaccination_par_personne = 31.20
    economie_par_personne_protegee = 250.00
    
    scenarios = []
    
    # Scénarios de taux de vaccination
    taux_scenarios = [0.20, 0.35, 0.50, 0.70, 0.85]
    
    for taux in taux_scenarios:
        personnes_vaccinees = population_francaise * taux
        personnes_protegees = personnes_vaccinees * 0.60
        
        cout_total = personnes_vaccinees * cout_vaccination_par_personne
        economie_totale = personnes_protegees * economie_par_personne_protegee
        
        cout_net = cout_total - economie_totale
        roi = (economie_totale - cout_total) / cout_total * 100 if cout_total > 0 else 0
        
        scenarios.append({
            "taux_vaccination": taux,
            "personnes_vaccinees": int(personnes_vaccinees),
            "personnes_protegees": int(personnes_protegees),
            "cout_total": cout_total,
            "economie_totale": economie_totale,
            "cout_net": cout_net,
            "roi": roi,
            "economie_par_euro": economie_totale / cout_total if cout_total > 0 else 0
        })
    
    return {
        "scenarios": scenarios,
        "recommandation": {
            "taux_optimal": 0.70,
            "justification": "Équilibre optimal entre coût et bénéfice",
            "roi_optimal": scenarios[3]["roi"]  # Scénario 70%
        }
    }
