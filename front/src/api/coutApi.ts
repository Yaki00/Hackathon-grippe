// API pour les coûts réels de vaccination
const API_BASE_URL = 'http://localhost:8000';

// Nouvelles interfaces basées sur les vraies données
export interface CoutNational {
  campagne: string;
  source_donnees: string;
  donnees_campagne: {
    doses_distribuees: number;
    personnes_vaccinees_estimees: number;
    population_france: number;
    taux_vaccination: number;
  };
  tarifs_officiels: {
    vaccin_unitaire: number;
    honoraire_pharmacien: number;
    vaccin_total: number;
    consultation: number;
    source: string;
  };
  couts_totaux: {
    vaccins: number;
    consultations: number;
    total_campagne: number;
  };
  remboursements: {
    securite_sociale: {
      vaccins: number;
      consultations: number;
      total: number;
      taux_vaccin: string;
      taux_consultation: string;
    };
    mutuelles: number;
    patients_reste_charge: number;
  };
  repartition_financiere: {
    securite_sociale_pourcent: number;
    mutuelles_pourcent: number;
    patients_pourcent: number;
  };
}

export interface CoutZone {
  zone: string;
  population: number;
  taux_vaccination_pourcent: number;
  personnes_vaccinees: number;
  couts_vaccination: {
    vaccins: number;
    consultations: number;
    total: number;
  };
  remboursements: {
    securite_sociale: number;
    reste_charge: number;
  };
  cout_par_personne_vaccinee: number;
}

export interface ScenarioVaccination {
  nom: string;
  description: string;
  taux_vaccination_pourcent: number;
  personnes_vaccinees: number;
  couts: {
    vaccins: number;
    consultations: number;
    total: number;
  };
  remboursements: {
    securite_sociale: number;
    reste_charge: number;
  };
  cout_par_habitant: number;
}

export interface ScenariosData {
  titre: string;
  scenarios: ScenarioVaccination[];
  recommandation: {
    taux_recommande: string;
    justification: string;
    cout_estime: number;
  };
}

// Interfaces pour prédictions
export interface Prediction {
  mois: string;
  mois_nom: string;
  doses_necessaires: number;
  doses_necessaires_min: number;
  doses_necessaires_max: number;
  confiance: string;
}

export interface PredictionData {
  zone: string;
  date_prediction: string;
  predictions: Prediction[];
  statistiques_historiques: {
    total_doses_distribuees: number;
    moyenne_mensuelle: number;
    pic_mensuel: number;
    tendance: string;
    periode_analysee: string;
  };
  contexte: {
    mois_actuel: string;
    saison: string;
    facteur_saisonnier: number;
  };
  source: string;
  methode: string;
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

  // Nouvelles méthodes pour prédictions
  async getPredictionsNationales(horizonMois: number = 3): Promise<{ success: boolean; data: PredictionData }> {
    const response = await fetch(`${API_BASE_URL}/prediction/doses?horizon_mois=${horizonMois}`);
    return response.json();
  }

  async getPredictionsZone(zoneCode: string, horizonMois: number = 3): Promise<{ success: boolean; data: PredictionData }> {
    const response = await fetch(`${API_BASE_URL}/prediction/doses/zone/${zoneCode}?horizon_mois=${horizonMois}`);
    return response.json();
  }
}

export const coutApi = new CoutApi();
