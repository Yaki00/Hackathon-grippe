#!/usr/bin/env python3
"""
Script de test automatique pour toutes les routes de l'API
"""
import requests
import json
from time import time

BASE_URL = "http://localhost:8000"

def test_route(nom, url, params=None):
    """Teste une route et affiche le résultat"""
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {nom}")
    print(f"{'='*70}")
    print(f"URL: {url}")
    
    try:
        start = time()
        response = requests.get(url, params=params, timeout=30)
        duree = time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS ({duree:.2f}s)")
            print(f"Status: {response.status_code}")
            
            # Afficher aperçu données
            if isinstance(data, dict):
                if 'success' in data:
                    print(f"Success: {data['success']}")
                if 'data' in data:
                    print(f"Data keys: {list(data['data'].keys())}")
                elif 'statistiques' in data:
                    print(f"Stats keys: {list(data['statistiques'].keys())}")
                    
            print(f"\n📄 Aperçu réponse:")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:500] + "...")
            
        else:
            print(f"❌ ERREUR: Status {response.status_code}")
            print(response.text[:200])
            
    except requests.exceptions.ConnectionError:
        print("❌ ERREUR: Serveur non démarré")
        print("→ Lancer: python -m uvicorn app.main:app --reload --port 8000")
    except Exception as e:
        print(f"❌ ERREUR: {str(e)}")


print("="*70)
print("🚀 TEST COMPLET DE L'API VACCINATION + ANALYSES INTELLIGENTES")
print("="*70)

# Test 0: Health check
test_route("Health Check", f"{BASE_URL}/health")

# Test 1: Page d'accueil
test_route("Page d'accueil", f"{BASE_URL}/")

# Test 2: Vaccination zones
test_route("Vaccination par zones", f"{BASE_URL}/vaccination/zones")

# Test 3: Vaccination zone spécifique
test_route("Vaccination zone A", f"{BASE_URL}/vaccination/zone/A")

# Test 4: Vaccination national
test_route("Vaccination national", f"{BASE_URL}/vaccination/national")

# ============================================================================
# NOUVELLES ROUTES D'ANALYSE INTELLIGENTE
# ============================================================================

print("\n" + "="*70)
print("🤖 TESTS DES ANALYSES INTELLIGENTES (avec IA Ollama)")
print("="*70)

# Test 5: Zones sous-vaccinées
test_route(
    "🎯 OBJECTIF 1: Zones sous-vaccinées",
    f"{BASE_URL}/analyse/zones-sous-vaccinees",
    {"annee": "2024"}
)

# Test 6: Prédiction besoins
test_route(
    "🎯 OBJECTIF 2: Prédiction besoins vaccins",
    f"{BASE_URL}/analyse/prediction-besoins",
    {"annee_cible": "2025"}
)

# Test 7: Optimisation distribution
test_route(
    "🎯 OBJECTIF 3: Optimisation distribution",
    f"{BASE_URL}/analyse/optimisation-distribution",
    {"annee": "2024"}
)

# Test 8: Prédiction urgences
test_route(
    "🎯 OBJECTIF 4: Prédiction passages urgences",
    f"{BASE_URL}/analyse/prediction-urgences",
    {"periode": "hiver_2024"}
)

# Résumé
print("\n" + "="*70)
print("✅ TESTS TERMINÉS")
print("="*70)
print("\n📚 Documentation complète:")
print("  - Swagger: http://localhost:8000/docs")
print("  - README: backend/README_ANALYSES.md")
print("  - Guide Ollama: backend/GUIDE_OLLAMA.md")
print("\n🤖 Note: Si Ollama n'est pas lancé, les recommandations IA seront marquées comme indisponibles")
print("   → Lancer: ollama serve")
print("   → Télécharger: ollama pull llama3.2")

