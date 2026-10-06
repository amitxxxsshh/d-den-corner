-- ============================================================
-- D DEN CORNER — COMPLETE CUSTOMER MENU CATALOG SEED
-- Preserves all categories, variants, and pricing (minor units: paise)
-- ============================================================

-- Deactivate legacy test categories so they do not clutter the customer menu
UPDATE menu_categories
SET active = 0
WHERE id IN ('dev-cat-1', 'dev-cat-2', 'dev-cat-3')
   OR name IN ('Main Course', 'Breads', 'Beverages');

-- ------------------------------------------------------------
-- 1. CATEGORIES (22 categories)
-- ------------------------------------------------------------

INSERT INTO menu_categories (id, name, sort_order, active)
VALUES
  ('cat-refreshing-mocktails', 'Refreshing Mocktails', 1, 1),
  ('cat-shakes-beverages', 'Shakes & Beverages', 2, 1),
  ('cat-hot-beverage', 'Hot Beverage', 3, 1),
  ('cat-soups', 'Soups', 4, 1),
  ('cat-noodles', 'Noodles', 5, 1),
  ('cat-sandwiches', 'Sandwiches', 6, 1),
  ('cat-burgers', 'Burgers', 7, 1),
  ('cat-pizza', 'Pizza', 8, 1),
  ('cat-wraps', 'Wraps', 9, 1),
  ('cat-pasta', 'Pasta', 10, 1),
  ('cat-veg-starters-fries-potato-bites', 'Veg Starters — Fries & Potato Bites', 11, 1),
  ('cat-veg-starters-cheese-bread-bites', 'Veg Starters — Cheese & Bread Bites', 12, 1),
  ('cat-veg-starters-indo-chinese-favourites', 'Veg Starters — Indo-Chinese Favourites', 13, 1),
  ('cat-non-veg-starters', 'Non-Veg Starters', 14, 1),
  ('cat-non-veg-starters-indo-chinese-favourites', 'Non-Veg Starters — Indo-Chinese Favourites', 15, 1),
  ('cat-tandoor', 'Tandoor', 16, 1),
  ('cat-salads', 'Salads', 17, 1),
  ('cat-biryani', 'Biryani', 18, 1),
  ('cat-rice', 'Rice', 19, 1),
  ('cat-parathas-breads', 'Parathas & Breads', 20, 1),
  ('cat-signature-gravy', 'Signature Gravy', 21, 1),
  ('cat-desserts', 'Desserts', 22, 1)
ON CONFLICT(name) DO UPDATE SET
  id = excluded.id,
  sort_order = excluded.sort_order,
  active = 1,
  updated_at = CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- 2. MENU ITEMS (143 items across 22 categories)
-- ------------------------------------------------------------

-- REFRESHING MOCKTAILS (7 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-virgin-mojito', 'cat-refreshing-mocktails', 'Virgin Mojito', NULL, 12900, 1, 0),
  ('item-watermelon-mint-cooler', 'cat-refreshing-mocktails', 'Watermelon Mint Cooler', NULL, 12900, 1, 0),
  ('item-pineapple-ginger-fizz', 'cat-refreshing-mocktails', 'Pineapple Ginger Fizz', NULL, 12900, 1, 0),
  ('item-orange-basil-spritzer', 'cat-refreshing-mocktails', 'Orange Basil Spritzer', NULL, 12900, 1, 0),
  ('item-aam-panna-cooler', 'cat-refreshing-mocktails', 'Aam Panna Cooler', NULL, 12900, 1, 0),
  ('item-jaljeera-fizz', 'cat-refreshing-mocktails', 'Jaljeera Fizz', NULL, 12900, 1, 0),
  ('item-masala-cola', 'cat-refreshing-mocktails', 'Masala Cola', NULL, 12900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- SHAKES & BEVERAGES (8 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-cold-coffee', 'cat-shakes-beverages', 'Cold Coffee', NULL, 17900, 1, 0),
  ('item-coffee-mocha-frappe', 'cat-shakes-beverages', 'Coffee Mocha Frappe', NULL, 19900, 1, 0),
  ('item-french-vanilla-frappe', 'cat-shakes-beverages', 'French Vanilla Frappe', NULL, 17900, 1, 0),
  ('item-hazelnut-indulgence-frappe', 'cat-shakes-beverages', 'Hazelnut Indulgence Frappe', NULL, 18900, 1, 0),
  ('item-cookies-cream-frappe', 'cat-shakes-beverages', 'Cookies & Cream Frappe', NULL, 18900, 1, 0),
  ('item-chocolate-thick-shake', 'cat-shakes-beverages', 'Chocolate Thick Shake', NULL, 18900, 1, 0),
  ('item-strawberry-milkshake', 'cat-shakes-beverages', 'Strawberry Milkshake', NULL, 19900, 1, 0),
  ('item-nutella-love-shake', 'cat-shakes-beverages', 'Nutella Love Shake', NULL, 19900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- HOT BEVERAGE (8 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-espresso', 'cat-hot-beverage', 'Espresso', NULL, 11900, 1, 0),
  ('item-americano', 'cat-hot-beverage', 'Americano', NULL, 12900, 1, 0),
  ('item-cappuccino', 'cat-hot-beverage', 'Cappuccino', NULL, 14900, 1, 0),
  ('item-cafe-latte', 'cat-hot-beverage', 'Café Latte', NULL, 14900, 1, 0),
  ('item-mochaccino', 'cat-hot-beverage', 'Mochaccino', NULL, 14900, 1, 0),
  ('item-hot-chocolate', 'cat-hot-beverage', 'Hot Chocolate', NULL, 15900, 1, 0),
  ('item-masala-tea', 'cat-hot-beverage', 'Masala Tea', NULL, 4900, 1, 0),
  ('item-green-tea', 'cat-hot-beverage', 'Green Tea', NULL, 4900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- SOUPS (5 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-hot-sour-soup-veg', 'cat-soups', 'Hot & Sour Soup (Veg)', NULL, 13900, 1, 0),
  ('item-hot-sour-soup-non-veg', 'cat-soups', 'Hot & Sour Soup (Non-Veg)', NULL, 14900, 1, 0),
  ('item-lemon-pepper-coriander-soup-veg', 'cat-soups', 'Lemon Pepper Coriander Soup (Veg)', NULL, 13900, 1, 0),
  ('item-lemon-pepper-coriander-soup-non-veg', 'cat-soups', 'Lemon Pepper Coriander Soup (Non-Veg)', NULL, 14900, 1, 0),
  ('item-cream-of-chicken-soup', 'cat-soups', 'Cream of Chicken Soup', NULL, 19900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- NOODLES (3 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-hakka-noodles', 'cat-noodles', 'Hakka Noodles', NULL, 14900, 1, 0),
  ('item-szechuan-noodles', 'cat-noodles', 'Szechuan Noodles', NULL, 19900, 1, 0),
  ('item-burnt-garlic-noodles', 'cat-noodles', 'Burnt Garlic Noodles', NULL, 19900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- SANDWICHES (7 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-veggie-grilled-sandwich', 'cat-sandwiches', 'Veggie Grilled Sandwich', NULL, 14900, 1, 0),
  ('item-cheesy-paneer-sandwich', 'cat-sandwiches', 'Cheesy Paneer Sandwich', NULL, 16900, 1, 0),
  ('item-flaming-hot-paneer-sandwich', 'cat-sandwiches', 'Flaming Hot Paneer Sandwich', NULL, 17900, 1, 0),
  ('item-classic-grilled-mozzarella-sandwich', 'cat-sandwiches', 'Classic Grilled Mozzarella Sandwich', NULL, 19900, 1, 0),
  ('item-creamy-cheese-corn-sandwich', 'cat-sandwiches', 'Creamy Cheese Corn Sandwich', NULL, 14900, 1, 0),
  ('item-cheesy-chicken-sandwich', 'cat-sandwiches', 'Cheesy Chicken Sandwich', NULL, 16900, 1, 0),
  ('item-flaming-hot-chicken-sandwich', 'cat-sandwiches', 'Flaming Hot Chicken Sandwich', NULL, 17900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- BURGERS (8 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-aloo-tikki-burger', 'cat-burgers', 'Aloo Tikki Burger', NULL, 11900, 1, 0),
  ('item-paneer-makhani-burger', 'cat-burgers', 'Paneer Makhani Burger', NULL, 12900, 1, 0),
  ('item-cheesy-paneer-burger', 'cat-burgers', 'Cheesy Paneer Burger', NULL, 14900, 1, 0),
  ('item-tandoori-paneer-burger', 'cat-burgers', 'Tandoori Paneer Burger', NULL, 14900, 1, 0),
  ('item-cheesy-chicken-burger', 'cat-burgers', 'Cheesy Chicken Burger', NULL, 16900, 1, 0),
  ('item-fried-chicken-burger', 'cat-burgers', 'Fried Chicken Burger', NULL, 24900, 1, 0),
  ('item-chicken-double-decker-burger', 'cat-burgers', 'Chicken Double Decker Burger', NULL, 21900, 1, 0),
  ('item-tandoori-chicken-burger', 'cat-burgers', 'Tandoori Chicken Burger', NULL, 14900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- PIZZA (11 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-classic-margherita-pizza', 'cat-pizza', 'Classic Margherita Pizza', NULL, 14900, 1, 0),
  ('item-italian-tomato-basil-pizza', 'cat-pizza', 'Italian Tomato Basil Pizza', NULL, 19900, 1, 0),
  ('item-double-cheese-margherita', 'cat-pizza', 'Double Cheese Margherita', NULL, 16900, 1, 0),
  ('item-garden-fresh-pizza', 'cat-pizza', 'Garden Fresh Pizza', NULL, 29900, 1, 0),
  ('item-spicy-mexican-pizza', 'cat-pizza', 'Spicy Mexican Pizza', NULL, 24900, 1, 0),
  ('item-chicken-sausage-pizza', 'cat-pizza', 'Chicken Sausage Pizza', NULL, 27900, 1, 0),
  ('item-chicken-feast-pizza', 'cat-pizza', 'Chicken Feast Pizza', NULL, 19900, 1, 0),
  ('item-makhni-paneer-pizza', 'cat-pizza', 'Makhni Paneer Pizza', NULL, 29900, 1, 0),
  ('item-makhni-chicken-pizza', 'cat-pizza', 'Makhni Chicken Pizza', NULL, 29900, 1, 0),
  ('item-tandoori-chicken-pizza', 'cat-pizza', 'Tandoori Chicken Pizza', NULL, 29900, 1, 0),
  ('item-tandoori-paneer-pizza', 'cat-pizza', 'Tandoori Paneer Pizza', NULL, 29900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- WRAPS (9 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-paneer-tikka-wrap', 'cat-wraps', 'Paneer Tikka Wrap', NULL, 14900, 1, 0),
  ('item-peri-peri-paneer-wrap', 'cat-wraps', 'Peri Peri Paneer Wrap', NULL, 14900, 1, 0),
  ('item-bbq-paneer-wrap', 'cat-wraps', 'BBQ Paneer Wrap', NULL, 15900, 1, 0),
  ('item-paneer-g5-wrap', 'cat-wraps', 'Paneer G5 Wrap', NULL, 16900, 1, 0),
  ('item-chicken-tikka-wrap', 'cat-wraps', 'Chicken Tikka Wrap', NULL, 16900, 1, 0),
  ('item-peri-peri-chicken-wrap', 'cat-wraps', 'Peri Peri Chicken Wrap', NULL, 17900, 1, 0),
  ('item-bbq-chicken-wrap', 'cat-wraps', 'BBQ Chicken Wrap', NULL, 15900, 1, 0),
  ('item-saucy-egg-wrap', 'cat-wraps', 'Saucy Egg Wrap', NULL, 12900, 1, 0),
  ('item-korean-fried-chicken-wrap', 'cat-wraps', 'Korean Fried Chicken Wrap', NULL, 19900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- PASTA (6 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-white-sauce-pasta', 'cat-pasta', 'White Sauce Pasta', NULL, 24900, 1, 0),
  ('item-red-sauce-pasta', 'cat-pasta', 'Red Sauce Pasta', NULL, 24900, 1, 0),
  ('item-classic-cheese-pasta', 'cat-pasta', 'Classic Cheese Pasta', NULL, 24900, 1, 0),
  ('item-veggie-blast-pasta', 'cat-pasta', 'Veggie Blast Pasta', NULL, 24900, 1, 0),
  ('item-peppy-paneer-pasta', 'cat-pasta', 'Peppy Paneer Pasta', NULL, 28900, 1, 0),
  ('item-chicken-overload-pasta', 'cat-pasta', 'Chicken Overload Pasta', NULL, 29900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- VEG STARTERS — FRIES & POTATO BITES (3 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-salted-fries', 'cat-veg-starters-fries-potato-bites', 'Salted Fries', NULL, 9900, 1, 0),
  ('item-potato-wedges', 'cat-veg-starters-fries-potato-bites', 'Potato Wedges', NULL, 12900, 1, 0),
  ('item-potato-shots', 'cat-veg-starters-fries-potato-bites', 'Potato Shots', NULL, 14900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- VEG STARTERS — CHEESE & BREAD BITES (3 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-cheese-corn-nuggets', 'cat-veg-starters-cheese-bread-bites', 'Cheese Corn Nuggets', NULL, 14900, 1, 0),
  ('item-cheese-garlic-bread', 'cat-veg-starters-cheese-bread-bites', 'Cheese Garlic Bread', NULL, 14900, 1, 0),
  ('item-classic-garlic-bread', 'cat-veg-starters-cheese-bread-bites', 'Classic Garlic Bread', NULL, 12900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- VEG STARTERS — INDO-CHINESE FAVOURITES (8 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-honey-chilli-potato', 'cat-veg-starters-indo-chinese-favourites', 'Honey Chilli Potato', NULL, 14900, 1, 0),
  ('item-chilli-paneer-dry', 'cat-veg-starters-indo-chinese-favourites', 'Chilli Paneer Dry', NULL, 22900, 1, 0),
  ('item-paneer-65', 'cat-veg-starters-indo-chinese-favourites', 'Paneer 65', NULL, 19900, 1, 0),
  ('item-mushroom-65', 'cat-veg-starters-indo-chinese-favourites', 'Mushroom 65', NULL, 19900, 1, 0),
  ('item-american-crispy-corn', 'cat-veg-starters-indo-chinese-favourites', 'American Crispy Corn', NULL, 13900, 1, 0),
  ('item-honey-chilli-cauliflower', 'cat-veg-starters-indo-chinese-favourites', 'Honey Chilli Cauliflower', NULL, 19900, 1, 0),
  ('item-salt-pepper-mushroom', 'cat-veg-starters-indo-chinese-favourites', 'Salt & Pepper Mushroom', NULL, 19900, 1, 0),
  ('item-spring-roll', 'cat-veg-starters-indo-chinese-favourites', 'Spring Roll', NULL, 14900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- NON-VEG STARTERS (8 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-chicken-nuggets', 'cat-non-veg-starters', 'Chicken Nuggets', NULL, 14900, 1, 0),
  ('item-crispy-chicken-wings-6pcs', 'cat-non-veg-starters', 'Crispy Chicken Wings (6 pcs)', NULL, 24900, 1, 0),
  ('item-crispy-chicken-wings-12pcs', 'cat-non-veg-starters', 'Crispy Chicken Wings (12 pcs)', NULL, 44900, 1, 0),
  ('item-chilli-chicken-dry', 'cat-non-veg-starters', 'Chilli Chicken (Dry)', NULL, 27900, 1, 0),
  ('item-drums-of-heaven', 'cat-non-veg-starters', 'Drums of Heaven', NULL, 29900, 1, 0),
  ('item-dragon-chicken', 'cat-non-veg-starters', 'Dragon Chicken', NULL, 29900, 1, 0),
  ('item-chilli-fish', 'cat-non-veg-starters', 'Chilli Fish', NULL, 32900, 1, 0),
  ('item-honey-garlic-chicken', 'cat-non-veg-starters', 'Honey Garlic Chicken', NULL, 29900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- NON-VEG STARTERS — INDO-CHINESE FAVOURITES (5 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-crispy-fried-chicken-2pcs', 'cat-non-veg-starters-indo-chinese-favourites', 'Crispy Fried Chicken (2 pcs)', NULL, 19900, 1, 0),
  ('item-crispy-fried-chicken-4pcs', 'cat-non-veg-starters-indo-chinese-favourites', 'Crispy Fried Chicken (4 pcs)', NULL, 34900, 1, 0),
  ('item-crispy-fried-chicken-6pcs', 'cat-non-veg-starters-indo-chinese-favourites', 'Crispy Fried Chicken (6 pcs)', NULL, 49900, 1, 0),
  ('item-hot-spicy-fried-chicken', 'cat-non-veg-starters-indo-chinese-favourites', 'Hot & Spicy Fried Chicken', NULL, 19900, 1, 0),
  ('item-chicken-popcorn', 'cat-non-veg-starters-indo-chinese-favourites', 'Chicken Popcorn', NULL, 29900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- TANDOOR (7 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-tandoori-chicken-half', 'cat-tandoor', 'Tandoori Chicken (Half)', NULL, 24900, 1, 0),
  ('item-tandoori-chicken-full', 'cat-tandoor', 'Tandoori Chicken (Full)', NULL, 39900, 1, 0),
  ('item-chicken-tikka', 'cat-tandoor', 'Chicken Tikka', NULL, 24900, 1, 0),
  ('item-malai-chicken-tikka', 'cat-tandoor', 'Malai Chicken Tikka', NULL, 25900, 1, 0),
  ('item-hariyali-chicken-tikka', 'cat-tandoor', 'Hariyali Chicken Tikka', NULL, 25900, 1, 0),
  ('item-paneer-tikka', 'cat-tandoor', 'Paneer Tikka', NULL, 22900, 1, 0),
  ('item-malai-paneer-tikka', 'cat-tandoor', 'Malai Paneer Tikka', NULL, 24900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- SALADS (6 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-greek-salad', 'cat-salads', 'Greek Salad', NULL, 19900, 1, 0),
  ('item-classic-caesar-salad', 'cat-salads', 'Classic Caesar Salad', NULL, 21900, 1, 0),
  ('item-creamy-avocado-salad', 'cat-salads', 'Creamy Avocado Salad', NULL, 22900, 1, 0),
  ('item-grilled-prawn-salad', 'cat-salads', 'Grilled Prawn Salad', NULL, 34900, 1, 0),
  ('item-sea-grilled-basa-salad', 'cat-salads', 'Sea Grilled Basa Salad', NULL, 32900, 1, 0),
  ('item-fruit-salad', 'cat-salads', 'Fruit Salad', NULL, 15900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- BIRYANI (4 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-veg-biryani', 'cat-biryani', 'Veg Biryani', NULL, 19900, 1, 0),
  ('item-chicken-biryani', 'cat-biryani', 'Chicken Biryani', NULL, 24900, 1, 0),
  ('item-mutton-biryani', 'cat-biryani', 'Mutton Biryani', NULL, 39900, 1, 0),
  ('item-prawn-biryani', 'cat-biryani', 'Prawn Biryani', NULL, 39900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- RICE (5 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-classic-fried-rice', 'cat-rice', 'Classic Fried Rice', NULL, 14900, 1, 0),
  ('item-fiery-szechuan-fried-rice', 'cat-rice', 'Fiery Szechuan Fried Rice', NULL, 18900, 1, 0),
  ('item-triple-szechuan-rice', 'cat-rice', 'Triple Szechuan Rice', NULL, 18900, 1, 0),
  ('item-burnt-garlic-fried-rice', 'cat-rice', 'Burnt Garlic Fried Rice', NULL, 19900, 1, 0),
  ('item-mixed-fried-rice', 'cat-rice', 'Mixed Fried Rice', NULL, 19900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- PARATHAS & BREADS (3 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-roti', 'cat-parathas-breads', 'Roti', NULL, 1900, 1, 0),
  ('item-lachha-paratha', 'cat-parathas-breads', 'Lachha Paratha', NULL, 3900, 1, 0),
  ('item-egg-lachha-paratha', 'cat-parathas-breads', 'Egg Lachha Paratha', NULL, 5900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- SIGNATURE GRAVY (12 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-paneer-butter-masala', 'cat-signature-gravy', 'Paneer Butter Masala', NULL, 23900, 1, 0),
  ('item-kadhai-paneer', 'cat-signature-gravy', 'Kadhai Paneer', NULL, 23900, 1, 0),
  ('item-kadhai-mushroom', 'cat-signature-gravy', 'Kadhai Mushroom', NULL, 24900, 1, 0),
  ('item-matar-paneer-masala', 'cat-signature-gravy', 'Matar Paneer Masala', NULL, 23900, 1, 0),
  ('item-palak-paneer', 'cat-signature-gravy', 'Palak Paneer', NULL, 24900, 1, 0),
  ('item-palak-mushroom', 'cat-signature-gravy', 'Palak Mushroom', NULL, 25900, 1, 0),
  ('item-butter-chicken', 'cat-signature-gravy', 'Butter Chicken', NULL, 26900, 1, 0),
  ('item-kadhai-chicken', 'cat-signature-gravy', 'Kadhai Chicken', NULL, 26900, 1, 0),
  ('item-palak-chicken', 'cat-signature-gravy', 'Palak Chicken', NULL, 27900, 1, 0),
  ('item-malai-prawn-curry', 'cat-signature-gravy', 'Malai Prawn Curry', NULL, 39900, 1, 0),
  ('item-smoked-laal-maans', 'cat-signature-gravy', 'Smoked Laal Maans', NULL, 39900, 1, 0),
  ('item-prawn-masala', 'cat-signature-gravy', 'Prawn Masala', NULL, 39900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;

-- DESSERTS (7 items)
INSERT INTO menu_items (id, category_id, name, description, price_minor, available, archived)
VALUES
  ('item-choco-lava-cake', 'cat-desserts', 'Choco Lava Cake', NULL, 9900, 1, 0),
  ('item-hot-brownie', 'cat-desserts', 'Hot Brownie', NULL, 9900, 1, 0),
  ('item-sizzling-brownie-with-ice-cream', 'cat-desserts', 'Sizzling Brownie with Ice Cream', NULL, 14900, 1, 0),
  ('item-caramel-cheese-jar', 'cat-desserts', 'Caramel Cheese Jar', NULL, 19900, 1, 0),
  ('item-blueberry-cheesecake', 'cat-desserts', 'Blueberry Cheesecake', NULL, 19900, 1, 0),
  ('item-nutty-sundae', 'cat-desserts', 'Nutty Sundae', NULL, 16900, 1, 0),
  ('item-ice-cream', 'cat-desserts', 'Ice Cream', NULL, 4900, 1, 0)
ON CONFLICT(id) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  price_minor = excluded.price_minor,
  available = excluded.available,
  archived = excluded.archived,
  updated_at = CURRENT_TIMESTAMP;
