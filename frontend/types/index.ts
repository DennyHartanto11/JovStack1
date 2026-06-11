export type Role = "Owner" | "Admin" | "Editor" | "Viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  avatarColor: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  sentAt: string;
  status: "Pending" | "Accepted" | "Expired";
}

export type PublicationState = "Live" | "Offline";

export interface Website {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  state: PublicationState;
  pages: number;
  updatedAt: string;
  /** Vanity domain shown as a label, e.g. `tokobudi.jovstack.app`. */
  domain?: string;
  /** Actually-openable URL, e.g. `http://localhost:4000/site/tokobudi`. */
  url?: string;
}

export type BlockType =
  | "Hero"
  | "Features"
  | "Gallery"
  | "Product"
  | "FAQ"
  | "Contact"
  | "Footer";

export interface Block {
  id: string;
  type: BlockType;
  title: string;
}

export interface Page {
  id: string;
  name: string;
  blocks: Block[];
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: "Logo" | "Banner" | "Product" | "Gallery";
  size: string;
  uploadedAt: string;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

/** Org-defined, reusable size label (backend `SizeOption`). */
export interface SizeOption {
  id: string;
  label: string;
  order: number;
  variantCount?: number;
}

/** A purchasable size with its own stock (backend `ProductVariant`). */
export interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  sku?: string;
  priceOverride?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
  // Size & stock (backend variant support)
  variants?: ProductVariant[];
  sizes?: string[]; // convenience: ["M","L","XL"]
  totalStock?: number; // sum of variant stock
  inStock?: boolean;
}

export type OrderStatus = "New" | "Processing" | "Completed" | "Cancelled";

export interface OrderLineItem {
  id: string;
  name: string;
  size?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string; // order code, e.g. "ORD-006"
  customer: string;
  phone: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: number; // line-item count
  // Present on the detail endpoint (GET /orders/:id):
  lineItems?: OrderLineItem[];
  // Stored by the backend; surfaced once the serializer exposes them:
  email?: string;
  address?: string;
  paymentMethod?: string;
}

export type LeadStatus = "New" | "Contacted" | "Closed";

export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 * Auth session + request payloads (mirror frontend/API_CONTRACT.md)
 * ------------------------------------------------------------------ */

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  description?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: Exclude<Role, "Owner">;
}

export interface CreateWebsitePayload {
  name: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
}

export type UpdateWebsitePayload = Partial<CreateWebsitePayload>;

export interface SaveBlocksPayload {
  blocks: Array<{ type: BlockType; title: string; order: number }>;
}

/** Per-size variant input on create/update (backend `ProductVariantInput`). */
export interface ProductVariantInput {
  size: string; // label, unique per product
  stock: number; // integer >= 0
  sku?: string;
  priceOverride?: number; // IDR; falls back to Product.price
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  imageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Omit to leave sizes untouched on PATCH; when present it is a full replace. */
  variants?: ProductVariantInput[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface CreateSizeOptionPayload {
  label: string;
}

export interface DashboardSummary {
  totalWebsites: number;
  totalProducts: number;
  totalOrders: number;
  totalLeads: number;
}

export interface TrendPoint {
  month: string;
  orders: number;
  leads: number;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
}

/* ------------------------------------------------------------------ *
 * Storefront Theme (public site rendered at /site/{slug})
 * ------------------------------------------------------------------ */

export type StorefrontSectionType =
  | "PromoBar"
  | "Hero"
  | "ProductGrid"
  | "Collection"
  | "PromoTiles"
  | "Newsletter"
  | "Footer";

export interface StorefrontSection {
  id: string;
  type: StorefrontSectionType;
  enabled: boolean;
  /** Section-specific config; shape depends on `type`. */
  config?: Record<string, unknown>;
}

export interface ThemeColors {
  background: string;
  surface: string;
  accent: string;
  accentAlt: string;
  text: string;
  muted: string;
  headerBg?: string;
  headerText?: string;
  promoBarBg?: string;
  promoBarText?: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface StorefrontCollection {
  /** Section heading, e.g. "Hot Items". */
  title: string;
  /** Category name to pull products from, or "All". */
  category: string;
}

export interface ThemeButtons {
  borderRadius: "none" | "rounded" | "rounded-md" | "rounded-lg" | "rounded-full";
  style: "solid" | "outline" | "gradient";
  fontWeight: "medium" | "semibold" | "bold" | "black";
  hoverEffect: "none" | "zoom" | "glow" | "both";
}

export interface ThemeSettings {
  preset?: "default" | "pprx";
  brandName: string;
  logoUrl?: string;
  colors: ThemeColors;
  promoBar: { enabled: boolean; text: string };
  nav: string[];
  currency: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl?: string;
  };
  collections: StorefrontCollection[];
  promoTiles: { title: string; subtitle: string; href: string }[];
  newsletter: { enabled: boolean; headline: string; offer: string };
  footer: { about: string; socials: SocialLink[] };
  /** Ordered, toggleable homepage sections. */
  sections: StorefrontSection[];
  buttons?: ThemeButtons;
}
