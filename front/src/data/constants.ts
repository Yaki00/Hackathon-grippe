export const AVAILABLE_YEARS = [
  { value: "2016", label: "2016" },
  { value: "2017", label: "2017" },
  { value: "2018", label: "2018" },
  { value: "2019", label: "2019" },
  { value: "2020", label: "2020" },
  { value: "2021", label: "2021" },
  { value: "2022", label: "2022" },
  { value: "2023", label: "2023" },
  { value: "2024", label: "2024" },
];

// Les options de filtres sont maintenant gérées par le FilterManager
// Ce fichier est conservé pour la compatibilité, mais les filtres sont maintenant
// récupérés dynamiquement via useAvailableFilters()
export const FILTER_OPTIONS = [
  { value: "none", label: "Rien" },
  { value: "vaccination", label: "Taux de vaccination" },
  { value: "cost", label: "Coûts de vaccination" },
  { value: "emergency", label: "Passages aux urgences" },
  { value: "doctors", label: "Densité de médecins" },
];
