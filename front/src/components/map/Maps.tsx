import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo } from "react";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl";
import type { Feature, FeatureCollection } from "geojson";
import france from "../data/france.json";
import regionsData from "../data/regions.json";
import departementsData from "../data/departements.json";

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

const INITIAL_VIEW_STATE = {
  longitude: 2.3522,
  latitude: 48.8566,
  zoom: 5,
  minZoom: 3,
  maxZoom: 15,
  pitch: 15,
  maxPitch: 60,
  bearing: 0,
} as const;

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

type Point = {
  position: [number, number];
  size: number;
  value?: number;
  color?: [number, number, number];
};

type MapTestProps = {
  selectedRegion?: string;
  selectedDepartement?: string;
  colorMode?: boolean;
};

// Fonction pour extraire une région ou un département spécifique
function extractZone(data: FeatureCollection, code: string): Feature | null {
  const features = data.features;
  const zone = features.find(
    (f: Feature) => f.properties?.code === code || f.properties?.nom === code
  );
  return zone || null;
}

// Calcule le centre et le zoom pour une zone donnée
function getViewStateForZone(zone: Feature | null): {
  longitude: number;
  latitude: number;
  zoom: number;
} {
  if (!zone || !zone.geometry) {
    return { longitude: 2.3522, latitude: 46.8566, zoom: 5 };
  }

  // Calculer le centre approximatif du bounding box
  const coords =
    zone.geometry.type === "Polygon"
      ? zone.geometry.coordinates[0]
      : zone.geometry.type === "MultiPolygon"
      ? zone.geometry.coordinates[0][0]
      : [];

  if (coords.length === 0) {
    return { longitude: 2.3522, latitude: 46.8566, zoom: 5 };
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

  // Calculer un zoom adapté à la taille de la zone
  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;
  const maxDiff = Math.max(lonDiff, latDiff);

  let zoom = 5;
  if (maxDiff < 0.5) zoom = 10;
  else if (maxDiff < 1) zoom = 9;
  else if (maxDiff < 2) zoom = 8;
  else if (maxDiff < 4) zoom = 7;
  else if (maxDiff < 6) zoom = 6;

  return { longitude, latitude, zoom };
}

export default function MapTest({
  selectedRegion,
  selectedDepartement,
  colorMode = false,
}: MapTestProps = {}) {
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
    if (selectedDepartement) {
      return extractZone(
        departementsData as FeatureCollection,
        selectedDepartement
      );
    } else if (selectedRegion && selectedRegion !== "all") {
      return extractZone(regionsData as FeatureCollection, selectedRegion);
    }
    return france as Feature; // France entière par défaut
  }, [selectedRegion, selectedDepartement]);

  // Calculer le viewState dynamique
  const dynamicViewState = useMemo(() => {
    if (selectedDepartement || (selectedRegion && selectedRegion !== "all")) {
      return getViewStateForZone(currentZone);
    }
    return { longitude: 2.3522, latitude: 46.8566, zoom: 5 };
  }, [selectedRegion, selectedDepartement, currentZone]);

  // Masque opaque pour cacher tout sauf la zone sélectionnée
  const maskFeature = useMemo(() => {
    if (!currentZone) return buildCountryMask(france as Feature);
    if (selectedDepartement || (selectedRegion && selectedRegion !== "all")) {
      // Pour une région ou un département, on crée un masque pour cette zone
      return buildCountryMask(currentZone);
    }
    return buildCountryMask(france as Feature);
  }, [currentZone, selectedRegion, selectedDepartement]);

  const maskLayer = useMemo(
    () =>
      new GeoJsonLayer({
        id: "country-mask",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: maskFeature as any,
        stroked: false,
        filled: true,
        getFillColor: colorMode
          ? [0, 0, 0, 255] // noir totalement opaque en mode couleur
          : [0, 0, 0, 255], // noir totalement opaque en mode normal
        pickable: false,
      }),
    [maskFeature, colorMode]
  );

  // Contour de la zone actuelle (France, région ou département)
  const zoneForBorder = useMemo(() => {
    if (!currentZone) return getFranceMetropolitaine(france as Feature);
    if (selectedDepartement || (selectedRegion && selectedRegion !== "all")) {
      return currentZone;
    }
    return getFranceMetropolitaine(france as Feature);
  }, [currentZone, selectedRegion, selectedDepartement]);

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

  return (
    <DeckGL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialViewState={{ ...INITIAL_VIEW_STATE, ...dynamicViewState } as any}
      controller={{ dragRotate: true }}
      layers={[maskLayer, zoneLayer, ...points]}
      style={{ width: "100%", height: "100%" }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={
          colorMode
            ? "mapbox://styles/mapbox/streets-v12" // style coloré
            : "mapbox://styles/mapbox/dark-v11" // style sombre
        }
        cooperativeGestures
      />
    </DeckGL>
  );
}
