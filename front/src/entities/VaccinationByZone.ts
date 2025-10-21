export interface VaccinationByZone {
	zone: string;
	zone_code: string;
	population_totale: number;
	population_cible: number;
	nombre_vaccines: number;
	taux_vaccination: number;
	objectif: number;
	atteint: boolean;
	nb_regions: number;
	regions: string[];
	sources_donnees: {
		[key: string]: number;
	};
}


export interface VaccinationStockByZone {
	zone: string;
	zone_code: string;
	current_inventory: number;
	forecasted_need_30_days: number;
	surplus_deficit: number;
	statut: string;
	couleur: string;
	taux_couverture: number;
	autonomie_jours: number;
	recommandation: string;
}
