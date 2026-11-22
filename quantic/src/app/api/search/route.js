export const dynamic = "force-static";

export async function GET() {
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

    return Response.json({ results: all });
  } catch (e) {
    return Response.json({ results: [], error: e.message });
  }
}
