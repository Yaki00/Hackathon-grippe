# 🤖 Guide d'installation et utilisation d'Ollama

## Installation Ollama

### Windows
1. Télécharger Ollama : https://ollama.com/download/windows
2. Installer l'application
3. Ollama démarre automatiquement en arrière-plan

### Vérifier l'installation
```powershell
ollama --version
```

## Télécharger un modèle

### Modèles recommandés :

#### 1. Llama 3.2 (3B) - **RECOMMANDÉ** (rapide, efficace)
```powershell
ollama pull llama3.2
```

#### 2. Mistral (7B) - (très bon, un peu plus lent)
```powershell
ollama pull mistral
```

#### 3. Phi-3 (3.8B) - (compact, rapide)
```powershell
ollama pull phi3
```

## Démarrer Ollama (si pas démarré)
```powershell
ollama serve
```

## Tester Ollama
```powershell
ollama run llama3.2
```

## Configuration dans l'API

Le fichier `app/analyse_intelligente.py` est configuré pour utiliser **llama3.2**.

Pour changer de modèle, modifiez la ligne :
```python
OLLAMA_MODEL = "llama3.2"  # ou "mistral", "phi3", etc.
```

## Utilisation dans l'API

### L'IA est appelée automatiquement pour :

1. **Zones sous-vaccinées** : Recommandations pour chaque région prioritaire
2. **Prédiction besoins** : Stratégie globale de commande
3. **Optimisation distribution** : Actions concrètes anti-gaspillage
4. **Prédiction urgences** : Stratégies de réduction

### Si Ollama n'est pas disponible :
- L'API fonctionne quand même
- Message affiché : "⚠️ Ollama non disponible"
- Les analyses statistiques restent complètes

## Performance

| Modèle | Taille | Vitesse | Qualité |
|--------|--------|---------|---------|
| llama3.2 | 3B | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| phi3 | 3.8B | ⚡⚡⚡ | ⭐⭐⭐ |
| mistral | 7B | ⚡⚡ | ⭐⭐⭐⭐⭐ |

## Test rapide de l'intégration

```powershell
# 1. Démarrer Ollama
ollama serve

# 2. Dans un autre terminal, tester l'API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Bonjour, teste 1-2-3",
  "stream": false
}'
```

## Désactiver l'IA (mode sans Ollama)

Si vous voulez désactiver complètement l'IA, dans `analyse_intelligente.py` :

```python
def appeler_agent_ia(prompt: str, temperature: float = 0.7) -> str:
    return "IA désactivée"
```

