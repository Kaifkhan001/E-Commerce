// GraphQL query fragments/documents for Shopify Storefront API 2026-04.
// Kept separate from products.ts/collections.ts so the query text is easy
// to audit against Shopify's schema independent of normalization logic.

const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on Product {
    id
    handle
    title
    availableForSale
    tags
    featuredImage {
      ...ImageFields
    }
    images(first: 2) {
      nodes {
        ...ImageFields
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyFields
      }
      maxVariantPrice {
        ...MoneyFields
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyFields
      }
      maxVariantPrice {
        ...MoneyFields
      }
    }
  }
`;

// Bag specs are expected to live in a "bag" metafield namespace once set up
// in Shopify admin (Settings > Custom data > Products). Adjust the
// namespace/key list here as the store's metafield schema is finalized.
const BAG_SPEC_METAFIELDS = /* GraphQL */ `
  capacityLiters: metafield(namespace: "bag", key: "capacity_liters") { value }
  material: metafield(namespace: "bag", key: "material") { value }
  weightGrams: metafield(namespace: "bag", key: "weight_grams") { value }
  dimensions: metafield(namespace: "bag", key: "dimensions") { value }
  laptopCompatibility: metafield(namespace: "bag", key: "laptop_compatibility") { value }
  waterResistance: metafield(namespace: "bag", key: "water_resistance") { value }
  care: metafield(namespace: "bag", key: "care") { value }
  warranty: metafield(namespace: "bag", key: "warranty") { value }
  features: metafield(namespace: "bag", key: "features") { value }
  useCases: metafield(namespace: "bag", key: "use_cases") { value }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...ProductCardFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      tags
      vendor
      productType
      featuredImage {
        ...ImageFields
      }
      images(first: 10) {
        nodes {
          ...ImageFields
        }
      }
      priceRange {
        minVariantPrice {
          ...MoneyFields
        }
        maxVariantPrice {
          ...MoneyFields
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          ...MoneyFields
        }
        maxVariantPrice {
          ...MoneyFields
        }
      }
      options {
        name
        values
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          price {
            ...MoneyFields
          }
          compareAtPrice {
            ...MoneyFields
          }
          selectedOptions {
            name
            value
          }
          image {
            ...ImageFields
          }
        }
      }
      ${BAG_SPEC_METAFIELDS}
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  query Collections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
        image {
          ...ImageFields
        }
      }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        ...ImageFields
      }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          ...ProductCardFields
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: PRODUCT) {
      nodes {
        ... on Product {
          ...ProductCardFields
        }
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        ...MoneyFields
      }
      totalAmount {
        ...MoneyFields
      }
      totalTaxAmount {
        ...MoneyFields
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            ...MoneyFields
          }
          amountPerQuantity {
            ...MoneyFields
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions {
              name
              value
            }
            product {
              handle
              title
              featuredImage {
                ...ImageFields
              }
            }
          }
        }
      }
    }
  }
  query GetCart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;
