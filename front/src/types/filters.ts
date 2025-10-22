// Types génériques pour le système de filtres modulaire

export interface FilterValue {
  [key: string]: any;
}

export interface FilterConfig<T = FilterValue> {
  id: string;
  label: string;
  apiEndpoint: string;
  dataProcessor: (rawData: any) => Record<string, T>;
  colorMapper: (value: T) => [number, number, number, number];
  volumeMapper?: (value: T) => {
    height: number;
    radius: number;
    color: [number, number, number, number];
  };
  displayFormatter?: (value: T) => string;
  isValid?: (value: T) => boolean;
}

export interface FilterData<T = FilterValue> {
  filterId: string;
  data: Record<string, T>;
  loading: boolean;
  error?: string;
}

export interface FilterState {
  selectedFilter: string;
  selectedRegion: string;
  selectedYear: string;
  volumeMode: boolean;
}

export interface FilterHandler<T = FilterValue> {
  fetchData: (year: string, filterId: string) => Promise<Record<string, T>>;
  processData: (
    rawData: any,
    filterConfig: FilterConfig<T>
  ) => Record<string, T>;
  getFilteredData: (
    data: Record<string, T>,
    region: string
  ) => Record<string, T>;
}

// Types spécifiques pour différents filtres
export interface VaccinationData extends FilterValue {
  taux: number;
  doses: number;
  population: number;
}

export interface CostData extends FilterValue {
  coutTotal: number;
  coutParHabitant: number;
  nombreVaccines: number;
}

export interface EmergencyData extends FilterValue {
  passagesUrgences: number;
  actesSOSMedecins: number;
  tauxIncidence: number;
}

export interface DoctorData extends FilterValue {
  nombreMedecins: number;
  densiteMedecins: number;
  specialites: string[];
}

// Configuration des filtres disponibles
export type FilterType = "vaccination" | "cost" | "emergency" | "doctors";

export interface FilterRegistry {
  [key: string]: FilterConfig<any>;
}
