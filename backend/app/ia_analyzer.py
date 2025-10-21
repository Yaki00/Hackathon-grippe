"""
Module IA ANALYZER
Utilise Ollama pour analyser les données de vaccination avec une IA locale
"""
import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime


class OllamaAnalyzer:
    """Analyseur IA utilisant Ollama pour l'analyse des données de vaccination"""
    
    def __init__(self, model: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
    
    def is_available(self) -> bool:
        """Vérifie si Ollama est disponible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self) -> list:
        """Récupère la liste des modèles disponibles"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except:
            return []
    
    def analyze_vaccination_data(self, prompt: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyse les données de vaccination avec l'IA
        
        Args:
            prompt: Prompt personnalisé de l'utilisateur
            data: Données de vaccination à analyser
            
        Returns:
            Dict avec l'analyse de l'IA
        """
        try:
            # Construire le prompt complet
            full_prompt = self._build_analysis_prompt(prompt, data)
            
            # Appeler Ollama
            response = self._call_ollama(full_prompt)
            
            return {
                "success": True,
                "analysis": response,
                "model": self.model,
                "timestamp": datetime.now().isoformat(),
                "data_summary": self._summarize_data(data)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": self.model,
                "timestamp": datetime.now().isoformat()
            }
    
    def _build_analysis_prompt(self, user_prompt: str, data: Dict[str, Any]) -> str:
        """Construit le prompt complet pour l'analyse"""
        
        # Prompt système pour l'expert en santé publique
        system_prompt = """Tu es un expert en santé publique française spécialisé dans la vaccination contre la grippe. 
Tu analyses les données officielles de Santé Publique France avec précision et objectivité.

Instructions:
- Analyse les données de vaccination grippe avec expertise
- Identifie les tendances, problèmes et opportunités
- Donne des recommandations concrètes et actionables
- Reste factuel et basé sur les données
- Utilise un ton professionnel mais accessible
- Structure ta réponse clairement

Format de réponse:
1. Résumé des données
2. Analyse des tendances
3. Points d'attention
4. Recommandations
5. Conclusion"""

        # Résumer les données pour le prompt
        data_summary = self._format_data_for_prompt(data)
        
        # Construire le prompt final
        full_prompt = f"""{system_prompt}

DONNÉES À ANALYSER:
{data_summary}

QUESTION/ANALYSE DEMANDÉE:
{user_prompt}

Réponds maintenant avec ton analyse experte:"""

        return full_prompt
    
    def _format_data_for_prompt(self, data: Dict[str, Any]) -> str:
        """Formate les données pour le prompt"""
        summary = []
        
        if 'zones' in data:
            summary.append("📊 DONNÉES PAR ZONE:")
            for zone in data['zones']:
                summary.append(f"  Zone {zone.get('zone_code', '?')}: {zone.get('taux_vaccination', 0):.1f}% ({zone.get('nombre_vaccines', 0):,} vaccinés)")
        
        if 'departements' in data:
            summary.append(f"\n🏘️ DONNÉES DÉPARTEMENTALES ({len(data['departements'])} départements):")
            # Prendre les 5 premiers départements comme exemple
            for dept in data['departements'][:5]:
                summary.append(f"  {dept.get('nom_departement', '?')}: {dept.get('taux_vaccination', 0):.1f}%")
            if len(data['departements']) > 5:
                summary.append(f"  ... et {len(data['departements']) - 5} autres départements")
        
        if 'statistiques' in data:
            stats = data['statistiques']
            summary.append(f"\n📈 STATISTIQUES NATIONALES:")
            summary.append(f"  Population totale: {stats.get('population_totale', 0):,}")
            summary.append(f"  Population cible: {stats.get('population_cible', 0):,}")
            summary.append(f"  Nombre vaccinés: {stats.get('nombre_vaccines', 0):,}")
            summary.append(f"  Taux global: {stats.get('taux_vaccination', 0):.1f}%")
        
        return "\n".join(summary)
    
    def _call_ollama(self, prompt: str) -> str:
        """Appelle l'API Ollama"""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000
            }
        }
        
        response = requests.post(
            self.api_url,
            json=payload,
            timeout=60  # Timeout plus long pour l'IA
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'Aucune réponse générée')
        else:
            raise Exception(f"Erreur Ollama: {response.status_code} - {response.text}")
    
    def _summarize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Résume les données pour le retour"""
        summary = {
            "data_type": "unknown",
            "count": 0,
            "date_range": None
        }
        
        if 'zones' in data:
            summary["data_type"] = "zones"
            summary["count"] = len(data['zones'])
        elif 'departements' in data:
            summary["data_type"] = "departements"
            summary["count"] = len(data['departements'])
        elif 'statistiques' in data:
            summary["data_type"] = "statistiques"
            summary["count"] = 1
        
        return summary


def get_ollama_status() -> Dict[str, Any]:
    """Vérifie le statut d'Ollama"""
    analyzer = OllamaAnalyzer()
    
    return {
        "available": analyzer.is_available(),
        "models": analyzer.get_available_models(),
        "default_model": analyzer.model,
        "base_url": analyzer.base_url
    }


def analyze_with_ai(prompt: str, data: Dict[str, Any], model: str = "llama3.2") -> Dict[str, Any]:
    """
    Fonction principale pour analyser les données avec l'IA
    
    Args:
        prompt: Prompt personnalisé de l'utilisateur
        data: Données de vaccination à analyser
        model: Modèle Ollama à utiliser
        
    Returns:
        Dict avec l'analyse de l'IA
    """
    analyzer = OllamaAnalyzer(model=model)
    return analyzer.analyze_vaccination_data(prompt, data)
