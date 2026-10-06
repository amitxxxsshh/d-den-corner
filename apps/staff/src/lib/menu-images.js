/**
 * D Den Corner — Customer Menu Visual Image Resolution Utility
 *
 * Provides a relevant, cohesive, high-quality visual image for every
 * menu item displayed in the customer menu.
 */

export const DEFAULT_MENU_IMAGE = "/images/menu/classic-margherita-pizza.jpg";

/**
 * Direct ID-to-image mapping covering all 143 items in the menu catalog.
 */
export const ITEM_IMAGE_MAP = {
  // 1. REFRESHING MOCKTAILS
  "item-virgin-mojito": "/images/menu/virgin-mojito.jpg",
  "item-watermelon-mint-cooler": "/images/menu/watermelon-mint-cooler.jpg",
  "item-pineapple-ginger-fizz": "/images/menu/pineapple-ginger-fizz.jpg",
  "item-orange-basil-spritzer": "/images/menu/orange-basil-spritzer.jpg",
  "item-aam-panna-cooler": "/images/menu/aam-panna-cooler.jpg",
  "item-jaljeera-fizz": "/images/menu/jaljeera-fizz.jpg",
  "item-masala-cola": "/images/menu/masala-cola.jpg",

  // 2. SHAKES & BEVERAGES
  "item-cold-coffee": "/images/menu/cold-coffee.jpg",
  "item-coffee-mocha-frappe": "/images/menu/coffee-mocha-frappe.jpg",
  "item-french-vanilla-frappe": "/images/menu/french-vanilla-frappe.jpg",
  "item-hazelnut-indulgence-frappe": "/images/menu/hazelnut-frappe.jpg",
  "item-cookies-cream-frappe": "/images/menu/cookies-cream-frappe.jpg",
  "item-chocolate-thick-shake": "/images/menu/chocolate-thick-shake.jpg",
  "item-strawberry-milkshake": "/images/menu/strawberry-milkshake.jpg",
  "item-nutella-love-shake": "/images/menu/nutella-shake.jpg",

  // 3. HOT BEVERAGE
  "item-espresso": "/images/menu/espresso.jpg",
  "item-americano": "/images/menu/americano.jpg",
  "item-cappuccino": "/images/menu/cappuccino.jpg",
  "item-cafe-latte": "/images/menu/cafe-latte.jpg",
  "item-mochaccino": "/images/menu/mochaccino.jpg",
  "item-hot-chocolate": "/images/menu/hot-chocolate.jpg",
  "item-masala-tea": "/images/menu/masala-tea.jpg",
  "item-green-tea": "/images/menu/green-tea.jpg",

  // 4. SOUPS
  "item-hot-sour-soup-veg": "/images/menu/hot-sour-soup-veg.jpg",
  "item-hot-sour-soup-non-veg": "/images/menu/hot-sour-soup-non-veg.jpg",
  "item-lemon-pepper-coriander-soup-veg": "/images/menu/lemon-coriander-soup.jpg",
  "item-lemon-pepper-coriander-soup-non-veg": "/images/menu/lemon-coriander-soup.jpg",
  "item-cream-of-chicken-soup": "/images/menu/cream-chicken-soup.jpg",

  // 5. NOODLES
  "item-hakka-noodles": "/images/menu/hakka-noodles.jpg",
  "item-szechuan-noodles": "/images/menu/szechuan-noodles.jpg",
  "item-burnt-garlic-noodles": "/images/menu/burnt-garlic-noodles.jpg",

  // 6. SANDWICHES
  "item-veggie-grilled-sandwich": "/images/menu/veggie-grilled-sandwich.jpg",
  "item-cheesy-paneer-sandwich": "/images/menu/cheesy-paneer-sandwich.jpg",
  "item-flaming-hot-paneer-sandwich": "/images/menu/flaming-hot-sandwich.jpg",
  "item-classic-grilled-mozzarella-sandwich": "/images/menu/classic-grilled-mozzarella-sandwich.jpg",
  "item-creamy-cheese-corn-sandwich": "/images/menu/creamy-cheese-corn-sandwich.jpg",
  "item-cheesy-chicken-sandwich": "/images/menu/cheesy-chicken-sandwich.jpg",
  "item-flaming-hot-chicken-sandwich": "/images/menu/flaming-hot-sandwich.jpg",

  // 7. BURGERS
  "item-aloo-tikki-burger": "/images/menu/aloo-tikki-burger.jpg",
  "item-paneer-makhani-burger": "/images/menu/paneer-burger.jpg",
  "item-cheesy-paneer-burger": "/images/menu/cheesy-burger.jpg",
  "item-tandoori-paneer-burger": "/images/menu/tandoori-chicken-burger.jpg",
  "item-cheesy-chicken-burger": "/images/menu/cheesy-chicken-burger.jpg",
  "item-fried-chicken-burger": "/images/menu/fried-chicken-burger.jpg",
  "item-chicken-double-decker-burger": "/images/menu/double-decker-burger.jpg",
  "item-tandoori-chicken-burger": "/images/menu/tandoori-chicken-burger.jpg",

  // 8. PIZZA
  "item-classic-margherita-pizza": "/images/menu/classic-margherita-pizza.jpg",
  "item-italian-tomato-basil-pizza": "/images/menu/italian-tomato-basil-pizza.jpg",
  "item-double-cheese-margherita": "/images/menu/double-cheese-margherita.jpg",
  "item-garden-fresh-pizza": "/images/menu/garden-fresh-pizza.jpg",
  "item-spicy-mexican-pizza": "/images/menu/spicy-mexican-pizza.jpg",
  "item-chicken-sausage-pizza": "/images/menu/chicken-sausage-pizza.jpg",
  "item-chicken-feast-pizza": "/images/menu/chicken-sausage-pizza.jpg",
  "item-makhni-paneer-pizza": "/images/menu/makhni-paneer-pizza.jpg",
  "item-makhni-chicken-pizza": "/images/menu/makhni-paneer-pizza.jpg",
  "item-tandoori-chicken-pizza": "/images/menu/chicken-sausage-pizza.jpg",
  "item-tandoori-paneer-pizza": "/images/menu/makhni-paneer-pizza.jpg",

  // 9. WRAPS
  "item-paneer-tikka-wrap": "/images/menu/paneer-tikka-wrap.jpg",
  "item-peri-peri-paneer-wrap": "/images/menu/peri-peri-wrap.jpg",
  "item-bbq-paneer-wrap": "/images/menu/paneer-tikka-wrap.jpg",
  "item-paneer-g5-wrap": "/images/menu/paneer-tikka-wrap.jpg",
  "item-chicken-tikka-wrap": "/images/menu/chicken-tikka-wrap.jpg",
  "item-peri-peri-chicken-wrap": "/images/menu/peri-peri-wrap.jpg",
  "item-bbq-chicken-wrap": "/images/menu/chicken-tikka-wrap.jpg",
  "item-saucy-egg-wrap": "/images/menu/saucy-egg-wrap.jpg",
  "item-korean-fried-chicken-wrap": "/images/menu/korean-fried-chicken-wrap.jpg",

  // 10. PASTA
  "item-white-sauce-pasta": "/images/menu/white-sauce-pasta.jpg",
  "item-red-sauce-pasta": "/images/menu/red-sauce-pasta.jpg",
  "item-classic-cheese-pasta": "/images/menu/classic-cheese-pasta.jpg",
  "item-veggie-blast-pasta": "/images/menu/veggie-blast-pasta.jpg",
  "item-peppy-paneer-pasta": "/images/menu/white-sauce-pasta.jpg",
  "item-chicken-overload-pasta": "/images/menu/white-sauce-pasta.jpg",

  // 11. VEG STARTERS — FRIES & POTATO BITES
  "item-salted-fries": "/images/menu/salted-fries.jpg",
  "item-potato-wedges": "/images/menu/potato-wedges.jpg",
  "item-potato-shots": "/images/menu/potato-shots.jpg",

  // 12. VEG STARTERS — CHEESE & BREAD BITES
  "item-cheese-corn-nuggets": "/images/menu/cheese-corn-nuggets.jpg",
  "item-cheese-garlic-bread": "/images/menu/cheese-garlic-bread.jpg",
  "item-classic-garlic-bread": "/images/menu/classic-garlic-bread.jpg",

  // 13. VEG STARTERS — INDO-CHINESE FAVOURITES
  "item-honey-chilli-potato": "/images/menu/honey-chilli-potato.jpg",
  "item-chilli-paneer-dry": "/images/menu/chilli-paneer-dry.jpg",
  "item-paneer-65": "/images/menu/chilli-paneer-dry.jpg",
  "item-mushroom-65": "/images/menu/mushroom-bites.jpg",
  "item-american-crispy-corn": "/images/menu/american-crispy-corn.jpg",
  "item-honey-chilli-cauliflower": "/images/menu/honey-chilli-potato.jpg",
  "item-salt-pepper-mushroom": "/images/menu/mushroom-bites.jpg",
  "item-spring-roll": "/images/menu/spring-roll.jpg",

  // 14. NON-VEG STARTERS
  "item-chicken-nuggets": "/images/menu/chicken-nuggets.jpg",
  "item-crispy-chicken-wings-6pcs": "/images/menu/crispy-chicken-wings.jpg",
  "item-crispy-chicken-wings-12pcs": "/images/menu/crispy-chicken-wings.jpg",
  "item-chilli-chicken-dry": "/images/menu/chilli-chicken-dry.jpg",
  "item-drums-of-heaven": "/images/menu/drums-of-heaven.jpg",
  "item-dragon-chicken": "/images/menu/chilli-chicken-dry.jpg",
  "item-chilli-fish": "/images/menu/chilli-fish.jpg",
  "item-honey-garlic-chicken": "/images/menu/drums-of-heaven.jpg",

  // 15. NON-VEG STARTERS — INDO-CHINESE FAVOURITES
  "item-crispy-fried-chicken-2pcs": "/images/menu/crispy-fried-chicken.jpg",
  "item-crispy-fried-chicken-4pcs": "/images/menu/crispy-fried-chicken.jpg",
  "item-crispy-fried-chicken-6pcs": "/images/menu/crispy-fried-chicken.jpg",
  "item-hot-spicy-fried-chicken": "/images/menu/crispy-fried-chicken.jpg",
  "item-chicken-popcorn": "/images/menu/chicken-popcorn.jpg",

  // 16. TANDOOR
  "item-tandoori-chicken-half": "/images/menu/tandoori-chicken.jpg",
  "item-tandoori-chicken-full": "/images/menu/tandoori-chicken.jpg",
  "item-chicken-tikka": "/images/menu/tandoori-chicken.jpg",
  "item-malai-chicken-tikka": "/images/menu/malai-chicken-tikka.jpg",
  "item-hariyali-chicken-tikka": "/images/menu/malai-chicken-tikka.jpg",
  "item-paneer-tikka": "/images/menu/paneer-tikka.jpg",
  "item-malai-paneer-tikka": "/images/menu/paneer-tikka.jpg",

  // 17. SALADS
  "item-greek-salad": "/images/menu/greek-salad.jpg",
  "item-classic-caesar-salad": "/images/menu/classic-caesar-salad.jpg",
  "item-creamy-avocado-salad": "/images/menu/creamy-avocado-salad.jpg",
  "item-grilled-prawn-salad": "/images/menu/grilled-prawn-salad.jpg",
  "item-sea-grilled-basa-salad": "/images/menu/grilled-prawn-salad.jpg",
  "item-fruit-salad": "/images/menu/fruit-salad.jpg",

  // 18. BIRYANI
  "item-veg-biryani": "/images/menu/veg-biryani.jpg",
  "item-chicken-biryani": "/images/menu/chicken-biryani.jpg",
  "item-mutton-biryani": "/images/menu/mutton-biryani.jpg",
  "item-prawn-biryani": "/images/menu/chicken-biryani.jpg",

  // 19. RICE
  "item-classic-fried-rice": "/images/menu/classic-fried-rice.jpg",
  "item-fiery-szechuan-fried-rice": "/images/menu/classic-fried-rice.jpg",
  "item-triple-szechuan-rice": "/images/menu/classic-fried-rice.jpg",
  "item-burnt-garlic-fried-rice": "/images/menu/classic-fried-rice.jpg",
  "item-mixed-fried-rice": "/images/menu/classic-fried-rice.jpg",

  // 20. PARATHAS & BREADS
  "item-roti": "/images/menu/roti.jpg",
  "item-lachha-paratha": "/images/menu/lachha-paratha.jpg",
  "item-egg-lachha-paratha": "/images/menu/lachha-paratha.jpg",

  // 21. SIGNATURE GRAVY
  "item-paneer-butter-masala": "/images/menu/paneer-butter-masala.jpg",
  "item-kadhai-paneer": "/images/menu/paneer-butter-masala.jpg",
  "item-kadhai-mushroom": "/images/menu/spiced-gravy.jpg",
  "item-matar-paneer-masala": "/images/menu/paneer-butter-masala.jpg",
  "item-palak-paneer": "/images/menu/palak-paneer.jpg",
  "item-palak-mushroom": "/images/menu/palak-paneer.jpg",
  "item-butter-chicken": "/images/menu/butter-chicken.jpg",
  "item-kadhai-chicken": "/images/menu/kadhai-chicken.jpg",
  "item-palak-chicken": "/images/menu/palak-paneer.jpg",
  "item-malai-prawn-curry": "/images/menu/spiced-gravy.jpg",
  "item-smoked-laal-maans": "/images/menu/spiced-gravy.jpg",
  "item-prawn-masala": "/images/menu/spiced-gravy.jpg",

  // 22. DESSERTS
  "item-choco-lava-cake": "/images/menu/choco-lava-cake.jpg",
  "item-hot-brownie": "/images/menu/choco-lava-cake.jpg",
  "item-sizzling-brownie-with-ice-cream": "/images/menu/sizzling-brownie.jpg",
  "item-caramel-cheese-jar": "/images/menu/cheesecake.jpg",
  "item-blueberry-cheesecake": "/images/menu/cheesecake.jpg",
  "item-nutty-sundae": "/images/menu/ice-cream-sundae.jpg",
  "item-ice-cream": "/images/menu/ice-cream-sundae.jpg",
};

/**
 * Category-level default image mapping.
 */
export const CATEGORY_IMAGE_MAP = {
  "cat-refreshing-mocktails": "/images/menu/virgin-mojito.jpg",
  "cat-shakes-beverages": "/images/menu/cold-coffee.jpg",
  "cat-hot-beverage": "/images/menu/cappuccino.jpg",
  "cat-soups": "/images/menu/hot-sour-soup-veg.jpg",
  "cat-noodles": "/images/menu/hakka-noodles.jpg",
  "cat-sandwiches": "/images/menu/veggie-grilled-sandwich.jpg",
  "cat-burgers": "/images/menu/aloo-tikki-burger.jpg",
  "cat-pizza": "/images/menu/classic-margherita-pizza.jpg",
  "cat-wraps": "/images/menu/paneer-tikka-wrap.jpg",
  "cat-pasta": "/images/menu/white-sauce-pasta.jpg",
  "cat-veg-starters-fries-potato-bites": "/images/menu/salted-fries.jpg",
  "cat-veg-starters-cheese-bread-bites": "/images/menu/cheese-garlic-bread.jpg",
  "cat-veg-starters-indo-chinese-favourites": "/images/menu/honey-chilli-potato.jpg",
  "cat-non-veg-starters": "/images/menu/crispy-chicken-wings.jpg",
  "cat-non-veg-starters-indo-chinese-favourites": "/images/menu/crispy-fried-chicken.jpg",
  "cat-tandoor": "/images/menu/tandoori-chicken.jpg",
  "cat-salads": "/images/menu/classic-caesar-salad.jpg",
  "cat-biryani": "/images/menu/chicken-biryani.jpg",
  "cat-rice": "/images/menu/classic-fried-rice.jpg",
  "cat-parathas-breads": "/images/menu/lachha-paratha.jpg",
  "cat-signature-gravy": "/images/menu/butter-chicken.jpg",
  "cat-desserts": "/images/menu/choco-lava-cake.jpg",
};

/**
 * Name keyword mapping for dynamic or festival items without a static item ID.
 */
const KEYWORD_IMAGE_RULES = [
  { match: ["mojito"], image: "/images/menu/virgin-mojito.jpg" },
  { match: ["watermelon"], image: "/images/menu/watermelon-mint-cooler.jpg" },
  { match: ["pineapple"], image: "/images/menu/pineapple-ginger-fizz.jpg" },
  { match: ["orange", "spritzer"], image: "/images/menu/orange-basil-spritzer.jpg" },
  { match: ["aam", "panna"], image: "/images/menu/aam-panna-cooler.jpg" },
  { match: ["jaljeera"], image: "/images/menu/jaljeera-fizz.jpg" },
  { match: ["cola"], image: "/images/menu/masala-cola.jpg" },
  { match: ["coffee", "cold coffee"], image: "/images/menu/cold-coffee.jpg" },
  { match: ["frappe"], image: "/images/menu/coffee-mocha-frappe.jpg" },
  { match: ["shake"], image: "/images/menu/chocolate-thick-shake.jpg" },
  { match: ["strawberry"], image: "/images/menu/strawberry-milkshake.jpg" },
  { match: ["espresso"], image: "/images/menu/espresso.jpg" },
  { match: ["americano"], image: "/images/menu/americano.jpg" },
  { match: ["cappuccino"], image: "/images/menu/cappuccino.jpg" },
  { match: ["latte"], image: "/images/menu/cafe-latte.jpg" },
  { match: ["chocolate", "cocoa"], image: "/images/menu/hot-chocolate.jpg" },
  { match: ["tea", "chai"], image: "/images/menu/masala-tea.jpg" },
  { match: ["soup"], image: "/images/menu/hot-sour-soup-veg.jpg" },
  { match: ["noodle"], image: "/images/menu/hakka-noodles.jpg" },
  { match: ["sandwich"], image: "/images/menu/veggie-grilled-sandwich.jpg" },
  { match: ["burger"], image: "/images/menu/aloo-tikki-burger.jpg" },
  { match: ["pizza", "margherita"], image: "/images/menu/classic-margherita-pizza.jpg" },
  { match: ["wrap", "roll"], image: "/images/menu/paneer-tikka-wrap.jpg" },
  { match: ["pasta", "alfredo", "arrabbiata"], image: "/images/menu/white-sauce-pasta.jpg" },
  { match: ["fries", "potato", "wedges"], image: "/images/menu/salted-fries.jpg" },
  { match: ["garlic bread"], image: "/images/menu/cheese-garlic-bread.jpg" },
  { match: ["nugget"], image: "/images/menu/chicken-nuggets.jpg" },
  { match: ["wings"], image: "/images/menu/crispy-chicken-wings.jpg" },
  { match: ["spring roll"], image: "/images/menu/spring-roll.jpg" },
  { match: ["biryani"], image: "/images/menu/chicken-biryani.jpg" },
  { match: ["fried rice"], image: "/images/menu/classic-fried-rice.jpg" },
  { match: ["roti", "paratha"], image: "/images/menu/lachha-paratha.jpg" },
  { match: ["tikka", "tandoori"], image: "/images/menu/tandoori-chicken.jpg" },
  { match: ["salad"], image: "/images/menu/classic-caesar-salad.jpg" },
  { match: ["butter chicken"], image: "/images/menu/butter-chicken.jpg" },
  { match: ["paneer butter"], image: "/images/menu/paneer-butter-masala.jpg" },
  { match: ["palak"], image: "/images/menu/palak-paneer.jpg" },
  { match: ["curry", "gravy", "masala"], image: "/images/menu/spiced-gravy.jpg" },
  { match: ["lava", "brownie"], image: "/images/menu/choco-lava-cake.jpg" },
  { match: ["cheesecake"], image: "/images/menu/cheesecake.jpg" },
  { match: ["sundae", "ice cream"], image: "/images/menu/ice-cream-sundae.jpg" },
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
