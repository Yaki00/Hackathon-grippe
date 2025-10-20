"""
Module pour récupérer les données temps réel des passages aux urgences et SOS Médecins.
Source: Santé Publique France (SurSaUD)
"""
import httpx
from typing import List, Dict, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

BASE_URL = "https://odisse.santepubliquefrance.fr/api/explore/v2.1/catalog/datasets"


class UrgencesAPI:
    """Client pour récupérer les données d'urgences et SOS Médecins."""
    
    def __init__(self):
        self.timeout = 30.0
        
    async def get_donnees_departement(self, limit: int = 100, dep: Optional[str] = None) -> Dict:
        """
        Récupère les données départementales de passages aux urgences.
        
        Args:
            limit: Nombre max de résultats
            dep: Code département (ex: "75" pour Paris)
        
        Returns:
            Dict avec total_count et results
        """
        url = f"{BASE_URL}/grippe-passages-aux-urgences-et-actes-sos-medecins-departement/records"
        
        params = {"limit": limit}
        if dep:
            params["where"] = f"dep='{dep}'"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Récupéré {len(data.get('results', []))} enregistrements départementaux")
                return data
        except Exception as e:
            logger.error(f"Erreur API départements: {e}")
            return {"total_count": 0, "results": []}
    
    async def get_donnees_region(self, limit: int = 100, region: Optional[str] = None) -> Dict:
        """
        Récupère les données régionales de passages aux urgences.
        
        Args:
            limit: Nombre max de résultats
            region: Code région (ex: "11" pour Île-de-France)
        
        Returns:
            Dict avec total_count et results
        """
        url = f"{BASE_URL}/grippe-passages-urgences-et-actes-sos-medecin_reg/records"
        
        params = {"limit": limit, "order_by": "date_complet DESC"}
        if region:
            params["where"] = f"region='{region}'"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Récupéré {len(data.get('results', []))} enregistrements régionaux")
                return data
        except Exception as e:
            logger.error(f"Erreur API régions: {e}")
            return {"total_count": 0, "results": []}
    
    async def get_donnees_nationales(self, limit: int = 100) -> Dict:
        """
        Récupère les données nationales de passages aux urgences.
        
        Returns:
            Dict avec total_count et results
        """
        url = f"{BASE_URL}/grippe-passages-aux-urgences-et-actes-sos-medecins-france/records"
        
        params = {"limit": limit, "order_by": "date_complet DESC"}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Récupéré {len(data.get('results', []))} enregistrements nationaux")
                return data
        except Exception as e:
            logger.error(f"Erreur API nationale: {e}")
            return {"total_count": 0, "results": []}
    
    async def analyser_tendances_region(self, region: str, semaines: int = 8) -> Dict:
        """
        Analyse les tendances des passages aux urgences pour une région.
        
        Args:
            region: Code région
            semaines: Nombre de semaines à analyser
        
        Returns:
            Analyse avec tendances et alertes
        """
        data = await self.get_donnees_region(limit=semaines * 10, region=region)
        
        if not data.get('results'):
            return {
                "region": region,
                "message": "Pas de données disponibles",
                "tendances": []
            }
        
        results = data['results']
        
        # Filtrer pour "Tous âges"
        tous_ages = [r for r in results if r.get('sursaud_cl_age_gene') == 'Tous âges']
        
        if not tous_ages:
            tous_ages = results
        
        # Trier par date
        tous_ages.sort(key=lambda x: x.get('date_complet', ''), reverse=True)
        tous_ages = tous_ages[:semaines]
        
        tendances = []
        for record in tous_ages:
            tendances.append({
                "semaine": record.get('semaine'),
                "date": record.get('date_complet'),
                "region": record.get('reglib', 'Inconnu'),
                "taux_passages_sau": round(record.get('taux_passages_grippe_sau', 0), 2),
                "taux_hospit_sau": round(record.get('taux_hospit_grippe_sau', 0), 2),
                "taux_sos_medecins": round(record.get('taux_actes_grippe_sos', 0), 2) if record.get('taux_actes_grippe_sos') else 0
            })
        
        # Calculer moyennes
        if tendances:
            moy_passages = sum(t['taux_passages_sau'] for t in tendances) / len(tendances)
            moy_hospit = sum(t['taux_hospit_sau'] for t in tendances) / len(tendances)
            moy_sos = sum(t['taux_sos_medecins'] for t in tendances) / len(tendances)
            
            # Déterminer tendance (dernière semaine vs moyenne)
            dernier = tendances[0] if tendances else {}
            evolution_passages = ((dernier.get('taux_passages_sau', 0) - moy_passages) / moy_passages * 100) if moy_passages > 0 else 0
            
            niveau_alerte = "NORMAL"
            if evolution_passages > 30:
                niveau_alerte = "ÉLEVÉ"
            elif evolution_passages > 15:
                niveau_alerte = "MODÉRÉ"
            
            return {
                "region": region,
                "region_nom": tendances[0].get('region', 'Inconnu'),
                "periode": f"{semaines} dernières semaines",
                "tendances": tendances,
                "statistiques": {
                    "moyenne_passages_sau": round(moy_passages, 2),
                    "moyenne_hospitalisations": round(moy_hospit, 2),
                    "moyenne_sos_medecins": round(moy_sos, 2),
                    "evolution_vs_moyenne": round(evolution_passages, 2),
                    "niveau_alerte": niveau_alerte
                },
                "derniere_semaine": dernier
            }
        
        return {
            "region": region,
            "message": "Données insuffisantes",
            "tendances": []
        }
    
    async def comparer_regions(self, limit_par_region: int = 5) -> List[Dict]:
        """
        Compare les taux d'urgences entre toutes les régions.
        
        Returns:
            Liste des régions avec leurs indicateurs
        """
        data = await self.get_donnees_region(limit=500)
        
        if not data.get('results'):
            return []
        
        results = data['results']
        
        # Filtrer pour "Tous âges" et données récentes
        tous_ages = [r for r in results if r.get('sursaud_cl_age_gene') == 'Tous âges']
        
        # Grouper par région
        regions_data = {}
        for record in tous_ages:
            region = record.get('region')
            if region not in regions_data:
                regions_data[region] = []
            regions_data[region].append(record)
        
        # Analyser chaque région
        comparaison = []
        for region_code, records in regions_data.items():
            # Trier par date et prendre les plus récents
            records.sort(key=lambda x: x.get('date_complet', ''), reverse=True)
            recent_records = records[:limit_par_region]
            
            if recent_records:
                moy_passages = sum(r.get('taux_passages_grippe_sau', 0) for r in recent_records) / len(recent_records)
                moy_hospit = sum(r.get('taux_hospit_grippe_sau', 0) for r in recent_records) / len(recent_records)
                moy_sos = sum(r.get('taux_actes_grippe_sos', 0) or 0 for r in recent_records) / len(recent_records)
                
                # Score de risque basé sur les passages
                score_risque = moy_passages / 100  # Normaliser
                
                comparaison.append({
                    "code_region": region_code,
                    "nom_region": recent_records[0].get('reglib', 'Inconnu'),
                    "derniere_date": recent_records[0].get('date_complet'),
                    "taux_moyen_passages": round(moy_passages, 2),
                    "taux_moyen_hospit": round(moy_hospit, 2),
                    "taux_moyen_sos": round(moy_sos, 2),
                    "score_risque": round(score_risque, 2),
                    "niveau": "ÉLEVÉ" if score_risque > 15 else "MODÉRÉ" if score_risque > 10 else "FAIBLE"
                })
        
        # Trier par score de risque décroissant
        comparaison.sort(key=lambda x: x['score_risque'], reverse=True)
        
        return comparaison
    
    async def indicateurs_nationaux(self) -> Dict:
        """
        Calcule les indicateurs nationaux agrégés.
        
        Returns:
            Dict avec indicateurs nationaux
        """
        data = await self.get_donnees_nationales(limit=50)
        
        if not data.get('results'):
            return {
                "message": "Pas de données disponibles",
                "indicateurs": {}
            }
        
        results = data['results']
        
        # Filtrer tous âges
        tous_ages = [r for r in results if r.get('sursaud_cl_age_gene') == 'Tous âges']
        
        if not tous_ages:
            tous_ages = results
        
        # Trier par date
        tous_ages.sort(key=lambda x: x.get('date_complet', ''), reverse=True)
        
        # Données récentes (dernières 4 semaines)
        recents = tous_ages[:4]
        
        if recents:
            moy_passages = sum(r.get('taux_passages_grippe_sau', 0) for r in recents) / len(recents)
            moy_hospit = sum(r.get('taux_hospit_grippe_sau', 0) for r in recents) / len(recents)
            moy_sos = sum(r.get('taux_actes_grippe_sos', 0) or 0 for r in recents) / len(recents)
            
            # Évolution
            if len(recents) >= 2:
                evolution = ((recents[0].get('taux_passages_grippe_sau', 0) - recents[-1].get('taux_passages_grippe_sau', 0)) / recents[-1].get('taux_passages_grippe_sau', 1) * 100)
            else:
                evolution = 0
            
            return {
                "periode": "4 dernières semaines",
                "derniere_mise_a_jour": recents[0].get('date_complet'),
                "indicateurs": {
                    "taux_moyen_passages_urgences": round(moy_passages, 2),
                    "taux_moyen_hospitalisations": round(moy_hospit, 2),
                    "taux_moyen_sos_medecins": round(moy_sos, 2),
                    "evolution_4_semaines": round(evolution, 2),
                    "tendance": "HAUSSE" if evolution > 10 else "BAISSE" if evolution < -10 else "STABLE"
                },
                "dernieres_donnees": [
                    {
                        "semaine": r.get('semaine'),
                        "taux_passages": round(r.get('taux_passages_grippe_sau', 0), 2),
                        "taux_hospit": round(r.get('taux_hospit_grippe_sau', 0), 2)
                    }
                    for r in recents
                ]
            }
        
        return {
            "message": "Données insuffisantes",
            "indicateurs": {}
        }


# Instance globale
urgences_api = UrgencesAPI()

