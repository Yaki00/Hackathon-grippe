// API pour les coûts réels de vaccination
const API_BASE_URL = 'http://localhost:8000';

export interface CoutNational {
  annee: string;
  population_francaise: number;
  taux_vaccination_actuel: number;
  personnes_vaccinees: number;
  personnes_protegees: number;
  couts_directs: {
    vaccin_unitaire: number;
    honoraire_pharmacien: number;
    consultation_vaccination: number;
    cout_total_vaccination: number;
    cout_total_france: number;
  };
  remboursements: {
    securite_sociale: {
      vaccins: number;
      consultations: number;
      total: number;
    };
    mutuelles: number;
    reste_charge_patients: number;
  };
  couts_grippe_sans_vaccination: {
    consultations: number;
    medicaments: number;
    arrets_maladie: number;
    hospitalisations: number;
    complications: number;
    total: number;
  };
  economies_vaccination: {
    consultations: number;
    medicaments: number;
    arrets_maladie: number;
    hospitalisations: number;
    complications: number;
    total: number;
  };
  bilan_financier: {
    cout_vaccination: number;
    economie_generee: number;
    cout_net_france: number;
    roi_pourcent: number;
    economie_par_euro_vaccin: number;
  };
  repartition_couts: {
    securite_sociale: number;
    mutuelles: number;
    patients: number;
    total: number;
  };
  impact_economique: {
    jours_arret_evites: number;
    hospitalisations_evitees: number;
    complications_evitees: number;
    productivite_preservee: number;
  };
}

export interface CoutZone {
  zone: string;
  population: number;
  taux_vaccination: number;
  personnes_vaccinees: number;
  personnes_protegees: number;
  couts: {
    vaccination: number;
    consultation: number;
    total: number;
  };
  economies: number;
  cout_net: number;
  roi: number;
}

export interface ScenarioVaccination {
  taux_vaccination: number;
  personnes_vaccinees: number;
  personnes_protegees: number;
  cout_total: number;
  economie_totale: number;
  cout_net: number;
  roi: number;
  economie_par_euro: number;
}

export interface ScenariosData {
  scenarios: ScenarioVaccination[];
  recommandation: {
    taux_optimal: number;
    justification: string;
    roi_optimal: number;
  };
}

class CoutApi {
  async getCoutsNationaux(): Promise<{ success: boolean; data: CoutNational }> {
    const response = await fetch(`${API_BASE_URL}/couts/national`);
    return response.json();
  }

  async getCoutsParZone(zoneCode: string): Promise<{ success: boolean; data: CoutZone }> {
    const response = await fetch(`${API_BASE_URL}/couts/zone/${zoneCode}`);
    return response.json();
  }

  async getCoutsParDepartement(codeDepartement: string): Promise<{ success: boolean; data: CoutZone }> {
    const response = await fetch(`${API_BASE_URL}/couts/departement/${codeDepartement}`);
    return response.json();
  }

  async getScenariosVaccination(): Promise<{ success: boolean; data: ScenariosData }> {
    const response = await fetch(`${API_BASE_URL}/couts/scenarios`);
    return response.json();
  }
}

export const coutApi = new CoutApi();
