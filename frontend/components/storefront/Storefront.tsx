"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ShoppingBag, User, ChevronDown, Star, X, Plus, Minus, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Inter } from "next/font/google";
import type { ThemeSettings, Product } from "@/types";
import { cn } from "@/lib/utils";
import { isColor, resolveMediaUrl, mediaBoxStyle } from "@/lib/media";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// Backend origin for public storefront actions (order submission, etc.).
const STOREFRONT_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

// Official merchandise scraped from shop.pprx.team
const MOCK_PPRX_PRODUCTS: Product[] = [
  {
    id: "pprx-jersey-2025",
    name: "PRX VCT 2025 Official Jersey",
    description: "The official match jersey for the 2025 VCT season. High-performance gaming jersey with the iconic Paper Rex neon graphics. Standard fit, lightweight, and engineered for maximum breathability.",
    price: 11000,
    category: "Team Kit",
    image: "#ff0099",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-hoodie-classic",
    name: "PRX Classic Hoodie - Black/Pink",
    description: "Heavyweight premium cotton fleece hoodie featuring 3D embroidered Paper Rex wordmark on the front and custom decals along the sleeve panels.",
    price: 13500,
    category: "Team Kit",
    image: "#e4ff00",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-muffler",
    name: "PRX Team Muffler Scarf",
    description: "Knit supporter scarf with 'WGAMING' and team crest graphics. Perfect for matchdays or accessorizing your setup.",
    price: 2499,
    category: "Team Kit",
    image: "#111111",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-bandana-navy",
    name: "PRX Immortal Three Bandana Navy",
    description: "Classic design bandana in deep navy featuring repeating mascot illustrations, team logomarks, and custom gaming tags.",
    price: 1499,
    category: "PRX Accessories",
    image: "#e4ff00",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-bandana-red",
    name: "PRX Immortal Three Bandana Red",
    description: "Vibrant red collector bandana featuring the official mascot print. Durable cotton construction.",
    price: 1499,
    category: "PRX Accessories",
    image: "#ff0099",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-seoul-keychain-v3",
    name: "PRX Seoul Coordinates Keychain V3",
    description: "Embroidered coordinates tactical flight tag keychain. Built with custom woven heavy duty strap and black anodized ring.",
    price: 999,
    category: "PRX Accessories",
    image: "#111111",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-seoul-keychain-v2",
    name: "PRX Seoul Legacy Keychain V2",
    description: "Embroidered classic keychain commemorating the Seoul VCT master finals. Features team crest signature stitching.",
    price: 999,
    category: "Sale",
    image: "#ff0099",
    seoTitle: "",
    seoDescription: "",
  },
  {
    id: "pprx-sticker-pack",
    name: "PRX WGAMING Sticker Pack V2",
    description: "Weatherproof vinyl stickers featuring players' signatures and mascot emotes. Perfect for decorating laptops and devices.",
    price: 1500,
    category: "Sale",
    image: "#e4ff00",
    seoTitle: "",
    seoDescription: "",
  }
];

interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

// Stylized vector SVG outlines for mock e-commerce products
function ProductGraphic({ productId, view }: { productId: string; view: "front" | "back" }) {
  const isBack = view === "back";

  if (productId === "pprx-jersey-2025") {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 filter drop-shadow-[0_4px_12px_rgba(255,0,153,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 20 25 L 30 15 L 42 20 L 45 15 L 55 15 L 58 20 L 70 15 L 80 25 L 75 40 L 70 38 L 70 85 L 30 85 L 30 38 L 25 40 Z" fill="#141414" stroke={isBack ? "#e4ff00" : "#ff0099"} strokeWidth="2.5" />
          <path d="M 42 20 C 45 24, 55 24, 58 20" stroke={isBack ? "#ff0099" : "#e4ff00"} strokeWidth="2" fill="none" />
          {!isBack ? (
            <>
              <path d="M 20 25 L 26 30 M 80 25 L 74 30" stroke="#e4ff00" strokeWidth="2" />
              <path d="M 30 50 L 70 55 M 30 65 L 70 60" stroke="#ff0099" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="42" y="32" width="16" height="10" rx="2" fill="#e4ff00" />
              <text x="50" y="39" fill="black" fontSize="6" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PRX</text>
              <text x="50" y="60" fill="white" fontSize="4" fontWeight="bold" letterSpacing="1" textAnchor="middle">WGAMING</text>
            </>
          ) : (
            <>
              <text x="50" y="45" fill="#e4ff00" fontSize="7" fontWeight="900" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">SOMETHING</text>
              <text x="50" y="70" fill="white" fontSize="22" fontWeight="900" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">25</text>
              <path d="M 30 80 L 70 80" stroke="#ff0099" strokeWidth="2" />
            </>
          )}
        </svg>
      </div>
    );
  }

  if (productId === "pprx-hoodie-classic") {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 filter drop-shadow-[0_4px_12px_rgba(228,255,0,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 22 30 L 32 15 C 32 15, 34 10, 50 10 C 66 10, 68 15, 68 15 L 78 30 L 72 45 L 68 43 L 68 85 L 32 85 L 32 43 L 28 45 Z" fill="#18181b" stroke={isBack ? "#ff0099" : "#e4ff00"} strokeWidth="2.5" />
          {!isBack && <path d="M 38 65 L 62 65 L 58 82 L 42 82 Z" fill="#27272a" stroke="#e4ff00" strokeWidth="1.5" />}
          {!isBack && (
            <>
              <path d="M 45 25 L 45 40" stroke="#ff0099" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 55 25 L 55 45" stroke="#ff0099" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          {!isBack ? (
            <>
              <text x="50" y="52" fill="white" fontSize="6.5" fontWeight="950" fontStyle="italic" textAnchor="middle" fontFamily="sans-serif">WGAMING</text>
              <circle cx="50" cy="35" r="4" fill="none" stroke="#ff0099" strokeWidth="1" />
            </>
          ) : (
            <>
              <circle cx="50" cy="48" r="14" fill="#141414" stroke="#ff0099" strokeWidth="2" />
              <path d="M 42 48 L 58 48 M 50 40 L 50 56" stroke="#e4ff00" strokeWidth="1.5" />
              <text x="50" y="74" fill="white" fontSize="5" fontWeight="bold" letterSpacing="0.5" textAnchor="middle" fontFamily="sans-serif">PAPER REX</text>
            </>
          )}
        </svg>
      </div>
    );
  }

  if (productId === "pprx-muffler") {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15 45 L 85 45 L 85 55 L 15 55 Z" fill="#111" stroke="#ff0099" strokeWidth="2" />
          <path d="M 15 50 L 10 75 L 20 75 Z" fill="#111" stroke="#e4ff00" strokeWidth="1.5" />
          <path d="M 85 50 L 90 75 L 80 75 Z" fill="#111" stroke="#e4ff00" strokeWidth="1.5" />
          <path d="M 8 75 L 8 82 M 12 75 L 12 82 M 16 75 L 16 82 M 20 75 L 20 82" stroke="#ff0099" strokeWidth="1" />
          <path d="M 80 75 L 80 82 M 84 75 L 84 82 M 88 75 L 88 82 M 92 75 L 92 82" stroke="#ff0099" strokeWidth="1" />
          {!isBack ? (
            <text x="50" y="52" fill="#e4ff00" fontSize="6.5" fontWeight="900" fontStyle="italic" letterSpacing="2" textAnchor="middle" fontFamily="sans-serif">WGAMING</text>
          ) : (
            <text x="50" y="52" fill="#ffffff" fontSize="6" fontWeight="900" letterSpacing="1.5" textAnchor="middle" fontFamily="sans-serif">PAPER REX</text>
          )}
        </svg>
      </div>
    );
  }

  if (productId.includes("bandana")) {
    const isRed = productId.includes("red");
    const primaryColor = isRed ? "#dd4242" : "#1e1b4b";
    const patternColor = isRed ? "#e4ff00" : "#ff0099";
    return (
      <div className="w-full h-full p-4 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="6" fill={primaryColor} stroke={patternColor} strokeWidth="2.5" />
          <rect x="22" y="22" width="56" height="56" rx="2" fill="none" stroke={patternColor} strokeWidth="1" strokeDasharray="3 3" />
          {!isBack ? (
            <>
              <path d="M 40 45 C 40 38, 60 38, 60 45 C 60 55, 40 55, 40 60 L 60 60" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="16" stroke={patternColor} strokeWidth="1" />
            </>
          ) : (
            <>
              <path d="M 30 30 L 70 70 M 70 30 L 30 70" stroke={patternColor} strokeWidth="1" />
              <text x="50" y="52" fill="white" fontSize="5.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">PRX</text>
            </>
          )}
        </svg>
      </div>
    );
  }

  if (productId.includes("keychain")) {
    const isV2 = productId.includes("v2");
    const tagBg = isV2 ? "#ff0099" : "#111111";
    const tagBorder = isV2 ? "#ffffff" : "#e4ff00";
    return (
      <div className="w-full h-full p-4 flex items-center justify-center relative">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="22" r="10" stroke="#71717a" strokeWidth="2.5" fill="none" />
          <circle cx="50" cy="30" r="4" fill="#3f3f46" />
          <rect x="35" y="32" width="30" height="58" rx="4" fill={tagBg} stroke={tagBorder} strokeWidth="2" />
          <circle cx="50" cy="38" r="2.5" fill="#0d0d0d" stroke={tagBorder} strokeWidth="1.5" />
          {!isBack ? (
            <>
              <text x="50" y="54" fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{isV2 ? "SEOUL" : "VCT"}</text>
              <text x="50" y="64" fill={tagBorder} fontSize="6" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">{isV2 ? "V2" : "2025"}</text>
              <path d="M 42 75 L 58 75" stroke="white" strokeWidth="1" />
            </>
          ) : (
            <>
              <text x="50" y="55" fill={tagBorder} fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PRX</text>
              <text x="50" y="65" fill="white" fontSize="3" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">126.97° E</text>
              <text x="50" y="72" fill="white" fontSize="3" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">37.56° N</text>
            </>
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 flex items-center justify-center relative">
      <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="70" height="70" rx="8" fill="#18181b" stroke="#e4ff00" strokeWidth="2.5" strokeDasharray="4 2" />
        {!isBack ? (
          <>
            <circle cx="38" cy="38" r="14" fill="#ff0099" />
            <text x="38" y="41" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">W</text>
            <rect x="52" y="52" width="22" height="22" rx="4" fill="#e4ff00" stroke="black" strokeWidth="1" />
            <text x="63" y="66" fill="black" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">PRX</text>
          </>
        ) : (
          <>
            <circle cx="62" cy="38" r="12" fill="#e4ff00" />
            <text x="62" y="41" fill="black" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">REX</text>
            <rect x="25" y="52" width="22" height="22" rx="11" fill="#ff0099" />
            <text x="36" y="65" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">25</text>
          </>
        )}
      </svg>
    </div>
  );
}

// Local dynamic currency formatter to support multi-currency switching
const formatStorefrontCurrency = (value: number, currencyCode: string) => {
  const locale = currencyCode === "IDR" ? "id-ID" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currencyCode === "IDR" ? 0 : 2,
    maximumFractionDigits: currencyCode === "IDR" ? 0 : 2,
  }).format(value);
};

// Simulated dynamic exchange rates
const getConvertedPrice = (basePrice: number, targetCurrency: string, baseCurrency: string) => {
  if (baseCurrency === targetCurrency) return basePrice;
  
  // Convert current base price to baseline USD
  let priceInUsd = basePrice;
  if (baseCurrency === "IDR") {
    priceInUsd = basePrice / 15000;
  } else if (baseCurrency === "SGD") {
    priceInUsd = basePrice / 1.35;
  } else if (baseCurrency === "MYR") {
    priceInUsd = basePrice / 4.4;
  }

  // Convert from USD to target currency
  if (targetCurrency === "IDR") {
    return priceInUsd * 15000;
  } else if (targetCurrency === "SGD") {
    return priceInUsd * 1.35;
  } else if (targetCurrency === "MYR") {
    return priceInUsd * 4.4;
  } else if (targetCurrency === "USD") {
    return priceInUsd;
  }
  return basePrice;
};

export function Storefront({
  theme,
  products: initialProducts,
  siteSlug,
}: {
  theme: ThemeSettings;
  products: Product[];
  /** Slug of the published site — used to submit orders to the backend. */
  siteSlug?: string;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocalizationOpen, setIsLocalizationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Custom Category & Search states
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");  // Custom Size & Quantity states for Quick View Modal
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [activeModalView, setActiveModalView] = useState<"front" | "back">("front");

  // Premium Toast Notification
  const [toast, setToast] = useState<{
    visible: boolean;
    productName: string;
    size?: string;
  } | null>(null);

  // Simulated Checkout Drawer States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "processing" | "success">("form");
  const [checkoutForm, setCheckoutForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "card", // "card" | "applepay" | "paypal"
    cardNumber: "",
    cardExpiry: "",
    cardCvv: ""
  });
  const [simulatedOrderId, setSimulatedOrderId] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const c = theme.colors;
  const isPprx = theme.preset === "pprx";

  // Dynamic currency state initialized to the theme's base currency
  const [activeCurrency, setActiveCurrency] = useState<string>(theme.currency);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        setToast((t) => t ? { ...t, visible: false } : null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast?.visible]);

  // Parse baseline product pricing correctly (mock prices are converted from cents to standard floats)
  const products = useMemo(() => {
    let list = initialProducts;
    if (isPprx && initialProducts.length <= 1 && initialProducts[0]?.name.includes("Kopi")) {
      list = MOCK_PPRX_PRODUCTS;
    }
    return list.map(p => {
      if (p.id.startsWith("pprx-")) {
        return { ...p, price: p.price / 100 };
      }
      return p;
    });
  }, [initialProducts, isPprx]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const styleVars = {
    "--bg": c.background,
    "--surface": c.surface,
    "--accent": c.accent,
    "--accent-alt": c.accentAlt,
    "--fg": c.text,
    "--muted": c.muted,
    "--header-bg": c.headerBg || (isPprx ? "#0d0d0d" : c.surface),
    "--header-text": c.headerText || c.text,
    "--promo-bg": c.promoBarBg || (isPprx ? c.accentAlt : c.accent),
    "--promo-text": c.promoBarText || "#000000",
  } as React.CSSProperties;

  const handleAddToCart = (product: Product, size?: string, qty: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty, size }];
    });
    
    // Trigger premium Toast notification instead of opening Cart Drawer
    setToast({
      visible: true,
      productName: product.name,
      size,
    });
  };

  const handleUpdateQuantity = (productId: string, size: string | undefined, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string, size?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCheckoutStep("form");
    setCheckoutError(null);
    setIsCheckoutOpen(true);
    setSimulatedOrderId(`PRX-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setCheckoutStep("processing");

    // Submit the order to the backend public checkout endpoint so it appears
    // in the JovStack dashboard Orders menu (POST /api/v1/public/orders).
    // Prices/totals are integers in the storefront's base currency.
    const baseCurrency = isPprx ? "SGD" : theme.currency;
    const items = cartItems.map((item) => ({
      productId: item.product.id.startsWith("pprx-") ? undefined : item.product.id,
      name: item.product.name + (item.size ? ` (${item.size})` : ""),
      price: Math.round(getConvertedPrice(item.product.price, baseCurrency, baseCurrency)),
      quantity: item.quantity,
      size: item.size,
    }));
    const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const customer = `${checkoutForm.firstName} ${checkoutForm.lastName}`.trim() || "Guest";

    try {
      if (!siteSlug) throw new Error("This store isn't published yet — checkout is unavailable.");
      const res = await fetch(`${STOREFRONT_API_BASE_URL}/api/v1/public/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: siteSlug,
          customer,
          email: checkoutForm.email,
          phone: checkoutForm.phone,
          address: [checkoutForm.address, checkoutForm.city, checkoutForm.postalCode]
            .filter(Boolean)
            .join(", "),
          paymentMethod: checkoutForm.paymentMethod,
          total,
          items,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        // Surface backend errors (OUT_OF_STOCK, validation, not-Live, …).
        const err = json?.error;
        const fieldMsg = err?.fields ? Object.values(err.fields)[0] : undefined;
        throw new Error(fieldMsg || err?.message || `Checkout failed (HTTP ${res.status}).`);
      }

      const code = json?.data?.code ?? json?.data?.id;
      if (code) setSimulatedOrderId(String(code));
      setCheckoutStep("success");
      setCartItems([]); // Clear cart only on a confirmed order
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setCheckoutStep("form"); // back to the form; cart preserved
    }
  };

  // Open Quick View Modal
  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    const prodSizes = product.sizes ?? [];
    const sizes = prodSizes.length > 0 ? prodSizes : isPprx ? ["S", "M", "L", "XL", "XXL"] : [];
    setSelectedSize(sizes.length > 0 ? sizes[0] : "M");
    setSelectedQty(1);
    setActiveModalView("front"); // Reset to front view
  };

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Category filtering
    if (activeCategory !== "All") {
      result = result.filter((p) => {
        const cat = p.category?.toLowerCase() || "";
        const target = activeCategory.toLowerCase();
        
        if (target.includes("kit") || target.includes("jersey")) {
          return cat.includes("kit") || cat.includes("jersey") || cat.includes("clothing");
        }
        if (target.includes("accessories") || target.includes("prx")) {
          return cat.includes("accessories") || cat.includes("merchandise") || cat.includes("sticker");
        }
        if (target.includes("sale")) {
          return cat.includes("sale") || p.price < 50;
        }
        return cat.includes(target) || target.includes(cat);
      });
    }

    // Search query filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, activeCategory, searchQuery]);

  // Dynamic Button Customization helper
  const getButtonClass = (variant: "primary" | "secondary" = "primary") => {
    const b = theme.buttons ?? {
      borderRadius: "rounded-md",
      style: "solid",
      fontWeight: "semibold",
      hoverEffect: "zoom",
    };

    const radiusMap = {
      none: "rounded-none",
      rounded: "rounded",
      "rounded-md": "rounded-md",
      "rounded-lg": "rounded-lg",
      "rounded-full": "rounded-full",
    };

    const weightMap = {
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      black: "font-black italic uppercase tracking-wider",
    };

    return cn(
      "inline-flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer",
      radiusMap[b.borderRadius] ?? "rounded-md",
      weightMap[b.fontWeight] ?? "font-semibold",
      (b.hoverEffect === "zoom" || b.hoverEffect === "both") && "hover:scale-[1.03]",
      (b.hoverEffect === "glow" || b.hoverEffect === "both") && "hover-glow",
      b.style === "outline"
        ? variant === "primary"
          ? "bg-transparent border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"
          : "bg-transparent border-2 border-[var(--accent-alt)] text-[var(--accent-alt)] hover:bg-[var(--accent-alt)] hover:text-white"
        : b.style === "gradient"
        ? "bg-gradient-to-r from-[#e4ff00] to-[#ff0099] border-none text-black hover:shadow-[0_0_20px_rgba(255,0,153,0.5)]"
        : variant === "primary"
        ? "bg-[var(--accent)] text-[#000] border-transparent hover:opacity-90"
        : "bg-[var(--accent-alt)] text-[#fff] border-transparent hover:opacity-90"
    );
  };

  return (
    <div style={styleVars} className={cn("relative min-h-screen flex flex-col font-sans selection:bg-[var(--accent)] selection:text-black", isPprx ? inter.className : "")}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes modalZoom {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-zoom {
          animation: modalZoom 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pprx-stripes {
          background-image: repeating-linear-gradient(
            45deg,
            rgba(255, 0, 153, 0.08) 0px,
            rgba(255, 0, 153, 0.08) 2px,
            transparent 2px,
            transparent 8px
          );
        }
        .pprx-item-card {
          border: 2px solid transparent;
          background: #141414 !important;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pprx-item-card:hover {
          border-color: var(--accent-alt);
          transform: translateY(-6px);
        }
        .pprx-gradient-bg {
          background: linear-gradient(127deg, #e4ff00 0%, #ff0099 100%) !important;
        }
        .hover-glow:hover {
          box-shadow: 0 0 15px var(--accent) !important;
        }
      `}</style>

      {/* Announcements Bar */}
      {theme.promoBar.enabled && (
        <PromoBar theme={theme} isPprx={isPprx} />
      )}

      {/* Main Layout Header */}
      <Header
        theme={theme}
        isPprx={isPprx}
        cartCount={cartCount}
        onCartOpen={() => setIsCartOpen(true)}
        onMenuOpen={() => setIsMenuOpen(true)}
        onSearchOpen={() => setIsSearchOpen(true)}
        onLocalizationOpen={() => setIsLocalizationOpen(true)}
        activeCurrency={activeCurrency}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Page Content Builder */}
      <div style={{ background: "var(--bg)", color: "var(--fg)" }} className="flex-1">
        {theme.sections
          .filter((s) => s.enabled)
          .map((s) => {
            switch (s.type) {
              case "Hero":
                return (
                  <Hero
                    key={s.id}
                    theme={theme}
                    isPprx={isPprx}
                    onSelectCategory={(cat) => {
                      setActiveCategory(cat);
                      document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    getButtonClass={getButtonClass}
                  />
                );
              case "ProductGrid":
                return (
                  <ProductSection
                    key={s.id}
                    id="products-grid-section"
                    title={activeCategory === "All" ? ((s.config?.title as string) ?? "Hot Items") : `Category: ${activeCategory}`}
                    products={filteredProducts}
                    isPprx={isPprx}
                    currency={activeCurrency}
                    baseCurrency={isPprx ? "SGD" : theme.currency}
                    onAddToCart={handleAddToCart}
                    onOpenQuickView={openQuickView}
                    getButtonClass={getButtonClass}
                  />
                );
              case "PromoTiles":
                return (
                  <PromoTiles
                    key={s.id}
                    theme={theme}
                    isPprx={isPprx}
                    onSelectCategory={(cat) => {
                      setActiveCategory(cat);
                      document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                );
              case "Newsletter":
                return theme.newsletter.enabled ? (
                  <Newsletter key={s.id} theme={theme} isPprx={isPprx} getButtonClass={getButtonClass} />
                ) : null;
              case "Footer":
                return <Footer key={s.id} theme={theme} isPprx={isPprx} onSelectCategory={setActiveCategory} />;
              default:
                return null;
            }
          })}
      </div>

      {/* ---------------- DRAWERS & INTERACTIVE OVERLAYS ---------------- */}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-sm transition-opacity">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsCartOpen(false)}
          />
          <div
            style={{ background: isPprx ? "#0d0d0d" : "var(--surface)", borderLeft: isPprx ? "2px solid var(--accent-alt)" : "none" }}
            className="relative flex h-full w-full max-w-md animate-slide-in flex-col p-6 shadow-2xl text-[var(--fg)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className={cn("text-xl font-bold tracking-tight", isPprx ? "uppercase italic" : "")}>
                Shopping Cart ({cartCount})
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                  <ShoppingBag size={48} className="opacity-40" />
                  <p className="text-sm">Your shopping cart is empty</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={cn("mt-4 px-6 py-2.5 uppercase tracking-wider text-xs", getButtonClass("primary"))}
                  >
                    Browse Merch
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const convertedPrice = getConvertedPrice(item.product.price, activeCurrency, isPprx ? "SGD" : theme.currency);
                  return (
                    <div
                      key={`${item.product.id}-${item.size}-${idx}`}
                      className="flex gap-4 rounded-lg bg-white/5 p-3 border border-white/5"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md flex items-center justify-center pprx-gradient-bg">
                        {!isColor(item.product.image) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(item.product.image)} alt={item.product.name} className="h-full w-full object-cover p-1 drop-shadow-md" />
                        )}
                        {isColor(item.product.image) && <Star size={20} className="text-black/35" />}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-semibold leading-tight line-clamp-1">{item.product.name}</h4>
                          {item.size && (
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Size: {item.size}</p>
                          )}
                          <p className="text-xs text-[var(--accent)] font-bold mt-1">
                            {formatStorefrontCurrency(convertedPrice, activeCurrency)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 bg-black/40 rounded-full px-2 py-1 border border-white/10">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.size, -1)}
                              className="p-1 hover:text-[var(--accent)] text-white"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-semibold w-4 text-center text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.size, 1)}
                              className="p-1 hover:text-[var(--accent)] text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id, item.size)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex justify-between text-base font-bold">
                  <span>Subtotal</span>
                  <span>
                    {formatStorefrontCurrency(
                      cartItems.reduce((acc, item) => {
                        const convertedPrice = getConvertedPrice(item.product.price, activeCurrency, isPprx ? "SGD" : theme.currency);
                        return acc + convertedPrice * item.quantity;
                      }, 0),
                      activeCurrency
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Shipping and taxes calculated at checkout.</p>
                <button
                  onClick={handleCheckout}
                  className={cn("w-full py-3 uppercase tracking-wider text-xs", getButtonClass("primary"))}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Localization Modal (Country/Currency Selector) */}
      {isLocalizationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div style={{ background: isPprx ? "#0d0d0d" : "var(--surface)", border: "1px solid rgba(255,255,255,0.1)" }} className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl text-[var(--fg)]">
            <h3 className={cn("text-lg font-bold mb-4", isPprx ? "uppercase italic" : "")}>Select Country & Currency</h3>
            
            <div className="space-y-3">
              {([
                { country: "Singapore", code: "SGD", label: "SGD ($)", flag: "🇸🇬" },
                { country: "Indonesia", code: "IDR", label: "IDR (Rp)", flag: "🇮🇩" },
                { country: "United States", code: "USD", label: "USD ($)", flag: "🇺🇸" },
                { country: "Malaysia", code: "MYR", label: "MYR (RM)", flag: "🇲🇾" },
              ] as const).map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    setActiveCurrency(curr.code);
                    setIsLocalizationOpen(false);
                  }}
                  style={{ background: activeCurrency === curr.code ? "rgba(255,255,255,0.08)" : "transparent" }}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/5 px-4 py-3 hover:bg-white/5 transition-colors text-left font-semibold"
                >
                  <span className="text-xl">{curr.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm">{curr.country}</p>
                    <p className="text-xs text-slate-400">{curr.label}</p>
                  </div>
                  {activeCurrency === curr.code && (
                    <span className="text-[var(--accent)] font-bold">Active</span>
                  )}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsLocalizationOpen(false)}
              className="mt-6 w-full py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-sm font-bold uppercase transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Product Quick View Dialog Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setSelectedProduct(null)}
          />
          <div
            style={{
              background: isPprx ? "#141414" : "var(--surface)",
              borderColor: isPprx ? "var(--accent)" : "rgba(255,255,255,0.1)",
              borderWidth: "2px",
              borderStyle: "solid"
            }}
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-[var(--fg)] z-10 animate-modal-zoom"
          >
            {/* Absolute close button matching premium Shopify layout */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 rounded-full p-2 bg-black/50 hover:bg-black/80 border border-white/10 text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            
            {/* Image Column */}
            <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-6 bg-black/20 shrink-0">
              <div className={cn("relative w-full aspect-square flex items-center justify-center rounded-2xl overflow-hidden", isPprx ? "bg-zinc-950/60 shadow-inner" : "bg-black/10")}>
                {!isColor(selectedProduct.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(selectedProduct.image)}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover rounded-xl p-2 drop-shadow-lg"
                  />
                ) : (
                  <ProductGraphic productId={selectedProduct.id} view={activeModalView} />
                )}
              </div>

              {/* Thumbnail Selector Grid inside Quick View */}
              {isColor(selectedProduct.image) && (
                <div className="flex gap-3 mt-4 justify-center">
                  <button
                    onClick={() => setActiveModalView("front")}
                    className={cn(
                      "w-12 h-12 rounded-xl p-0.5 border-2 bg-zinc-900 transition-all cursor-pointer",
                      activeModalView === "front" ? "border-[var(--accent)] scale-105" : "border-white/10 opacity-50 hover:opacity-80"
                    )}
                  >
                    <ProductGraphic productId={selectedProduct.id} view="front" />
                  </button>
                  <button
                    onClick={() => setActiveModalView("back")}
                    className={cn(
                      "w-12 h-12 rounded-xl p-0.5 border-2 bg-zinc-900 transition-all cursor-pointer",
                      activeModalView === "back" ? "border-[var(--accent)] scale-105" : "border-white/10 opacity-50 hover:opacity-80"
                    )}
                  >
                    <ProductGraphic productId={selectedProduct.id} view="back" />
                  </button>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent)]">
                    {selectedProduct.category}
                  </span>
                </div>
                
                <h3 className={cn("text-xl md:text-2xl font-black mt-2 leading-tight uppercase", isPprx ? "italic text-white" : "")}>
                  {selectedProduct.name}
                </h3>
                
                <p className="text-lg font-black text-[var(--accent)] mt-1.5">
                  {formatStorefrontCurrency(
                    getConvertedPrice(selectedProduct.price, activeCurrency, isPprx ? "SGD" : theme.currency),
                    activeCurrency
                  )}
                </p>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed line-clamp-4">
                  {selectedProduct.description}
                </p>

                {/* Variant Selection — real product sizes + per-size stock when
                    available, falling back to the PRX demo sizes. */}
                {(() => {
                  const realSizes = selectedProduct.sizes ?? [];
                  const sizes = realSizes.length > 0 ? realSizes : isPprx ? ["S", "M", "L", "XL", "XXL"] : [];
                  if (sizes.length === 0) return null;
                  const stockFor = (size: string) =>
                    selectedProduct.variants?.find((v) => v.size === size)?.stock;
                  return (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Size</p>
                        {selectedProduct.inStock === false && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-red-400">Sold out</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                          const stock = stockFor(size);
                          const soldOut = stock === 0;
                          return (
                            <button
                              key={size}
                              disabled={soldOut}
                              onClick={() => setSelectedSize(size)}
                              title={typeof stock === "number" ? `${stock} in stock` : undefined}
                              style={{
                                borderColor: selectedSize === size ? "var(--accent)" : "rgba(255,255,255,0.15)",
                                background: selectedSize === size ? "var(--accent)" : "transparent",
                                color: selectedSize === size ? "#000000" : "#ffffff",
                              }}
                              className={cn(
                                "px-3.5 py-1.5 border rounded-lg text-xs font-bold transition-all",
                                soldOut && "cursor-not-allowed line-through opacity-40"
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Add to Cart Actions */}
              <div className="mt-8 border-t border-white/10 pt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5 border border-white/10 shrink-0">
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="p-1 hover:text-[var(--accent)] text-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center text-white">{selectedQty}</span>
                  <button
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    className="p-1 hover:text-[var(--accent)] text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  disabled={selectedProduct.inStock === false}
                  onClick={() => {
                    const hasSizes = (selectedProduct.sizes && selectedProduct.sizes.length > 0) || isPprx;
                    handleAddToCart(selectedProduct, hasSizes ? selectedSize : undefined, selectedQty);
                    setSelectedProduct(null);
                  }}
                  className={cn(
                    "flex-1 py-3 text-xs uppercase tracking-wider",
                    getButtonClass("primary"),
                    selectedProduct.inStock === false && "cursor-not-allowed opacity-40"
                  )}
                >
                  {selectedProduct.inStock === false ? "Sold Out" : "Add to Cart"}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/75 backdrop-blur-sm transition-opacity md:hidden">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            style={{ background: isPprx ? "#0d0d0d" : "var(--surface)" }}
            className="relative flex h-full w-4/5 max-w-sm animate-slide-in-left flex-col p-6 shadow-2xl text-[var(--fg)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className={cn("text-xl font-bold uppercase tracking-tight", isPprx ? "italic text-[var(--accent-alt)]" : "")}>
                {theme.brandName}
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-6 flex flex-col gap-4 text-base font-bold uppercase tracking-wider">
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setIsMenuOpen(false);
                  document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn("text-left hover:text-[var(--accent)]", activeCategory === "All" && "text-[var(--accent)]")}
              >
                All Products
              </button>
              {theme.nav.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveCategory(item);
                    setIsMenuOpen(false);
                    document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "text-left hover:text-[var(--accent)]",
                    activeCategory === item && "text-[var(--accent)]"
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>Currency</span>
                <span>{activeCurrency}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay Dialog */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/85 p-4 md:p-10 transition-opacity">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold">Search Catalog</h3>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by jersey, hoodie, keychain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 outline-none focus:border-[var(--accent)] text-base"
              />
            </div>

            <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No matching items found</p>
              ) : (
                filteredProducts.slice(0, 5).map((p) => {
                  const convertedPrice = getConvertedPrice(p.price, activeCurrency, isPprx ? "SGD" : theme.currency);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        openQuickView(p);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="h-12 w-12 rounded-md overflow-hidden flex items-center justify-center shrink-0 pprx-gradient-bg">
                        {!isColor(p.image) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(p.image)} alt={p.name} className="h-full w-full object-cover p-0.5" />
                        )}
                        {isColor(p.image) && <Star size={14} className="text-black/35" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                        <p className="text-xs text-[var(--accent)] font-semibold">
                          {formatStorefrontCurrency(convertedPrice, activeCurrency)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {filteredProducts.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs text-[var(--accent)] hover:underline font-bold"
                >
                  View all results
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Drawer Simulation */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/80 backdrop-blur-sm transition-opacity">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setIsCheckoutOpen(false)}
          />
          <div
            style={{ background: isPprx ? "#0d0d0d" : "var(--surface)", borderLeft: isPprx ? "2px solid var(--accent-alt)" : "none" }}
            className="relative flex h-full w-full max-w-lg animate-slide-in flex-col p-6 shadow-2xl text-[var(--fg)] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className={cn("text-xl font-bold tracking-tight uppercase", isPprx ? "italic text-white" : "")}>
                Secure Checkout
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {checkoutStep === "form" && (
              <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between mt-4 space-y-6">
                <div className="space-y-4">
                  {/* Order Overview */}
                  <div className="rounded-xl bg-white/5 border border-white/5 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Items ({cartCount})</span>
                      <span className="font-bold">
                        {formatStorefrontCurrency(
                          cartItems.reduce((acc, item) => {
                            const price = getConvertedPrice(item.product.price, activeCurrency, isPprx ? "SGD" : theme.currency);
                            return acc + price * item.quantity;
                          }, 0),
                          activeCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Shipping</span>
                      <span className="text-emerald-400 font-bold">FREE</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between text-base font-black">
                      <span>Total</span>
                      <span className="text-[var(--accent)]">
                        {formatStorefrontCurrency(
                          cartItems.reduce((acc, item) => {
                            const price = getConvertedPrice(item.product.price, activeCurrency, isPprx ? "SGD" : theme.currency);
                            return acc + price * item.quantity;
                          }, 0),
                          activeCurrency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Information</p>
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (WhatsApp)"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                    />
                    {checkoutError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        <X size={14} className="mt-0.5 shrink-0" />
                        <span>{checkoutError}</span>
                      </div>
                    )}
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipping Address</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First Name"
                        required
                        value={checkoutForm.firstName}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, firstName: e.target.value })}
                        className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        required
                        value={checkoutForm.lastName}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, lastName: e.target.value })}
                        className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      required
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        required
                        value={checkoutForm.postalCode}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                        className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                    <div className="flex gap-2">
                      {(["card", "applepay", "paypal"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method })}
                          className={cn(
                            "flex-1 py-2 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer",
                            checkoutForm.paymentMethod === method
                              ? "border-[var(--accent)] bg-white/5 text-white"
                              : "border-white/10 opacity-60 hover:opacity-100 text-slate-400"
                          )}
                        >
                          {method === "card" ? "Credit Card" : method === "applepay" ? "Apple Pay" : "PayPal"}
                        </button>
                      ))}
                    </div>

                    {checkoutForm.paymentMethod === "card" && (
                      <div className="space-y-2 mt-2 bg-black/25 border border-white/5 rounded-xl p-3">
                        <input
                          type="text"
                          placeholder="Card Number (16 digits)"
                          required
                          maxLength={16}
                          value={checkoutForm.cardNumber}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value })}
                          className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            required
                            maxLength={5}
                            value={checkoutForm.cardExpiry}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, cardExpiry: e.target.value })}
                            className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            required
                            maxLength={3}
                            value={checkoutForm.cardCvv}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, cardCvv: e.target.value })}
                            className="h-10 bg-black/40 border border-white/10 rounded-lg px-3 outline-none focus:border-[var(--accent)] text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {checkoutForm.paymentMethod === "applepay" && (
                      <button
                        type="submit"
                        className="w-full py-3 mt-2 rounded-xl bg-white text-black font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
                      >
                         Pay Now
                      </button>
                    )}

                    {checkoutForm.paymentMethod === "paypal" && (
                      <button
                        type="submit"
                        className="w-full py-3 mt-2 rounded-xl bg-amber-400 text-blue-900 font-black italic text-sm flex items-center justify-center gap-1 hover:bg-amber-300 active:scale-95 transition-all cursor-pointer"
                      >
                        PayWith <span className="font-bold">PayPal</span>
                      </button>
                    )}
                  </div>
                </div>

                {checkoutForm.paymentMethod === "card" && (
                  <button
                    type="submit"
                    className={cn("w-full py-3.5 mt-6 uppercase tracking-wider text-xs shadow-lg cursor-pointer", getButtonClass("primary"))}
                  >
                    Authorize & Place Order
                  </button>
                )}
              </form>
            )}

            {checkoutStep === "processing" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <div>
                  <h4 className="text-lg font-bold text-white">Securing Your Order...</h4>
                  <p className="text-xs text-slate-400 mt-1">Please do not refresh or close this page.</p>
                </div>
              </div>
            )}

            {checkoutStep === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 text-4xl animate-bounce">
                  ✓
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black uppercase italic tracking-wide text-white">Order Confirmed!</h4>
                  <p className="text-xs text-slate-400">Thank you for shopping at {theme.brandName}.</p>
                  <p className="text-sm font-bold text-[var(--accent)] mt-2">Order ID: {simulatedOrderId}</p>
                </div>

                <div className="w-full border-t border-white/10 pt-6 space-y-2 text-left text-xs text-slate-400">
                  <p><span className="font-bold text-white">Deliver to:</span> {checkoutForm.firstName} {checkoutForm.lastName}</p>
                  <p><span className="font-bold text-white">Address:</span> {checkoutForm.address}, {checkoutForm.city} {checkoutForm.postalCode}</p>
                  <p><span className="font-bold text-white">Notification:</span> A confirmation email has been sent to {checkoutForm.email}</p>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className={cn("w-full py-3 uppercase tracking-wider text-xs cursor-pointer", getButtonClass("primary"))}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toast?.visible && (
        <div className="fixed bottom-6 right-6 z-[200] flex max-w-sm w-full items-center gap-3 rounded-2xl bg-zinc-900 border border-white/10 p-4 shadow-2xl animate-slide-in text-white">
          <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center pprx-gradient-bg">
            <ShoppingBag size={20} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added to Cart</p>
            <p className="text-sm font-bold truncate text-white">{toast.productName}</p>
            {toast.size && <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Size: {toast.size}</p>}
          </div>
          <button
            onClick={() => {
              setToast((t) => t ? { ...t, visible: false } : null);
              setIsCartOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-black text-xs font-bold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Sections ---------------- */

function PromoBar({ theme, isPprx }: { theme: ThemeSettings; isPprx: boolean }) {
  return (
    <div
      style={{ background: "var(--promo-bg)", color: "var(--promo-text)" }}
      className={cn(
        "py-2.5 text-xs font-bold tracking-[0.15em] overflow-hidden whitespace-nowrap border-b border-black/10 uppercase",
        !isPprx && "px-4 text-center tracking-normal font-semibold"
      )}
    >
      {isPprx ? (
        <div className="animate-marquee">
          <span className="mx-8">{theme.promoBar.text}</span>
          <span className="mx-8">{theme.promoBar.text}</span>
          <span className="mx-8">{theme.promoBar.text}</span>
          <span className="mx-8">{theme.promoBar.text}</span>
        </div>
      ) : (
        theme.promoBar.text
      )}
    </div>
  );
}

interface HeaderProps {
  theme: ThemeSettings;
  isPprx: boolean;
  cartCount: number;
  onCartOpen: () => void;
  onMenuOpen: () => void;
  onSearchOpen: () => void;
  onLocalizationOpen: () => void;
  activeCurrency: string;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

function Header({
  theme,
  isPprx,
  cartCount,
  onCartOpen,
  onMenuOpen,
  onSearchOpen,
  onLocalizationOpen,
  activeCurrency,
  activeCategory,
  onSelectCategory,
}: HeaderProps) {
  const brandInitial = theme.brandName.charAt(0);
  
  // Custom flag mapping based on selected currency code
  const getFlag = (code: string) => {
    if (code === "IDR") return "🇮🇩";
    if (code === "USD") return "🇺🇸";
    if (code === "MYR") return "🇲🇾";
    return "🇸🇬";
  };

  return (
    <header
      style={{
        background: "var(--header-bg)",
        color: "var(--header-text)",
        borderColor: "rgba(255,255,255,0.06)"
      }}
      className="sticky top-0 z-50 border-b animate-fade-in"
    >
      <div className={cn("mx-auto flex h-16 max-w-6xl items-center px-4 justify-between")}>
        
        {/* Left Side: Hamburger (Mobile) & Nav links (Desktop) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuOpen}
            className="md:hidden p-2 rounded-full hover:bg-white/5 text-current cursor-pointer"
          >
            <Menu size={20} />
          </button>

          <nav className={cn(
            "hidden items-center gap-6 text-xs font-extrabold uppercase tracking-wider md:flex",
            !isPprx && "ml-4 lowercase capitalize font-medium tracking-normal text-sm"
          )}>
            <button
              onClick={() => {
                onSelectCategory("All");
                document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn("opacity-80 hover:opacity-100 transition-opacity cursor-pointer", activeCategory === "All" && "text-[var(--accent)] font-black border-b-2 border-[var(--accent)] pb-1")}
            >
              All Products
            </button>
            {theme.nav.map((item) => (
              <button
                key={item}
                onClick={() => {
                  onSelectCategory(item);
                  document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "opacity-80 hover:opacity-100 transition-opacity cursor-pointer",
                  activeCategory === item && "text-[var(--accent)] font-black border-b-2 border-[var(--accent)] pb-1"
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Brand Logo / Name */}
        <div
          onClick={() => {
            onSelectCategory("All");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          {theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(theme.logoUrl)} alt={theme.brandName} className="h-8 w-auto" />
          ) : (
            <span
              style={{ background: isPprx ? "var(--accent-alt)" : "var(--accent)", color: isPprx ? "#fff" : "#000" }}
              className="flex h-8 w-8 items-center justify-center rounded font-extrabold"
            >
              {brandInitial}
            </span>
          )}
          <span className={cn("font-black tracking-tighter text-current", isPprx ? "text-xl uppercase italic" : "text-lg")}>
            {theme.brandName}
          </span>
        </div>

        {/* Right Side: Actions (Currency indicator, Search, User, Shopping Cart Bag) */}
        <div
          className="flex items-center gap-4 text-sm font-semibold"
          style={{ color: "var(--header-text)" }}
        >
          {/* Custom Localization trigger flag */}
          <button
            onClick={onLocalizationOpen}
            className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <span className="text-base leading-none">{getFlag(activeCurrency)}</span>
            <span className="hidden sm:inline text-xs uppercase opacity-75">{activeCurrency}</span>
            <ChevronDown size={12} className="opacity-50" />
          </button>

          <Search size={20} className="cursor-pointer hover:text-[var(--accent)] transition-colors" onClick={onSearchOpen} />
          <User
            size={20}
            className="cursor-pointer hover:text-[var(--accent)] transition-colors"
            onClick={() => alert("Simulation: User Profile & Orders dashboard coming soon!")}
          />
          
          {/* Shopping Bag Button */}
          <div
            onClick={onCartOpen}
            className="relative cursor-pointer hover:text-[var(--accent)] transition-colors"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span
                style={{ background: isPprx ? "var(--accent)" : "var(--accent-alt)", color: isPprx ? "#000" : "#fff" }}
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold shadow-md border border-black/10"
              >
                {cartCount}
              </span>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

function Hero({
  theme,
  isPprx,
  onSelectCategory,
  getButtonClass,
}: {
  theme: ThemeSettings;
  isPprx: boolean;
  onSelectCategory: (cat: string) => void;
  getButtonClass: (variant?: "primary" | "secondary") => string;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Visual background layers */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          isPprx ? "pprx-stripes" : ""
        )}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: theme.hero.imageUrl
            ? `linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.35)), url(${resolveMediaUrl(theme.hero.imageUrl)}) center/cover`
            : isPprx
            ? `linear-gradient(135deg, rgba(255, 0, 153, 0.25) 0%, #000 80%)`
            : `radial-gradient(120% 120% at 80% 10%, var(--accent-alt), transparent 55%), linear-gradient(120deg, var(--surface), var(--bg))`,
        }}
      />
      
      <div className={cn("relative z-10 mx-auto flex min-h-[520px] max-w-6xl flex-col px-6 py-24 justify-center", isPprx ? "items-center text-center" : "")}>
        <span
          style={{ color: "var(--accent)" }}
          className={cn("font-bold tracking-[0.3em]", isPprx ? "text-xs mb-4" : "text-xs uppercase")}
        >
          {theme.hero.eyebrow}
        </span>
        <h1 className={cn("max-w-3xl font-black leading-[1.0] tracking-tighter uppercase", isPprx ? "text-6xl md:text-8xl italic text-white" : "mt-3 text-5xl")}>
          {theme.hero.title}
        </h1>
        <p className={cn("max-w-md font-medium", isPprx ? "mt-6 text-lg text-slate-300" : "mt-4 text-base")} style={{ color: "var(--muted)" }}>
          {theme.hero.subtitle}
        </p>
        <button
          onClick={() => {
            if (theme.hero.ctaHref === "#") {
              onSelectCategory("All");
            } else {
              const cleanedAnchor = theme.hero.ctaHref.replace("#", "");
              const match = theme.nav.find((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, "-") === cleanedAnchor);
              if (match) {
                onSelectCategory(match);
              } else {
                onSelectCategory("All");
              }
            }
          }}
          className={cn("mt-8 px-10 py-4 text-xs uppercase tracking-[0.2em] border border-transparent shadow-md", getButtonClass("primary"))}
        >
          {theme.hero.ctaLabel}
        </button>
      </div>
    </section>
  );
}

function ProductSection({
  id,
  title,
  products,
  isPprx,
  currency,
  baseCurrency,
  onAddToCart,
  onOpenQuickView,
  getButtonClass,
}: {
  id: string;
  title: string;
  products: Product[];
  isPprx: boolean;
  currency: string;
  baseCurrency: string;
  onAddToCart: (p: Product) => void;
  onOpenQuickView: (p: Product) => void;
  getButtonClass: (variant?: "primary" | "secondary") => string;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -sliderRef.current.offsetWidth * 0.75 : sliderRef.current.offsetWidth * 0.75;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-16 scroll-mt-16 animate-fade-in">
      <div className={cn("mb-8 flex items-end justify-between", isPprx && "border-b border-white/10 pb-4")}>
        <h2 className={cn("font-black tracking-tight uppercase", isPprx ? "text-3xl italic text-white" : "text-2xl")}>{title}</h2>
        {products.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white hover:bg-[var(--accent)] hover:text-black transition-all duration-200 active:scale-90 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white hover:bg-[var(--accent)] hover:text-black transition-all duration-200 active:scale-90 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      {products.length === 0 ? (
        <div
          style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--muted)" }}
          className="rounded-xl border border-dashed py-16 text-center text-sm"
        >
          No products found in this category.
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 md:gap-6 pb-6 scroll-smooth"
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] md:w-[calc(25%-18px)] shrink-0 snap-start"
            >
              <ProductCard
                product={p}
                isPprx={isPprx}
                currency={currency}
                baseCurrency={baseCurrency}
                onAddToCart={onAddToCart}
                onOpenQuickView={onOpenQuickView}
                getButtonClass={getButtonClass}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Category Badge Color Handler based on shop.pprx.team patterns
const getBadgeStyles = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("sale")) {
    return { bg: "bg-[#dd4242]", text: "text-white font-extrabold uppercase border border-red-500/20" };
  }
  if (c.includes("preorder") || c.includes("pre-order")) {
    return { bg: "bg-black", text: "text-[#e4ff00] font-bold uppercase border border-[#e4ff00]/40" };
  }
  if (c.includes("new")) {
    return { bg: "bg-[#e4ff00]", text: "text-black font-black uppercase border border-yellow-300/20" };
  }
  return { bg: "bg-[#ff0099]", text: "text-white font-bold uppercase border border-pink-400/20" };
};

function ProductCard({
  product,
  isPprx,
  currency,
  baseCurrency,
  onAddToCart,
  onOpenQuickView,
  getButtonClass,
}: {
  product: Product;
  isPprx: boolean;
  currency: string;
  baseCurrency: string;
  onAddToCart: (p: Product) => void;
  onOpenQuickView: (p: Product) => void;
  getButtonClass: (variant?: "primary" | "secondary") => string;
}) {
  const badgeStyle = getBadgeStyles(product.category ?? "");
  const convertedPrice = getConvertedPrice(product.price, currency, baseCurrency);

  return (
    <div
      onClick={() => onOpenQuickView(product)}
      className={cn(
        "group relative flex flex-col transition-all duration-300 cursor-pointer",
        isPprx ? "pprx-item-card" : "rounded-xl border overflow-hidden hover:shadow-lg hover:-translate-y-1"
      )}
      style={!isPprx ? { background: "var(--surface)", borderColor: "rgba(255,255,255,0.06)" } : {}}
    >
      {/* Product Image Container */}
      <div className={cn("relative flex aspect-square items-center justify-center overflow-hidden", isPprx ? "pprx-gradient-bg m-3 rounded-xl" : "bg-black/10")} style={mediaBoxStyle(product.image)}>
        {/* Product Media Content */}
        {!isColor(product.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(product.image)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 p-2 drop-shadow-md"
          />
        ) : (
          <div className="w-full h-full relative">
            {/* Front View */}
            <div className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0 opacity-100 flex items-center justify-center">
              <ProductGraphic productId={product.id} view="front" />
            </div>
            {/* Back View */}
            <div className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-100 opacity-0 flex items-center justify-center">
              <ProductGraphic productId={product.id} view="back" />
            </div>
          </div>
        )}

        {/* PRX Style overlay category badge */}
        {product.category && (
          <div className={cn("absolute left-3 top-3 px-3 py-1 text-[8px] tracking-[0.15em] rounded-full shadow-md z-10", badgeStyle.bg, badgeStyle.text)}>
            {product.category}
          </div>
        )}

        {/* Quick Add overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent opening the quick view modal
            const hasSizes = product.sizes && product.sizes.length > 0;
            if (hasSizes) {
              onOpenQuickView(product);
            } else {
              onAddToCart(product);
            }
          }}
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-10 px-6 py-2.5 text-[10px] tracking-wider uppercase border border-transparent shadow-lg",
            getButtonClass("primary")
          )}
        >
          Quick Add
        </button>
      </div>

      {/* Description Info block */}
      <div className={cn("flex flex-1 flex-col p-4", isPprx ? "bg-[#141414] text-white pt-2" : "")}>
        <p className={cn("font-bold leading-tight", isPprx ? "text-sm uppercase tracking-wide" : "text-sm truncate")}>{product.name}</p>

        {/* Sizes + stock (variant support) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {product.sizes.map((s) => (
              <span
                key={s}
                className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {product.inStock === false && (
          <span className="mt-2 inline-block w-fit rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Sold out
          </span>
        )}

        <p className={cn("mt-auto pt-3 font-black text-base", isPprx ? "text-[var(--accent)]" : "text-[var(--accent)]")}>
          {formatStorefrontCurrency(convertedPrice, currency)}
        </p>
      </div>
    </div>
  );
}

function PromoTiles({
  theme,
  isPprx,
  onSelectCategory,
}: {
  theme: ThemeSettings;
  isPprx: boolean;
  onSelectCategory: (cat: string) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {theme.promoTiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => {
              if (tile.title.includes("Jersey") || tile.title.includes("Kit")) {
                onSelectCategory("Team Kit");
              } else {
                onSelectCategory("PRX Accessories");
              }
            }}
            style={{
              background: isPprx
                ? `linear-gradient(135deg, ${i % 2 === 0 ? "var(--accent-alt)" : "var(--accent)"}, #000)`
                : `linear-gradient(120deg, ${i % 2 === 0 ? "var(--accent-alt)" : "var(--accent)"}, var(--surface))`,
              color: isPprx ? "#fff" : "inherit"
            }}
            className={cn(
              "flex min-h-[220px] flex-col justify-end p-8 transition-transform hover:scale-[1.01] cursor-pointer shadow-lg",
              isPprx ? "rounded-3xl border border-white/10" : "rounded-2xl border border-[var(--border)]"
            )}
          >
            <h3 className={cn("font-black uppercase tracking-tight", isPprx ? "text-3xl italic" : "text-xl")}>{tile.title}</h3>
            <p className={cn("opacity-90 font-medium", isPprx ? "text-base mt-2" : "text-sm")}>{tile.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter({
  theme,
  isPprx,
  getButtonClass,
}: {
  theme: ThemeSettings;
  isPprx: boolean;
  getButtonClass: (variant?: "primary" | "secondary") => string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div
        style={{ background: isPprx ? "transparent" : "var(--surface)", borderColor: isPprx ? "var(--accent-alt)" : "rgba(255,255,255,0.06)" }}
        className={cn("text-center border", isPprx ? "rounded-3xl border-4 p-12" : "rounded-2xl p-10 shadow-lg")}
      >
        <h3 className={cn("font-black uppercase tracking-tight", isPprx ? "text-4xl italic text-white" : "text-2xl")}>{theme.newsletter.headline}</h3>
        <p className="mt-3 font-medium" style={{ color: "var(--muted)" }}>
          {theme.newsletter.offer}
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Subscribed! Simulation: Discount code sent successfully.");
          }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            required
            style={{ background: isPprx ? "rgba(255,255,255,0.05)" : "var(--bg)", borderColor: "rgba(255,255,255,0.1)", color: "var(--fg)" }}
            className={cn("h-12 flex-1 border px-4 outline-none", isPprx ? "rounded-full text-base" : "rounded-md text-sm")}
          />
          <button
            type="submit"
            className={cn("h-12 px-8 uppercase tracking-wider text-xs border border-transparent", getButtonClass("primary"))}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer({
  theme,
  isPprx,
  onSelectCategory,
}: {
  theme: ThemeSettings;
  isPprx: boolean;
  onSelectCategory: (cat: string) => void;
}) {
  return (
    <footer style={{ background: isPprx ? "#000" : "var(--surface)", borderColor: "rgba(255,255,255,0.06)" }} className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-4">
        
        {/* About brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            {theme.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(theme.logoUrl)} alt={theme.brandName} className="h-8 w-auto grayscale" />
            ) : (
              <span
                style={{ background: isPprx ? "var(--accent-alt)" : "var(--accent)", color: "#fff" }}
                className="flex h-8 w-8 items-center justify-center rounded font-extrabold"
              >
                {theme.brandName.charAt(0)}
              </span>
            )}
            <span className={cn("font-black tracking-tighter text-white", isPprx ? "text-xl uppercase italic" : "text-lg")}>{theme.brandName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {theme.footer.about}
          </p>
        </div>

        {/* Categories */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white">Shop</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
            <li>
              <button
                onClick={() => {
                  onSelectCategory("All");
                  document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                All Products
              </button>
            </li>
            {theme.nav.map((n) => (
              <li key={n}>
                <button
                  onClick={() => {
                    onSelectCategory(n);
                    document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Socials */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white">Follow</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
            {theme.footer.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
      <div
        style={{ borderColor: "rgba(255,255,255,0.06)", color: "var(--muted)" }}
        className="border-t px-4 py-6 text-center text-xs uppercase tracking-[0.20em] font-semibold"
      >
        © {new Date().getFullYear()} {theme.brandName}. Powered by JovStack.
      </div>
    </footer>
  );
}
