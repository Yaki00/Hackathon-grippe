import type { FilterValue } from "./filters";

export interface DepartmentData {
  taux: number;
  doses: number;
  population: number;
}

export interface SelectedDepartment {
  code: string;
  name: string;
}

// Types pour les données de vaccination (étendus)
export interface VaccinationData extends FilterValue {
  taux: number;
  doses: number;
  population: number;
  population_totale: number;
  population_cible: number;
  taux_65_plus: number;
  taux_65_plus_risque: number;
  taux_moins_65: number;
  taux_moins_65_risque: number;
  objectif: number;
  atteint: boolean;
}

// Types pour les données de coût (étendus)
export interface CostData extends FilterValue {
  coutTotal: number;
  coutParHabitant: number;
  nombreVaccines: number;
}

// Types pour les données d'urgence (étendus)
export interface EmergencyData extends FilterValue {
  passagesUrgences: number;
  actesSOSMedecins: number;
  tauxIncidence: number;
}

// Types pour les données de médecins (étendus)
export interface DoctorsData extends FilterValue {
  nombreMedecins: number;
  densiteMedecins: number;
  specialites: string[];
}

// Union type pour toutes les données possibles
export type FilterData =
  | VaccinationData
  | CostData
  | EmergencyData
  | DoctorsData;

export interface HoveredDepartment {
  code: string;
  name: string;
  data: FilterValue;
  position: { x: number; y: number };
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  departements: T[];
}

export interface VaccinationApiItem {
  code_departement: string;
  taux_vaccination?: number;
  taux?: number;
  rate?: number;
  nombre_vaccines?: number;
  nombre_doses?: number;
  doses?: number;
  doses_count?: number;
  population_totale?: number;
  population?: number;
  population_count?: number;
  population_cible?: number;
  taux_65_plus?: number;
  taux_65_plus_risque?: number;
  taux_moins_65?: number;
  taux_moins_65_risque?: number;
  objectif?: number;
  atteint?: boolean;
}

export interface CostApiItem {
  code_departement: string;
  cout_total?: number;
  total_cost?: number;
  cout_par_habitant?: number;
  cost_per_capita?: number;
  nombre_vaccines?: number;
  vaccinated_count?: number;
}

export interface EmergencyApiItem {
  code_departement: string;
  passages_urgences?: number;
  emergency_visits?: number;
  actes_sos_medecins?: number;
  sos_medecins_acts?: number;
  taux_incidence?: number;
  incidence_rate?: number;
}

export interface DoctorsApiItem {
  code_departement: string;
  nombre_medecins?: number;
  doctor_count?: number;
  densite_medecins?: number;
  doctor_density?: number;
  specialites?: string[];
  specialties?: string[];
}

export type ApiItem =
  | VaccinationApiItem
  | CostApiItem
  | EmergencyApiItem
  | DoctorsApiItem;
