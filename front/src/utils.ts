const zones = {
  A: [
    "Auvergne et Rhône-Alpes",
    "Bourgogne et Franche-Comté",
    "Nouvelle Aquitaine",
    "Clermont-Ferrand",
    "Dijon",
    "Grenoble",
    "Limoges",
    "Lyon",
    "Poitiers"
  ],
  B: [
    "Grand Est",
    "Provence-Alpes-Côte d'Azur",
    "Centre-Val de Loire",
    "Normandie",
    "Hauts-de-France",
    "Pays de la Loire",
    "Bretagne",
    "Aix-Marseille",
    "Amiens",
    "Caen",
    "Lille",
    "Nancy-Metz",
    "Nantes",
    "Nice",
    "Orléans-Tours",
    "Reims",
    "Rennes",
    "Rouen",
    "Strasbourg"
  ],
  C: [
    "Île-de-France",
    "Occitanie",
    "Créteil",
    "Montpellier",
    "Paris",
    "Toulouse",
    "Versailles"
  ],
};

function getZoneForRegion(regionName) {
  if (zones.A.includes(regionName)) return "A";
  if (zones.B.includes(regionName)) return "B";
  if (zones.C.includes(regionName)) return "C";
}

function groupByZone(data) {
  const grouped = {
    A: [],
    B: [],
    C: [],
  };

  console.log("Data received for grouping:", data);

  // Vérifier si data a une propriété 'regions' ou si c'est data.data.regions
  const regions = data.regions || data.data?.regions || [];

  regions.forEach(region => {
    const zone = getZoneForRegion(region.nom_region);
    if (zone) {
      grouped[zone].push(region);
    }
  });

  return grouped;
}


function aggregateByZoneAndYear(data) {
  const zonesKeys = ["A", "B", "C"];

  // init structure: { annee -> zone -> doses }
  const result = {};

  // Vérifier si data a une propriété 'regions' ou si c'est data.data.regions
  const regions = data.regions || data.data?.regions || [];

  regions.forEach(region => {
    const zone = getZoneForRegion(region.nom_region);
    region.data.forEach(yearData => {
      const annee = yearData.annee;
      if (!result[annee]) result[annee] = {};

      if (!result[annee][zone]) {
        result[annee][zone] = {
          hpv_filles_dose_1: 0,
          hpv_filles_dose_2: 0,
          hpv_garcons_dose_1: 0,
          hpv_garcons_dose_2: 0,
          count: 0, // pour moyenne éventuelle
        };
      }

      result[annee][zone].hpv_filles_dose_1 += yearData.hpv_filles.dose_1;
      result[annee][zone].hpv_filles_dose_2 += yearData.hpv_filles.dose_2;
      result[annee][zone].hpv_garcons_dose_1 += yearData.hpv_garcons.dose_1;
      result[annee][zone].hpv_garcons_dose_2 += yearData.hpv_garcons.dose_2;
      result[annee][zone].count++;
    });
  });

  // On peut faire une moyenne en divisant par count
  const finalData = [];

  for (const annee in result) {
    const entry = { annee };

    zonesKeys.forEach(zone => {
      if (result[annee][zone]) {
        entry[`zone${zone}_dose1_filles`] = (result[annee][zone].hpv_filles_dose_1 / result[annee][zone].count).toFixed(2);
        entry[`zone${zone}_dose2_filles`] = (result[annee][zone].hpv_filles_dose_2 / result[annee][zone].count).toFixed(2);
        entry[`zone${zone}_dose1_garcons`] = (result[annee][zone].hpv_garcons_dose_1 / result[annee][zone].count).toFixed(2);
        entry[`zone${zone}_dose2_garcons`] = (result[annee][zone].hpv_garcons_dose_2 / result[annee][zone].count).toFixed(2);
      } else {
        entry[`zone${zone}_dose1_filles`] = 0;
        entry[`zone${zone}_dose2_filles`] = 0;
        entry[`zone${zone}_dose1_garcons`] = 0;
        entry[`zone${zone}_dose2_garcons`] = 0;
      }
    });

    finalData.push(entry);
  }

  return finalData;
}
export { groupByZone, aggregateByZoneAndYear };