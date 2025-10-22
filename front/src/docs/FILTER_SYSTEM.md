# Système de Filtres Modulaire

Ce système permet d'ajouter facilement de nouveaux types de filtres avec des données et valeurs différentes.

## Structure du Système

### 1. Types et Interfaces (`types/filters.ts`)

Le système utilise des interfaces génériques pour supporter différents types de données :

- `FilterConfig<T>` : Configuration d'un filtre avec ses processeurs de données, mappeurs de couleurs, etc.
- `FilterData<T>` : Données d'un filtre avec état de chargement
- `FilterState` : État global des filtres (filtre sélectionné, région, année, mode volume)

### 2. Gestionnaire de Filtres (`services/FilterManager.ts`)

Le `FilterManager` gère :

- Le registre des filtres disponibles (`FILTER_REGISTRY`)
- Le cache des données API
- Le traitement des données selon la configuration du filtre
- La récupération des données depuis les APIs

### 3. Hook Personnalisé (`hooks/useFilters.ts`)

Le hook `useFilters` fournit :

- L'état des filtres
- Les fonctions de mise à jour
- Le chargement automatique des données
- La gestion des erreurs

### 4. Utilitaires (`utils/filterUtils.ts`)

Fonctions utilitaires pour :

- Calculer les couleurs des départements
- Créer les données de volume 3D
- Formater l'affichage des valeurs
- Filtrer les données par région

## Comment Ajouter un Nouveau Filtre

### Étape 1 : Définir le Type de Données

```typescript
// Dans types/filters.ts
export interface NouveauTypeData extends FilterValue {
  propriete1: number;
  propriete2: string;
  propriete3: boolean;
}
```

### Étape 2 : Ajouter la Configuration du Filtre

```typescript
// Dans services/FilterManager.ts
export const FILTER_REGISTRY: FilterRegistry = {
  // ... autres filtres
  nouveauFiltre: {
    id: "nouveauFiltre",
    label: "Nouveau Type de Données",
    apiEndpoint: "/nouveau-filtre/departements",
    dataProcessor: (rawData: any) => {
      const processedData: Record<string, NouveauTypeData> = {};
      if (rawData.success && rawData.departements) {
        rawData.departements.forEach((item: any) => {
          const departmentCode = item.code_departement;
          if (departmentCode) {
            processedData[departmentCode] = {
              propriete1: item.propriete1 || 0,
              propriete2: item.propriete2 || "",
              propriete3: item.propriete3 || false,
            };
          }
        });
      }
      return processedData;
    },
    colorMapper: (value: NouveauTypeData) => {
      // Logique de couleur basée sur propriete1
      if (value.propriete1 < 10) return [255, 0, 0, 255]; // Rouge
      if (value.propriete1 < 50) return [255, 165, 0, 255]; // Orange
      return [0, 255, 0, 255]; // Vert
    },
    volumeMapper: (value: NouveauTypeData) => ({
      height: Math.max(3000, value.propriete1 * 100),
      radius: Math.max(10000, Math.min(30000, value.propriete1 * 200)),
      color: (() => {
        if (value.propriete1 < 10) return [255, 0, 0, 200];
        if (value.propriete1 < 50) return [255, 165, 0, 200];
        return [0, 255, 0, 200];
      })(),
    }),
    displayFormatter: (value: NouveauTypeData) =>
      `${value.propriete1} ${value.propriete2}`,
    isValid: (value: NouveauTypeData) =>
      value.propriete1 !== undefined && value.propriete1 >= 0,
  },
};
```

### Étape 3 : Mettre à Jour les Constantes (Optionnel)

```typescript
// Dans data/constants.ts
export const FILTER_OPTIONS = [
  // ... autres options
  { value: "nouveauFiltre", label: "Nouveau Type de Données" },
];
```

### Étape 4 : Utiliser le Nouveau Filtre

Le nouveau filtre sera automatiquement disponible dans l'interface utilisateur grâce au système modulaire. Aucune modification supplémentaire n'est nécessaire dans les composants principaux.

## Avantages du Système Modulaire

1. **Extensibilité** : Ajout facile de nouveaux filtres sans modification du code existant
2. **Réutilisabilité** : Les composants principaux fonctionnent avec tous les types de filtres
3. **Type Safety** : Support TypeScript complet avec types génériques
4. **Performance** : Cache automatique et optimisations intégrées
5. **Maintenabilité** : Code organisé et séparation des responsabilités

## Exemples de Filtres Disponibles

- **Vaccination** : Taux de vaccination, doses, population
- **Coûts** : Coûts totaux, coûts par habitant, nombre de vaccinés
- **Urgences** : Passages aux urgences, actes SOS médecins, taux d'incidence
- **Médecins** : Nombre de médecins, densité, spécialités

Chaque filtre peut avoir ses propres :

- Sources de données (endpoints API différents)
- Formats de données (structures différentes)
- Échelles de couleurs (logiques différentes)
- Représentations volumétriques (hauteurs et rayons différents)
- Formats d'affichage (unités différentes)
