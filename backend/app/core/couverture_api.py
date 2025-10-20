"""
Module pour récupérer les données temps réel de couverture vaccinale.
Source: Santé Publique France
"""
import httpx
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://odisse.santepubliquefrance.fr/api/explore/v2.1/catalog/datasets"


class CouvertureAPI:
    """Client pour récupérer les données de couverture vaccinale."""
    
    def __init__(self):
        self.timeout = 30.0
        
    async def get_couverture_nationale(self, limit: int = 20) -> Dict:
        """
        Récupère les données nationales de couverture vaccinale depuis 2011.
        
        Returns:
            Dict avec total_count et results
        """
        url = f"{BASE_URL}/couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-france/records"
        
        params = {"limit": limit, "order_by": "an_mesure DESC"}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Récupéré {len(data.get('results', []))} enregistrements nationaux de couverture")
                return data
        except Exception as e:
            logger.error(f"Erreur API couverture nationale: {e}")
            return {"total_count": 0, "results": []}
    
    async def get_couverture_region(self, limit: int = 100, region: Optional[str] = None) -> Dict:
        """
        Récupère les données régionales de couverture vaccinale depuis 2011.
        
        Args:
            limit: Nombre max de résultats
            region: Code région (ex: "11" pour Île-de-France)
        
        Returns:
            Dict avec total_count et results
        """
        url = f"{BASE_URL}/couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region/records"
        
        params = {"limit": limit, "order_by": "an_mesure DESC"}
        if region:
            params["where"] = f"reg='{region}'"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                logger.info(f"Récupéré {len(data.get('results', []))} enregistrements régionaux de couverture")
                return data
        except Exception as e:
            logger.error(f"Erreur API couverture régionale: {e}")
            return {"total_count": 0, "results": []}
    
    async def analyser_couverture_grippe_region(self, region: str) -> Dict:
        """
        Analyse l'évolution de la couverture vaccinale grippe pour une région.
        
        Args:
            region: Code région
        
        Returns:
            Analyse avec historique et tendances
        """
        data = await self.get_couverture_region(limit=50, region=region)
        
        if not data.get('results'):
            return {
                "region": region,
                "message": "Pas de données disponibles",
                "evolution": []
            }
        
        results = data['results']
        
        # Filtrer et organiser les données grippe
        evolution = []
        for record in results:
            annee = record.get('an_mesure')
            grip_moins65 = record.get('grip_moins65')
            grip_65plus = record.get('grip_65plus')
            
            # Ne garder que les années avec données grippe
            if grip_moins65 is not None or grip_65plus is not None:
                evolution.append({
                    "annee": annee,
                    "region_nom": record.get('reglib', 'Inconnu'),
                    "couverture_moins_65ans": grip_moins65,
                    "couverture_65plus": grip_65plus,
                    "couverture_65_74": record.get('grip_6574'),
                    "couverture_75plus": record.get('grip_75plus')
                })
        
        # Trier par année décroissante
        evolution.sort(key=lambda x: x['annee'], reverse=True)
        
        if not evolution:
            return {
                "region": region,
                "message": "Pas de données grippe disponibles",
                "evolution": []
            }
        
        # Calculer tendance
        derniere_annee = evolution[0]
        if len(evolution) > 1:
            annee_precedente = evolution[1]
            
            # Évolution 65+
            if derniere_annee['couverture_65plus'] and annee_precedente['couverture_65plus']:
                evolution_65plus = derniere_annee['couverture_65plus'] - annee_precedente['couverture_65plus']
            else:
                evolution_65plus = None
            
            # Évolution <65
            if derniere_annee['couverture_moins_65ans'] and annee_precedente['couverture_moins_65ans']:
                evolution_moins65 = derniere_annee['couverture_moins_65ans'] - annee_precedente['couverture_moins_65ans']
            else:
                evolution_moins65 = None
        else:
            evolution_65plus = None
            evolution_moins65 = None
        
        return {
            "region": region,
            "region_nom": evolution[0].get('region_nom'),
            "derniere_annee": derniere_annee['annee'],
            "couverture_actuelle": {
                "moins_65ans": derniere_annee['couverture_moins_65ans'],
                "65_plus": derniere_annee['couverture_65plus'],
                "objectif_65plus": 75.0  # Objectif recommandé OMS
            },
            "tendance": {
                "evolution_65plus": round(evolution_65plus, 2) if evolution_65plus else None,
                "evolution_moins65": round(evolution_moins65, 2) if evolution_moins65 else None,
                "direction_65plus": "HAUSSE" if evolution_65plus and evolution_65plus > 0 else "BAISSE" if evolution_65plus and evolution_65plus < 0 else "STABLE"
            },
            "atteint_objectif_65plus": derniere_annee['couverture_65plus'] >= 75.0 if derniere_annee['couverture_65plus'] else False,
            "evolution_historique": evolution
        }
    
    async def comparer_couverture_regions(self) -> List[Dict]:
        """
        Compare la couverture vaccinale grippe entre toutes les régions.
        
        Returns:
            Liste des régions avec leurs taux de couverture
        """
        data = await self.get_couverture_region(limit=300)
        
        if not data.get('results'):
            return []
        
        results = data['results']
        
        # Grouper par région et prendre la dernière année
        regions_data = {}
        for record in results:
            region = record.get('reg')
            annee = record.get('an_mesure')
            
            if region not in regions_data:
                regions_data[region] = []
            regions_data[region].append(record)
        
        # Analyser chaque région
        comparaison = []
        for region_code, records in regions_data.items():
            # Trier par année et prendre la plus récente avec données grippe
            records.sort(key=lambda x: x.get('an_mesure', '0'), reverse=True)
            
            derniere_donnee = None
            for record in records:
                if record.get('grip_65plus') is not None:
                    derniere_donnee = record
                    break
            
            if derniere_donnee:
                grip_65plus = derniere_donnee.get('grip_65plus', 0)
                grip_moins65 = derniere_donnee.get('grip_moins65', 0)
                
                # Calculer score (pondéré 65+)
                score = (grip_65plus * 0.7 + grip_moins65 * 0.3) if grip_65plus and grip_moins65 else grip_65plus or grip_moins65 or 0
                
                # Évaluation
                if score >= 70:
                    evaluation = "BON"
                elif score >= 50:
                    evaluation = "MOYEN"
                else:
                    evaluation = "FAIBLE"
                
                comparaison.append({
                    "code_region": region_code,
                    "nom_region": derniere_donnee.get('reglib', 'Inconnu'),
                    "annee": derniere_donnee.get('an_mesure'),
                    "couverture_65plus": grip_65plus,
                    "couverture_moins_65ans": grip_moins65,
                    "score_global": round(score, 2),
                    "evaluation": evaluation,
                    "atteint_objectif": grip_65plus >= 75.0 if grip_65plus else False
                })
        
        # Trier par score décroissant
        comparaison.sort(key=lambda x: x['score_global'], reverse=True)
        
        return comparaison
    
    async def indicateurs_nationaux_couverture(self) -> Dict:
        """
        Calcule les indicateurs nationaux de couverture vaccinale grippe.
        
        Returns:
            Dict avec indicateurs et évolution
        """
        data = await self.get_couverture_nationale(limit=20)
        
        if not data.get('results'):
            return {
                "message": "Pas de données disponibles",
                "indicateurs": {}
            }
        
        results = data['results']
        
        # Trier par année
        results.sort(key=lambda x: x.get('an_mesure', '0'), reverse=True)
        
        # Prendre les dernières années avec données grippe
        annees_grippe = []
        for record in results:
            if record.get('grip_65plus') is not None:
                annees_grippe.append(record)
        
        if not annees_grippe:
            return {
                "message": "Pas de données grippe disponibles",
                "indicateurs": {}
            }
        
        derniere_annee = annees_grippe[0]
        
        # Évolution si on a plusieurs années
        if len(annees_grippe) >= 2:
            annee_precedente = annees_grippe[1]
            evolution_65plus = derniere_annee.get('grip_65plus', 0) - annee_precedente.get('grip_65plus', 0)
            evolution_moins65 = (derniere_annee.get('grip_moins65', 0) - annee_precedente.get('grip_moins65', 0)) if derniere_annee.get('grip_moins65') and annee_precedente.get('grip_moins65') else None
        else:
            evolution_65plus = None
            evolution_moins65 = None
        
        return {
            "periode": "Depuis 2011",
            "derniere_annee": derniere_annee.get('an_mesure'),
            "indicateurs": {
                "couverture_65plus": derniere_annee.get('grip_65plus'),
                "couverture_moins_65ans": derniere_annee.get('grip_moins65'),
                "couverture_65_74": derniere_annee.get('grip_6574'),
                "couverture_75plus": derniere_annee.get('grip_75plus'),
                "objectif_oms_65plus": 75.0,
                "atteint_objectif": derniere_annee.get('grip_65plus', 0) >= 75.0
            },
            "evolution": {
                "evolution_65plus": round(evolution_65plus, 2) if evolution_65plus else None,
                "evolution_moins65": round(evolution_moins65, 2) if evolution_moins65 else None,
                "tendance": "HAUSSE" if evolution_65plus and evolution_65plus > 0 else "BAISSE" if evolution_65plus and evolution_65plus < 0 else "STABLE"
            },
            "historique": [
                {
                    "annee": r.get('an_mesure'),
                    "65plus": r.get('grip_65plus'),
                    "moins65": r.get('grip_moins65')
                }
                for r in annees_grippe[:10]  # 10 dernières années
            ]
        }


# Instance globale
couverture_api = CouvertureAPI()

