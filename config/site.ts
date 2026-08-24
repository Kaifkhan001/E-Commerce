// Central place for demo navigation/footer/business content.
// Replace with real business details before launch — see README "Content
// checklist before launch".

export const siteConfig = {
  name: "Aramis Bags",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  tagline: "Bags built to be carried, not just bought.",
  description:
    "Aramis Bags designs and manufactures backpacks, totes, and travel bags for people who move through their day carrying real things.",
  // Demo contact/business details — placeholders, not real registered info.
  contactEmail: "hello@example.com",
  supportPhone: "+91 00000 00000",
  address: "Placeholder Address Line, City, State, PIN — update before launch",
};

export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

export const footerNav = {
  shop: [
    { label: "All Bags", href: "/shop" },
    { label: "New Arrivals", href: "/collections/new-arrivals" },
    { label: "Best Sellers", href: "/collections/best-sellers" },
    { label: "Travel", href: "/collections/travel" },
    { label: "Work", href: "/collections/work" },
  ],
  help: [
    { label: "Bag Finder", href: "/bag-finder" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns & Exchanges", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
  ],
  about: [
    { label: "Our Story", href: "/about" },
    { label: "Craftsmanship", href: "/about#craftsmanship" },
  ],
  policies: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
  ],
};

export const shopByPurpose = [
  { label: "Work", href: "/shop?purpose=Work" },
  { label: "Travel", href: "/shop?purpose=Travel" },
  { label: "College", href: "/shop?purpose=College" },
  { label: "Everyday", href: "/shop?purpose=Everyday" },
  { label: "Gym", href: "/shop?purpose=Gym" },
  { label: "Weekend", href: "/shop?purpose=Weekend" },
  { label: "Camera", href: "/shop?purpose=Camera" },
];

export const shopByCapacity = [
  { label: "Small (under 10L)", href: "/shop?capacity=small", max: 10 },
  { label: "10–15L", href: "/shop?capacity=10-15", min: 10, max: 15 },
  { label: "15–25L", href: "/shop?capacity=15-25", min: 15, max: 25 },
  { label: "25–35L", href: "/shop?capacity=25-35", min: 25, max: 35 },
  { label: "35L+", href: "/shop?capacity=35plus", min: 35 },
];
