export const BOOKS = [
  {
    slug: "breakfast-pancakes",
    title: "Breakfast Pancakes",
    dek: "A booklet of the cakes this journal tags for breakfast.",
    intro: [
      "Breakfast here means the meal the entry itself names: a stack, a dosa, a johnnycake, a hotcake. It is not a claim that nobody eats the same cake at supper.",
      "Print the booklet if you want the recipes in one sheaf. The field-guide page for each cake has the longer history."
    ],
    match: (pancake) => pancake.uses.includes("breakfast")
  },
  {
    slug: "savory-pancakes",
    title: "Savory Pancakes",
    dek: "Scallion, cabbage, potato, and the other cakes that are not a sweet stack.",
    intro: [
      "A savory pancake is a meal or a side: okonomiyaki, pajeon, latkes, socca, a masala dosa. Syrup is not the point.",
      "The tag is the one on the field-guide page. A cake can be both breakfast and savory."
    ],
    match: (pancake) => pancake.uses.includes("savory")
  },
  {
    slug: "dessert-pancakes",
    title: "Dessert Pancakes",
    dek: "Crêpes, syrup cakes, and the sweets that end a meal.",
    intro: [
      "These are the cakes tagged as dessert: Suzette, malpua, æbleskiver, dorayaki, a stack with cajeta.",
      "They are table sweets, not shelf-stable candies."
    ],
    match: (pancake) => pancake.uses.includes("dessert")
  },
  {
    slug: "potato-cakes",
    title: "Potato Cakes",
    dek: "Latkes, boxty, rösti, deruny, and the other potato breads.",
    intro: [
      "Potato cakes are a family, not one holiday. This booklet gathers every entry whose base is potato.",
      "Squeeze the potato dry. That advice shows up because it is the step that decides whether the cake fries or steams."
    ],
    match: (pancake) => pancake.baseType === "potato"
  },
  {
    slug: "fermented-batters",
    title: "Fermented Batters",
    dek: "Dosa, injera, kisra, blini, and the other cakes that wait overnight.",
    intro: [
      "Fermentation is a flavor, not a fuss. These batters sour, bubble, or rise before they are cooked.",
      "If a batter smells rotten or grows mold, discard it. Sour and yeasty is the goal."
    ],
    match: (pancake) => pancake.baseType === "fermented"
  },
  {
    slug: "oven-pancakes",
    title: "Oven Pancakes",
    dek: "Dutch babies, pannukakku, Yorkshire pudding, and the other baked batters.",
    intro: [
      "Some pancakes never see a flip. They puff in a hot pan in the oven.",
      "A hot dish and a closed door are the usual rules. The field-guide page says when to break them."
    ],
    match: (pancake) => pancake.baseType === "oven"
  },
  {
    slug: "street-pancakes",
    title: "Street Pancakes",
    dek: "The cakes sold from a stall, a tawa, or a night market.",
    intro: [
      "Street food in this booklet is a tag, not a romance. It means the cake is cooked to sell and to eat in the hand or at a counter.",
      "The recipes are home versions of those stalls."
    ],
    match: (pancake) => pancake.uses.includes("street")
  },
  {
    slug: "corn-griddles",
    title: "Corn Griddles",
    dek: "Arepas, tortillas, hoe cakes, johnnycakes, and cachapas.",
    intro: [
      "Corn on a griddle is older than the wheat pancake in much of the Americas, and it is not one bread.",
      "Masa, masarepa, fresh corn, and plain cornmeal are different ingredients. The recipes do not swap them silently."
    ],
    match: (pancake) => pancake.baseType === "corn"
  }
];
