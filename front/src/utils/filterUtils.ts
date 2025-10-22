import type { FilterConfig } from "../types/filters";

// Fonction générique pour obtenir la couleur d'un département
export function getDepartmentColor(
  departmentCode: string,
  filterData: Record<string, any>,
  filterConfig: FilterConfig | undefined
): [number, number, number, number] {
  // Si pas de filtre configuré ou pas de données, retourner la couleur par défaut
  if (!filterConfig || !filterData[departmentCode]) {
    return [120, 120, 120, 30]; // Couleur par défaut
  }

  const data = filterData[departmentCode];

  // Vérifier si les données sont valides
  if (filterConfig.isValid && !filterConfig.isValid(data)) {
    return [120, 120, 120, 30]; // Couleur par défaut pour données invalides
  }

  return filterConfig.colorMapper(data);
}

// Fonction générique pour créer les données de volume 3D
export function createVolumeData(
  filterData: Record<string, any>,
  filterConfig: FilterConfig | undefined,
  departmentCenters: Record<string, [number, number]> = {}
): Array<{
  position: [number, number];
  height: number;
  radius: number;
  color: [number, number, number, number];
  departmentCode: string;
  departmentName: string;
}> {
  if (!filterConfig || !filterConfig.volumeMapper) {
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

  Object.entries(filterData).forEach(([departmentCode, data]) => {
    // Vérifier si les données sont valides
    if (filterConfig.isValid && !filterConfig.isValid(data)) {
      return;
    }

    const center = departmentCenters[departmentCode];
    if (!center) {
      return;
    }

    const volumeInfo = filterConfig.volumeMapper!(data);

    volumeData.push({
      position: center,
      height: volumeInfo.height,
      radius: volumeInfo.radius,
      color: volumeInfo.color,
      departmentCode,
      departmentName: departmentCode, // Vous pouvez améliorer cela avec un mapping des noms
    });
  });

  return volumeData;
}

// Fonction pour formater l'affichage des données
export function formatFilterValue(
  data: any,
  filterConfig: FilterConfig | undefined
): string {
  if (!filterConfig || !filterConfig.displayFormatter) {
    return "N/A";
  }

  return filterConfig.displayFormatter(data);
}

// Fonction pour vérifier si un département appartient à une région
export function isDepartmentInRegion(
  departmentCode: string,
  regionCode: string,
  departments: Array<{ value: string; region: string }>
): boolean {
  if (!regionCode || regionCode === "all") {
    return true;
  }

  const department = departments.find((dept) => dept.value === departmentCode);
  return department ? department.region === regionCode : false;
}

// Fonction pour filtrer les données par région
export function filterDataByRegion<T>(
  data: Record<string, T>,
  regionCode: string,
  departments: Array<{ value: string; region: string }>
): Record<string, T> {
  if (regionCode === "all" || !regionCode) {
    return data;
  }

  const filteredData: Record<string, T> = {};
  Object.entries(data).forEach(([departmentCode, value]) => {
    if (isDepartmentInRegion(departmentCode, regionCode, departments)) {
      filteredData[departmentCode] = value;
    }
  });

  return filteredData;
}

// Fonction pour obtenir les statistiques d'un filtre
export function getFilterStatistics(
  data: Record<string, any>,
  filterConfig: FilterConfig | undefined
): {
  min: number;
  max: number;
  average: number;
  count: number;
} {
  if (!filterConfig || !data || Object.keys(data).length === 0) {
    return { min: 0, max: 0, average: 0, count: 0 };
  }

  const values: number[] = [];

  Object.values(data).forEach((item) => {
    if (filterConfig.isValid && filterConfig.isValid(item)) {
      // Extraire la valeur principale selon le type de filtre
      const value = extractMainValue(item, filterConfig.id);
      if (value !== null) {
        values.push(value);
      }
    }
  });

  if (values.length === 0) {
    return { min: 0, max: 0, average: 0, count: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;

  return { min, max, average, count: values.length };
}

// Fonction utilitaire pour extraire la valeur principale selon le type de filtre
function extractMainValue(data: any, filterId: string): number | null {
  switch (filterId) {
    case "vaccination":
      return data.taux || null;
    case "cost":
      return data.coutParHabitant || null;
    case "emergency":
      return data.tauxIncidence || null;
    case "doctors":
      return data.densiteMedecins || null;
    default:
      return null;
  }
}
