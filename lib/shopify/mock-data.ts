import type { Cart, Collection, Product, ProductCardData } from "@/types/shopify";

// Real, verified Unsplash photos (free Unsplash License — not Unsplash+/premium)
// used as interim bag photography for products with no matching real photo yet
// (Atlas Work Tote, Transit Gym Duffel, Lumen Camera Sling, Everyday Crossbody,
// and the New Arrivals / Work collections). Voyager Travel Backpack, Campus
// Daypack, and the Best Sellers / Travel / All Bags collections now use real
// photos from /public/images (only backpack-shaped real photos were available).
function unsplash(id: string, w = 1200, h = 1500) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

const IMG = unsplash;

function money(amount: string, currencyCode = "INR") {
  return { amount, currencyCode };
}

const products: Product[] = [
  {
    id: "gid://mock/Product/1",
    handle: "voyager-travel-backpack",
    title: "Voyager Travel Backpack",
    description:
      "A carry-on-friendly travel backpack built for multi-day trips, with a padded 16\" laptop sleeve and a dedicated shoe compartment.",
    descriptionHtml:
      "<p>A carry-on-friendly travel backpack built for multi-day trips, with a padded 16\" laptop sleeve and a dedicated shoe compartment.</p>",
    featuredImage: { url: "/images/Product-Image-06.jpeg", altText: "Navy backpack with a black leather-trim zip pocket, front view", width: 736, height: 920 },
    images: [
      { url: "/images/Product-Image-06.jpeg", altText: "Navy backpack with a black leather-trim zip pocket, front view", width: 736, height: 920 },
      { url: "/images/Product-Image-03.jpeg", altText: "Sand-beige backpack on a warm neutral background, side view", width: 736, height: 1104 },
      { url: "/images/Product-Image-02.jpeg", altText: "Open backpack showing interior organizer pockets and travel gear", width: 736, height: 1040 },
    ],
    priceRange: { min: money("6499.00"), max: money("6499.00") },
    compareAtPriceRange: { min: money("7999.00"), max: money("7999.00") },
    options: [{ name: "Color", values: ["Charcoal", "Sand"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/1-charcoal",
        title: "Charcoal",
        availableForSale: true,
        quantityAvailable: 24,
        price: money("6499.00"),
        compareAtPrice: money("7999.00"),
        selectedOptions: [{ name: "Color", value: "Charcoal" }],
        image: { url: "/images/Product-Image-06.jpeg", altText: "Charcoal", width: 736, height: 920 },
      },
      {
        id: "gid://mock/ProductVariant/1-sand",
        title: "Sand",
        availableForSale: true,
        quantityAvailable: 9,
        price: money("6499.00"),
        compareAtPrice: money("7999.00"),
        selectedOptions: [{ name: "Color", value: "Sand" }],
        image: { url: "/images/Product-Image-03.jpeg", altText: "Sand", width: 736, height: 1104 },
      },
    ],
    availableForSale: true,
    tags: ["travel", "bestseller"],
    vendor: "Aramis Bags",
    productType: "Backpack",
    specs: {
      capacityLiters: 32,
      material: "600D recycled polyester",
      weightGrams: 1150,
      dimensions: "50 x 33 x 22 cm",
      laptopCompatibility: "Fits up to 16-inch laptops",
      waterResistance: "Water-resistant shell (not waterproof)",
      care: "Wipe clean with a damp cloth. Do not machine wash.",
      warranty: "2-year manufacturer warranty",
      features: ["Carry-on friendly", "Dedicated shoe compartment", "Trolley strap", "Lockable zippers"],
      useCases: ["Travel", "Weekend"],
    },
  },
  {
    id: "gid://mock/Product/2",
    handle: "atlas-work-tote",
    title: "Atlas Work Tote",
    description: "A structured work tote with a padded 14\" laptop compartment, designed for daily commuting.",
    descriptionHtml: "<p>A structured work tote with a padded 14\" laptop compartment, designed for daily commuting.</p>",
    featuredImage: { url: IMG("1567744875520-cf9c27fbb53b"), altText: "Atlas Work Tote, front view", width: 1200, height: 1500 },
    images: [
      { url: IMG("1567744875520-cf9c27fbb53b"), altText: "Atlas Work Tote, front view", width: 1200, height: 1500 },
      { url: IMG("1605733513597-a8f8341084e6"), altText: "Atlas Work Tote, interior", width: 1200, height: 1500 },
    ],
    priceRange: { min: money("4299.00"), max: money("4299.00") },
    compareAtPriceRange: null,
    options: [{ name: "Color", values: ["Espresso"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/2-espresso",
        title: "Espresso",
        availableForSale: true,
        quantityAvailable: 41,
        price: money("4299.00"),
        compareAtPrice: null,
        selectedOptions: [{ name: "Color", value: "Espresso" }],
        image: { url: IMG("1567744875520-cf9c27fbb53b"), altText: "Espresso", width: 1200, height: 1500 },
      },
    ],
    availableForSale: true,
    tags: ["work", "new"],
    vendor: "Aramis Bags",
    productType: "Tote",
    specs: {
      capacityLiters: 18,
      material: "Full-grain leather",
      weightGrams: 980,
      dimensions: "38 x 28 x 14 cm",
      laptopCompatibility: "Fits up to 14-inch laptops",
      care: "Condition leather every 3-6 months.",
      warranty: "1-year manufacturer warranty",
      features: ["Trolley strap", "Interior organizer panel", "Magnetic closure"],
      useCases: ["Work", "Everyday"],
    },
  },
  {
    id: "gid://mock/Product/3",
    handle: "campus-daypack",
    title: "Campus Daypack",
    description: "A lightweight everyday daypack sized for textbooks, a laptop, and a full day on campus.",
    descriptionHtml: "<p>A lightweight everyday daypack sized for textbooks, a laptop, and a full day on campus.</p>",
    featuredImage: { url: "/images/Product-Image-07.jpeg", altText: "Dark olive backpack with structured front pockets and black hardware, front view", width: 736, height: 920 },
    images: [
      { url: "/images/Product-Image-07.jpeg", altText: "Dark olive backpack with structured front pockets and black hardware, front view", width: 736, height: 920 },
      { url: "/images/Product-Image-01.jpeg", altText: "Charcoal-grey backpack with a structured flap and metal buckles, styled shot", width: 735, height: 1105 },
    ],
    priceRange: { min: money("2799.00"), max: money("2799.00") },
    compareAtPriceRange: { min: money("3299.00"), max: money("3299.00") },
    options: [{ name: "Color", values: ["Forest", "Black", "Stone"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/3-forest",
        title: "Forest",
        availableForSale: true,
        quantityAvailable: 15,
        price: money("2799.00"),
        compareAtPrice: money("3299.00"),
        selectedOptions: [{ name: "Color", value: "Forest" }],
        image: { url: "/images/Product-Image-07.jpeg", altText: "Forest", width: 736, height: 920 },
      },
      {
        id: "gid://mock/ProductVariant/3-black",
        title: "Black",
        availableForSale: true,
        quantityAvailable: 30,
        price: money("2799.00"),
        compareAtPrice: money("3299.00"),
        selectedOptions: [{ name: "Color", value: "Black" }],
        image: { url: "/images/Product-Image-01.jpeg", altText: "Black", width: 735, height: 1105 },
      },
      {
        id: "gid://mock/ProductVariant/3-stone",
        title: "Stone",
        availableForSale: false,
        quantityAvailable: 0,
        price: money("2799.00"),
        compareAtPrice: money("3299.00"),
        selectedOptions: [{ name: "Color", value: "Stone" }],
        image: { url: "/images/Product-Image-07.jpeg", altText: "Stone", width: 736, height: 920 },
      },
    ],
    availableForSale: true,
    tags: ["college", "bestseller", "sale"],
    vendor: "Aramis Bags",
    productType: "Backpack",
    specs: {
      capacityLiters: 22,
      material: "Ripstop nylon",
      weightGrams: 620,
      dimensions: "44 x 30 x 16 cm",
      laptopCompatibility: "Fits up to 15-inch laptops",
      care: "Machine washable on gentle cycle.",
      features: ["Side water bottle pockets", "Hidden back pocket"],
      useCases: ["College", "Everyday"],
    },
  },
  {
    id: "gid://mock/Product/4",
    handle: "transit-gym-duffel",
    title: "Transit Gym Duffel",
    description: "A compact gym duffel with a ventilated shoe pocket and a separate wet-gear compartment.",
    descriptionHtml: "<p>A compact gym duffel with a ventilated shoe pocket and a separate wet-gear compartment.</p>",
    featuredImage: { url: IMG("1448582649076-3981753123b5"), altText: "Transit Gym Duffel, front view", width: 1200, height: 1500 },
    images: [{ url: IMG("1448582649076-3981753123b5"), altText: "Transit Gym Duffel, front view", width: 1200, height: 1500 }],
    priceRange: { min: money("2199.00"), max: money("2199.00") },
    compareAtPriceRange: null,
    options: [{ name: "Color", values: ["Black"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/4-black",
        title: "Black",
        availableForSale: true,
        quantityAvailable: 60,
        price: money("2199.00"),
        compareAtPrice: null,
        selectedOptions: [{ name: "Color", value: "Black" }],
        image: { url: IMG("1448582649076-3981753123b5"), altText: "Black", width: 1200, height: 1500 },
      },
    ],
    availableForSale: true,
    tags: ["gym", "new"],
    vendor: "Aramis Bags",
    productType: "Duffel",
    specs: {
      capacityLiters: 28,
      material: "Water-resistant canvas",
      weightGrams: 540,
      dimensions: "52 x 26 x 24 cm",
      waterResistance: "Water-resistant base panel",
      care: "Spot clean only.",
      features: ["Ventilated shoe pocket", "Wet-gear compartment", "Adjustable shoulder strap"],
      useCases: ["Gym", "Weekend"],
    },
  },
  {
    id: "gid://mock/Product/5",
    handle: "lumen-camera-sling",
    title: "Lumen Camera Sling",
    description: "A weather-resistant camera sling with customizable dividers, built for mirrorless kits.",
    descriptionHtml: "<p>A weather-resistant camera sling with customizable dividers, built for mirrorless kits.</p>",
    featuredImage: { url: IMG("1622560480654-d96214fdc887"), altText: "Lumen Camera Sling, front view", width: 1200, height: 1500 },
    images: [{ url: IMG("1622560480654-d96214fdc887"), altText: "Lumen Camera Sling, front view", width: 1200, height: 1500 }],
    priceRange: { min: money("3999.00"), max: money("3999.00") },
    compareAtPriceRange: null,
    options: [{ name: "Color", values: ["Olive"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/5-olive",
        title: "Olive",
        availableForSale: true,
        quantityAvailable: 12,
        price: money("3999.00"),
        compareAtPrice: null,
        selectedOptions: [{ name: "Color", value: "Olive" }],
        image: { url: IMG("1622560480654-d96214fdc887"), altText: "Olive", width: 1200, height: 1500 },
      },
    ],
    availableForSale: true,
    tags: ["camera"],
    vendor: "Aramis Bags",
    productType: "Sling",
    specs: {
      capacityLiters: 8,
      material: "400D nylon, YKK zippers",
      weightGrams: 480,
      dimensions: "26 x 18 x 12 cm",
      waterResistance: "Weather-resistant coated fabric",
      features: ["Customizable dividers", "Quick-access side opening", "Tripod strap"],
      useCases: ["Camera", "Everyday"],
    },
  },
  {
    id: "gid://mock/Product/6",
    handle: "everyday-crossbody",
    title: "Everyday Crossbody",
    description: "A minimal crossbody bag sized for the essentials — phone, cards, keys, and a compact charger.",
    descriptionHtml: "<p>A minimal crossbody bag sized for the essentials — phone, cards, keys, and a compact charger.</p>",
    featuredImage: { url: IMG("1595326995002-3c708e5caed7"), altText: "Everyday Crossbody, front view", width: 1200, height: 1500 },
    images: [{ url: IMG("1595326995002-3c708e5caed7"), altText: "Everyday Crossbody, front view", width: 1200, height: 1500 }],
    priceRange: { min: money("1599.00"), max: money("1599.00") },
    compareAtPriceRange: { min: money("1899.00"), max: money("1899.00") },
    options: [{ name: "Color", values: ["Sand", "Black"] }],
    variants: [
      {
        id: "gid://mock/ProductVariant/6-sand",
        title: "Sand",
        availableForSale: true,
        quantityAvailable: 50,
        price: money("1599.00"),
        compareAtPrice: money("1899.00"),
        selectedOptions: [{ name: "Color", value: "Sand" }],
        image: { url: IMG("1595326995002-3c708e5caed7"), altText: "Sand", width: 1200, height: 1500 },
      },
    ],
    availableForSale: true,
    tags: ["everyday", "sale"],
    vendor: "Aramis Bags",
    productType: "Crossbody",
    specs: {
      capacityLiters: 3,
      material: "Vegan leather",
      weightGrams: 260,
      dimensions: "20 x 15 x 6 cm",
      care: "Wipe clean with a damp cloth.",
      useCases: ["Everyday"],
    },
  },
];

const collections: Collection[] = [
  {
    id: "gid://mock/Collection/1",
    handle: "new-arrivals",
    title: "New Arrivals",
    description: "The latest additions to the collection.",
    image: { url: IMG("1501555088652-021faa106b9b"), altText: "New Arrivals", width: 1600, height: 900 },
    products: products.filter((p) => p.tags.includes("new")).map(toCard),
  },
  {
    id: "gid://mock/Collection/2",
    handle: "best-sellers",
    title: "Best Sellers",
    description: "The bags our customers reach for most.",
    image: { url: "/images/Product-Image-06.jpeg", altText: "Navy backpack with a black leather-trim zip pocket", width: 736, height: 920 },
    products: products.filter((p) => p.tags.includes("bestseller")).map(toCard),
  },
  {
    id: "gid://mock/Collection/3",
    handle: "travel",
    title: "Travel",
    description: "Built for the road, the terminal, and everywhere between.",
    image: { url: "/images/Product-Image-02.jpeg", altText: "Open backpack packed with travel gear", width: 736, height: 1040 },
    products: products.filter((p) => p.specs.useCases?.includes("Travel")).map(toCard),
  },
  {
    id: "gid://mock/Collection/4",
    handle: "work",
    title: "Work",
    description: "Structured, laptop-ready bags for the commute.",
    image: { url: IMG("1567744875520-cf9c27fbb53b"), altText: "Work", width: 1600, height: 900 },
    products: products.filter((p) => p.specs.useCases?.includes("Work")).map(toCard),
  },
  {
    id: "gid://mock/Collection/5",
    handle: "all-bags",
    title: "All Bags",
    description: "The full collection.",
    image: { url: "/images/Product-Image-01.jpeg", altText: "Charcoal-grey backpack with a structured flap and metal buckles", width: 735, height: 1105 },
    products: products.map(toCard),
  },
];

function toCard(p: Product): ProductCardData {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    featuredImage: p.featuredImage,
    secondaryImage: p.images[1] ?? null,
    priceRange: p.priceRange,
    compareAtPriceRange: p.compareAtPriceRange,
    availableForSale: p.availableForSale,
    tags: p.tags,
  };
}

export const mockDb = {
  products,
  collections,
};

// --- In-memory mock cart (per server process — fine for local/demo use) ---
const mockCarts = new Map<string, Cart>();

export function mockCreateCart(): Cart {
  const id = `gid://mock/Cart/${crypto.randomUUID()}`;
  const cart: Cart = {
    id,
    checkoutUrl: `/cart?mockCheckout=1&cart=${encodeURIComponent(id)}`,
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: money("0.00"),
      totalAmount: money("0.00"),
      totalTaxAmount: null,
    },
  };
  mockCarts.set(id, cart);
  return cart;
}

export function mockGetCart(id: string): Cart | null {
  return mockCarts.get(id) ?? null;
}

function recalc(cart: Cart) {
  cart.totalQuantity = cart.lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = cart.lines.reduce((sum, l) => sum + Number(l.cost.totalAmount.amount), 0);
  cart.cost.subtotalAmount = money(subtotal.toFixed(2));
  cart.cost.totalAmount = money(subtotal.toFixed(2));
}

export function mockAddLine(cartId: string, variantId: string, quantity: number): Cart {
  const cart = mockCarts.get(cartId) ?? mockCreateCart();
  const variant = products.flatMap((p) => p.variants.map((v) => ({ v, p }))).find((x) => x.v.id === variantId);
  if (!variant) throw new Error(`Unknown variant: ${variantId}`);

  const existing = cart.lines.find((l) => l.merchandise.id === variantId);
  if (existing) {
    existing.quantity += quantity;
    existing.cost.totalAmount = money((Number(variant.v.price.amount) * existing.quantity).toFixed(2));
  } else {
    cart.lines.push({
      id: `gid://mock/CartLine/${crypto.randomUUID()}`,
      quantity,
      merchandise: {
        id: variant.v.id,
        title: variant.v.title,
        product: {
          handle: variant.p.handle,
          title: variant.p.title,
          featuredImage: variant.p.featuredImage,
        },
        selectedOptions: variant.v.selectedOptions,
      },
      cost: {
        totalAmount: money((Number(variant.v.price.amount) * quantity).toFixed(2)),
        amountPerQuantity: variant.v.price,
      },
    });
  }
  recalc(cart);
  mockCarts.set(cartId, cart);
  return cart;
}

export function mockUpdateLine(cartId: string, lineId: string, quantity: number): Cart {
  const cart = mockCarts.get(cartId);
  if (!cart) throw new Error(`Unknown cart: ${cartId}`);
  const line = cart.lines.find((l) => l.id === lineId);
  if (!line) throw new Error(`Unknown line: ${lineId}`);
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.id !== lineId);
  } else {
    line.quantity = quantity;
    line.cost.totalAmount = money((Number(line.cost.amountPerQuantity.amount) * quantity).toFixed(2));
  }
  recalc(cart);
  mockCarts.set(cartId, cart);
  return cart;
}

export function mockRemoveLine(cartId: string, lineId: string): Cart {
  return mockUpdateLine(cartId, lineId, 0);
}
