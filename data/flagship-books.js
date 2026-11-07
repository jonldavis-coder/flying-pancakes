const route = (pairs) => pairs;

export const FLAGSHIP_BOOKS = [
  {
    slug: "top-100-pancakes",
    title: "Flying Pancakes: The Top 100 Pancakes of the World",
    dek: "A reading route through a hundred pancakes chosen for reach and usefulness, not a prize list.",
    tier: "top",
    vehicle: "plane",
    selectionNote: "This is not a ranking and not an official list. The hundred were chosen for cultural weight and for the way they explain a method: a cake that traveled, a ferment, a holiday, or a bread people still cook far from where it started. The order is a reading route. Another editor would pick a different hundred.",
    intro: [
      "These hundred pancakes are a route, not a contest. Each one is already in the field guide. Nothing was invented to fill a slot.",
      "The route moves across the continents those pancakes actually come from. The number of continents is counted from this list, not set in advance."
    ],
    slugs: [
      "southern-buttermilk-pancakes", "hoecakes", "appalachian-buckwheat-cakes", "sorghum-flapjacks", "rhode-island-thin-johnnycakes",
      "jewish-latkes", "new-york-blintzes", "pennsylvania-dutch-potato-pancakes", "swedish-american-pancakes", "norwegian-lefse",
      "aebleskiver", "seattle-dutch-baby", "new-mexico-blue-corn-pancakes", "navajo-frybread", "hawaii-poi-pancakes",
      "acadian-ployes", "canadian-bannock", "irish-shrove-pancakes", "boxty", "english-shrove-pancakes",
      "crumpets", "staffordshire-oatcakes", "yorkshire-pudding", "scotch-pancakes", "scottish-oatcakes",
      "welsh-cakes", "crempog", "sweet-crepes", "galette-bretonne", "galette-complete",
      "crepe-suzette", "socca", "farinata", "dutch-pannenkoeken", "poffertjes",
      "swedish-pannkakor", "raggmunk", "norwegian-svele", "danish-pandekager", "finnish-lettu",
      "icelandic-ponnukokur", "russian-blini", "buckwheat-blini", "syrniki", "ukrainian-deruny",
      "polish-nalesniki", "hungarian-palacsinta", "german-kartoffelpuffer", "austrian-kaiserschmarrn", "swiss-rosti",
      "greek-tiganites", "injera", "somali-laxoox", "sudanese-kisra", "nigerian-masa",
      "moroccan-baghrir", "moroccan-msemen", "qatayef", "madagascan-mofo-gasy", "plain-dosa",
      "masala-dosa", "rava-dosa", "neer-dosa", "uttapam", "pesarattu",
      "adai", "kerala-appam", "besan-cheela", "malpua", "patishapta",
      "sri-lankan-hoppers", "pajeon", "kimchi-jeon", "bindaetteok", "hotteok",
      "osaka-okonomiyaki", "hiroshima-okonomiyaki", "dorayaki", "jianbing", "scallion-pancake",
      "mandarin-duck-pancakes", "banh-xeo", "khanom-krok", "roti-canai", "martabak-manis",
      "serabi", "bibingka", "cuban-casabe", "jamaican-bammy", "trinidad-paratha-roti",
      "mexican-hotcakes", "corn-tortillas", "tlayudas", "crepas-de-cajeta", "galician-filloas",
      "tortillitas-de-camarones", "venezuelan-cachapas", "venezuelan-arepas", "pupusas", "australian-pikelets"
    ]
  },
  {
    slug: "appalachian-griddle-cakes",
    title: "Appalachian Griddle Cakes",
    dek: "Buckwheat, sorghum, cornmeal, and dried apple from the upland South.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "These are the mountain cakes that can be tied to a real griddle: buckwheat, sorghum flapjacks, cornmeal, dried apple, and the plain buttermilk cake.",
      "Scots-Irish and English settlers brought oat and griddle habits into the mountains. German-speaking settlers brought a taste for buckwheat and for sweet-sour keeping. Enslaved people and later Black Appalachian cooks worked the same farms and kitchens. Their labor is part of this food.",
      "Cherokee and other Native nations of these mountains grew corn long before those settlements. This book does not assign the settler cakes to them, and it does not invent a Cherokee pancake to fill a gap. Spoonbread is here as the baked cornmeal cousin, labeled as baked."
    ],
    slugs: [
      "appalachian-buckwheat-cakes",
      "sorghum-flapjacks",
      "appalachian-cornmeal-cakes",
      "dried-apple-pancakes",
      "mountain-buttermilk-pancakes",
      "ozark-corn-cakes",
      "kentucky-spoonbread",
      "sweet-potato-pancakes"
    ]
  },
  {
    slug: "across-the-american-south",
    title: "Across the American South",
    dek: "Buttermilk, hoe cakes, rice fritters, and peach, from the Piedmont to New Orleans.",
    tier: "flagship",
    vehicle: "train",
    route: [[33.75, -84.39], [32.78, -79.93], [35.23, -80.84], [36.16, -86.78], [29.95, -90.07], [30.45, -91.15]],
    intro: [
      "Southern pancakes are not one stack. Buttermilk and sorghum sit beside hoe cakes, hot-water cornbread, and the rice fritters of New Orleans.",
      "Corn was an Indigenous crop. Enslaved African American cooks kept griddle breads that also sit beside West African grain cakes. French and Creole kitchens added pain perdu and calas. This train crosses that map without pretending one cake belongs to one people only."
    ],
    slugs: [
      "southern-buttermilk-pancakes",
      "hoecakes",
      "hot-water-cornbread",
      "carolina-corn-griddle-cakes",
      "sweet-potato-pancakes",
      "pecan-pancakes",
      "georgia-peach-pancakes",
      "virginia-corn-cakes",
      "creole-calas",
      "new-orleans-pain-perdu"
    ]
  },
  {
    slug: "british-isles-and-ireland",
    title: "The British Isles & Ireland",
    dek: "Shrove pancakes, boxty, oatcakes, pikelets, and the girdle breads.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "Ireland, England, Scotland, and Wales do not share one pancake. Shrove Tuesday cakes are thin. Drop scones and Scotch pancakes are thick. Staffordshire oatcakes are a savory wrap. Welsh cakes are a currant dough on a bakestone.",
      "This book keeps the names the cooks use, including the two different cakes called pikelets."
    ],
    slugs: [
      "irish-shrove-pancakes", "boxty", "irish-potato-farls", "irish-soda-farls", "ulster-oatcakes", "irish-buttermilk-drop-scones",
      "english-shrove-pancakes", "crumpets", "yorkshire-pikelets", "midlands-pikelets", "staffordshire-oatcakes", "derbyshire-oatcakes",
      "yorkshire-pudding", "lancashire-potato-cakes", "singing-hinnies", "english-muffins",
      "scotch-pancakes", "scottish-oatcakes", "tattie-scones", "scottish-bannocks", "beremeal-bannocks",
      "crempog", "welsh-cakes"
    ]
  },
  {
    slug: "crepes-of-france",
    title: "Crêpes of France",
    dek: "Wheat crêpes, buckwheat galettes, and the Norman apple fold.",
    tier: "regional",
    vehicle: "train",
    route: [[48.11, -1.68], [48.39, -4.49], [49.89, 2.3], [49.18, -0.37], [43.7, 7.26]],
    intro: [
      "In Brittany a galette is buckwheat and a crêpe is wheat. The complète is a meal. Suzette is a restaurant dessert. Picardy’s ficelle is a baked roll. Normandy puts apples in the fold.",
      "Chandeleur, February 2, is the crêpe day most often named in France. It is not the same date as Shrove Tuesday. Socca, the chickpea cake of Nice, lives with the savory cousins rather than in this book."
    ],
    slugs: [
      "sweet-crepes",
      "galette-bretonne",
      "galette-complete",
      "crepe-suzette",
      "ficelle-picarde",
      "normandy-apple-crepes",
      "french-pain-perdu"
    ]
  },
  {
    slug: "east-asia-savory-pancakes",
    title: "East Asia’s Savory Pancakes",
    dek: "Scallion, kimchi, cabbage, and the northern Chinese street crepe.",
    tier: "regional",
    vehicle: "boat",
    intro: [
      "Korea, Japan, and China do not share one savory pancake. Pajeon is scallion. Okonomiyaki in Osaka is mixed cabbage. Hiroshima layers noodles. Jianbing is a breakfast crepe. Cong you bing is a flaky bread.",
      "Sweet dorayaki, soufflé pancakes, and Harajuku crêpes are in the field guide and not in this savory book."
    ],
    slugs: [
      "pajeon", "kimchi-jeon", "haemul-pajeon", "bindaetteok", "gamjajeon",
      "osaka-okonomiyaki", "hiroshima-okonomiyaki", "monjayaki",
      "jianbing", "scallion-pancake", "mandarin-duck-pancakes", "taiwanese-danbing", "laobing"
    ]
  },
  {
    slug: "indias-dosas-and-cheelas",
    title: "India’s Dosas & Cheelas",
    dek: "Fermented rice crepes, instant rava, and the besan pancakes of the north.",
    tier: "regional",
    vehicle: "train",
    intro: [
      "A dosa is not a cheela. Dosa batter ferments from rice and urad dal. A besan cheela is chickpea flour, mixed and cooked the same morning. Uttapam, pesarattu, adai, and appam are their own cakes.",
      "Sri Lankan hoppers are the last chapter, the island cousin of Kerala appam, included so the water between them is visible. Malpua, the syrup sweet, lives in the dessert booklet."
    ],
    slugs: [
      "plain-dosa", "masala-dosa", "paper-dosa", "rava-dosa", "set-dosa", "neer-dosa", "mysore-masala-dosa", "benne-dosa",
      "uttapam", "pesarattu", "adai", "kerala-appam", "paniyaram", "ragi-dosa", "godhuma-dosa", "egg-dosa", "dibba-rotti",
      "besan-cheela", "moong-dal-cheela", "gujarati-pudla", "ghavan", "chakuli-pitha", "sri-lankan-hoppers"
    ]
  },
  {
    slug: "africa-coast-to-coast",
    title: "Africa Coast to Coast",
    dek: "A route across several African countries, not one pancake for a continent.",
    tier: "regional",
    vehicle: "plane",
    intro: [
      "Injera is not kisra, and kisra is not masa. This book crosses Ethiopia, Eritrea, Somalia, Sudan, Nigeria, Ghana, Morocco, Algeria, Tunisia, South Africa, Madagascar, Tanzania, and Kenya because those are the countries with entries, not because a continent can be reduced to one bread.",
      "The plane is the honest vehicle for that distance. The recipes stay specific."
    ],
    slugs: [
      "moroccan-baghrir", "moroccan-msemen", "algerian-kesra", "tunisian-mlewi",
      "ghanaian-tatale", "nigerian-masa", "nigerian-sinasir",
      "sudanese-kisra", "ethiopian-kita", "injera", "eritrean-injera", "somali-laxoox", "somali-malawah",
      "kenyan-chapati", "tanzanian-vitumbua", "madagascan-mofo-gasy", "south-african-pannekoek"
    ]
  },
  {
    slug: "latin-america-and-the-caribbean",
    title: "Latin America & the Caribbean",
    dek: "Casabe, bammy, cachapas, arepas, pupusas, and the crepe with dulce de leche.",
    tier: "regional",
    vehicle: "boat",
    intro: [
      "This book crosses Cuba, Jamaica, the Dominican Republic, Trinidad, Guyana, Mexico, Venezuela, Colombia’s neighbors by way of cachapas and arepas, El Salvador, Costa Rica, Brazil, Paraguay, Argentina, and Ecuador.",
      "Cassava recipes use commercial flour or yuca sold ready to cook. They do not teach a home process for bitter cassava. Corn tortillas, arepas, and pupusas are different masa techniques and stay different."
    ],
    slugs: [
      "cuban-casabe", "cuban-torrejas", "jamaican-bammy", "dominican-yaniqueques", "trinidad-paratha-roti", "guyanese-dhalpuri",
      "mexican-hotcakes", "corn-tortillas", "tlayudas", "gorditas", "crepas-de-cajeta",
      "venezuelan-cachapas", "venezuelan-arepas", "pupusas", "costa-rican-chorreadas", "nicaraguan-guirilas",
      "brazilian-tapioca", "brazilian-beiju", "paraguayan-mbeju", "argentine-panqueques", "ecuadorian-llapingachos"
    ]
  },
  {
    slug: "shrove-tuesday-around-the-world",
    title: "Shrove Tuesday Around the World",
    dek: "Pancakes tied to the days before Lent, and the Orthodox butter week beside them.",
    tier: "flagship",
    vehicle: "train",
    intro: [
      "Shrove Tuesday, Mardi Gras, Ireland’s Pancake Tuesday, and Orthodox Maslenitsa are not the same day. This book groups the pancakes that belong to that season and says which calendar each one uses.",
      "English and Irish pancakes are Shrove. French crêpes are more famously Chandeleur, February 2, and are here because they are also the rich pancakes of the late winter. Russian blini are Maslenitsa. Galician filloas are carnival. The book does not drag in a cake that only happens to be round."
    ],
    slugs: [
      "english-shrove-pancakes",
      "irish-shrove-pancakes",
      "sweet-crepes",
      "galette-bretonne",
      "russian-blini",
      "buckwheat-blini",
      "ukrainian-nalysnyky",
      "finnish-blini",
      "galician-filloas",
      "asturian-frixuelos"
    ]
  }
];

void route;
