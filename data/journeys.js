// Curated voyages. Stops are pancake slugs. Routes are approximate map legs, not GPS tracks.
// vehicles[i] is how you arrive at stops[i].
export const VEHICLES = {
  balloon: "Hot air balloon",
  plane: "Plane",
  train: "Train",
  boat: "Boat"
};

export const JOURNEYS = [
  {
    slug: "who-settled-the-flavor",
    title: "Who settled the flavor",
    vehicle: "train",
    dek: "A rail journey through the pancakes immigrants, enslaved cooks, and Native crops left on the United States map.",
    intro: [
      "This is the United States as a pancake route. Corn was already here. English, African, German, Acadian, Nordic, and Jewish cooks changed what a griddle did with it.",
      "The train is the vehicle because the regional differences are a land route: New England, the South, the mountains, the Midwest, the Southwest."
    ],
    stops: [
      "rhode-island-thin-johnnycakes",
      "acadian-ployes",
      "hoecakes",
      "appalachian-buckwheat-cakes",
      "jewish-latkes",
      "swedish-american-pancakes",
      "new-mexico-blue-corn-pancakes",
      "seattle-dutch-baby"
    ],
    vehicles: ["train", "train", "train", "train", "train", "train", "plane", "plane"],
    route: [[41.58, -71.48], [47.2, -68.6], [33.75, -84.39], [35.6, -82.55], [40.71, -74.0], [44.98, -93.27], [35.69, -105.94], [47.61, -122.33]]
  },
  {
    slug: "british-isles-by-train",
    title: "The British Isles by train",
    vehicle: "train",
    dek: "Boxty, Shrove pancakes, oatcakes, and a bakestone, without pretending the islands share one cake.",
    intro: [
      "The train crosses Ireland, England, Scotland, and Wales. The pancakes change thickness, grain, and holiday as it goes.",
      "A thin Shrove pancake and a Staffordshire oatcake are not variations of each other. They are different stops."
    ],
    stops: ["boxty", "irish-shrove-pancakes", "english-shrove-pancakes", "staffordshire-oatcakes", "scotch-pancakes", "crempog", "welsh-cakes"],
    vehicles: ["boat", "train", "train", "train", "train", "train", "train"],
    route: [[54.6, -5.93], [53.35, -6.26], [51.75, -0.7], [53.0, -2.18], [55.95, -3.19], [51.48, -3.18], [51.48, -3.18]]
  },
  {
    slug: "crepes-by-balloon",
    title: "Crêpes by balloon",
    vehicle: "balloon",
    dek: "A low pass over Brittany, Picardy, and Normandy.",
    intro: [
      "A balloon is the right speed for a crêpe coast. Buckwheat gives way to wheat, then to apples.",
      "The balloon does not cross an ocean. This leg stays in France."
    ],
    stops: ["galette-bretonne", "galette-complete", "sweet-crepes", "ficelle-picarde", "normandy-apple-crepes"],
    vehicles: ["balloon", "balloon", "balloon", "balloon", "balloon"],
    route: [[48.11, -1.68], [48.39, -4.49], [48.86, 2.35], [49.89, 2.3], [49.18, -0.37]]
  },
  {
    slug: "butter-week-by-train",
    title: "Butter week by train",
    vehicle: "train",
    dek: "From Pancake Day to Maslenitsa, with the calendars kept distinct.",
    intro: [
      "Shrove Tuesday and Maslenitsa are not the same morning. The train still runs from the thin English pancake to the yeasted Russian blin, because both belong to the rich days before a fast.",
      "The pages say which calendar they mean."
    ],
    stops: ["english-shrove-pancakes", "irish-shrove-pancakes", "sweet-crepes", "finnish-blini", "russian-blini", "buckwheat-blini"],
    vehicles: ["train", "boat", "train", "boat", "train", "train"],
    route: [[52.15, -0.7], [53.35, -6.26], [48.86, 2.35], [60.17, 24.94], [55.75, 37.62], [59.93, 30.33]]
  },
  {
    slug: "low-countries-and-the-north",
    title: "Poffertjes to the north",
    vehicle: "boat",
    dek: "Dutch pancakes, then the thin cakes and potato breads of Scandinavia.",
    intro: [
      "The boat leaves the Dutch pannenkoek and the poffertjes pan and continues to Sweden, Norway, Denmark, and Finland.",
      "Æbleskiver and poffertjes share a dimpled pan and not a recipe."
    ],
    stops: ["dutch-pannenkoeken", "poffertjes", "spekdik", "swedish-pannkakor", "norwegian-lefse", "aebleskiver", "finnish-pannukakku"],
    vehicles: ["boat", "boat", "train", "boat", "boat", "boat", "boat"],
    route: [[52.37, 4.9], [52.09, 5.12], [52.99, 6.56], [59.33, 18.07], [60.39, 5.32], [55.68, 12.57], [60.17, 24.94]]
  },
  {
    slug: "africa-by-plane",
    title: "Africa by plane",
    vehicle: "plane",
    dek: "Baghrir, masa, kisra, injera, and a Cape pannekoek. Several countries, several batters.",
    intro: [
      "The plane is the honest way across this distance. Each stop is a different grain: semolina, rice, sorghum, teff, wheat.",
      "Nothing in this leg is “African pancake” as a single dish."
    ],
    stops: ["moroccan-baghrir", "nigerian-masa", "sudanese-kisra", "injera", "somali-laxoox", "kenyan-chapati", "south-african-pannekoek"],
    vehicles: ["plane", "plane", "plane", "plane", "plane", "plane", "plane"],
    route: [[31.63, -8.0], [12.0, 8.5], [15.5, 32.56], [9.03, 38.74], [2.04, 45.34], [-1.29, 36.82], [-33.92, 18.42]]
  },
  {
    slug: "dosas-by-train",
    title: "Dosas by train",
    vehicle: "train",
    dek: "From a crisp dosa to a soft appam, then north to a besan cheela.",
    intro: [
      "The train starts in the ferment of South India and ends at a chickpea pancake that does not ferment at all.",
      "Hoppers are the boat leg at the end, across the water to Sri Lanka."
    ],
    stops: ["plain-dosa", "masala-dosa", "neer-dosa", "kerala-appam", "pesarattu", "besan-cheela", "sri-lankan-hoppers"],
    vehicles: ["train", "train", "train", "train", "train", "train", "boat"],
    route: [[13.08, 80.27], [12.97, 77.59], [12.87, 74.84], [9.93, 76.26], [16.51, 80.63], [28.61, 77.21], [6.93, 79.85]]
  },
  {
    slug: "east-asia-by-boat",
    title: "East Asia by boat",
    vehicle: "boat",
    dek: "Jianbing, okonomiyaki, and pajeon, with the savory cakes kept distinct.",
    intro: [
      "The boat moves from a northern Chinese breakfast crepe to Osaka’s cabbage pancake and Korea’s scallion pancake.",
      "Hiroshima’s layered cake is a different stop from Osaka’s mixed one."
    ],
    stops: ["jianbing", "scallion-pancake", "taiwanese-danbing", "osaka-okonomiyaki", "hiroshima-okonomiyaki", "pajeon", "bindaetteok"],
    vehicles: ["boat", "train", "boat", "boat", "boat", "boat", "train"],
    route: [[39.13, 117.2], [39.9, 116.4], [25.03, 121.57], [34.69, 135.5], [34.39, 132.46], [37.57, 126.98], [37.57, 126.98]]
  },
  {
    slug: "caribbean-and-the-south-by-boat",
    title: "Caribbean and the south by boat",
    vehicle: "boat",
    dek: "Casabe, bammy, roti, then corn cakes on the mainland.",
    intro: [
      "The boat leaves Havana’s casabe, touches Jamaica and Trinidad, and the route continues by plane to cachapas, arepas, and pupusas.",
      "Cassava breads in this leg use commercial flour. The pages say so."
    ],
    stops: ["cuban-casabe", "jamaican-bammy", "trinidad-paratha-roti", "venezuelan-cachapas", "venezuelan-arepas", "pupusas", "brazilian-tapioca"],
    vehicles: ["boat", "boat", "boat", "plane", "plane", "plane", "plane"],
    route: [[23.11, -82.37], [18.0, -76.8], [10.65, -61.51], [10.48, -66.9], [10.48, -66.9], [13.69, -89.19], [-8.05, -34.9]]
  },
  {
    slug: "middle-east-by-plane",
    title: "Ramadan and the griddle",
    vehicle: "plane",
    dek: "Qatayef, lahoh, malawach, and gözleme.",
    intro: [
      "Qatayef belong to Ramadan. Lahoh is a fermented breakfast. Malawach is a layered bread. Gözleme is a stuffed griddle bread. They are four stops, not one “Middle Eastern pancake.”",
      "The plane is the distance between Sana’a, Beirut, and the Black Sea."
    ],
    stops: ["qatayef", "yemeni-lahoh", "malawach", "gozleme", "manakish"],
    vehicles: ["plane", "plane", "plane", "plane", "plane"],
    route: [[33.89, 35.5], [15.37, 44.19], [15.37, 44.19], [41.01, 28.98], [33.89, 35.5]]
  }
];

export function journeyFor(slug) {
  return JOURNEYS.find((journey) => journey.stops.includes(slug)) || null;
}

export function vehicleForStop(journey, slug) {
  if (!journey) return "plane";
  const index = journey.stops.indexOf(slug);
  if (index < 0) return journey.vehicle || "plane";
  return (journey.vehicles && journey.vehicles[index]) || journey.vehicle || "plane";
}
