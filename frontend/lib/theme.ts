import type { ThemeSettings, StorefrontSection } from "@/types";

/** Default storefront sections, in render order. */
export const defaultSections: StorefrontSection[] = [
  { id: "s-promobar", type: "PromoBar", enabled: true },
  { id: "s-hero", type: "Hero", enabled: true },
  { id: "s-hot", type: "ProductGrid", enabled: true, config: { title: "Hot Items", category: "All", limit: 8 } },
  { id: "s-collection-1", type: "Collection", enabled: true, config: { title: "Basics Collection", category: "All" } },
  { id: "s-promotiles", type: "PromoTiles", enabled: true },
  { id: "s-collection-2", type: "Collection", enabled: true, config: { title: "Featured Collection", category: "All" } },
  { id: "s-newsletter", type: "Newsletter", enabled: true },
  { id: "s-footer", type: "Footer", enabled: true },
];

export const defaultTheme: ThemeSettings = {
  preset: "default",
  brandName: "Your Store",
  logoUrl: undefined,
  colors: {
    background: "#0b0e14",
    surface: "#141923",
    accent: "#14b8c4",
    accentAlt: "#7a1f2b",
    text: "#f1f5f9",
    muted: "#94a3b8",
    headerBg: "#141923",
    headerText: "#f1f5f9",
    promoBarBg: "#14b8c4",
    promoBarText: "#0b0e14",
  },
  promoBar: { enabled: true, text: "Free shipping on orders over Rp 500.000" },
  nav: ["All Products", "Team Kit", "Collections", "Exclusive", "Collabs"],
  currency: "IDR",
  hero: {
    eyebrow: "New Season",
    title: "2026 / 27 Collection",
    subtitle: "Gear up with the latest drop. Limited stock available now.",
    ctaLabel: "Shop the Drop",
    ctaHref: "#hot-items",
    imageUrl: undefined,
  },
  collections: [
    { title: "Hot Items", category: "All" },
    { title: "Basics Collection", category: "All" },
  ],
  promoTiles: [
    { title: "Gift Ideas", subtitle: "Find the perfect present", href: "#" },
    { title: "Loyalty Club", subtitle: "Earn points on every order", href: "#" },
  ],
  newsletter: {
    enabled: true,
    headline: "Join the club",
    offer: "Get 10% off your first order",
  },
  footer: {
    about: "Official merchandise store. Quality apparel and accessories shipped nationwide.",
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  sections: defaultSections,
  buttons: {
    borderRadius: "rounded-md",
    style: "solid",
    fontWeight: "semibold",
    hoverEffect: "zoom",
  },
};

export const pprxTheme: ThemeSettings = {
  preset: "pprx",
  brandName: "Paper Rex Shop",
  logoUrl: undefined,
  colors: {
    background: "#0d0d0d",
    surface: "#1a1a1a",
    accent: "#e4ff00",
    accentAlt: "#ff0099",
    text: "#ffffff",
    muted: "#a0a0a0",
    headerBg: "#0d0d0d",
    headerText: "#ffffff",
    promoBarBg: "#ff0099",
    promoBarText: "#000000",
  },
  promoBar: { enabled: true, text: "FREE WORLDWIDE SHIPPING ON ORDERS OVER SGD $100 • WGAMING • OFFICIAL MERCHANDISE" },
  nav: ["All Products", "Team Kit", "PRX Accessories", "Sale"],
  currency: "SGD",
  hero: {
    eyebrow: "NEW RELEASES",
    title: "WGAMING 2025",
    subtitle: "Official merchandise store for Paper Rex™. Gear up with the latest VCT drop.",
    ctaLabel: "SHOP ALL",
    ctaHref: "#",
  },
  collections: [
    { title: "Bestsellers", category: "All" },
    { title: "New Arrivals", category: "All" },
  ],
  promoTiles: [
    { title: "Official Jersey", subtitle: "Match ready apparel", href: "#" },
    { title: "Accessories", subtitle: "Complete your setup", href: "#" },
  ],
  newsletter: {
    enabled: true,
    headline: "JOIN THE REX FAMILY",
    offer: "Sign up to get the latest on sales, new releases and more.",
  },
  footer: {
    about: "Paper Rex™ is a Southeast Asian esports organization based in Singapore. Official merchandise store.",
    socials: [
      { label: "Twitter", href: "https://x.com/pprxteam" },
      { label: "Instagram", href: "https://instagram.com/pprxteam" },
      { label: "YouTube", href: "https://youtube.com/pprxteam" },
    ],
  },
  sections: [
    { id: "s-promobar", type: "PromoBar", enabled: true },
    { id: "s-hero", type: "Hero", enabled: true },
    { id: "s-hot", type: "ProductGrid", enabled: true, config: { title: "Bestsellers", category: "All", limit: 8 } },
    { id: "s-newsletter", type: "Newsletter", enabled: true },
    { id: "s-footer", type: "Footer", enabled: true },
  ],
  buttons: {
    borderRadius: "rounded-full",
    style: "gradient",
    fontWeight: "black",
    hoverEffect: "both",
  },
};

export const sectionLabels: Record<StorefrontSection["type"], string> = {
  PromoBar: "Promo Bar",
  Hero: "Hero Banner",
  ProductGrid: "Product Grid",
  Collection: "Collection Row",
  PromoTiles: "Promo Tiles",
  Newsletter: "Newsletter",
  Footer: "Footer",
};
