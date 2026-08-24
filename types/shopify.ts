// Domain types used across the app. These are intentionally decoupled from
// Shopify's raw GraphQL response shapes — lib/shopify/*.ts normalizes real
// Storefront API responses (and mock data) into this shape, so components
// never need to know whether they're rendering mock or live data.

export type Money = {
  amount: string; // decimal string, e.g. "2499.00"
  currencyCode: string; // e.g. "INR"
};

export type ProductImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductOption = {
  name: string; // e.g. "Color"
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
  image: ProductImage | null;
};

// Bag-specific specifications. Every field is optional — only render what's
// actually present. Populated from Shopify metafields in live mode; from
// mock data in mock mode. Never invent values for these.
export type BagSpecs = {
  capacityLiters?: number;
  material?: string;
  weightGrams?: number;
  dimensions?: string; // e.g. "45 x 30 x 20 cm"
  laptopCompatibility?: string; // e.g. "Fits up to 16-inch laptops"
  waterResistance?: string; // e.g. "Water-resistant shell (not waterproof)"
  care?: string;
  warranty?: string;
  features?: string[];
  useCases?: string[]; // "Work", "Travel", "College", "Everyday", "Gym", "Weekend", "Camera"
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ProductImage | null;
  images: ProductImage[];
  priceRange: { min: Money; max: Money };
  compareAtPriceRange: { min: Money; max: Money } | null;
  options: ProductOption[];
  variants: ProductVariant[];
  availableForSale: boolean;
  tags: string[];
  vendor: string;
  productType: string;
  specs: BagSpecs;
};

export type ProductCardData = Pick<
  Product,
  | "id"
  | "handle"
  | "title"
  | "featuredImage"
  | "priceRange"
  | "compareAtPriceRange"
  | "availableForSale"
  | "tags"
> & { secondaryImage?: ProductImage | null };

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ProductImage | null;
  products: ProductCardData[];
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string; // variant id
    title: string;
    product: {
      handle: string;
      title: string;
      featuredImage: ProductImage | null;
    };
    selectedOptions: { name: string; value: string }[];
  };
  cost: {
    totalAmount: Money;
    amountPerQuantity: Money;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
};

export type SearchResult = {
  products: ProductCardData[];
  query: string;
};
