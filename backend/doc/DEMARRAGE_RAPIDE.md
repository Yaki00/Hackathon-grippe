# 🚀 DÉMARRAGE RAPIDE - 5 MINUTES

## Étape 1 : Installer les dépendances (2 min)

```powershell
cd backend
pip install -r requirements.txt
```

**Packages installés** :
- fastapi, uvicorn (serveur)
- pandas (données)
- scipy, numpy (analyses statistiques)
- requests (appel IA)

---

## Étape 2 : (Optionnel) Installer Ollama (3 min)

### Si vous voulez les recommandations IA :

1. **Télécharger** : https://ollama.com/download/windows
2. **Installer** l'application
3. **Dans un terminal** :
   ```powershell
   ollama pull llama3.2
   ```

### Si vous sautez cette étape :
- ✅ L'API fonctionnera quand même
- ⚠️ Pas de recommandations IA personnalisées
- ℹ️ Toutes les analyses statistiques seront disponibles

---

## Étape 3 : Lancer le serveur (30 sec)

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Vous devriez voir** :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

## Étape 4 : Tester l'API (1 min)

### Méthode 1 : Navigateur

Ouvrir : **http://localhost:8000/docs**

Vous verrez l'interface Swagger avec toutes les routes.

### Méthode 2 : Script auto

Dans un **nouveau terminal** :
```powershell
cd backend
python tester_api.py
```

### Méthode 3 : curl

```powershell
curl http://localhost:8000/analyse/zones-sous-vaccinees
```

---

## 🎯 Les 4 analyses disponibles

### 1. Zones sous-vaccinées
```
http://localhost:8000/analyse/zones-sous-vaccinees
```
→ Identifie régions prioritaires + recommandations IA

### 2. Prédire besoins vaccins
```
http://localhost:8000/analyse/prediction-besoins?annee_cible=2025
```
→ Calcule doses nécessaires 2025 + stratégie IA

### 3. Optimiser distribution
```
http://localhost:8000/analyse/optimisation-distribution
```
→ Détecte gaspillage + actions IA

### 4. Anticiper urgences
```
http://localhost:8000/analyse/prediction-urgences
```
→ Corrélation vaccination/urgences + recommandations IA

---

## 📊 Exemple de test rapide

### Dans le navigateur (Swagger)

1. Aller sur http://localhost:8000/docs
2. Cliquer sur **GET /analyse/zones-sous-vaccinees**
3. Cliquer sur "Try it out"
4. Cliquer sur "Execute"
5. Voir le résultat JSON en bas

### Exemple de résultat (extrait)
```json
{
  "success": true,
  "data": {
    "synthese": {
      "taux_moyen_national": 53.7,
      "regions_sous_objectif": 17,
      "regions_critiques": 3
    },
    "zones_prioritaires": [
      {
        "region": "Corse",
        "taux_actuel": 46.0,
        "ecart_objectif": 29.0,
        "statut": "critique",
        "recommandations_ia": "..."
      }
    ]
  }
}
```

---

## ⚡ Commandes utiles

### Lancer serveur
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

### Lancer Ollama (si installé)
```powershell
ollama serve
```

### Tester l'API
```powershell
python tester_api.py
```

### Analyser les données
```powershell
python analyser_donnees.py
```

---

## 🐛 Problèmes fréquents

### "Module not found: scipy"
```powershell
pip install scipy numpy
```

### "Connection refused: Ollama"
- Soit lancer : `ollama serve`
- Soit ignorer (l'API fonctionne sans)

### "Port 8000 already in use"
```powershell
# Changer le port
python -m uvicorn app.main:app --reload --port 8001
```

### "File not found: couvertures-vaccinales..."
Vérifier que tous les fichiers sont dans :
```
backend/data/datagouve/
├── couverture_vaccinal/
├── passage_urgence/
└── 2024/
```

---

## 📚 Documentation complète

- **API complète** : `README_ANALYSES.md`
- **Guide Ollama** : `GUIDE_OLLAMA.md`
- **Détail données** : `ANALYSE_DONNEES.md`
- **Résumé implem** : `RESUME_IMPLEMENTATION.md`

---

## ✅ Checklist de démarrage

- [ ] Dependencies installées (`pip install -r requirements.txt`)
- [ ] (Optionnel) Ollama installé et lancé
- [ ] Serveur démarré (port 8000)
- [ ] Page http://localhost:8000 accessible
- [ ] Au moins 1 route testée

**Si tout est coché → Vous êtes prêt ! 🎉**

---

## 🎯 Prochaines étapes

1. Explorer les 4 routes d'analyse
2. Tester avec différents paramètres
3. Lire les recommandations IA
4. Intégrer au frontend
5. Déployer en production

---

**Temps total : ~5 minutes (sans Ollama) ou ~8 minutes (avec Ollama)**

**Vous avez un problème ?**
- Relire ce guide
- Vérifier `README_ANALYSES.md`
- Vérifier structure des dossiers

