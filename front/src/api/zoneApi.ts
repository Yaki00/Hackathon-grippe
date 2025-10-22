


export const zoneApi = {
	async getVaccinationByZone() {
		const response = await fetch('http://localhost:8000/vaccination/zones?annee=2024');
		const data = await response.json();
		return data;
	},

	async getVaccinationStockByZone() {
		const response = await fetch('http://localhost:8000/prediction/stock-vs-besoin');
		const data = await response.json();
		return data;
	},

	async getVaccinationHpvByRegion() {
		const response = await fetch('http://localhost:8000/couverture/hpv/regional?annee_debut=2022');
		const data = await response.json();
		return data;
	},

	async getVaccinationGrippeByZone() {
		const response = await fetch('http://localhost:8000/couverture/grippe/zones');
		const data = await response.json();
		console.log("Grippe data from API:", data);
		return data;

	}
};