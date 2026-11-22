// Service de récupération direct des données OpenData Paris (Client & Static friendly)
export async function fetchParisSpots(query = "") {
  try {
    const [act, fresh, drink] = await Promise.all([
      fetch("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/ilots-de-fraicheur-equipements-activites/records?limit=100")
        .then((res) => res.json())
        .catch(() => ({ results: [] })),
      fetch("https://parisdata.opendatasoft.com/api/explore/v2.1/catalog/datasets/ilots-de-fraicheur-espaces-verts-frais/records?limit=100")
        .then((res) => res.json())
        .catch(() => ({ results: [] })),
      fetch("https://parisdata.opendatasoft.com/api/explore/v2.1/catalog/datasets/fontaines-a-boire/records?limit=50")
        .then((res) => res.json())
        .catch(() => ({ results: [] }))
    ]);

    let all = [];
    if (act.results) all = all.concat(act.results);
    if (fresh.results) all = all.concat(fresh.results);
    if (drink.results) all = all.concat(drink.results);

    if (!query) {
      return all;
    }

    const q = query.toLowerCase().trim();
    return all.filter((item) => {
      const fields = [
        item.nom,
        item.name,
        item.voie,
        item.adresse,
        item.commune,
        item.arrondissement,
        item.type,
        item.type_objet
      ];
      return fields.some((f) => (f || "").toLowerCase().includes(q));
    });
  } catch (err) {
    console.error("Erreur de récupération des données Paris:", err);
    return [];
  }
}
