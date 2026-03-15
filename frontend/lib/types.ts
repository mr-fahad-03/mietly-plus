export type Locale = "en" | "de";

export type Category = {
  id: string;
  name: {
    en: string;
    de: string;
  };
  slug: string;
  image: string | null;
  parentId: string | null;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    canonicalUrl: string;
    contentHtml: {
      en: string;
      de: string;
    };
  };
  children?: Category[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  position: string;
  device: "desktop" | "mobile";
  sortOrder: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  title: string;
  titleI18n: {
    en: string;
    de: string;
  };
  slug: string;
  description: string;
  descriptionI18n: {
    en: string;
    de: string;
  };
  shortDescription: string;
  shortDescriptionI18n: {
    en: string;
    de: string;
  };
  imageUrl: string;
  galleryImages: string[];
  sku: string;
  brandId: string;
  brand: string;
  brandData?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  } | null;
  tags: string[];
  categoryId: string;
  category: {
    id: string;
    name: {
      en: string;
      de: string;
    };
    slug: string;
  } | null;
  monthlyPrice: number;
  buyerPrice: number;
  offerPrice: number;
  stock: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  lowStockWarning: number;
  maxRentalQuantity: number;
  unit: string;
  weightKg: number;
  minimumRentalMonths: number;
  maximumRentalMonths: number;
  minimumRentalWeeks: number;
  maximumRentalWeeks: number;
  minimumRentalDays: number;
  maximumRentalDays: number;
  rentalPeriodUnit: "day" | "week" | "month";
  deliveryFee: number;
  verificationRequired: boolean;
  depositEnabled: boolean;
  securityDeposit: number;
  replacementValue: number;
  refundable: boolean;
  specifications: Array<{ key: string; value: string }>;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
  };
  isMostPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: string;
  titleI18n: {
    en: string;
    de: string;
  };
  excerptI18n: {
    en: string;
    de: string;
  };
  contentHtmlI18n: {
    en: string;
    de: string;
  };
  categoryId: string;
  category: {
    id: string;
    name: {
      en: string;
      de: string;
    };
    slug: string;
  } | null;
  slug: string;
  coverImageUrl: string;
  tags: string[];
  readingTimeMinutes: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
  };
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  locale: "en" | "de";
  source: string;
  pageUrl: string;
  status: "new" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    title: string;
    slug: string;
    imageUrl: string;
    categoryName: string;
    brandName: string;
    quantity: number;
    unitPrice: number;
    baseUnitPrice: number;
    durationValue: number;
    durationUnit: "day" | "week" | "month";
    startDate: string;
    depositEnabled: boolean;
    securityDeposit: number;
    deliveryFee: number;
    lineSubtotal: number;
    lineDeposit: number;
    lineDelivery: number;
    lineTotal: number;
  }>;
  currency: string;
  subtotal: number;
  depositTotal: number;
  deliveryTotal: number;
  total: number;
  status: "pending_payment" | "paid" | "failed" | "cancelled";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  paymentStatus: "unpaid" | "paid" | "refunded";
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  rentalEndDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  categoryName: string;
  brandName: string;
  unitPrice: number;
  baseUnitPrice: number;
  durationValue: number;
  durationUnit: "day" | "week" | "month";
  startDate: string;
  quantity: number;
  verificationRequired: boolean;
  depositEnabled: boolean;
  securityDeposit: number;
  deliveryFee: number;
  addedAt: string;
};
