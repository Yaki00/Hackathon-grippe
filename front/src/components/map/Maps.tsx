// ============================================================================
// IMPORTS ET DÉPENDANCES
// ============================================================================

// Styles CSS pour Mapbox GL
import "mapbox-gl/dist/mapbox-gl.css";

// Hooks React pour la gestion d'état et les effets
import { useMemo, useState, useEffect, useRef } from "react";

// Composants DeckGL pour la visualisation 3D et les couches
import { DeckGL } from "deck.gl";
import { ScatterplotLayer, GeoJsonLayer, ColumnLayer } from "deck.gl";
import { MapView } from "deck.gl";
import { FlyToInterpolator } from "deck.gl";

// Composant Map de react-map-gl pour l'affichage de la carte
import { Map } from "react-map-gl";

// Types GeoJSON pour la manipulation des données géographiques
import type { Feature, FeatureCollection } from "geojson";

// Données géographiques de la France
import france from "../data/france.json";
import regionsData from "../data/regions.json";
import departementsData from "../data/departements.json";

// Liste des départements et régions avec leurs codes
import { DEPARTEMENTS } from "../data/regions-list";

// Types TypeScript pour les filtres et les données
import type { FilterConfig, FilterValue } from "../../types/filters";

// ============================================================================
// FONCTIONS UTILITAIRES POUR LE WEBGL ET LA DIAGNOSTIQUE
// ============================================================================

/**
 * Diagnostique les capacités WebGL du navigateur
 * Cette fonction teste si WebGL est supporté et fonctionnel
 * Utilisée pour détecter les problèmes de compatibilité avant le rendu
 */
function diagnoseWebGL(): void {
  try {
    // Créer un canvas temporaire pour tester WebGL
    const canvas = document.createElement("canvas");

    // Essayer d'obtenir le contexte WebGL (standard ou expérimental)
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.error("WebGL non supporté sur ce navigateur");
      return;
    }

    // Test simple de création de texture pour vérifier le bon fonctionnement
    const texture = gl.createTexture();
    if (texture) {
      gl.deleteTexture(texture); // Nettoyer la texture de test
    }

    console.log("WebGL détecté et fonctionnel");
  } catch (error) {
    console.error("Erreur lors du diagnostic WebGL:", error);
  }
}

// ============================================================================
// FONCTIONS DE MANIPULATION DES DONNÉES GÉOGRAPHIQUES
// ============================================================================

/**
 * Extrait uniquement la France métropolitaine (continentale + Corse) des données GeoJSON
 * Filtre les DOM-TOM qui sont situés en dehors de l'Europe
 *
 * @param country - Feature ou FeatureCollection contenant les données de la France
 * @returns Feature contenant uniquement la France métropolitaine
 */
function getFranceMetropolitaine(
  country: Feature | FeatureCollection
): Feature {
  // Normaliser l'entrée : si c'est une collection, prendre le premier élément
  const feature =
    country.type === "FeatureCollection" ? country.features[0] : country;

  if (!feature || !feature.geometry) {
    throw new Error("GeoJSON invalide pour le pays");
  }

  const geom = feature.geometry;

  // Si c'est un simple polygone, le retourner tel quel
  if (geom.type === "Polygon") {
    return feature;
  }
  // Si c'est un MultiPolygon, filtrer les polygones par zone géographique
  else if (geom.type === "MultiPolygon") {
    // Filtrer les polygones de la France métropolitaine
    // Critères géographiques : longitude entre -5.5 et 10, latitude entre 41 et 51.5
    // Ceci inclut la France continentale ET la Corse, mais exclut les DOM-TOM
    const metroPolygons = geom.coordinates.filter((poly: number[][][]) => {
      // Prendre le premier point du polygone extérieur pour vérifier la position
      const firstPoint = poly[0][0];
      const lon = firstPoint[0];
      const lat = firstPoint[1];

      // Zone géographique de la France métropolitaine (incluant la Corse)
      return lon >= -5.5 && lon <= 10 && lat >= 41 && lat <= 51.5;
    });

    return {
      type: "Feature",
      properties: feature.properties,
      geometry: { type: "MultiPolygon", coordinates: metroPolygons },
    } as Feature;
  }

  throw new Error("Le GeoJSON du pays doit être Polygon ou MultiPolygon");
}

/**
 * Construit un masque géographique pour isoler une zone spécifique
 * Crée un polygone mondial avec des "trous" correspondant à la zone à masquer
 * Utilisé pour afficher uniquement la région/département sélectionné
 *
 * @param country - Feature ou FeatureCollection de la zone à masquer
 * @returns Feature contenant le masque (monde avec trous)
 */
function buildCountryMask(country: Feature | FeatureCollection): Feature {
  // Obtenir la France métropolitaine filtrée
  const franceMetro = getFranceMetropolitaine(country);
  const geom = franceMetro.geometry;

  // Définir les limites du monde entier
  const world = [
    [-180, -85], // Coin sud-ouest
    [180, -85], // Coin sud-est
    [180, 85], // Coin nord-est
    [-180, 85], // Coin nord-ouest
    [-180, -85], // Fermer le polygone
  ];

  let holes: number[][][] = [];

  // Extraire les coordonnées des trous selon le type de géométrie
  if (geom.type === "Polygon") {
    // Pour un polygone simple, utiliser directement ses coordonnées
    holes = geom.coordinates.map((ring: number[][]) => ring);
  } else if (geom.type === "MultiPolygon") {
    // Pour un MultiPolygon, aplatir tous les polygones en anneaux
    holes = geom.coordinates.flatMap((poly: number[][][]) => poly);
  }

  // Retourner le masque : monde entier avec des trous pour la zone sélectionnée
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [world, ...holes] },
  } as Feature;
}

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

/**
 * Limites géographiques de la France métropolitaine
 * Utilisées pour contraindre la navigation de la carte dans les limites du territoire français
 */
const FRANCE_BOUNDS = {
  minLng: -5.5, // Ouest (Bretagne)
  maxLng: 10.0, // Est (Alsace)
  minLat: 41.0, // Sud (Corse)
  maxLat: 51.5, // Nord (Nord-Pas-de-Calais)
};

/**
 * Configuration initiale de la vue de la carte
 * Définit la position, le zoom et les limites de navigation par défaut
 */
const INITIAL_VIEW_STATE = {
  longitude: 2.3522, // Paris
  latitude: 48.8566, // Paris
  zoom: 3, // Zoom initial pour voir la France entière
  minZoom: 4.3, // Zoom minimum (vue très large)
  maxZoom: 7.5, // Zoom maximum (vue détaillée)
  pitch: 10, // Inclinaison de la caméra (0 = vue de dessus)
  maxPitch: 65, // Inclinaison maximale pour la vue 3D
  bearing: 0, // Rotation de la caméra (0 = nord en haut)
} as const;

/**
 * Paramètres d'optimisation WebGL pour améliorer les performances
 * Limite les ressources utilisées pour éviter les surcharges sur les appareils moins puissants
 */
const WEBGL_OPTIMIZATIONS = {
  // Limiter le devicePixelRatio pour éviter les surcharges sur écrans haute résolution
  maxDevicePixelRatio: 2,
  // Réduire la qualité des textures pour améliorer les performances
  textureQuality: 0.8,
  // Limiter le nombre de polygones rendus simultanément
  maxPolygons: 1000,
  // Durée des transitions d'animation (en millisecondes) - optimisée pour éviter les conflits
  transitionDuration: 600,
};

// Durée de transition optimisée pour les animations fluides
const TRANSITION_DURATION = WEBGL_OPTIMIZATIONS.transitionDuration;

// ============================================================================
// FONCTIONS UTILITAIRES POUR LA NAVIGATION ET LA CONTRAINTE
// ============================================================================

/**
 * Contraint les coordonnées de navigation dans les limites de la France métropolitaine
 * Empêche l'utilisateur de naviguer en dehors du territoire français
 *
 * @param longitude - Longitude à contraindre
 * @param latitude - Latitude à contraindre
 * @returns Coordonnées contraintes dans les limites françaises
 */
function constrainToFranceBounds(
  longitude: number,
  latitude: number
): { longitude: number; latitude: number } {
  return {
    longitude: Math.max(
      FRANCE_BOUNDS.minLng,
      Math.min(FRANCE_BOUNDS.maxLng, longitude)
    ),
    latitude: Math.max(
      FRANCE_BOUNDS.minLat,
      Math.min(FRANCE_BOUNDS.maxLat, latitude)
    ),
  };
}

// Token d'accès Mapbox (récupéré depuis les variables d'environnement)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Type pour représenter un point sur la carte
 * Utilisé pour les données de test et les marqueurs
 */
type Point = {
  position: [number, number]; // Coordonnées [longitude, latitude]
  size: number; // Taille du point
  value?: number; // Valeur associée au point
  color?: [number, number, number]; // Couleur RGB
};

/**
 * Props du composant MapTest
 * Définit toutes les propriétés configurables de la carte
 */
type MapTestProps = {
  selectedRegion?: string; // Code de la région sélectionnée
  volumeMode?: boolean; // Mode d'affichage (couleur ou volume 3D)
  pitch?: number; // Inclinaison de la caméra
  bearing?: number; // Rotation de la caméra

  // Callbacks pour les interactions avec les départements
  onDepartmentSelect?: (departmentCode: string, departmentName: string) => void;
  onDepartmentHover?: (
    departmentCode: string,
    departmentName: string,
    event: { x: number; y: number }
  ) => void;
  onDepartmentLeave?: () => void;

  // Données et configuration des filtres
  filterData?: Record<string, FilterValue>; // Données filtrées par département
  selectedFilter?: string; // ID du filtre actuel
  filterConfig?: FilterConfig; // Configuration du filtre
};

// ============================================================================
// FONCTIONS DE LOGIQUE MÉTIER ET FILTRAGE
// ============================================================================

/**
 * Vérifie si un département appartient à la région sélectionnée
 * Utilise un cache pour optimiser les performances
 *
 * @param departmentCode - Code du département à vérifier
 * @param selectedRegion - Code de la région sélectionnée
 * @returns true si le département appartient à la région
 */
function isDepartmentInSelectedRegion(
  departmentCode: string,
  selectedRegion?: string
): boolean {
  // Si aucune région sélectionnée ou "all", tous les départements sont visibles
  if (!selectedRegion || selectedRegion === "all") {
    return true;
  }

  // Vérifier le cache d'abord
  const cacheKey = `${departmentCode}-${selectedRegion}`;
  if (regionCache[cacheKey] !== undefined) {
    return regionCache[cacheKey];
  }

  // Chercher le département dans la liste et vérifier sa région
  const department = DEPARTEMENTS.find((dept) => dept.value === departmentCode);
  const result = department ? department.region === selectedRegion : false;

  // Mettre en cache le résultat
  regionCache[cacheKey] = result;
  return result;
}

/**
 * Crée les données pour les colonnes 3D en mode volume
 * Transforme les données de filtres en objets 3D positionnés sur la carte
 *
 * @param filterData - Données filtrées par département
 * @param selectedRegion - Région sélectionnée pour le filtrage
 * @param filterConfig - Configuration du filtre actuel
 * @returns Tableau d'objets 3D pour le rendu des colonnes
 */
function createVolumeData(
  filterData?: Record<string, FilterValue>,
  selectedRegion?: string,
  filterConfig?: FilterConfig
): Array<{
  position: [number, number]; // Position géographique [lon, lat]
  height: number; // Hauteur de la colonne
  radius: number; // Rayon de la colonne
  color: [number, number, number, number]; // Couleur RGBA
  departmentCode: string; // Code du département
  departmentName: string; // Nom du département
}> {
  // Vérifications préliminaires
  if (!filterData || !filterConfig || !filterConfig.volumeMapper) {
    return [];
  }

  const volumeData: Array<{
    position: [number, number];
    height: number;
    radius: number;
    color: [number, number, number, number];
    departmentCode: string;
    departmentName: string;
  }> = [];

  // Parcourir les données et créer des colonnes pour chaque département
  Object.entries(filterData).forEach(([departmentCode, data]) => {
    // Vérifier si le département appartient à la région sélectionnée
    if (!isDepartmentInSelectedRegion(departmentCode, selectedRegion)) {
      return;
    }

    // Vérifier si les données sont valides selon la configuration du filtre
    if (filterConfig.isValid && !filterConfig.isValid(data)) {
      return;
    }

    // Calculer ou récupérer le centre géographique du département
    let center: [number, number];
    if (departmentCenterCache[departmentCode]) {
      // Utiliser le cache si disponible
      center = departmentCenterCache[departmentCode];
    } else {
      // Calculer le centre géographique du département
      const departmentFeature = (
        departementsData as FeatureCollection
      ).features.find(
        (f: Feature) =>
          f.properties?.code === departmentCode ||
          f.properties?.INSEE_DEP === departmentCode
      );

      if (!departmentFeature || !departmentFeature.geometry) {
        return; // Ignorer ce département si pas de géométrie
      }

      // Calculer le centre du département (version optimisée)
      let centerLon = 0;
      let centerLat = 0;
      let pointCount = 0;

      if (departmentFeature.geometry.type === "Polygon") {
        // Pour un polygone simple
        const coords = departmentFeature.geometry.coordinates[0];
        // Échantillonner seulement quelques points pour le calcul du centre (optimisation)
        const step = Math.max(1, Math.floor(coords.length / 10));
        for (let i = 0; i < coords.length; i += step) {
          const coord = coords[i];
          centerLon += coord[0];
          centerLat += coord[1];
          pointCount++;
        }
      } else if (departmentFeature.geometry.type === "MultiPolygon") {
        // Pour un MultiPolygon (plusieurs polygones)
        departmentFeature.geometry.coordinates.forEach(
          (polygon: number[][][]) => {
            const coords = polygon[0];
            const step = Math.max(1, Math.floor(coords.length / 10));
            for (let i = 0; i < coords.length; i += step) {
              const coord = coords[i];
              centerLon += coord[0];
              centerLat += coord[1];
              pointCount++;
            }
          }
        );
      }

      if (pointCount > 0) {
        // Calculer la moyenne des coordonnées pour obtenir le centre
        centerLon /= pointCount;
        centerLat /= pointCount;
        center = [centerLon, centerLat];
        // Mettre en cache le résultat
        departmentCenterCache[departmentCode] = center;
      } else {
        return; // Ignorer si aucun point trouvé
      }
    }

    // Utiliser la configuration du filtre pour calculer les propriétés du volume 3D
    const volumeInfo = filterConfig.volumeMapper!(data);

    // Ajouter l'objet 3D au tableau des données de volume
    volumeData.push({
      position: center, // Position géographique du centre
      height: volumeInfo.height, // Hauteur calculée par le filtre
      radius: volumeInfo.radius, // Rayon calculé par le filtre
      color: volumeInfo.color, // Couleur calculée par le filtre
      departmentCode, // Code du département
      departmentName: departmentCode, // Nom (utilise le code par défaut)
    });
  });

  return volumeData;
}

/**
 * Calcule la couleur d'un département basée sur les données du filtre actuel
 * Utilisée pour le mode couleur (non-volume) de la carte
 *
 * @param departmentCode - Code du département
 * @param filterData - Données filtrées par département
 * @param selectedRegion - Région sélectionnée
 * @param filterConfig - Configuration du filtre actuel
 * @returns Couleur RGBA pour le département
 */
function getDepartmentColor(
  departmentCode: string,
  filterData?: Record<string, FilterValue>,
  selectedRegion?: string,
  filterConfig?: FilterConfig
): [number, number, number, number] {
  // Vérifications préliminaires
  if (
    !filterConfig ||
    !filterData ||
    !filterData[departmentCode] ||
    !isDepartmentInSelectedRegion(departmentCode, selectedRegion)
  ) {
    return [120, 120, 120, 30]; // Couleur par défaut (gris transparent)
  }

  const data = filterData[departmentCode];

  // Vérifier si les données sont valides selon la configuration du filtre
  if (filterConfig.isValid && !filterConfig.isValid(data)) {
    return [120, 120, 120, 30]; // Couleur par défaut pour données invalides
  }

  // Utiliser la fonction de mapping des couleurs du filtre
  return filterConfig.colorMapper(data);
}

// ============================================================================
// CACHES ET OPTIMISATIONS
// ============================================================================

/**
 * Cache pour les vérifications d'appartenance à une région
 * Évite de recalculer plusieurs fois la même vérification
 */
const regionCache: Record<string, boolean> = {};

/**
 * Cache pour les centres géographiques des départements
 * Évite de recalculer le centre d'un département plusieurs fois
 */
const departmentCenterCache: Record<string, [number, number]> = {};

/**
 * Cache pour les zones géographiques extraites
 * Évite de re-parser les données GeoJSON pour la même zone
 */
const zoneCache: Record<string, Feature | null> = {};

/**
 * Extrait une zone géographique spécifique (région ou département) des données GeoJSON
 * Utilise un cache pour optimiser les performances
 *
 * @param data - Collection de features GeoJSON
 * @param code - Code de la zone à extraire
 * @returns Feature correspondant à la zone ou null si non trouvée
 */
function extractZone(data: FeatureCollection, code: string): Feature | null {
  // Vérifier le cache d'abord
  if (zoneCache[code] !== undefined) {
    return zoneCache[code];
  }

  // Chercher la zone dans les features
  const features = data.features;
  const zone = features.find(
    (f: Feature) => f.properties?.code === code || f.properties?.nom === code
  );

  // Mettre en cache le résultat
  zoneCache[code] = zone || null;
  return zone || null;
}

// ============================================================================
// CONFIGURATION DES NIVEAUX DE ZOOM PAR RÉGION
// ============================================================================

/**
 * Niveaux de zoom personnalisés pour chaque région française
 * Optimisés selon la taille et la forme de chaque région
 * Plus la région est grande, plus le zoom est faible pour la voir entièrement
 */
const REGION_ZOOM_LEVELS: Record<string, number> = {
  "84": 6.2, // Auvergne-Rhône-Alpes (grande région)
  "27": 6.8, // Bourgogne-Franche-Comté (moyenne)
  "53": 7.5, // Bretagne (compacte)
  "24": 7.0, // Centre-Val de Loire (moyenne)
  "94": 8.5, // Corse (petite île)
  "44": 6.0, // Grand Est (très grande)
  "32": 6.5, // Hauts-de-France (grande)
  "11": 7.8, // Île-de-France (compacte mais importante)
  "28": 7.2, // Normandie (moyenne)
  "75": 5.8, // Nouvelle-Aquitaine (très grande)
  "76": 6.3, // Occitanie (grande)
  "52": 7.0, // Pays de la Loire (moyenne)
  "93": 6.8, // Provence-Alpes-Côte d'Azur (moyenne-grande)
};

/**
 * Calcule la position et le niveau de zoom optimaux pour afficher une zone géographique
 * Utilise des niveaux de zoom prédéfinis pour les régions ou calcule automatiquement
 *
 * @param zone - Feature GeoJSON de la zone à afficher
 * @param regionCode - Code de la région (optionnel, pour utiliser le zoom prédéfini)
 * @returns Configuration de vue {longitude, latitude, zoom}
 */
function getViewStateForZone(
  zone: Feature | null,
  regionCode?: string
): {
  longitude: number;
  latitude: number;
  zoom: number;
} {
  // Valeurs par défaut si pas de zone
  if (!zone || !zone.geometry) {
    return { longitude: 2.3522, latitude: 46.3, zoom: 4.5 };
  }

  // Calculer le centre approximatif du bounding box
  const coords =
    zone.geometry.type === "Polygon"
      ? zone.geometry.coordinates[0]
      : zone.geometry.type === "MultiPolygon"
      ? zone.geometry.coordinates[0][0]
      : [];

  if (coords.length === 0) {
    return { longitude: 2.3522, latitude: 46.3, zoom: 4.5 };
  }

  // Calculer les limites de la zone
  let minLon = Infinity,
    maxLon = -Infinity;
  let minLat = Infinity,
    maxLat = -Infinity;

  coords.forEach((coord: number[]) => {
    const [lon, lat] = coord;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  // Calculer le centre de la zone
  const longitude = (minLon + maxLon) / 2;
  const latitude = (minLat + maxLat) / 2;

  // Déterminer le niveau de zoom
  let zoom = 5; // Valeur par défaut
  if (regionCode && REGION_ZOOM_LEVELS[regionCode]) {
    // Utiliser le niveau prédéfini pour cette région
    zoom = REGION_ZOOM_LEVELS[regionCode];
  } else {
    // Calcul automatique basé sur la taille de la zone
    const lonDiff = maxLon - minLon;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lonDiff, latDiff);

    // Ajuster le zoom selon la taille de la zone
    if (maxDiff < 0.3) zoom = 9.5; // Très petites zones
    else if (maxDiff < 0.6) zoom = 8.5; // Petites zones
    else if (maxDiff < 1.2) zoom = 7.5; // Zones moyennes
    else if (maxDiff < 2.5) zoom = 6.5; // Grandes zones
    else if (maxDiff < 4) zoom = 5.5; // Très grandes zones
    else zoom = 4.5; // France entière
  }

  return { longitude, latitude, zoom };
}

// ============================================================================
// HOOK PERSONNALISÉ POUR LA GESTION DE LA TAILLE DU CONTENEUR
// ============================================================================

/**
 * Hook personnalisé pour surveiller la taille d'un conteneur HTML
 * Utilise ResizeObserver pour détecter les changements de taille
 * Retourne une référence et les dimensions actuelles
 *
 * @returns {ref, width, height} - Référence du conteneur et ses dimensions
 */
function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    // Créer un ResizeObserver pour surveiller les changements de taille
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({
        width: Math.max(1, Math.floor(cr.width)), // Largeur minimale de 1px
        height: Math.max(1, Math.floor(cr.height)), // Hauteur minimale de 1px
      });
    });

    // Commencer l'observation
    ro.observe(ref.current);

    // Nettoyer l'observer lors du démontage
    return () => ro.disconnect();
  }, []);

  return { ref, ...size };
}

// ============================================================================
// COMPOSANT PRINCIPAL DE LA CARTE
// ============================================================================

/**
 * Composant principal de visualisation cartographique interactive
 * Affiche une carte de la France avec des données filtrées et des interactions 3D
 *
 * Fonctionnalités principales :
 * - Affichage des départements et régions avec données colorées ou volumes 3D
 * - Navigation fluide avec contraintes géographiques
 * - Interactions (clic, survol) avec les départements
 * - Optimisations WebGL pour les performances
 * - Support des filtres de données dynamiques
 *
 * @param props - Configuration du composant (voir MapTestProps)
 * @returns Composant React de la carte interactive
 */
export default function MapTest({
  selectedRegion,
  volumeMode = false,
  pitch,
  bearing,
  onDepartmentSelect,
  onDepartmentHover,
  onDepartmentLeave,
  filterData,
  selectedFilter,
  filterConfig,
}: MapTestProps = {}) {
  // ============================================================================
  // INITIALISATION ET GESTION DE LA TAILLE DU CONTENEUR
  // ============================================================================

  // Hook personnalisé pour surveiller la taille du conteneur
  const {
    ref: containerRef,
    width,
    height,
  } = useContainerSize<HTMLDivElement>();

  // Vérifier si le conteneur est prêt (dimensions définies)
  const ready = width > 0 && height > 0;

  // ============================================================================
  // GESTION DU MONTAGE ET DE L'INITIALISATION WEBGL
  // ============================================================================

  // 1) Monter DeckGL au prochain frame (laisse le DOM se stabiliser)
  const [mountDeck, setMountDeck] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountDeck(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // 2) Attendre que le contexte WebGL soit initialisé avant de pousser les enfants (Map + layers)
  const [glReady, setGlReady] = useState(false);

  // Diagnostic WebGL au montage du composant (optimisé)
  useEffect(() => {
    diagnoseWebGL();
  }, []);

  // ============================================================================
  // GESTION DE L'ÉTAT DE LA VUE DE LA CARTE
  // ============================================================================

  // État séparé pour le pitch pour éviter les conflits
  const [currentPitch, setCurrentPitch] = useState<number>(() => {
    return volumeMode ? 65 : pitch ?? INITIAL_VIEW_STATE.pitch;
  });

  // État local pour la vue de la carte (position, zoom, inclinaison, rotation)
  const [viewState, setViewState] = useState<{
    longitude: number;
    latitude: number;
    zoom: number;
    minZoom: number;
    maxZoom: number;
    pitch: number;
    maxPitch: number;
    bearing: number;
    transitionDuration?: number;
  }>(() => ({
    ...INITIAL_VIEW_STATE,
    pitch: currentPitch,
    bearing: bearing ?? INITIAL_VIEW_STATE.bearing,
  }));

  // État pour le département sélectionné (pour le surlignage)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );

  // ============================================================================
  // DONNÉES DE TEST ET COUCHES DE BASE
  // ============================================================================

  // Données de test pour les points (utilisées pour les tests de rendu)
  const data: Point[] = useMemo(
    () => [
      { position: [2.35, 48.86], size: 200, value: 10 }, // Paris
      { position: [2.29, 48.85], size: 200, value: 30 }, // Paris
      { position: [2.4, 48.88], size: 200, value: 50 }, // Paris
    ],
    []
  );

  // Couche de points de test (ScatterplotLayer)
  const points = useMemo(() => {
    try {
      const layer = new ScatterplotLayer<Point>({
        id: "points",
        data,
        getPosition: (d: Point) => d.position,
        getRadius: (d: Point) => d.size,
        getFillColor: [255, 0, 0], // Rouge
        pickable: true,
      });
      return [layer];
    } catch (error) {
      console.error("Erreur création couche points:", error);
      return [];
    }
  }, [data]);

  // ============================================================================
  // GESTION DES ZONES ET DE LA NAVIGATION
  // ============================================================================

  // Déterminer quelle zone afficher (France entière ou région spécifique)
  const currentZone = useMemo(() => {
    if (selectedRegion && selectedRegion !== "all") {
      return extractZone(regionsData as FeatureCollection, selectedRegion);
    }
    return france as Feature; // France entière par défaut
  }, [selectedRegion]);

  // Calculer le viewState dynamique (position et zoom) selon la zone sélectionnée
  const dynamicViewState = useMemo(() => {
    if (selectedRegion && selectedRegion !== "all") {
      return getViewStateForZone(currentZone, selectedRegion);
    }
    return { longitude: 2.3522, latitude: 46.3, zoom: 4.3 };
  }, [currentZone, selectedRegion]);

  // ============================================================================
  // EFFETS POUR LA GESTION DES TRANSITIONS ET ANIMATIONS
  // ============================================================================

  // Mettre à jour l'inclinaison de la caméra quand le mode volume change
  useEffect(() => {
    const newPitch = volumeMode ? 65 : 10; // 65° pour la vue 3D, 10° pour la vue 2D
    setCurrentPitch(newPitch);

    // Mettre à jour directement le viewState avec une transition fluide pour le pitch
    setViewState((prev) => ({
      ...prev,
      pitch: newPitch,
      transitionDuration: TRANSITION_DURATION,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }, [volumeMode]);

  // Mettre à jour la vue avec transition fluide quand les props ou la zone changent
  useEffect(() => {
    setViewState((prev) => {
      // Contraindre les coordonnées dans les limites de la France
      const constrainedCoords = constrainToFranceBounds(
        dynamicViewState.longitude,
        dynamicViewState.latitude
      );

      const finalPitch = pitch !== undefined ? pitch : currentPitch;

      // Déterminer si on doit utiliser des transitions
      const needsTransition =
        prev.longitude !== constrainedCoords.longitude ||
        prev.latitude !== constrainedCoords.latitude ||
        prev.zoom !== dynamicViewState.zoom;

      return {
        ...prev,
        ...dynamicViewState,
        longitude: constrainedCoords.longitude,
        latitude: constrainedCoords.latitude,
        // Utiliser l'état séparé pour le pitch, sauf si une prop pitch est explicitement fournie
        pitch: finalPitch,
        bearing: bearing !== undefined ? bearing : prev.bearing,
        // Ajouter la durée de transition seulement pour les changements de position/zoom
        // Pas pour les changements de pitch qui sont gérés par l'autre useEffect
        ...(needsTransition && {
          transitionDuration: TRANSITION_DURATION,
          transitionInterpolator: new FlyToInterpolator(),
        }),
      };
    });
  }, [dynamicViewState, pitch, bearing, currentPitch]);

  // ============================================================================
  // CRÉATION DES COUCHES DE LA CARTE
  // ============================================================================

  // Masque opaque pour cacher tout sauf la zone sélectionnée
  const maskFeature = useMemo(() => {
    if (!currentZone) return buildCountryMask(france as Feature);
    if (selectedRegion && selectedRegion !== "all") {
      // Pour une région, créer un masque pour cette zone spécifique
      return buildCountryMask(currentZone);
    }
    return buildCountryMask(france as Feature);
  }, [currentZone, selectedRegion]);

  // Couche de masque (cache tout sauf la zone sélectionnée)
  const maskLayer = useMemo(() => {
    try {
      const layer = new GeoJsonLayer({
        id: "country-mask",
        data: maskFeature as unknown as FeatureCollection,
        stroked: false, // Pas de contour
        filled: true, // Remplissage opaque
        getFillColor: [18, 28, 33, 255], // Couleur sombre pour le masque
        pickable: false, // Non cliquable
      });
      return layer;
    } catch (error) {
      console.error("Erreur création maskLayer:", error);
      return null;
    }
  }, [maskFeature]);

  // Contour de la zone actuelle (France, région ou département)
  const zoneForBorder = useMemo(() => {
    if (!currentZone) return getFranceMetropolitaine(france as Feature);
    if (selectedRegion && selectedRegion !== "all") {
      return currentZone;
    }
    return getFranceMetropolitaine(france as Feature);
  }, [currentZone, selectedRegion]);

  // Couche de contour de la zone principale
  const zoneLayer = useMemo(() => {
    try {
      const layer = new GeoJsonLayer({
        id: "zone-border",
        data: zoneForBorder as unknown as FeatureCollection,
        stroked: true, // Avec contour
        filled: false, // Pas de remplissage
        getLineColor: volumeMode ? [255, 255, 255, 255] : [200, 200, 200, 255], // Blanc en mode volume, gris sinon
        getLineWidth: 2,
        lineWidthMinPixels: 2,
        pickable: false, // Non cliquable
      });
      return layer;
    } catch (error) {
      console.error("Erreur création zoneLayer:", error);
      return null;
    }
  }, [zoneForBorder, volumeMode]);

  // Couche pour les frontières des régions (toujours visible)
  const regionsBorderLayer = useMemo(() => {
    try {
      const layer = new GeoJsonLayer({
        id: "regions-border",
        data: regionsData as FeatureCollection,
        stroked: true, // Avec contour
        filled: false, // Pas de remplissage
        getLineColor: volumeMode ? [100, 150, 255, 200] : [150, 150, 150, 200], // Bleu en mode volume, gris sinon
        getLineWidth: 1.5,
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 3,
        pickable: false, // Non cliquable
        visible: true,
      });
      return layer;
    } catch (error) {
      console.error("Erreur création regionsBorderLayer:", error);
      return null;
    }
  }, [volumeMode]);

  // ============================================================================
  // DONNÉES ET COUCHES POUR LE MODE VOLUME 3D
  // ============================================================================

  // Données des volumes 3D (colonnes) calculées à partir des filtres
  const volumeData = useMemo(() => {
    return createVolumeData(filterData, selectedRegion, filterConfig);
  }, [filterData, selectedRegion, filterConfig]);

  // Couche des volumes 3D (colonnes) - visible uniquement en mode volume
  const volumeLayer = useMemo(() => {
    if (!volumeMode || volumeData.length === 0) {
      return null;
    }

    try {
      const layer = new ColumnLayer({
        id: "volume-columns",
        data: volumeData,
        getPosition: (d: { position: [number, number] }) => d.position,
        getFillColor: (d: { color: [number, number, number, number] }) =>
          d.color,
        getLineColor: [255, 255, 255, 100], // Contour blanc semi-transparent
        getElevation: (d: { height: number }) => d.height,
        getRadius: (d: { radius: number }) => d.radius,
        radiusMinPixels: 15, // Rayon minimum en pixels
        radiusMaxPixels: 100, // Rayon maximum en pixels
        elevationScale: 2.5, // Facteur d'échelle pour la hauteur
        pickable: true, // Cliquable
        extruded: true, // Extrusion 3D activée
        visible: volumeMode, // Visible uniquement en mode volume
        // Gestionnaire de clic sur les colonnes 3D
        onClick: (info: {
          object?: {
            departmentCode: string;
            departmentName: string;
          };
        }) => {
          if (info.object) {
            setSelectedDepartment(info.object.departmentCode);
            onDepartmentSelect?.(
              info.object.departmentCode,
              info.object.departmentName
            );
          }
        },
        // Gestionnaire de survol des colonnes 3D
        onHover: (info: {
          object?: {
            departmentCode: string;
            departmentName: string;
          };
          x?: number;
          y?: number;
        }) => {
          if (
            info.object &&
            typeof info.x === "number" &&
            typeof info.y === "number"
          ) {
            onDepartmentHover?.(
              info.object.departmentCode,
              info.object.departmentName,
              { x: info.x, y: info.y }
            );
          } else {
            onDepartmentLeave?.();
          }
        },
      });
      return layer;
    } catch (error) {
      console.error("Erreur création volumeLayer:", error);
      return null;
    }
  }, [
    volumeMode,
    volumeData,
    onDepartmentSelect,
    onDepartmentHover,
    onDepartmentLeave,
  ]);

  // ============================================================================
  // COUCHE DES DÉPARTEMENTS (INTERACTIVE)
  // ============================================================================

  // Couche pour les départements (cliquable et avec remplissage coloré)
  const departementsLayer = useMemo(() => {
    try {
      const layer = new GeoJsonLayer({
        id: "departements",
        data: departementsData as FeatureCollection,
        stroked: true,
        filled: true,
        getFillColor: (feature: {
          properties?: {
            code?: string;
            INSEE_DEP?: string;
            [key: string]: unknown;
          };
        }) => {
          // En mode volume, rendre les départements transparents mais cliquables
          if (volumeMode) {
            const departmentCode =
              feature.properties?.code ||
              feature.properties?.INSEE_DEP ||
              feature.properties?.CODE_DEPT ||
              feature.properties?.code_dept ||
              feature.properties?.insee_dep;

            // Si c'est le département sélectionné, utiliser une couleur de sélection spéciale
            if (
              selectedDepartment === departmentCode &&
              typeof departmentCode === "string"
            ) {
              return [100, 200, 255, 100];
            }

            return [0, 0, 0, 0];
          }

          // En mode couleur, logique normale
          const departmentCode =
            feature.properties?.code ||
            feature.properties?.INSEE_DEP ||
            feature.properties?.CODE_DEPT ||
            feature.properties?.code_dept ||
            feature.properties?.insee_dep;

          if (
            selectedDepartment === departmentCode &&
            typeof departmentCode === "string"
          ) {
            return [100, 200, 255, 200];
          }

          return getDepartmentColor(
            typeof departmentCode === "string" ? departmentCode : "",
            filterData,
            selectedRegion,
            filterConfig
          );
        },
        getLineColor: [120, 120, 120, 150],
        getLineWidth: (feature: {
          properties?: { code?: string; INSEE_DEP?: string };
        }) => {
          const departmentCode =
            feature.properties?.code || feature.properties?.INSEE_DEP;
          return selectedDepartment === departmentCode ? 3 : 1;
        },
        lineWidthMinPixels: 0.5,
        lineWidthMaxPixels: 3,
        pickable: true,
        visible: true,
        updateTriggers: {
          getFillColor: [
            selectedFilter,
            filterData,
            volumeMode,
            selectedDepartment,
            selectedRegion,
            filterConfig,
          ],
          getLineWidth: [selectedDepartment],
        },
        onClick: (info: {
          object?: {
            properties?: {
              code?: string;
              INSEE_DEP?: string;
              nom?: string;
              NOM_DEP?: string;
            };
          };
        }) => {
          if (info.object && info.object.properties) {
            const departmentCode =
              info.object.properties.code || info.object.properties.INSEE_DEP;
            const departmentName =
              info.object.properties.nom || info.object.properties.NOM_DEP;

            if (departmentCode && departmentName) {
              setSelectedDepartment(departmentCode);
              onDepartmentSelect?.(departmentCode, departmentName);
            }
          }
        },
        onHover: (info: {
          object?: {
            properties?: {
              code?: string;
              INSEE_DEP?: string;
              nom?: string;
              NOM_DEP?: string;
            };
          };
          x?: number;
          y?: number;
        }) => {
          if (info.object && info.object.properties && info.x && info.y) {
            const departmentCode =
              info.object.properties.code || info.object.properties.INSEE_DEP;
            const departmentName =
              info.object.properties.nom || info.object.properties.NOM_DEP;

            if (departmentCode && departmentName) {
              onDepartmentHover?.(departmentCode, departmentName, {
                x: info.x,
                y: info.y,
              });
            }
          } else {
            onDepartmentLeave?.();
          }
        },
      });
      return layer;
    } catch (error) {
      console.error("Erreur création departementsLayer:", error);
      return null;
    }
  }, [
    volumeMode,
    selectedDepartment,
    onDepartmentSelect,
    filterData,
    selectedFilter,
    selectedRegion,
    filterConfig,
    onDepartmentHover,
    onDepartmentLeave,
  ]);

  // ============================================================================
  // ASSEMBLAGE DES COUCHES ET RENDU FINAL
  // ============================================================================

  // Optimisation: Créer les couches une seule fois et les réutiliser
  // Ordre important : masque en arrière-plan, puis contours, puis départements, puis volumes
  const layers = useMemo(() => {
    const allLayers = [
      maskLayer, // Masque opaque en arrière-plan
      zoneLayer, // Contour de la zone principale
      regionsBorderLayer, // Frontières des régions
      departementsLayer, // Départements interactifs
      ...(volumeLayer ? [volumeLayer] : []), // Colonnes 3D (si mode volume)
      ...points, // Points de test
    ].filter(Boolean); // Filtrer les couches null/undefined

    return allLayers;
  }, [
    maskLayer,
    zoneLayer,
    regionsBorderLayer,
    departementsLayer,
    volumeLayer,
    points,
  ]);

  // ============================================================================
  // RENDU DU COMPOSANT
  // ============================================================================

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {/* Rendu conditionnel : attendre que le conteneur soit prêt et DeckGL monté */}
      {ready && mountDeck && (
        <DeckGL
          views={[new MapView({ id: "map", controller: true })]}
          width={width}
          height={height}
          // Limite le devicePixelRatio pour éviter les surcharges sur écrans haute résolution
          useDevicePixels={Math.min(
            WEBGL_OPTIMIZATIONS.maxDevicePixelRatio,
            window.devicePixelRatio || 1
          )}
          viewState={{ map: viewState }}
          // Gestionnaire de changement de vue avec contraintes géographiques
          onViewStateChange={({ viewState: newViewState }) => {
            const constrained = constrainToFranceBounds(
              newViewState.longitude,
              newViewState.latitude
            );
            setViewState((prev) => ({
              ...prev,
              ...newViewState,
              longitude: constrained.longitude,
              latitude: constrained.latitude,
              minZoom: prev.minZoom,
              maxZoom: prev.maxZoom,
              maxPitch: prev.maxPitch,
            }));
          }}
          controller={{ dragRotate: true }} // Permettre la rotation avec la souris
          onWebGLInitialized={() => setGlReady(true)} // Callback d'initialisation WebGL
          layers={glReady ? layers : []} // Couches visibles uniquement quand WebGL est prêt
          style={{ width: "100%", height: "100%" }}
          onError={(error: Error) => {
            console.error("Erreur DeckGL:", error);
          }}
        >
          {/* Composant Map de react-map-gl pour l'affichage de la carte de base */}
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11" // Style sombre
            style={{ background: "#121c21", width: "100%", height: "100%" }}
            cooperativeGestures // Permettre les gestes de navigation
            {...({ projection: "mercator" } as Record<string, unknown>)}
            onError={(event: { error?: Error; type?: string }) =>
              console.error("Erreur Mapbox:", event)
            }
          />
        </DeckGL>
      )}
    </div>
  );
}
