


export const zoneApi = {
	async getVaccinationByZone() {
		const response = await fetch('http://localhost:8000/vaccination/zones?annee=2024');
		const data = await response.json();
		return data;
	}
}