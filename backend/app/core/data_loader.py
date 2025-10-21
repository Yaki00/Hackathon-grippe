"""
Module de chargement et traitement des données de vaccination.
"""
import pandas as pd
import json
from pathlib import Path
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

DATA_DIR = Path("data/datagouve")


class DataLoader:
    """Charge et traite les données de vaccination."""
    
    def __init__(self):
        self.data_cache = {}
        
    def load_couverture_data(self, year: str = "2024") -> pd.DataFrame:
        """
        Charge les données de couverture vaccinale par région.
        """
        try:
            # Essayer JSON d'abord
            json_file = DATA_DIR / year / f"couverture-{year} (1).json"
            if not json_file.exists():
                json_file = DATA_DIR / year / f"couverture-{year}.json"
            
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
            else:
                # Essayer CSV
                csv_file = DATA_DIR / year / f"couverture-{year}.csv"
                df = pd.read_csv(csv_file)
            
            # Nettoyer les données
            if 'region' in df.columns:
                # Extraire code région
                df['code_region'] = df['region'].str.extract(r'(\d+)')[0]
                df['nom_region'] = df['region'].str.extract(r'-\s*(.+)')[0]
            
            logger.info(f"Chargé {len(df)} lignes de couverture pour {year}")
            return df
            
        except Exception as e:
            logger.error(f"Erreur chargement couverture {year}: {e}")
            return pd.DataFrame()
    
    def load_doses_actes_data(self, year: str = "2024") -> pd.DataFrame:
        """
        Charge les données détaillées de doses et actes.
        """
        try:
            # Essayer JSON
            json_file = DATA_DIR / year / f"doses-actes-{year} (1).json"
            if not json_file.exists():
                json_file = DATA_DIR / year / f"doses-actes-{year}.json"
            
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
            else:
                # Essayer CSV
                csv_file = DATA_DIR / year / f"doses-actes-{year}.csv"
                df = pd.read_csv(csv_file)
            
            logger.info(f"Chargé {len(df)} lignes de doses/actes pour {year}")
            return df
            
        except Exception as e:
            logger.error(f"Erreur chargement doses/actes {year}: {e}")
            return pd.DataFrame()
    
    def load_campagne_data(self, year: str = "2024") -> Dict:
        """
        Charge les données de campagne (métriques globales).
        """
        try:
            json_file = DATA_DIR / year / f"campagne-{year} (1).json"
            if not json_file.exists():
                json_file = DATA_DIR / year / f"campagne-{year}.json"
            
            if json_file.exists():
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return data
            else:
                csv_file = DATA_DIR / year / f"campagne-{year}.csv"
                df = pd.read_csv(csv_file)
                return df.to_dict('records')[0] if len(df) > 0 else {}
                
        except Exception as e:
            logger.error(f"Erreur chargement campagne {year}: {e}")
            return {}
    
    def get_zones_sous_vaccinees(self, year: str = "2024", seuil: float = 50.0) -> List[Dict]:
        """
        Identifie les zones sous-vaccinées.
        
        Args:
            year: Année de données
            seuil: Seuil de couverture en pourcentage (défaut 50%)
        
        Returns:
            Liste des régions sous-vaccinées avec détails
        """
        df = self.load_couverture_data(year)
        
        if df.empty:
            return []
        
        # Calculer le taux de couverture par région
        # ACTE(VGP) = actes vaccinaux
        result = []
        
        if 'region' in df.columns and 'valeur' in df.columns:
            # Grouper par région
            regions = df['region'].unique()
            
            for region in regions:
                region_data = df[df['region'] == region]
                
                # Calculer taux moyen
                actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
                doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
                
                # Extraire code
                code = region_data['code'].iloc[0] if 'code' in region_data.columns else None
                
                # Taux de couverture estimé (actes / population cible * 100)
                # Pour simplifier, on utilise le ratio actes/doses
                taux = (actes / doses * 100) if doses > 0 else 0
                
                if taux < seuil:
                    result.append({
                        'code_region': str(code),
                        'nom_region': region,
                        'taux_couverture': round(taux, 2),
                        'actes': int(actes) if not pd.isna(actes) else 0,
                        'doses_disponibles': int(doses) if not pd.isna(doses) else 0,
                        'deficit': round(seuil - taux, 2)
                    })
        
        # Trier par déficit décroissant
        result.sort(key=lambda x: x['deficit'], reverse=True)
        
        return result
    
    def predire_besoins_vaccins(self, year: str = "2024", horizon_semaines: int = 4) -> Dict:
        """
        Prédit les besoins en vaccins pour les semaines à venir.
        """
        df = self.load_couverture_data(year)
        
        if df.empty:
            return {}
        
        # Calculer besoins par région
        besoins_par_region = []
        
        if 'region' in df.columns:
            regions = df['region'].unique()
            
            for region in regions:
                region_data = df[df['region'] == region]
                
                actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
                doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
                code = region_data['code'].iloc[0] if 'code' in region_data.columns else None
                
                # Prédiction simple basée sur tendance
                taux_actuel = (actes / doses * 100) if doses > 0 else 0
                
                # Estimer besoin pour atteindre 70% de couverture
                besoin_optimal = doses * 0.70
                besoin_actuel = actes
                besoin_supplementaire = max(0, besoin_optimal - besoin_actuel)
                
                # Répartir sur l'horizon
                besoin_par_semaine = besoin_supplementaire / horizon_semaines
                
                besoins_par_region.append({
                    'code_region': str(code),
                    'nom_region': region,
                    'besoin_total': int(besoin_supplementaire),
                    'besoin_par_semaine': int(besoin_par_semaine),
                    'taux_actuel': round(taux_actuel, 2),
                    'objectif': 70.0
                })
        
        # Trier par besoin décroissant
        besoins_par_region.sort(key=lambda x: x['besoin_total'], reverse=True)
        
        total_besoins = sum(r['besoin_total'] for r in besoins_par_region)
        
        return {
            'horizon_semaines': horizon_semaines,
            'total_besoins_national': total_besoins,
            'besoins_par_region': besoins_par_region
        }
    
    def optimiser_distribution(self, year: str = "2024") -> List[Dict]:
        """
        Propose une optimisation de la distribution par zones.
        """
        df = self.load_couverture_data(year)
        
        if df.empty:
            return []
        
        distribution = []
        
        if 'region' in df.columns:
            regions = df['region'].unique()
            
            for region in regions:
                region_data = df[df['region'] == region]
                
                actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
                doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
                code = region_data['code'].iloc[0] if 'code' in region_data.columns else None
                
                taux = (actes / doses * 100) if doses > 0 else 0
                
                # Calculer priorité (plus le taux est bas, plus la priorité est haute)
                priorite = 100 - taux
                
                # Recommandation
                if taux < 40:
                    recommandation = "URGENT - Augmenter distribution de 50%"
                    allocation = 1.5
                elif taux < 55:
                    recommandation = "PRIORITAIRE - Augmenter distribution de 30%"
                    allocation = 1.3
                elif taux < 65:
                    recommandation = "NORMAL - Augmenter distribution de 15%"
                    allocation = 1.15
                else:
                    recommandation = "BON - Maintenir distribution actuelle"
                    allocation = 1.0
                
                distribution.append({
                    'code_region': str(code),
                    'nom_region': region,
                    'taux_couverture': round(taux, 2),
                    'priorite': round(priorite, 2),
                    'recommandation': recommandation,
                    'facteur_allocation': allocation,
                    'doses_recommandees': int(doses * allocation)
                })
        
        # Trier par priorité décroissante
        distribution.sort(key=lambda x: x['priorite'], reverse=True)
        
        return distribution
    
    def anticiper_urgences(self, year: str = "2024") -> Dict:
        """
        Anticipe les passages aux urgences en fonction de la couverture vaccinale.
        
        Logique: Plus la couverture est basse, plus le risque d'urgences est élevé.
        """
        df = self.load_couverture_data(year)
        
        if df.empty:
            return {}
        
        risques_par_region = []
        
        if 'region' in df.columns:
            regions = df['region'].unique()
            
            for region in regions:
                region_data = df[df['region'] == region]
                
                actes = region_data[region_data['variable'] == 'ACTE(VGP)']['valeur'].sum()
                doses = region_data[region_data['variable'] == 'DOSES(J07E1)']['valeur'].sum()
                code = region_data['code'].iloc[0] if 'code' in region_data.columns else None
                
                taux = (actes / doses * 100) if doses > 0 else 0
                
                # Estimation du risque d'urgences (inversement proportionnel au taux)
                # Formule simple: risque = 100 - taux_couverture
                risque_score = 100 - taux
                
                # Estimation passages urgences (fictif mais réaliste)
                # Base: 1000 passages pour 100k habitants * facteur de risque
                estimation_passages = int((risque_score / 100) * 5000)
                
                # Niveau de risque
                if risque_score > 60:
                    niveau = "TRÈS ÉLEVÉ"
                    couleur = "rouge"
                elif risque_score > 45:
                    niveau = "ÉLEVÉ"
                    couleur = "orange"
                elif risque_score > 30:
                    niveau = "MODÉRÉ"
                    couleur = "jaune"
                else:
                    niveau = "FAIBLE"
                    couleur = "vert"
                
                risques_par_region.append({
                    'code_region': str(code),
                    'nom_region': region,
                    'taux_couverture': round(taux, 2),
                    'score_risque': round(risque_score, 2),
                    'niveau_risque': niveau,
                    'couleur': couleur,
                    'estimation_passages_urgences': estimation_passages,
                    'action_recommandee': f"Augmenter vaccination de {int(risque_score/2)}%" if risque_score > 30 else "Maintenir efforts"
                })
        
        # Trier par risque décroissant
        risques_par_region.sort(key=lambda x: x['score_risque'], reverse=True)
        
        return {
            'annee': year,
            'risques_par_region': risques_par_region,
            'regions_a_risque': [r for r in risques_par_region if r['score_risque'] > 45]
        }


# Instance globale
data_loader = DataLoader()

