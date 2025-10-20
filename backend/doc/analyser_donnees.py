#!/usr/bin/env python3
"""
Script pour analyser tous les fichiers de données
"""
import json
import pandas as pd
from pathlib import Path

DATA_DIR = Path('data/datagouve')

print("=" * 80)
print("ANALYSE COMPLÈTE DE TOUTES LES DONNÉES")
print("=" * 80)
print()

# =============================================================================
# 1. DONNÉES ANNUELLES (2021-2024)
# =============================================================================
print("📁 PARTIE 1: DONNÉES ANNUELLES IQVIA (2021-2024)")
print("=" * 80)
print()

for annee in ['2021', '2022', '2023', '2024']:
    print(f"🗓️  ANNÉE {annee}")
    print("-" * 80)
    
    # CAMPAGNE
    try:
        if annee in ['2021', '2022']:
            chemin = DATA_DIR / annee / f'campagne-{annee}.csv'
            df = pd.read_csv(chemin, sep=';')
        else:
            chemin = DATA_DIR / annee / f'campagne-{annee}.json' if annee == '2023' else DATA_DIR / annee / f'campagne-{annee} (1).json'
            with open(chemin, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
        
        print(f"   📊 campagne-{annee}:")
        print(f"      • Lignes: {len(df)}")
        print(f"      • Colonnes: {list(df.columns)}")
        if 'variable' in df.columns:
            print(f"      • Variables: {df['variable'].unique().tolist()}")
        if 'valeur' in df.columns:
            print(f"      • Valeur min: {df['valeur'].min()}, max: {df['valeur'].max()}")
        print()
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()
    
    # COUVERTURE
    try:
        if annee in ['2021', '2022']:
            chemin = DATA_DIR / annee / f'couverture-{annee}.csv'
            df = pd.read_csv(chemin, sep=';')
        else:
            chemin = DATA_DIR / annee / f'couverture-{annee}.json' if annee == '2023' else DATA_DIR / annee / f'couverture-{annee} (1).json'
            with open(chemin, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
        
        print(f"   📊 couverture-{annee}:")
        print(f"      • Lignes: {len(df)}")
        print(f"      • Colonnes: {list(df.columns)}")
        if 'region' in df.columns:
            print(f"      • Régions: {df['region'].nunique()} régions")
        if 'variable' in df.columns:
            print(f"      • Variables: {df['variable'].unique().tolist()}")
        if 'groupe' in df.columns:
            print(f"      • Groupes d'âge: {df['groupe'].unique().tolist()}")
        print()
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()
    
    # DOSES-ACTES
    try:
        if annee in ['2021', '2022']:
            chemin = DATA_DIR / annee / f'doses-actes-{annee}.csv'
            df = pd.read_csv(chemin, sep=';')
        else:
            chemin = DATA_DIR / annee / f'doses-actes-{annee}.json' if annee == '2023' else DATA_DIR / annee / f'doses-actes-{annee} (1).json'
            with open(chemin, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
        
        print(f"   📊 doses-actes-{annee}:")
        print(f"      • Lignes: {len(df)}")
        print(f"      • Colonnes: {list(df.columns)}")
        if 'variable' in df.columns:
            print(f"      • Variables: {df['variable'].unique().tolist()}")
        if 'date' in df.columns:
            print(f"      • Période: {df['date'].min()} à {df['date'].max()}")
        print()
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()
    
    print()

# =============================================================================
# 2. COUVERTURE VACCINALE HISTORIQUE (2011-2024)
# =============================================================================
print()
print("📁 PARTIE 2: COUVERTURE VACCINALE HISTORIQUE SANTÉ PUBLIQUE FRANCE")
print("=" * 80)
print()

# FRANCE
try:
    chemin = DATA_DIR / 'couverture_vaccinal' / 'couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-france.json'
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    print("   📊 Données NATIONALES (France):")
    print(f"      • Lignes: {len(df)}")
    print(f"      • Colonnes: {list(df.columns)}")
    print(f"      • Années: {sorted(df['an_mesure'].unique())}")
    print(f"      • Exemple 2024:")
    ligne_2024 = df[df['an_mesure'] == '2024'].iloc[0]
    print(f"        - Moins de 65 ans: {ligne_2024['grip_moins65']}%")
    print(f"        - 65 ans et plus: {ligne_2024['grip_65plus']}%")
    print()
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print()

# RÉGIONS
try:
    chemin = DATA_DIR / 'couverture_vaccinal' / 'couvertures-vaccinales-des-adolescents-et-adultes-depuis-2011-region.json'
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    print("   📊 Données RÉGIONALES:")
    print(f"      • Lignes: {len(df)}")
    print(f"      • Colonnes: {list(df.columns)}")
    print(f"      • Années: {sorted(df['an_mesure'].unique())}")
    print(f"      • Régions: {df['reglib'].nunique()} régions")
    print(f"      • Liste régions: {sorted(df['reglib'].unique())}")
    print(f"      • Exemple Bretagne 2024:")
    ligne_bretagne = df[(df['reglib'] == 'Bretagne') & (df['an_mesure'] == '2024')].iloc[0]
    print(f"        - Moins de 65 ans: {ligne_bretagne['grip_moins65']}%")
    print(f"        - 65 ans et plus: {ligne_bretagne['grip_65plus']}%")
    print()
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print()

# DÉPARTEMENTS
try:
    chemin = DATA_DIR / 'couverture_vaccinal' / 'couvertures-vaccinales-des-adolescent-et-adultes-departement.json'
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    print("   📊 Données DÉPARTEMENTALES:")
    print(f"      • Lignes: {len(df)}")
    print(f"      • Colonnes: {list(df.columns)}")
    if 'an_mesure' in df.columns:
        print(f"      • Années: {sorted(df['an_mesure'].unique())}")
    if 'dep' in df.columns:
        print(f"      • Départements: {df['dep'].nunique()} départements")
    print()
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print()

# =============================================================================
# 3. PASSAGES AUX URGENCES
# =============================================================================
print()
print("📁 PARTIE 3: PASSAGES AUX URGENCES & SOS MÉDECINS")
print("=" * 80)
print()

# RÉGIONAL
try:
    chemin = DATA_DIR / 'passage_urgence' / 'grippe-passages-urgences-et-actes-sos-medecin_reg.json'
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    print("   📊 Passages urgences RÉGIONAL:")
    print(f"      • Lignes: {len(df)}")
    print(f"      • Colonnes: {list(df.columns)}")
    if 'annee' in df.columns:
        print(f"      • Années: {sorted(df['annee'].unique())}")
    if 'semaine' in df.columns:
        print(f"      • Semaines: {df['semaine'].min()} à {df['semaine'].max()}")
    if 'reg_name' in df.columns:
        print(f"      • Régions: {df['reg_name'].nunique()} régions")
    print()
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print()

# DÉPARTEMENTAL
try:
    chemin = DATA_DIR / 'passage_urgence' / 'grippe-passages-aux-urgences-et-actes-sos-medecins-departement.json'
    with open(chemin, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    print("   📊 Passages urgences DÉPARTEMENTAL:")
    print(f"      • Lignes: {len(df)}")
    print(f"      • Colonnes: {list(df.columns)}")
    if 'annee' in df.columns:
        print(f"      • Années: {sorted(df['annee'].unique())}")
    if 'dep_name' in df.columns:
        print(f"      • Départements: {df['dep_name'].nunique()} départements")
    print()
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print()

print()
print("=" * 80)
print("FIN DE L'ANALYSE")
print("=" * 80)

