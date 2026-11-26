// Coffee Darbar — Coffee Collection data: products, filters, barista notes
const IMG = {
  espressoRoyale: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
  artisanLatte: 'https://images.unsplash.com/photo-1563311977-d285756282dc',
  irishFrappeHero: 'https://images.unsplash.com/photo-1765510758735-634710ac4863',
  matchaBloom: 'https://images.unsplash.com/photo-1759363580278-058211df7102',
  midnightScholar: 'https://images.unsplash.com/photo-1778664254177-99b082efa8ff',
  focusPour: 'https://images.unsplash.com/photo-1522012188892-24beb302783d',
  latte1: 'https://images.unsplash.com/photo-1542372147193-a7aca54189cd',
  cappuccino1: 'https://images.unsplash.com/photo-1506372023823-741c83b836fe',
  flatwhite1: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
  mocha1: 'https://images.unsplash.com/photo-1619286310410-a95de97b0aec',
  coldbrew2: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
  pourover1: 'https://images.unsplash.com/photo-1639906512494-dd4a536abc4e',
  bakery1: 'https://images.unsplash.com/photo-1762754104628-cb53c14d79b7',
  bakery2: 'https://images.unsplash.com/photo-1773091389938-9e12c7fb3cd8',
  dessert1: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50',
  healthy1: 'https://images.unsplash.com/photo-1603046891726-36bfd957e0bf',
};
function img(key, w) { return `${IMG[key]}?auto=format&fit=crop&w=${w || 700}&q=80`; }

window.FILTERS = [
  { tag: 'all', label: 'All Items', icon: '✨' },
  { tag: 'high-caff', label: 'High Caffeine', icon: '⚡' },
  { tag: 'med-caff', label: 'Medium Caffeine', icon: '⚖️' },
  { tag: 'low-caff', label: 'Low & Decaf', icon: '🌿' },
  { tag: 'vegan', label: '100% Vegan', icon: '🌱' },
  { tag: 'meals', label: 'Fresh Meals & Savory', icon: '🍔' },
  { tag: 'bestseller', label: 'Best Sellers', icon: '⭐' },
  { tag: 'signature', label: 'Signatures', icon: '👑' },
  { tag: 'bakery', label: 'Bakery', icon: '🥐' },
  { tag: 'sugar-free', label: 'Sugar-Free', icon: '🍯' }
];

window.DIETARY_FILTERS = [
  { key: 'vegan', label: 'Plant-Based', icon: '🌱', tip: '100% dairy-free & plant-powered' },
  { key: 'lowCaffeine', label: 'Decaf / Low-Caf', icon: '🌿', tip: 'Naturally low caffeine (<40mg) or decaf' },
  { key: 'fairTrade', label: 'Fair-Trade Certified', icon: '🌍', tip: 'Directly sourced from ethical farmer cooperatives' },
  { key: 'sugarFree', label: 'Sugar-Free', icon: '🍯', tip: 'Zero refined sugars or artificial syrups' },
  { key: 'nutFree', label: 'Nut-Free Safe', icon: '🥜', tip: 'Safe for tree nut and peanut allergies' }
];

window.BARISTA_NOTES = [
  "Today's beans arrived from Ethiopia. Expect floral sweetness and a citrus aroma — brew them light, drink them slow.",
  "Rain outside today, so we pulled the roast a touch darker. The Midnight Scholar tastes especially good against a grey window.",
  "We cupped six lots this morning. The Colombian Huila won — red plum, panela, a clean finish that lingers politely.",
  "New batch of oat milk steaming beautifully today. If you've never tried the Hazelnut Harmony with it, today's the day.",
  "The Guatemalan Antigua just came off the roaster an hour ago. Nutty, chocolatey, still warm from the drum.",
  "Slow Sunday energy in the café today. We recommend a Pour Over, a window seat, and no particular plan.",
  "Someone asked for 'something like sunshine' this morning, so we made the Golden Sunrise. It worked."
];

window.PRODUCTS = [
  // ---------- TIER 1 — Signature Collection ----------
  { id: 1, tier: 1, name: 'Espresso Royale', tags: ['bestseller', 'hot', 'signature', 'top-rated'], price: 260, rating: 4.9, cal: 15, caffeine: 'High', origin: 'Ethiopia · Guji', roast: 'Light-Medium', bean: 'Arabica', milk: 'None', notes: 'Dark chocolate, wild honey, toasted almond', pairing: 'Almond Biscotti', mood: 'Focused mornings', brew: 'Espresso machine · 25-second extraction', story: ['The first sip is bold.', 'The second reveals chocolate.', 'The third reminds you why mornings matter.'], desc: 'A double espresso pulled slow and poured proud.', img: img('espressoRoyale', 1000) },
  { id: 2, tier: 1, name: 'Artisan Latte', tags: ['bestseller', 'hot', 'latte', 'signature'], price: 280, rating: 4.9, cal: 190, caffeine: 'Medium', origin: 'Colombia · Huila', roast: 'Medium', bean: 'Arabica', milk: 'Whole milk', notes: 'Brown sugar, silk, toasted hazelnut', pairing: 'Butter Croissant', mood: 'Slow mornings', brew: 'Espresso + hand-steamed milk', story: ['Steamed until it forgets where the milk ends and the espresso begins.', 'Poured slow, for people who notice small things.'], desc: 'Our house latte, poured with a heart every time.', img: img('artisanLatte', 1000) },
  { id: 4, tier: 1, name: 'Irish Frappe', tags: ['cold', 'signature', 'bestseller'], price: 320, rating: 4.7, cal: 340, caffeine: 'Medium', origin: 'Vietnam · Da Lat', roast: 'Medium-Dark', bean: 'Robusta-Arabica blend', milk: 'Fresh cream', notes: 'Dark cocoa, vanilla cream, ice', pairing: 'Dark Chocolate Tart', mood: 'Warm afternoons', brew: 'Blended cold + whipped cream crown', story: ['Whipped, blended, and crowned with cream —', 'a cold ritual built for warm afternoons.'], desc: 'Blended cold coffee, whipped cream, chocolate shavings.', img: img('irishFrappeHero', 1000) },
  { id: 5, tier: 1, name: 'Matcha Bloom', tags: ['cold', 'matcha', 'signature'], price: 310, rating: 4.8, cal: 210, caffeine: 'Medium', origin: 'Japan · Uji', roast: 'Ceremonial grade', bean: 'Stone-ground matcha', milk: 'Oat milk', notes: 'Grassy matcha, oat milk, honey', pairing: 'Pistachio Financier', mood: 'Quiet renewal', brew: 'Whisked matcha over cold oat milk', story: ['Stone-ground matcha whisked into oat milk', 'until it turns the colour of spring.'], desc: 'Ceremonial-grade matcha, whisked to a soft green cloud.', img: img('matchaBloom', 1000) },
  { id: 6, tier: 1, name: 'Midnight Scholar', tags: ['hot', 'signature', 'bestseller'], price: 290, rating: 4.9, cal: 40, caffeine: 'Very High', origin: 'Dark roast blend', roast: 'Dark', bean: 'Robusta-Arabica', milk: 'None', notes: 'Dark cocoa, black pepper, molasses', pairing: 'Dark Chocolate Cookie', mood: 'Late-night focus', brew: 'Double ristretto, no sugar', story: ['Crafted for students chasing', 'impossible dreams after midnight.'], desc: 'A double ristretto with nowhere else to be.', img: img('midnightScholar', 1000) },
  { id: 8, tier: 1, name: 'The Focus Pour', tags: ['hot', 'bestseller', 'signature', 'top-rated'], price: 260, rating: 4.9, cal: 20, caffeine: 'High', origin: 'Ethiopia · Yirgacheffe', roast: 'Light', bean: 'Arabica', milk: 'None', notes: 'Orange zest, jasmine, clean acidity', pairing: 'Rye Crackers', mood: 'Deep work', brew: 'Pour-over, no sugar', story: ['Double espresso, oat milk, orange zest —', 'because your brain deserves a clean runway.'], desc: 'Clean, bright, and built for momentum.', img: img('focusPour', 1000) },

  // ---------- TIER 2 — Premium Collection ----------
  { id: 12, tier: 2, name: 'Flat White', tags: ['hot', 'latte', 'top-rated'], price: 250, rating: 4.7, cal: 160, caffeine: 'Medium', origin: 'Colombia', roast: 'Medium', bean: 'Arabica', milk: 'Whole milk', notes: 'Caramel, toasted nut', pairing: 'Almond Croissant', desc: 'Velvet micro-foam over a double ristretto.', img: img('flatwhite1') },
  { id: 13, tier: 2, name: 'Cappuccino', tags: ['hot', 'bestseller'], price: 240, rating: 4.6, cal: 120, caffeine: 'Medium', origin: 'Brazil', roast: 'Medium', bean: 'Arabica', milk: 'Whole milk', notes: 'Cocoa dust, warm milk', pairing: 'Biscotti', desc: 'Equal thirds espresso, milk, and foam — the classic, done properly.', img: img('cappuccino1') },
  { id: 14, tier: 2, name: 'Mocha', tags: ['hot', 'chocolate', 'bestseller'], price: 280, rating: 4.7, cal: 290, caffeine: 'Medium', origin: 'Guatemala', roast: 'Medium-Dark', bean: 'Arabica', milk: 'Whole milk', notes: 'Dark chocolate, vanilla', pairing: 'Chocolate Brownie', desc: 'Espresso meets dark chocolate meets steamed milk.', img: img('mocha1') },
  { id: 26, tier: 2, name: 'Cold Brew', tags: ['cold', 'bestseller'], price: 240, rating: 4.6, cal: 10, caffeine: 'High', origin: 'Colombia', roast: 'Medium', bean: 'Arabica', milk: 'None', notes: 'Dark chocolate, caramel', pairing: 'Butter Biscuit', desc: 'Steeped slow for 18 hours — smooth, low-acid, quietly strong.', img: img('coldbrew2') },
  { id: 29, tier: 2, name: 'Pour Over', tags: ['hot', 'top-rated'], price: 280, rating: 4.7, cal: 5, caffeine: 'Medium', origin: 'Rotating single-origin', roast: 'Light', bean: 'Arabica', milk: 'None', notes: 'Seasonal single-origin notes', pairing: 'Plain Scone', desc: 'Single-origin, brewed by hand, one cup at a time.', img: img('pourover1') },
  { id: 34, tier: 2, name: 'Salted Caramel Latte', tags: ['hot', 'latte', 'top-rated'], price: 300, rating: 4.7, cal: 280, caffeine: 'Medium', origin: 'Brazil', roast: 'Medium', bean: 'Arabica', milk: 'Whole milk', notes: 'Salted caramel, cream', pairing: 'Salted Caramel Brownie', desc: 'Caramel and sea salt, folded into steamed milk.', img: img('latte1') },

  // ---------- TIER 3 — Classic Collection ----------
  { id: 38, tier: 3, name: 'Butter Croissant', tags: ['bakery', 'bestseller'], price: 150, rating: 4.6, cal: 280, ingredients: 'Butter, flour, yeast, salt', desc: 'Laminated 27 times, baked until it shatters.', img: img('bakery1') },
  { id: 45, tier: 3, name: 'Basque Cheesecake', tags: ['dessert', 'bestseller', 'top-rated'], price: 260, rating: 4.8, cal: 410, ingredients: 'Cream cheese, eggs, sugar, cream', desc: 'Burnt top, cloud-soft center — no crust needed.', img: img('dessert1') },
  { id: 53, tier: 3, name: 'Avocado Toast', tags: ['healthy'], price: 250, rating: 4.5, cal: 320, ingredients: 'Sourdough, avocado, chili flakes, lemon', desc: 'Sourdough, smashed avocado, chili flakes, lemon.', img: img('healthy1') },
  { id: 56, tier: 3, name: 'Vegan Banana Bread', tags: ['vegan', 'bakery', 'healthy'], price: 180, rating: 4.5, cal: 260, ingredients: 'Banana, oat flour, plant butter', desc: 'Plant-based, moist, barely sweet — the good kind of virtuous.', img: img('bakery2') },
];

// Enrich products with exact dietary flags and caffeineMg for Ethical AI & Wellness features
window.PRODUCTS.forEach(p => {
  const isFood = p.tier === 3;
  const milkStr = (p.milk || '').toLowerCase();
  const descStr = ((p.desc || '') + ' ' + (p.notes || '') + ' ' + (p.ingredients || '')).toLowerCase();
  const nameStr = p.name.toLowerCase();

  // Estimate caffeine in mg
  let mg = 0;
  if (!isFood) {
    if (nameStr.includes('midnight') || nameStr.includes('nitro')) mg = 200;
    else if (nameStr.includes('double') || nameStr.includes('espresso') || nameStr.includes('focus')) mg = 150;
    else if (nameStr.includes('cold brew')) mg = 165;
    else if (nameStr.includes('matcha')) mg = 45;
    else if (nameStr.includes('frappe')) mg = 65;
    else if (p.caffeine === 'Very High') mg = 210;
    else if (p.caffeine === 'High') mg = 150;
    else if (p.caffeine === 'Low') mg = 35;
    else mg = 85; // Medium default
  }
  p.caffeineMg = mg;

  // Dietary tags
  const isVegan = p.tags.includes('vegan') || milkStr === 'none' || milkStr.includes('oat') || nameStr.includes('avocado') || nameStr.includes('granola') || (isFood && !descStr.includes('butter') && !descStr.includes('egg') && !descStr.includes('cheese') && !descStr.includes('turkey') && !descStr.includes('bacon'));
  const isLowCaf = mg <= 50;
  const isFairTrade = !isFood && Boolean(p.origin && !p.origin.includes('Dark roast'));
  const isSugarFree = (p.cal && p.cal <= 45 && !descStr.includes('caramel') && !descStr.includes('syrup') && !descStr.includes('condensed')) || (milkStr === 'none' && !descStr.includes('honey'));
  const isNutFree = !descStr.includes('almond') && !descStr.includes('hazelnut') && !descStr.includes('walnut') && !descStr.includes('pistachio') && !nameStr.includes('hazelnut') && !nameStr.includes('almond');

  p.dietary = {
    vegan: isVegan,
    lowCaffeine: isLowCaf,
    fairTrade: isFairTrade,
    sugarFree: isSugarFree,
    nutFree: isNutFree
  };
});
