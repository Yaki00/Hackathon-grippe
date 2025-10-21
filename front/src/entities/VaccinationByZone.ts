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