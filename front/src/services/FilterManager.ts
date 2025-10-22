import type {
  FilterConfig,
  FilterHandler,
  FilterRegistry,
  FilterValue,
} from "../types/filters";
import type {
  VaccinationData,
  CostData,
  EmergencyData,
  DoctorsData,
  FilterData,
  ApiResponse,
  VaccinationApiItem,
  CostApiItem,
  EmergencyApiItem,
  DoctorsApiItem,
  ApiItem,
} from "../types/vaccination";

// Configuration des filtres disponibles
export const FILTER_REGISTRY: FilterRegistry = {
  none: {
    id: "none",
    label: "Rien",
    apiEndpoint: "",
    dataProcessor: (): Record<string, FilterData> => ({}),
    colorMapper: () => [120, 120, 120, 30],
  },
  vaccination: {
    id: "vaccination",
    label: "Taux de vaccination",
    apiEndpoint: "/vaccination/departements",
    dataProcessor: (
      rawData: ApiResponse<VaccinationApiItem>
    ): Record<string, VaccinationData> => {
      const processedData: Record<string, VaccinationData> = {};
      if (rawData.success && rawData.departements) {
        rawData.departements.forEach((item: VaccinationApiItem) => {
          const departmentCode = item.code_departement;
          if (departmentCode) {
            processedData[departmentCode] = {
              taux: item.taux_vaccination || item.taux || item.rate || 0,
              doses:
                item.nombre_vaccines ||
                item.nombre_doses ||
                item.doses ||
                item.doses_count ||
                0,
              population:
                item.population_totale ||
                item.population ||
                item.population_count ||
                0,
              population_totale:
                item.population_totale ||
                item.population ||
                item.population_count ||
                0,
              population_cible: item.population_cible || 0,
              taux_65_plus: item.taux_65_plus || 0,
              taux_moins_65: item.taux_moins_65 || 0,
              objectif: item.objectif || 0,
              atteint: item.atteint || false,
            };
          }
        });
      }
      return processedData;
    },
    colorMapper: (value: VaccinationData) => {
      const taux = value.taux || 0;
      if (taux < 55) return [255, 0, 0, 255]; // Rouge
      if (taux < 60) return [255, 165, 0, 255]; // Orange
      if (taux < 65) return [255, 255, 0, 255]; // Jaune
      return [0, 255, 0, 255]; // Vert
    },
    volumeMapper: (value: VaccinationData) => ({
      height: Math.max(6000, value.taux * 600),
      radius: Math.max(15000, Math.min(40000, value.population / 1500)),
      color: (() => {
        const taux = value.taux || 0;
        if (taux < 55) return [255, 0, 0, 200];
        if (taux < 60) return [255, 165, 0, 200];
        if (taux < 65) return [255, 255, 0, 200];
        return [0, 255, 0, 200];
      })(),
    }),
    displayFormatter: (value: VaccinationData) =>
      `${(value.taux || 0).toFixed(1)}%`,
    isValid: (value: VaccinationData) =>
      value.taux !== undefined && value.taux >= 0,
  },
  cost: {
    id: "cost",
    label: "Coûts de vaccination",
    apiEndpoint: "/cost/departements",
    dataProcessor: (
      rawData: ApiResponse<CostApiItem>
    ): Record<string, CostData> => {
      const processedData: Record<string, CostData> = {};
      if (rawData.success && rawData.departements) {
        rawData.departements.forEach((item: CostApiItem) => {
          const departmentCode = item.code_departement;
          if (departmentCode) {
            processedData[departmentCode] = {
              coutTotal: item.cout_total || item.total_cost || 0,
              coutParHabitant:
                item.cout_par_habitant || item.cost_per_capita || 0,
              nombreVaccines:
                item.nombre_vaccines || item.vaccinated_count || 0,
            };
          }
        });
      }
      return processedData;
    },
    colorMapper: (value: CostData) => {
      const coutParHabitant = value.coutParHabitant || 0;
      if (coutParHabitant < 50) return [0, 255, 0, 255]; // Vert (faible coût)
      if (coutParHabitant < 100) return [255, 255, 0, 255]; // Jaune
      if (coutParHabitant < 200) return [255, 165, 0, 255]; // Orange
      return [255, 0, 0, 255]; // Rouge (coût élevé)
    },
    volumeMapper: (value: CostData) => ({
      height: Math.max(5000, value.coutTotal / 1000),
      radius: Math.max(10000, Math.min(30000, value.nombreVaccines / 2000)),
      color: (() => {
        const coutParHabitant = value.coutParHabitant || 0;
        if (coutParHabitant < 50) return [0, 255, 0, 200];
        if (coutParHabitant < 100) return [255, 255, 0, 200];
        if (coutParHabitant < 200) return [255, 165, 0, 200];
        return [255, 0, 0, 200];
      })(),
    }),
    displayFormatter: (value: CostData) =>
      `${(value.coutParHabitant || 0).toFixed(0)}€/hab`,
    isValid: (value: CostData) =>
      value.coutParHabitant !== undefined && value.coutParHabitant >= 0,
  },
  emergency: {
    id: "emergency",
    label: "Passages aux urgences",
    apiEndpoint: "/emergency/departements",
    dataProcessor: (
      rawData: ApiResponse<EmergencyApiItem>
    ): Record<string, EmergencyData> => {
      const processedData: Record<string, EmergencyData> = {};
      if (rawData.success && rawData.departements) {
        rawData.departements.forEach((item: EmergencyApiItem) => {
          const departmentCode = item.code_departement;
          if (departmentCode) {
            processedData[departmentCode] = {
              passagesUrgences:
                item.passages_urgences || item.emergency_visits || 0,
              actesSOSMedecins:
                item.actes_sos_medecins || item.sos_medecins_acts || 0,
              tauxIncidence: item.taux_incidence || item.incidence_rate || 0,
            };
          }
        });
      }
      return processedData;
    },
    colorMapper: (value: EmergencyData) => {
      const tauxIncidence = value.tauxIncidence || 0;
      if (tauxIncidence < 50) return [0, 255, 0, 255]; // Vert (faible incidence)
      if (tauxIncidence < 100) return [255, 255, 0, 255]; // Jaune
      if (tauxIncidence < 200) return [255, 165, 0, 255]; // Orange
      return [255, 0, 0, 255]; // Rouge (incidence élevée)
    },
    volumeMapper: (value: EmergencyData) => ({
      height: Math.max(4000, value.passagesUrgences * 10),
      radius: Math.max(12000, Math.min(35000, value.actesSOSMedecins / 100)),
      color: (() => {
        const tauxIncidence = value.tauxIncidence || 0;
        if (tauxIncidence < 50) return [0, 255, 0, 200];
        if (tauxIncidence < 100) return [255, 255, 0, 200];
        if (tauxIncidence < 200) return [255, 165, 0, 200];
        return [255, 0, 0, 200];
      })(),
    }),
    displayFormatter: (value: EmergencyData) =>
      `${(value.tauxIncidence || 0).toFixed(1)}/100k hab`,
    isValid: (value: EmergencyData) =>
      value.tauxIncidence !== undefined && value.tauxIncidence >= 0,
  },
  doctors: {
    id: "doctors",
    label: "Densité de médecins",
    apiEndpoint: "/doctors/departements",
    dataProcessor: (
      rawData: ApiResponse<DoctorsApiItem>
    ): Record<string, DoctorsData> => {
      const processedData: Record<string, DoctorsData> = {};
      if (rawData.success && rawData.departements) {
        rawData.departements.forEach((item: DoctorsApiItem) => {
          const departmentCode = item.code_departement;
          if (departmentCode) {
            processedData[departmentCode] = {
              nombreMedecins: item.nombre_medecins || item.doctor_count || 0,
              densiteMedecins:
                item.densite_medecins || item.doctor_density || 0,
              specialites: item.specialites || item.specialties || [],
            };
          }
        });
      }
      return processedData;
    },
    colorMapper: (value: DoctorsData) => {
      const densite = value.densiteMedecins || 0;
      if (densite < 50) return [255, 0, 0, 255]; // Rouge (faible densité)
      if (densite < 100) return [255, 165, 0, 255]; // Orange
      if (densite < 200) return [255, 255, 0, 255]; // Jaune
      return [0, 255, 0, 255]; // Vert (bonne densité)
    },
    volumeMapper: (value: DoctorsData) => ({
      height: Math.max(3000, value.nombreMedecins * 50),
      radius: Math.max(10000, Math.min(30000, value.densiteMedecins * 200)),
      color: (() => {
        const densite = value.densiteMedecins || 0;
        if (densite < 50) return [255, 0, 0, 200];
        if (densite < 100) return [255, 165, 0, 200];
        if (densite < 200) return [255, 255, 0, 200];
        return [0, 255, 0, 200];
      })(),
    }),
    displayFormatter: (value: DoctorsData) =>
      `${(value.densiteMedecins || 0).toFixed(1)}/100k hab`,
    isValid: (value: DoctorsData) =>
      value.densiteMedecins !== undefined && value.densiteMedecins >= 0,
  },
};

// Classe pour gérer les filtres de manière modulaire
export class FilterManager implements FilterHandler<FilterValue> {
  private cache: Record<string, Record<string, FilterValue>> = {};

  async fetchData(
    year: string,
    filterId: string
  ): Promise<Record<string, FilterValue>> {
    const config = FILTER_REGISTRY[filterId];
    if (!config || filterId === "none") {
      return {};
    }

    const cacheKey = `${year}-${filterId}`;
    if (this.cache[cacheKey]) {
      console.log(`Utilisation du cache pour ${cacheKey}`);
      return this.cache[cacheKey];
    }

    try {
      console.log(`Appel API pour l'année ${year} et le filtre ${filterId}`);
      const response = await fetch(
        `http://127.0.0.1:8000${config.apiEndpoint}?annee=${year}`
      );

      if (response.ok) {
        const rawData = await response.json();
        const processedData = this.processData(rawData, config);

        this.cache[cacheKey] = processedData;
        console.log(`Données chargées et mises en cache pour ${cacheKey}`);
        return processedData;
      } else {
        console.error(`Erreur API pour ${filterId}:`, response.status);
        return {};
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement des données ${filterId}:`,
        error
      );
      return {};
    }
  }

  processData(
    rawData: ApiResponse<ApiItem>,
    filterConfig: FilterConfig<FilterValue>
  ): Record<string, FilterValue> {
    return filterConfig.dataProcessor(rawData);
  }

  getFilteredData(
    data: Record<string, FilterValue>,
    region: string
  ): Record<string, FilterValue> {
    if (region === "all" || !region) {
      return data;
    }

    const filteredData: Record<string, FilterValue> = {};
    Object.entries(data).forEach(([departmentCode, value]) => {
      // Ici, vous devrez adapter la logique de filtrage selon vos données de départements
      // Pour l'instant, on garde la même logique que dans le code original
      filteredData[departmentCode] = value;
    });

    return filteredData;
  }

  getFilterConfig(filterId: string): FilterConfig | undefined {
    return FILTER_REGISTRY[filterId];
  }

  getAvailableFilters(): Array<{ value: string; label: string }> {
    return Object.values(FILTER_REGISTRY).map((config) => ({
      value: config.id,
      label: config.label,
    }));
  }

  clearCache(): void {
    this.cache = {};
  }
}

// Instance singleton
export const filterManager = new FilterManager();
