"""
Configuration des zones A, B, C
"""

# Mapping régions -> 3 ZONES : A, B, C
REGIONS_ZONES = {
    # Zone A : IDF + grandes métropoles
    "11": {"zone": "A", "nom": "Île-de-France", "population": 12_278_210},
    "84": {"zone": "A", "nom": "Auvergne-Rhône-Alpes", "population": 8_078_652},
    "93": {"zone": "A", "nom": "Provence-Alpes-Côte d'Azur", "population": 5_081_101},
    "76": {"zone": "A", "nom": "Occitanie", "population": 6_014_915},
    "75": {"zone": "A", "nom": "Nouvelle-Aquitaine", "population": 6_033_952},
    
    # Zone B : Grandes agglomérations
    "32": {"zone": "B", "nom": "Hauts-de-France", "population": 5_962_662},
    "44": {"zone": "B", "nom": "Grand Est", "population": 5_511_747},
    "53": {"zone": "B", "nom": "Bretagne", "population": 3_373_835},
    "52": {"zone": "B", "nom": "Pays de la Loire", "population": 3_832_120},
    
    # Zone C : Reste de la France
    "28": {"zone": "C", "nom": "Normandie", "population": 3_303_500},
    "27": {"zone": "C", "nom": "Bourgogne-Franche-Comté", "population": 2_783_039},
    "24": {"zone": "C", "nom": "Centre-Val de Loire", "population": 2_559_073},
    "94": {"zone": "C", "nom": "Corse", "population": 349_465},
}

# Population cible vaccination (65+ et personnes à risque = ~30%)
POURCENTAGE_CIBLE = 0.30

