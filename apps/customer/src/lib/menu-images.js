/**
 * D Den Corner — Customer Menu Visual Image Resolution Utility
 *
 * Provides a relevant, cohesive, high-quality visual image for every
 * menu item displayed in the customer menu.
 */

export const DEFAULT_MENU_IMAGE = "/images/menu/classic-margherita-pizza.webp";

/**
 * Direct ID-to-image mapping covering all 143 items in the menu catalog.
 */
export const ITEM_IMAGE_MAP = {
  // 1. REFRESHING MOCKTAILS
  "item-virgin-mojito": "/images/menu/virgin-mojito.webp",
  "item-watermelon-mint-cooler": "/images/menu/watermelon-mint-cooler.webp",
  "item-pineapple-ginger-fizz": "/images/menu/pineapple-ginger-fizz.webp",
  "item-orange-basil-spritzer": "/images/menu/orange-basil-spritzer.webp",
  "item-aam-panna-cooler": "/images/menu/aam-panna-cooler.webp",
  "item-jaljeera-fizz": "/images/menu/jaljeera-fizz.webp",
  "item-masala-cola": "/images/menu/masala-cola.webp",

  // 2. SHAKES & BEVERAGES
  "item-cold-coffee": "/images/menu/cold-coffee.webp",
  "item-coffee-mocha-frappe": "/images/menu/coffee-mocha-frappe.webp",
  "item-french-vanilla-frappe": "/images/menu/french-vanilla-frappe.webp",
  "item-hazelnut-indulgence-frappe": "/images/menu/hazelnut-frappe.webp",
  "item-cookies-cream-frappe": "/images/menu/cookies-cream-frappe.webp",
  "item-chocolate-thick-shake": "/images/menu/chocolate-thick-shake.webp",
  "item-strawberry-milkshake": "/images/menu/strawberry-milkshake.webp",
  "item-nutella-love-shake": "/images/menu/nutella-shake.webp",

  // 3. HOT BEVERAGE
  "item-espresso": "/images/menu/espresso.webp",
  "item-americano": "/images/menu/americano.webp",
  "item-cappuccino": "/images/menu/cappuccino.webp",
  "item-cafe-latte": "/images/menu/cafe-latte.webp",
  "item-mochaccino": "/images/menu/mochaccino.webp",
  "item-hot-chocolate": "/images/menu/hot-chocolate.webp",
  "item-masala-tea": "/images/menu/masala-tea.webp",
  "item-green-tea": "/images/menu/green-tea.webp",

  // 4. SOUPS
  "item-hot-sour-soup-veg": "/images/menu/hot-sour-soup-veg.webp",
  "item-hot-sour-soup-non-veg": "/images/menu/hot-sour-soup-non-veg.webp",
  "item-lemon-pepper-coriander-soup-veg": "/images/menu/lemon-coriander-soup.webp",
  "item-lemon-pepper-coriander-soup-non-veg": "/images/menu/lemon-coriander-soup.webp",
  "item-cream-of-chicken-soup": "/images/menu/cream-chicken-soup.webp",

  // 5. NOODLES
  "item-hakka-noodles": "/images/menu/hakka-noodles.webp",
  "item-szechuan-noodles": "/images/menu/szechuan-noodles.webp",
  "item-burnt-garlic-noodles": "/images/menu/burnt-garlic-noodles.webp",

  // 6. SANDWICHES
  "item-veggie-grilled-sandwich": "/images/menu/veggie-grilled-sandwich.webp",
  "item-cheesy-paneer-sandwich": "/images/menu/cheesy-paneer-sandwich.webp",
  "item-flaming-hot-paneer-sandwich": "/images/menu/flaming-hot-sandwich.webp",
  "item-classic-grilled-mozzarella-sandwich": "/images/menu/classic-grilled-mozzarella-sandwich.webp",
  "item-creamy-cheese-corn-sandwich": "/images/menu/creamy-cheese-corn-sandwich.webp",
  "item-cheesy-chicken-sandwich": "/images/menu/cheesy-chicken-sandwich.webp",
  "item-flaming-hot-chicken-sandwich": "/images/menu/flaming-hot-sandwich.webp",

  // 7. BURGERS
  "item-aloo-tikki-burger": "/images/menu/aloo-tikki-burger.webp",
  "item-paneer-makhani-burger": "/images/menu/paneer-burger.webp",
  "item-cheesy-paneer-burger": "/images/menu/cheesy-burger.webp",
  "item-tandoori-paneer-burger": "/images/menu/tandoori-chicken-burger.webp",
  "item-cheesy-chicken-burger": "/images/menu/cheesy-chicken-burger.webp",
  "item-fried-chicken-burger": "/images/menu/fried-chicken-burger.webp",
  "item-chicken-double-decker-burger": "/images/menu/double-decker-burger.webp",
  "item-tandoori-chicken-burger": "/images/menu/tandoori-chicken-burger.webp",

  // 8. PIZZA
  "item-classic-margherita-pizza": "/images/menu/classic-margherita-pizza.webp",
  "item-italian-tomato-basil-pizza": "/images/menu/italian-tomato-basil-pizza.webp",
  "item-double-cheese-margherita": "/images/menu/double-cheese-margherita.webp",
  "item-garden-fresh-pizza": "/images/menu/garden-fresh-pizza.webp",
  "item-spicy-mexican-pizza": "/images/menu/spicy-mexican-pizza.webp",
  "item-chicken-sausage-pizza": "/images/menu/chicken-sausage-pizza.webp",
  "item-chicken-feast-pizza": "/images/menu/chicken-sausage-pizza.webp",
  "item-makhni-paneer-pizza": "/images/menu/makhni-paneer-pizza.webp",
  "item-makhni-chicken-pizza": "/images/menu/makhni-paneer-pizza.webp",
  "item-tandoori-chicken-pizza": "/images/menu/chicken-sausage-pizza.webp",
  "item-tandoori-paneer-pizza": "/images/menu/makhni-paneer-pizza.webp",

  // 9. WRAPS
  "item-paneer-tikka-wrap": "/images/menu/paneer-tikka-wrap.webp",
  "item-peri-peri-paneer-wrap": "/images/menu/peri-peri-wrap.webp",
  "item-bbq-paneer-wrap": "/images/menu/paneer-tikka-wrap.webp",
  "item-paneer-g5-wrap": "/images/menu/paneer-tikka-wrap.webp",
  "item-chicken-tikka-wrap": "/images/menu/chicken-tikka-wrap.webp",
  "item-peri-peri-chicken-wrap": "/images/menu/peri-peri-wrap.webp",
  "item-bbq-chicken-wrap": "/images/menu/chicken-tikka-wrap.webp",
  "item-saucy-egg-wrap": "/images/menu/saucy-egg-wrap.webp",
  "item-korean-fried-chicken-wrap": "/images/menu/korean-fried-chicken-wrap.webp",

  // 10. PASTA
  "item-white-sauce-pasta": "/images/menu/white-sauce-pasta.webp",
  "item-red-sauce-pasta": "/images/menu/red-sauce-pasta.webp",
  "item-classic-cheese-pasta": "/images/menu/classic-cheese-pasta.webp",
  "item-veggie-blast-pasta": "/images/menu/veggie-blast-pasta.webp",
  "item-peppy-paneer-pasta": "/images/menu/white-sauce-pasta.webp",
  "item-chicken-overload-pasta": "/images/menu/white-sauce-pasta.webp",

  // 11. VEG STARTERS — FRIES & POTATO BITES
  "item-salted-fries": "/images/menu/salted-fries.webp",
  "item-potato-wedges": "/images/menu/potato-wedges.webp",
  "item-potato-shots": "/images/menu/potato-shots.webp",

  // 12. VEG STARTERS — CHEESE & BREAD BITES
  "item-cheese-corn-nuggets": "/images/menu/cheese-corn-nuggets.webp",
  "item-cheese-garlic-bread": "/images/menu/cheese-garlic-bread.webp",
  "item-classic-garlic-bread": "/images/menu/classic-garlic-bread.webp",

  // 13. VEG STARTERS — INDO-CHINESE FAVOURITES
  "item-honey-chilli-potato": "/images/menu/honey-chilli-potato.webp",
  "item-chilli-paneer-dry": "/images/menu/chilli-paneer-dry.webp",
  "item-paneer-65": "/images/menu/chilli-paneer-dry.webp",
  "item-mushroom-65": "/images/menu/mushroom-bites.webp",
  "item-american-crispy-corn": "/images/menu/american-crispy-corn.webp",
  "item-honey-chilli-cauliflower": "/images/menu/honey-chilli-potato.webp",
  "item-salt-pepper-mushroom": "/images/menu/mushroom-bites.webp",
  "item-spring-roll": "/images/menu/spring-roll.webp",

  // 14. NON-VEG STARTERS
  "item-chicken-nuggets": "/images/menu/chicken-nuggets.webp",
  "item-crispy-chicken-wings-6pcs": "/images/menu/crispy-chicken-wings.webp",
  "item-crispy-chicken-wings-12pcs": "/images/menu/crispy-chicken-wings.webp",
  "item-chilli-chicken-dry": "/images/menu/chilli-chicken-dry.webp",
  "item-drums-of-heaven": "/images/menu/drums-of-heaven.webp",
  "item-dragon-chicken": "/images/menu/chilli-chicken-dry.webp",
  "item-chilli-fish": "/images/menu/chilli-fish.webp",
  "item-honey-garlic-chicken": "/images/menu/drums-of-heaven.webp",

  // 15. NON-VEG STARTERS — INDO-CHINESE FAVOURITES
  "item-crispy-fried-chicken-2pcs": "/images/menu/crispy-fried-chicken.webp",
  "item-crispy-fried-chicken-4pcs": "/images/menu/crispy-fried-chicken.webp",
  "item-crispy-fried-chicken-6pcs": "/images/menu/crispy-fried-chicken.webp",
  "item-hot-spicy-fried-chicken": "/images/menu/crispy-fried-chicken.webp",
  "item-chicken-popcorn": "/images/menu/chicken-popcorn.webp",

  // 16. TANDOOR
  "item-tandoori-chicken-half": "/images/menu/tandoori-chicken.webp",
  "item-tandoori-chicken-full": "/images/menu/tandoori-chicken.webp",
  "item-chicken-tikka": "/images/menu/tandoori-chicken.webp",
  "item-malai-chicken-tikka": "/images/menu/malai-chicken-tikka.webp",
  "item-hariyali-chicken-tikka": "/images/menu/malai-chicken-tikka.webp",
  "item-paneer-tikka": "/images/menu/paneer-tikka.webp",
  "item-malai-paneer-tikka": "/images/menu/paneer-tikka.webp",

  // 17. SALADS
  "item-greek-salad": "/images/menu/greek-salad.webp",
  "item-classic-caesar-salad": "/images/menu/classic-caesar-salad.webp",
  "item-creamy-avocado-salad": "/images/menu/creamy-avocado-salad.webp",
  "item-grilled-prawn-salad": "/images/menu/grilled-prawn-salad.webp",
  "item-sea-grilled-basa-salad": "/images/menu/grilled-prawn-salad.webp",
  "item-fruit-salad": "/images/menu/fruit-salad.webp",

  // 18. BIRYANI
  "item-veg-biryani": "/images/menu/veg-biryani.webp",
  "item-chicken-biryani": "/images/menu/chicken-biryani.webp",
  "item-mutton-biryani": "/images/menu/mutton-biryani.webp",
  "item-prawn-biryani": "/images/menu/chicken-biryani.webp",

  // 19. RICE
  "item-classic-fried-rice": "/images/menu/classic-fried-rice.webp",
  "item-fiery-szechuan-fried-rice": "/images/menu/classic-fried-rice.webp",
  "item-triple-szechuan-rice": "/images/menu/classic-fried-rice.webp",
  "item-burnt-garlic-fried-rice": "/images/menu/classic-fried-rice.webp",
  "item-mixed-fried-rice": "/images/menu/classic-fried-rice.webp",

  // 20. PARATHAS & BREADS
  "item-roti": "/images/menu/roti.webp",
  "item-lachha-paratha": "/images/menu/lachha-paratha.webp",
  "item-egg-lachha-paratha": "/images/menu/lachha-paratha.webp",

  // 21. SIGNATURE GRAVY
  "item-paneer-butter-masala": "/images/menu/paneer-butter-masala.webp",
  "item-kadhai-paneer": "/images/menu/paneer-butter-masala.webp",
  "item-kadhai-mushroom": "/images/menu/spiced-gravy.webp",
  "item-matar-paneer-masala": "/images/menu/paneer-butter-masala.webp",
  "item-palak-paneer": "/images/menu/palak-paneer.webp",
  "item-palak-mushroom": "/images/menu/palak-paneer.webp",
  "item-butter-chicken": "/images/menu/butter-chicken.webp",
  "item-kadhai-chicken": "/images/menu/kadhai-chicken.webp",
  "item-palak-chicken": "/images/menu/palak-paneer.webp",
  "item-malai-prawn-curry": "/images/menu/spiced-gravy.webp",
  "item-smoked-laal-maans": "/images/menu/spiced-gravy.webp",
  "item-prawn-masala": "/images/menu/spiced-gravy.webp",

  // 22. DESSERTS
  "item-choco-lava-cake": "/images/menu/choco-lava-cake.webp",
  "item-hot-brownie": "/images/menu/choco-lava-cake.webp",
  "item-sizzling-brownie-with-ice-cream": "/images/menu/sizzling-brownie.webp",
  "item-caramel-cheese-jar": "/images/menu/cheesecake.webp",
  "item-blueberry-cheesecake": "/images/menu/cheesecake.webp",
  "item-nutty-sundae": "/images/menu/ice-cream-sundae.webp",
  "item-ice-cream": "/images/menu/ice-cream-sundae.webp",
};

/**
 * Category-level default image mapping.
 */
export const CATEGORY_IMAGE_MAP = {
  "cat-refreshing-mocktails": "/images/menu/virgin-mojito.webp",
  "cat-shakes-beverages": "/images/menu/cold-coffee.webp",
  "cat-hot-beverage": "/images/menu/cappuccino.webp",
  "cat-soups": "/images/menu/hot-sour-soup-veg.webp",
  "cat-noodles": "/images/menu/hakka-noodles.webp",
  "cat-sandwiches": "/images/menu/veggie-grilled-sandwich.webp",
  "cat-burgers": "/images/menu/aloo-tikki-burger.webp",
  "cat-pizza": "/images/menu/classic-margherita-pizza.webp",
  "cat-wraps": "/images/menu/paneer-tikka-wrap.webp",
  "cat-pasta": "/images/menu/white-sauce-pasta.webp",
  "cat-veg-starters-fries-potato-bites": "/images/menu/salted-fries.webp",
  "cat-veg-starters-cheese-bread-bites": "/images/menu/cheese-garlic-bread.webp",
  "cat-veg-starters-indo-chinese-favourites": "/images/menu/honey-chilli-potato.webp",
  "cat-non-veg-starters": "/images/menu/crispy-chicken-wings.webp",
  "cat-non-veg-starters-indo-chinese-favourites": "/images/menu/crispy-fried-chicken.webp",
  "cat-tandoor": "/images/menu/tandoori-chicken.webp",
  "cat-salads": "/images/menu/classic-caesar-salad.webp",
  "cat-biryani": "/images/menu/chicken-biryani.webp",
  "cat-rice": "/images/menu/classic-fried-rice.webp",
  "cat-parathas-breads": "/images/menu/lachha-paratha.webp",
  "cat-signature-gravy": "/images/menu/butter-chicken.webp",
  "cat-desserts": "/images/menu/choco-lava-cake.webp",
};

/**
 * Name keyword mapping for dynamic or festival items without a static item ID.
 */
const KEYWORD_IMAGE_RULES = [
  { match: ["mojito"], image: "/images/menu/virgin-mojito.webp" },
  { match: ["watermelon"], image: "/images/menu/watermelon-mint-cooler.webp" },
  { match: ["pineapple"], image: "/images/menu/pineapple-ginger-fizz.webp" },
  { match: ["orange", "spritzer"], image: "/images/menu/orange-basil-spritzer.webp" },
  { match: ["aam", "panna"], image: "/images/menu/aam-panna-cooler.webp" },
  { match: ["jaljeera"], image: "/images/menu/jaljeera-fizz.webp" },
  { match: ["cola"], image: "/images/menu/masala-cola.webp" },
  { match: ["coffee", "cold coffee"], image: "/images/menu/cold-coffee.webp" },
  { match: ["frappe"], image: "/images/menu/coffee-mocha-frappe.webp" },
  { match: ["shake"], image: "/images/menu/chocolate-thick-shake.webp" },
  { match: ["strawberry"], image: "/images/menu/strawberry-milkshake.webp" },
  { match: ["espresso"], image: "/images/menu/espresso.webp" },
  { match: ["americano"], image: "/images/menu/americano.webp" },
  { match: ["cappuccino"], image: "/images/menu/cappuccino.webp" },
  { match: ["latte"], image: "/images/menu/cafe-latte.webp" },
  { match: ["chocolate", "cocoa"], image: "/images/menu/hot-chocolate.webp" },
  { match: ["tea", "chai"], image: "/images/menu/masala-tea.webp" },
  { match: ["soup"], image: "/images/menu/hot-sour-soup-veg.webp" },
  { match: ["noodle"], image: "/images/menu/hakka-noodles.webp" },
  { match: ["sandwich"], image: "/images/menu/veggie-grilled-sandwich.webp" },
  { match: ["burger"], image: "/images/menu/aloo-tikki-burger.webp" },
  { match: ["pizza", "margherita"], image: "/images/menu/classic-margherita-pizza.webp" },
  { match: ["wrap", "roll"], image: "/images/menu/paneer-tikka-wrap.webp" },
  { match: ["pasta", "alfredo", "arrabbiata"], image: "/images/menu/white-sauce-pasta.webp" },
  { match: ["fries", "potato", "wedges"], image: "/images/menu/salted-fries.webp" },
  { match: ["garlic bread"], image: "/images/menu/cheese-garlic-bread.webp" },
  { match: ["nugget"], image: "/images/menu/chicken-nuggets.webp" },
  { match: ["wings"], image: "/images/menu/crispy-chicken-wings.webp" },
  { match: ["spring roll"], image: "/images/menu/spring-roll.webp" },
  { match: ["biryani"], image: "/images/menu/chicken-biryani.webp" },
  { match: ["fried rice"], image: "/images/menu/classic-fried-rice.webp" },
  { match: ["roti", "paratha"], image: "/images/menu/lachha-paratha.webp" },
  { match: ["tikka", "tandoori"], image: "/images/menu/tandoori-chicken.webp" },
  { match: ["salad"], image: "/images/menu/classic-caesar-salad.webp" },
  { match: ["butter chicken"], image: "/images/menu/butter-chicken.webp" },
  { match: ["paneer butter"], image: "/images/menu/paneer-butter-masala.webp" },
  { match: ["palak"], image: "/images/menu/palak-paneer.webp" },
  { match: ["curry", "gravy", "masala"], image: "/images/menu/spiced-gravy.webp" },
  { match: ["lava", "brownie"], image: "/images/menu/choco-lava-cake.webp" },
  { match: ["cheesecake"], image: "/images/menu/cheesecake.webp" },
  { match: ["sundae", "ice cream"], image: "/images/menu/ice-cream-sundae.webp" },
];

/**
 * Resolves the most appropriate image URL for a menu item.
 *
 * @param {Object} item The menu item object
 * @returns {string} The public image URL path
 */
export function getMenuItemImageUrl(item) {
  if (!item) return DEFAULT_MENU_IMAGE;

  // 1. Direct explicit image URL in item data
  if (item.image_url) return item.image_url;
  if (item.imageUrl) return item.imageUrl;

  // 2. Direct ID lookup
  const itemId = item.id || item.menuItemId || item.specialMenuItemId;
  if (itemId && ITEM_IMAGE_MAP[itemId]) {
    return ITEM_IMAGE_MAP[itemId];
  }

  // 3. Name keyword matching
  const name = String(item.name || "").toLowerCase();
  for (const rule of KEYWORD_IMAGE_RULES) {
    if (rule.match.some((kw) => name.includes(kw))) {
      return rule.image;
    }
  }

  // 4. Category ID lookup
  const catId = item.category_id || item.categoryId;
  if (catId && CATEGORY_IMAGE_MAP[catId]) {
    return CATEGORY_IMAGE_MAP[catId];
  }

  // 5. Default fallback
  return DEFAULT_MENU_IMAGE;
}
