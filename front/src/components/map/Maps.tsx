import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useState, useEffect, useRef } from "react";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl";
import type { Feature, FeatureCollection } from "geojson";
import france from "../data/france.json";
import regionsData from "../data/regions.json";
import departementsData from "../data/departements.json";
import { DEPARTEMENTS } from "../data/regions-list";
import { MapView } from "@deck.gl/core";

// Fonction pour diagnostiquer les capacités WebGL
function diagnoseWebGL(): void {
  console.log("=== DIAGNOSTIC WEBGL ===");

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.error("❌ WebGL non supporté par ce navigateur");
      return;
    }

    console.log("✅ WebGL supporté");
    console.log("Version WebGL:", gl.getParameter(gl.VERSION));
    console.log("Vendor:", gl.getParameter(gl.VENDOR));
    console.log("Renderer:", gl.getParameter(gl.RENDERER));

    // Vérifier les limites critiques
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

    console.log("Limites WebGL:");
    console.log("- MAX_TEXTURE_SIZE:", maxTextureSize);
    console.log("- MAX_VIEWPORT_DIMS:", maxViewportDims);
    console.log("- MAX_RENDERBUFFER_SIZE:", maxRenderBufferSize);

    // Vérifier les extensions importantes
    const extensions = gl.getSupportedExtensions();
    console.log("Extensions supportées:", extensions);

    // Vérifier les extensions critiques pour DeckGL
    const criticalExtensions = [
      "WEBGL_depth_texture",
      "OES_texture_float",
      "OES_texture_half_float",
      "WEBGL_lose_context",
    ];

    console.log("Extensions critiques pour DeckGL:");
    criticalExtensions.forEach((ext) => {
      const supported = extensions?.includes(ext);
      console.log(`- ${ext}: ${supported ? "✅" : "❌"}`);
    });

    // Test de création de texture
    try {
      const texture = gl.createTexture();
      if (texture) {
        console.log("✅ Création de texture réussie");
        gl.deleteTexture(texture);
      } else {
        console.error("❌ Échec de création de texture");
      }
    } catch (e) {
      console.error("❌ Erreur lors de la création de texture:", e);
    }

    // Test spécifique pour maxTextureDimension2D
    try {
      const maxTextureDimension2D = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      console.log(
        "✅ maxTextureDimension2D disponible:",
        maxTextureDimension2D
      );

      // Test de création d'une texture de taille maximale
      const testTexture = gl.createTexture();
      if (testTexture) {
        gl.bindTexture(gl.TEXTURE_2D, testTexture);
        console.log("✅ Liaison texture réussie");
        gl.deleteTexture(testTexture);
      }
    } catch (e) {
      console.error("❌ Erreur avec maxTextureDimension2D:", e);
    }
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic WebGL:", error);
  }

  console.log("=== FIN DIAGNOSTIC ===");
}

// Extrait la France métropolitaine + Corse (polygones en Europe)
function getFranceMetropolitaine(
  country: Feature | FeatureCollection
): Feature {
  const feature =
    country.type === "FeatureCollection" ? country.features[0] : country;
  if (!feature || !feature.geometry)
    throw new Error("GeoJSON invalide pour le pays");

  const geom = feature.geometry;

  if (geom.type === "Polygon") {
    return feature;
  } else if (geom.type === "MultiPolygon") {
    // Filtrer les polygones de la France métropolitaine (longitude entre -5 et 10, latitude entre 41 et 52)
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

// Construit un "monde avec des trous = France + Corse"
function buildCountryMask(country: Feature | FeatureCollection): Feature {
  const franceMetro = getFranceMetropolitaine(country);
  const geom = franceMetro.geometry;

  const world = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];

  let holes: number[][][] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((geom as any).type === "Polygon") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    holes = (geom as any).coordinates.map((ring: number[][]) => ring);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } else if ((geom as any).type === "MultiPolygon") {
    // Pour un MultiPolygon, on aplatit tous les polygones en anneaux
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    holes = (geom as any).coordinates.flatMap((poly: number[][][]) => poly);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [world, ...holes] },
  } as Feature;
}

// Limites géographiques de la France métropolitaine
const FRANCE_BOUNDS = {
  minLng: -5.5, // Ouest (Bretagne)
  maxLng: 10.0, // Est (Alsace)
  minLat: 41.0, // Sud (Corse)
  maxLat: 51.5, // Nord (Nord-Pas-de-Calais)
};

const INITIAL_VIEW_STATE = {
  longitude: 2.3522,
  latitude: 48.8566,
  zoom: 10,
  minZoom: 4.5,
  maxZoom: 7.5,
  pitch: 10,
  maxPitch: 60,
  bearing: 0,
} as const;

// Durée de transition pour les animations de zoom/dézoom (en millisecondes)
const TRANSITION_DURATION = 1500;

// Fonction pour contraindre les coordonnées dans les limites de la France
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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

type Point = {
  position: [number, number];
  size: number;
  value?: number;
  color?: [number, number, number];
};

type MapTestProps = {
  selectedRegion?: string;
  selectedYear?: string;
  colorMode?: boolean;
  pitch?: number;
  bearing?: number;
  onDepartmentSelect?: (departmentCode: string, departmentName: string) => void;
  vaccinationData?: Record<
    string,
    { taux: number; doses: number; population: number }
  >;
  selectedFilter?: string;
};

// Fonction pour vérifier si un département appartient à la région sélectionnée
function isDepartmentInSelectedRegion(
  departmentCode: string,
  selectedRegion?: string
): boolean {
  if (!selectedRegion || selectedRegion === "all") {
    return true; // Si pas de région sélectionnée ou "all", afficher tous les départements
  }

  const department = DEPARTEMENTS.find((dept) => dept.value === departmentCode);
  return department ? department.region === selectedRegion : false;
}

// Fonction pour calculer la couleur d'un département basée sur les données de vaccination
function getVaccinationColor(
  departmentCode: string,
  vaccinationData?: Record<
    string,
    { taux: number; doses: number; population: number }
  >,
  selectedFilter?: string,
  colorMode?: boolean,
  selectedRegion?: string
): [number, number, number, number] {
  // Vérifier si le département appartient à la région sélectionnée
  const isInSelectedRegion = isDepartmentInSelectedRegion(
    departmentCode,
    selectedRegion
  );

  // Log détaillé pour diagnostiquer le problème
  console.log("🔍 getVaccinationColor appelée avec:", {
    departmentCode,
    selectedFilter,
    selectedRegion,
    isInSelectedRegion,
    hasVaccinationData: !!vaccinationData,
    vaccinationDataKeys: vaccinationData ? Object.keys(vaccinationData) : [],
    hasDataForDepartment: vaccinationData
      ? !!vaccinationData[departmentCode]
      : false,
    colorMode,
    departmentData: vaccinationData ? vaccinationData[departmentCode] : null,
  });

  // Si pas de filtre de vaccination, pas de données, ou département pas dans la région sélectionnée, retourner la couleur par défaut
  if (
    selectedFilter !== "vaccination" ||
    !vaccinationData ||
    !vaccinationData[departmentCode] ||
    !isInSelectedRegion
  ) {
    console.log(
      "❌ Retour couleur par défaut pour département",
      departmentCode,
      {
        reason:
          selectedFilter !== "vaccination"
            ? "Filtre != vaccination"
            : !vaccinationData
            ? "Pas de vaccinationData"
            : !vaccinationData[departmentCode]
            ? "Pas de données pour ce département"
            : "Département pas dans la région sélectionnée",
      }
    );
    return colorMode ? [255, 200, 100, 50] : [120, 120, 120, 30];
  }

  const taux = vaccinationData[departmentCode].taux;

  // Échelle de couleurs basée sur le taux de vaccination
  // Couleurs très visibles pour tester
  console.log(
    "🎨 Couleur calculée pour département",
    departmentCode,
    "taux:",
    taux,
    "données complètes:",
    vaccinationData[departmentCode]
  );

  let color: [number, number, number, number];
  if (taux < 30) {
    color = [255, 0, 0, 255]; // Rouge très visible
  } else if (taux < 60) {
    color = [255, 165, 0, 255]; // Orange très visible
  } else if (taux < 80) {
    color = [255, 255, 0, 255]; // Jaune très visible
  } else {
    color = [0, 255, 0, 255]; // Vert très visible
  }

  console.log("✅ Couleur finale retournée:", color);
  return color;
}

// Fonction pour extraire une région ou un département spécifique
function extractZone(data: FeatureCollection, code: string): Feature | null {
  const features = data.features;
  const zone = features.find(
    (f: Feature) => f.properties?.code === code || f.properties?.nom === code
  );
  return zone || null;
}

// Niveaux de zoom personnalisés pour chaque région
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

// Calcule le centre et le zoom pour une zone donnée avec des niveaux optimisés par région
function getViewStateForZone(
  zone: Feature | null,
  regionCode?: string
): {
  longitude: number;
  latitude: number;
  zoom: number;
} {
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

  const longitude = (minLon + maxLon) / 2;
  const latitude = (minLat + maxLat) / 2;

  // Utiliser le niveau de zoom personnalisé si disponible, sinon calculer automatiquement
  let zoom = 5;
  if (regionCode && REGION_ZOOM_LEVELS[regionCode]) {
    zoom = REGION_ZOOM_LEVELS[regionCode];
  } else {
    // Calcul automatique pour les cas non définis
    const lonDiff = maxLon - minLon;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lonDiff, latDiff);

    if (maxDiff < 0.3) zoom = 9.5; // Très petites zones
    else if (maxDiff < 0.6) zoom = 8.5; // Petites zones
    else if (maxDiff < 1.2) zoom = 7.5; // Zones moyennes
    else if (maxDiff < 2.5) zoom = 6.5; // Grandes zones
    else if (maxDiff < 4) zoom = 5.5; // Très grandes zones
    else zoom = 4.5; // France entière
  }

  return { longitude, latitude, zoom };
}

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({
        width: Math.max(1, Math.floor(cr.width)),
        height: Math.max(1, Math.floor(cr.height)),
      });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return { ref, ...size };
}

export default function MapTest({
  selectedRegion,
  selectedYear, // TODO: Utiliser pour charger les données spécifiques à l'année
  colorMode = false,
  pitch,
  bearing,
  onDepartmentSelect,
  vaccinationData,
  selectedFilter,
}: MapTestProps = {}) {
  // TODO: Utiliser selectedYear pour charger les données spécifiques à l'année
  console.log("Année sélectionnée:", selectedYear);

  // Log détaillé des props reçues par le composant Maps
  console.log("🗺️ MapTest reçoit les props:", {
    selectedRegion,
    selectedYear,
    colorMode,
    selectedFilter,
    hasVaccinationData: !!vaccinationData,
    vaccinationDataKeys: vaccinationData ? Object.keys(vaccinationData) : [],
    vaccinationDataSample: vaccinationData
      ? Object.keys(vaccinationData)
          .slice(0, 3)
          .reduce((acc, key) => {
            acc[key] = vaccinationData[key];
            return acc;
          }, {} as Record<string, { taux: number; doses: number; population: number }>)
      : null,
  });

  const {
    ref: containerRef,
    width,
    height,
  } = useContainerSize<HTMLDivElement>();
  const ready = width > 0 && height > 0;

  // 1) Monter DeckGL au rAF suivant (laisse le DOM se stabiliser)
  const [mountDeck, setMountDeck] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountDeck(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // 2) Attendre que le contexte WebGL soit initialisé avant de pousser les enfants (Map + layers)
  const [glReady, setGlReady] = useState(false);

  // Diagnostic WebGL au montage du composant
  useEffect(() => {
    console.log("🔍 Montage du composant Maps - Diagnostic WebGL");
    diagnoseWebGL();

    // Capturer les erreurs WebGL globales
    const handleWebGLError = (event: Event) => {
      console.error("🚨 Erreur WebGL globale:", event);
    };

    const handleWebGLContextRestored = (event: Event) => {
      console.log("✅ Contexte WebGL restauré:", event);
    };

    // Capturer les erreurs JavaScript globales
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("🚨 Erreur JavaScript globale:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🚨 Promesse rejetée non gérée:", {
        reason: event.reason,
        promise: event.promise,
      });
    };

    // Capturer les erreurs de redimensionnement
    const handleResizeError = (event: Event) => {
      console.error("🚨 Erreur de redimensionnement:", event);
    };

    // Ajouter les listeners
    window.addEventListener("webglcontextlost", handleWebGLError);
    window.addEventListener("webglcontextrestored", handleWebGLContextRestored);
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("resize", handleResizeError);

    // Log des informations sur le navigateur
    console.log("🌐 Informations navigateur:", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
      connection: (navigator as { connection?: { effectiveType?: string } })
        .connection,
    });

    return () => {
      window.removeEventListener("webglcontextlost", handleWebGLError);
      window.removeEventListener(
        "webglcontextrestored",
        handleWebGLContextRestored
      );
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("resize", handleResizeError);
    };
  }, []);

  // État local pour la vue de la carte
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewState, setViewState] = useState<any>(() => ({
    ...INITIAL_VIEW_STATE,
    pitch: pitch ?? INITIAL_VIEW_STATE.pitch,
    bearing: bearing ?? INITIAL_VIEW_STATE.bearing,
  }));

  // État pour le département sélectionné
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );

  const data: Point[] = useMemo(
    () => [
      { position: [2.35, 48.86], size: 200, value: 10 },
      { position: [2.29, 48.85], size: 200, value: 30 },
      { position: [2.4, 48.88], size: 200, value: 50 },
    ],
    []
  );

  const points = useMemo(() => {
    console.log("🏗️ Création de la couche points (ScatterplotLayer)");
    try {
      const layer = new ScatterplotLayer<Point>({
        id: "points",
        data,
        getPosition: (d) => d.position,
        getRadius: (d) => d.size,
        getFillColor: [255, 0, 0],
        pickable: true,
      });
      console.log("✅ Couche points créée avec succès");
      return [layer];
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création de la couche points:",
        error
      );
      throw error;
    }
  }, [data]);

  // Déterminer quelle zone afficher
  const currentZone = useMemo(() => {
    if (selectedRegion && selectedRegion !== "all") {
      return extractZone(regionsData as FeatureCollection, selectedRegion);
    }
    return france as Feature; // France entière par défaut
  }, [selectedRegion]);

  // Calculer le viewState dynamique (position et zoom seulement)
  const dynamicViewState = useMemo(() => {
    if (selectedRegion && selectedRegion !== "all") {
      return getViewStateForZone(currentZone, selectedRegion);
    }
    return { longitude: 2.3522, latitude: 46.3, zoom: 4.5 };
  }, [currentZone, selectedRegion]);

  // Mettre à jour la vue avec transition fluide quand les props ou la zone changent
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setViewState((prev: any) => {
      const constrainedCoords = constrainToFranceBounds(
        dynamicViewState.longitude,
        dynamicViewState.latitude
      );

      return {
        ...prev,
        ...dynamicViewState,
        longitude: constrainedCoords.longitude,
        latitude: constrainedCoords.latitude,
        pitch: pitch ?? prev.pitch,
        bearing: bearing ?? prev.bearing,
        // Ajouter la durée de transition pour les animations fluides
        transitionDuration: TRANSITION_DURATION,
      };
    });
  }, [dynamicViewState, pitch, bearing]);

  // Masque opaque pour cacher tout sauf la zone sélectionnée
  const maskFeature = useMemo(() => {
    if (!currentZone) return buildCountryMask(france as Feature);
    if (selectedRegion && selectedRegion !== "all") {
      // Pour une région, on crée un masque pour cette zone
      return buildCountryMask(currentZone);
    }
    return buildCountryMask(france as Feature);
  }, [currentZone, selectedRegion]);

  const maskLayer = useMemo(() => {
    console.log("🏗️ Création de la couche maskLayer");
    try {
      const layer = new GeoJsonLayer({
        id: "country-mask",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: maskFeature as any,
        stroked: false,
        filled: true,
        getFillColor: colorMode
          ? [18, 28, 33, 255] // #121c21 en mode couleur
          : [18, 28, 33, 255], // #121c21 en mode normal
        pickable: false,
      });
      console.log("✅ Couche maskLayer créée avec succès");
      return layer;
    } catch (error) {
      console.error("❌ Erreur lors de la création de maskLayer:", error);
      throw error;
    }
  }, [maskFeature, colorMode]);

  // Contour de la zone actuelle (France, région ou département)
  const zoneForBorder = useMemo(() => {
    if (!currentZone) return getFranceMetropolitaine(france as Feature);
    if (selectedRegion && selectedRegion !== "all") {
      return currentZone;
    }
    return getFranceMetropolitaine(france as Feature);
  }, [currentZone, selectedRegion]);

  const zoneLayer = useMemo(() => {
    console.log("🏗️ Création de la couche zoneLayer");
    try {
      const layer = new GeoJsonLayer({
        id: "zone-border",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: zoneForBorder as any,
        stroked: true,
        filled: false,
        getLineColor: colorMode
          ? [255, 255, 255, 255] // blanc en mode couleur
          : [200, 200, 200, 255], // gris clair en mode normal
        getLineWidth: 2,
        lineWidthMinPixels: 2,
        pickable: false,
      });
      console.log("✅ Couche zoneLayer créée avec succès");
      return layer;
    } catch (error) {
      console.error("❌ Erreur lors de la création de zoneLayer:", error);
      throw error;
    }
  }, [zoneForBorder, colorMode]);

  // Couche pour les frontières des régions (toujours visible)
  const regionsBorderLayer = useMemo(() => {
    console.log("🏗️ Création de la couche regionsBorderLayer");
    try {
      const layer = new GeoJsonLayer({
        id: "regions-border",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: regionsData as any,
        stroked: true,
        filled: false,
        getLineColor: colorMode
          ? [100, 150, 255, 200] // bleu clair en mode couleur
          : [150, 150, 150, 200], // gris moyen en mode normal
        getLineWidth: 1.5,
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 3,
        pickable: false,
        visible: true, // Toujours visible
      });
      console.log("✅ Couche regionsBorderLayer créée avec succès");
      return layer;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création de regionsBorderLayer:",
        error
      );
      throw error;
    }
  }, [colorMode]);

  // Couche pour les départements (cliquable et avec remplissage)
  const departementsLayer = useMemo(() => {
    console.log("🏗️ Création de la couche departementsLayer");

    // Log de la structure des données GeoJSON des départements
    console.log("🔍 Structure des données départements:", {
      hasData: !!departementsData,
      dataType: typeof departementsData,
      isFeatureCollection:
        departementsData &&
        (departementsData as FeatureCollection).type === "FeatureCollection",
      featuresCount:
        departementsData && (departementsData as FeatureCollection).features
          ? (departementsData as FeatureCollection).features.length
          : 0,
      firstFeatureSample:
        departementsData && (departementsData as FeatureCollection).features
          ? (departementsData as FeatureCollection).features[0]
          : null,
      firstFeatureProps:
        departementsData && (departementsData as FeatureCollection).features
          ? (departementsData as FeatureCollection).features[0]?.properties
          : null,
    });

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
          // Log immédiat pour confirmer que la fonction est appelée
          console.log("🚀 getFillColor appelée !", feature?.properties);

          // Log systématique pour les premiers départements pour diagnostiquer
          const departmentCode =
            feature.properties?.code ||
            feature.properties?.INSEE_DEP ||
            feature.properties?.CODE_DEPT ||
            feature.properties?.code_dept ||
            feature.properties?.insee_dep;

          // Log détaillé pour chaque appel de getFillColor
          console.log(
            "🎨 getFillColor appelée pour département:",
            departmentCode,
            {
              selectedFilter,
              hasVaccinationData: !!vaccinationData,
              vaccinationDataKeys: vaccinationData
                ? Object.keys(vaccinationData)
                : [],
              isSelected: selectedDepartment === departmentCode,
              availableProps: Object.keys(feature.properties || {}),
              allProps: feature.properties as Record<string, unknown>,
              colorMode,
            }
          );

          // Log spécial pour les départements avec des données
          if (
            departmentCode &&
            typeof departmentCode === "string" &&
            vaccinationData &&
            vaccinationData[departmentCode]
          ) {
            console.log(
              "✅ Département avec données trouvé:",
              departmentCode,
              vaccinationData[departmentCode]
            );
          }

          // Si c'est le département sélectionné, utiliser une couleur de sélection spéciale
          if (
            selectedDepartment === departmentCode &&
            typeof departmentCode === "string"
          ) {
            console.log(
              "🎯 Couleur de sélection pour département:",
              departmentCode
            );
            return colorMode ? [255, 100, 100, 200] : [100, 200, 255, 200]; // Couleur de sélection
          }

          // Sinon, utiliser la couleur basée sur les données de vaccination
          const finalColor = getVaccinationColor(
            typeof departmentCode === "string" ? departmentCode : "",
            vaccinationData,
            selectedFilter,
            colorMode,
            selectedRegion
          );

          console.log(
            "🎨 Couleur finale retournée pour département",
            departmentCode,
            ":",
            finalColor
          );
          return finalColor;
        },
        getLineColor: colorMode
          ? [255, 200, 100, 150] // orange clair en mode couleur
          : [120, 120, 120, 150], // gris foncé en mode normal
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
        visible: true, // Toujours visible, indépendamment du zoom
        updateTriggers: {
          getFillColor: [
            selectedFilter,
            vaccinationData,
            colorMode,
            selectedDepartment,
          ],
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
      });
      console.log("✅ Couche departementsLayer créée avec succès");
      return layer;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création de departementsLayer:",
        error
      );
      throw error;
    }
  }, [
    colorMode,
    selectedDepartment,
    onDepartmentSelect,
    vaccinationData,
    selectedFilter,
    selectedRegion,
  ]);

  // Log quand les dépendances changent pour forcer la mise à jour
  useEffect(() => {
    console.log("🔄 Dépendances de departementsLayer changées:", {
      colorMode,
      zoom: viewState.zoom,
      selectedDepartment,
      hasVaccinationData: !!vaccinationData,
      vaccinationDataKeys: vaccinationData ? Object.keys(vaccinationData) : [],
      selectedFilter,
    });
  }, [
    colorMode,
    viewState.zoom,
    selectedDepartment,
    vaccinationData,
    selectedFilter,
  ]);

  // Log de l'état des couches avant le rendu
  console.log("📊 État des couches avant rendu:", {
    maskLayer: maskLayer ? "✅ Créée" : "❌ Non créée",
    zoneLayer: zoneLayer ? "✅ Créée" : "❌ Non créée",
    regionsBorderLayer: regionsBorderLayer ? "✅ Créée" : "❌ Non créée",
    departementsLayer: departementsLayer ? "✅ Créée" : "❌ Non créée",
    points: points ? `✅ Créée (${points.length} couches)` : "❌ Non créée",
    totalLayers: [
      maskLayer,
      zoneLayer,
      regionsBorderLayer,
      departementsLayer,
      ...points,
    ].length,
    // Debug: état du filtre et des données
    selectedFilter,
    hasVaccinationData: !!vaccinationData,
    vaccinationDataKeys: vaccinationData ? Object.keys(vaccinationData) : [],
    currentZoom: viewState.zoom,
  });

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {ready && mountDeck && (
        <DeckGL
          views={[new MapView({ id: "map", controller: true })]}
          width={width}
          height={height}
          // Limite le drawing buffer sur écrans très denses (optionnel mais conseillé)
          useDevicePixels={Math.min(2, window.devicePixelRatio || 1)}
          viewState={{ ...viewState, maxPitch: 80 }}
          onViewStateChange={({ viewState: newViewState }) => {
            const constrained = constrainToFranceBounds(
              newViewState.longitude,
              newViewState.latitude
            );
            setViewState({
              ...newViewState,
              longitude: constrained.longitude,
              latitude: constrained.latitude,
            });
          }}
          controller={{ dragRotate: true }}
          onWebGLInitialized={() => setGlReady(true)}
          layers={
            glReady
              ? (() => {
                  const layers = [
                    maskLayer,
                    zoneLayer,
                    regionsBorderLayer,
                    departementsLayer,
                    ...points,
                  ];
                  console.log("🎨 Couches rendues:", {
                    totalLayers: layers.length,
                    departementsLayerVisible: departementsLayer?.props?.visible,
                    currentZoom: viewState.zoom,
                    layers: layers.map((layer) => ({
                      id: layer?.props?.id,
                      visible: layer?.props?.visible,
                      type: layer?.constructor?.name,
                    })),
                  });
                  return layers;
                })()
              : []
          }
          style={{ width: "100%", height: "100%" }}
          onError={(error: Error) => {
            console.error("🚨 Erreur DeckGL:", error);
            console.error("Stack trace:", error.stack);
          }}
          onAfterRender={() => console.log("🎨 Rendu DeckGL terminé")}
        >
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={
              colorMode
                ? "mapbox://styles/mapbox/streets-v12"
                : "mapbox://styles/mapbox/dark-v11"
            }
            style={{ background: "#121c21", width: "100%", height: "100%" }}
            cooperativeGestures
            {...({ projection: "mercator" } as Record<string, unknown>)}
            onLoad={() => console.log("🗺️ Carte Mapbox chargée")}
            onError={(event: { error?: Error; type?: string }) =>
              console.error("🚨 Erreur Mapbox:", event)
            }
          />
        </DeckGL>
      )}
    </div>
  );
}
