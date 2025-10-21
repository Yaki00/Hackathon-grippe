import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl";
import type { Feature, FeatureCollection } from "geojson";
import france from "../data/france.json";
import regionsData from "../data/regions.json";
import departementsData from "../data/departements.json";
import { MapView } from "@deck.gl/core";

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
};

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

export default function MapTest({
  selectedRegion,
  selectedYear, // TODO: Utiliser pour charger les données spécifiques à l'année
  colorMode = false,
  pitch,
  bearing,
  onDepartmentSelect,
}: MapTestProps = {}) {
  // TODO: Utiliser selectedYear pour charger les données spécifiques à l'année
  console.log("Année sélectionnée:", selectedYear);

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

  const points = useMemo(
    () => [
      new ScatterplotLayer<Point>({
        id: "points",
        data,
        getPosition: (d) => d.position,
        getRadius: (d) => d.size,
        getFillColor: [255, 0, 0],
        pickable: true,
      }),
    ],
    [data]
  );

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

  const maskLayer = useMemo(
    () =>
      new GeoJsonLayer({
        id: "country-mask",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: maskFeature as any,
        stroked: false,
        filled: true,
        getFillColor: colorMode
          ? [18, 28, 33, 255] // #121c21 en mode couleur
          : [18, 28, 33, 255], // #121c21 en mode normal
        pickable: false,
      }),
    [maskFeature, colorMode]
  );

  // Contour de la zone actuelle (France, région ou département)
  const zoneForBorder = useMemo(() => {
    if (!currentZone) return getFranceMetropolitaine(france as Feature);
    if (selectedRegion && selectedRegion !== "all") {
      return currentZone;
    }
    return getFranceMetropolitaine(france as Feature);
  }, [currentZone, selectedRegion]);

  const zoneLayer = useMemo(
    () =>
      new GeoJsonLayer({
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
      }),
    [zoneForBorder, colorMode]
  );

  // Couche pour les frontières des régions (toujours visible)
  const regionsBorderLayer = useMemo(
    () =>
      new GeoJsonLayer({
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
      }),
    [colorMode]
  );

  // Couche pour les départements (cliquable et avec remplissage)
  const departementsLayer = useMemo(
    () =>
      new GeoJsonLayer({
        id: "departements",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: departementsData as any,
        stroked: true,
        filled: true,
        getFillColor: (feature: any) => {
          const departmentCode =
            feature.properties?.code || feature.properties?.INSEE_DEP;
          if (selectedDepartment === departmentCode) {
            return colorMode ? [255, 100, 100, 200] : [100, 200, 255, 200]; // Couleur de sélection
          }
          return colorMode ? [255, 200, 100, 50] : [120, 120, 120, 30]; // Couleur normale
        },
        getLineColor: colorMode
          ? [255, 200, 100, 150] // orange clair en mode couleur
          : [120, 120, 120, 150], // gris foncé en mode normal
        getLineWidth: (feature: any) => {
          const departmentCode =
            feature.properties?.code || feature.properties?.INSEE_DEP;
          return selectedDepartment === departmentCode ? 3 : 1;
        },
        lineWidthMinPixels: 0.5,
        lineWidthMaxPixels: 3,
        pickable: true,
        visible: viewState.zoom >= 2, // Visible seulement au zoom 2 ou plus
        onClick: (info: any) => {
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
      }),
    [colorMode, viewState.zoom, selectedDepartment, onDepartmentSelect]
  );

  return (
    <DeckGL
      views={[new MapView({ id: "map", controller: true })]}
      viewState={{ ...viewState, maxPitch: 80 }}
      onViewStateChange={({ viewState: newViewState }) => {
        // Appliquer les contraintes géographiques lors du déplacement
        const constrainedCoords = constrainToFranceBounds(
          newViewState.longitude,
          newViewState.latitude
        );

        setViewState({
          ...newViewState,
          longitude: constrainedCoords.longitude,
          latitude: constrainedCoords.latitude,
        });
      }}
      controller={{
        dragRotate: true,
      }}
      layers={[
        maskLayer,
        zoneLayer,
        regionsBorderLayer,
        departementsLayer,
        ...points,
      ]}
      style={{ width: "100%", height: "100%" }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={
          colorMode
            ? "mapbox://styles/mapbox/streets-v12" // style coloré
            : "mapbox://styles/mapbox/dark-v11" // style sombre
        }
        style={{ background: "#121c21" }}
        cooperativeGestures
        {...({ projection: "mercator" } as Record<string, unknown>)}
      />
    </DeckGL>
  );
}
