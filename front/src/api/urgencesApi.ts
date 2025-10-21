// API pour les données d'urgences
const API_BASE_URL = 'http://localhost:8000';

// Interfaces pour les données d'urgences
export interface StatistiquesUrgences {
  moyenne: number;
  min: number;
  max: number;
}

export interface DepartementUrgences {
  code_departement: string;
  nom_departement: string;
  region: string;
  code_region: string;
  nb_enregistrements: number;
  statistiques: {
    taux_passages: StatistiquesUrgences;
    taux_hospitalisations: StatistiquesUrgences;
    taux_actes_sos: StatistiquesUrgences;
  };
}

export interface RegionUrgences {
  code_region: string;
  nom_region: string;
  nb_enregistrements: number;
  statistiques: {
    taux_passages: StatistiquesUrgences;
    taux_hospitalisations: StatistiquesUrgences;
    taux_actes_sos: StatistiquesUrgences;
  };
}

export interface GroupeAgeUrgences {
  groupe_age: string;
  nb_enregistrements: number;
  statistiques: {
    taux_passages: StatistiquesUrgences;
    taux_hospitalisations: StatistiquesUrgences;
    taux_actes_sos: StatistiquesUrgences;
  };
}

export interface UrgencesDepartementales {
  departements: DepartementUrgences[];
  total_departements: number;
  total_enregistrements_source: number;
  periode: {
    debut: string;
    fin: string;
  };
  statistiques: {
    total_entrees: number;
    taux_passages: StatistiquesUrgences & { nombre_valides: number };
    taux_hospitalisations: StatistiquesUrgences & { nombre_valides: number };
    taux_actes_sos: StatistiquesUrgences & { nombre_valides: number };
  };
  note: string;
}

export interface UrgencesRegionales {
  regions: RegionUrgences[];
  total_regions: number;
  total_enregistrements_source: number;
  periode: {
    debut: string;
    fin: string;
  };
  statistiques: {
    total_entrees: number;
    taux_passages: StatistiquesUrgences & { nombre_valides: number };
    taux_hospitalisations: StatistiquesUrgences & { nombre_valides: number };
    taux_actes_sos: StatistiquesUrgences & { nombre_valides: number };
  };
  note: string;
}

export interface UrgencesNationales {
  donnees_par_groupe_age: GroupeAgeUrgences[];
  total_enregistrements: number;
  periode: {
    debut: string;
    fin: string;
  };
  statistiques_globales: {
    total_entrees: number;
    taux_passages: StatistiquesUrgences & { nombre_valides: number };
    taux_hospitalisations: StatistiquesUrgences & { nombre_valides: number };
    taux_actes_sos: StatistiquesUrgences & { nombre_valides: number };
  };
  note: string;
}

export interface UrgencesZone {
  zone: string;
  regions: RegionUrgences[];
  total_regions: number;
  total_enregistrements: number;
  periode: {
    debut: string;
    fin: string;
  };
  statistiques: {
    total_entrees: number;
    taux_passages: StatistiquesUrgences & { nombre_valides: number };
    taux_hospitalisations: StatistiquesUrgences & { nombre_valides: number };
    taux_actes_sos: StatistiquesUrgences & { nombre_valides: number };
  };
  note: string;
}

class UrgencesApi {
  async getUrgencesNationales(annee?: string): Promise<{ success: boolean; data: UrgencesNationales }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/national?annee=${annee}`
      : `${API_BASE_URL}/urgences/national`;
    const response = await fetch(url);
    return response.json();
  }

  async getUrgencesRegionales(annee?: string): Promise<{ success: boolean; data: UrgencesRegionales }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/regional?annee=${annee}`
      : `${API_BASE_URL}/urgences/regional`;
    const response = await fetch(url);
    return response.json();
  }

  async getUrgencesRegion(codeRegion: string, annee?: string): Promise<{ success: boolean; data: UrgencesRegionales }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/regional/${codeRegion}?annee=${annee}`
      : `${API_BASE_URL}/urgences/regional/${codeRegion}`;
    const response = await fetch(url);
    return response.json();
  }

  async getUrgencesDepartementales(annee?: string): Promise<{ success: boolean; data: UrgencesDepartementales }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/departemental?annee=${annee}`
      : `${API_BASE_URL}/urgences/departemental`;
    const response = await fetch(url);
    return response.json();
  }

  async getUrgencesDepartement(codeDepartement: string, annee?: string): Promise<{ success: boolean; data: UrgencesDepartementales }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/departement/${codeDepartement}?annee=${annee}`
      : `${API_BASE_URL}/urgences/departement/${codeDepartement}`;
    const response = await fetch(url);
    return response.json();
  }

  async getUrgencesZone(zoneCode: string, annee?: string): Promise<{ success: boolean; data: UrgencesZone }> {
    const url = annee 
      ? `${API_BASE_URL}/urgences/zone/${zoneCode}?annee=${annee}`
      : `${API_BASE_URL}/urgences/zone/${zoneCode}`;
    const response = await fetch(url);
    return response.json();
  }
}

export const urgencesApi = new UrgencesApi();

