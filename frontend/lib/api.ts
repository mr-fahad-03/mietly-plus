import { API_BASE_URL, FALLBACK_CATEGORIES } from "./constants";
import { Banner, BlogPost, Brand, Category, Order, Product, SupportRequest } from "./types";

function buildApiBaseCandidates() {
  const candidates = [API_BASE_URL, "http://localhost:4000", "http://localhost:5000"];
  return [...new Set(candidates)];
}

async function fetchWithPortFallback(path: string, init?: RequestInit) {
  let lastError: unknown;
  const bases = buildApiBaseCandidates();

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, init);
      if (response.ok) return response;
      if (response.status < 500) return response;
      lastError = new Error(`Request failed on ${base} with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error("Request failed on all API ports.");
}

export async function fetchCategoryTree(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories?tree=true`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Could not fetch categories");
    }

    return (await response.json()) as Category[];
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchAdminCategoryTree(adminToken: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories?tree=true`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Could not fetch admin categories",
    }));
    throw new Error(error.message || "Could not fetch admin categories");
  }

  return (await response.json()) as Category[];
}

export async function fetchPublicBrands() {
  const response = await fetchWithPortFallback("/api/brands", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch brands.");
  }

  return response.json() as Promise<Brand[]>;
}

export async function fetchAdminBrands(adminToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/brands`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch brands." }));
    throw new Error(error.message || "Could not fetch brands.");
  }

  return response.json() as Promise<Brand[]>;
}

export async function uploadBrandImage(file: File, adminToken: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/brand-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not upload brand image." }));
    throw new Error(error.message || "Could not upload brand image.");
  }

  const payload = (await response.json()) as { imageUrl: string };
  return payload.imageUrl;
}

export async function createBrand(
  adminToken: string,
  payload: { name: string; slug: string; image?: string | null; isActive?: boolean }
) {
  const response = await fetch(`${API_BASE_URL}/api/admin/brands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create brand." }));
    throw new Error(error.message || "Could not create brand.");
  }

  return response.json() as Promise<Brand>;
}

export async function deleteBrand(adminToken: string, brandId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/brands/${brandId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not delete brand." }));
    throw new Error(error.message || "Could not delete brand.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function createCategory(category: {
  name: { en: string; de: string };
  slug: string;
  image?: string | null;
  parentId?: string | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[] | string;
    canonicalUrl?: string;
    contentHtml?: {
      en?: string;
      de?: string;
    };
  };
}, adminToken?: string) {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Could not create category",
    }));
    throw new Error(error.message || "Could not create category");
  }

  return response.json();
}

export async function updateCategory(
  categoryId: string,
  category: {
    name: { en: string; de: string };
    slug: string;
    image?: string | null;
    parentId?: string | null;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[] | string;
      canonicalUrl?: string;
      contentHtml?: {
        en?: string;
        de?: string;
      };
    };
  },
  adminToken?: string
) {
  const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Could not update category",
    }));
    throw new Error(error.message || "Could not update category");
  }

  return response.json();
}

export async function deleteCategory(
  categoryId: string,
  options?: { cascade?: boolean; adminToken?: string }
) {
  const cascadeQuery = options?.cascade ? "?cascade=true" : "";
  const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}${cascadeQuery}`, {
    method: "DELETE",
    headers: {
      ...(options?.adminToken ? { Authorization: `Bearer ${options.adminToken}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Could not delete category",
    }));
    throw new Error(error.message || "Could not delete category");
  }

  return response.json();
}

export async function uploadCategoryImage(file: File, adminToken?: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/category-image`, {
    method: "POST",
    headers: {
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Could not upload image",
    }));
    throw new Error(error.message || "Could not upload image");
  }

  const payload = (await response.json()) as { imageUrl: string };
  return payload.imageUrl;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const response = await fetchWithPortFallback("/api/auth/check-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Could not verify email.");
  }

  const payload = (await response.json()) as { exists: boolean };
  return payload.exists;
}

export async function signIn(payload: { email: string; password: string }) {
  const response = await fetchWithPortFallback("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Sign in failed." }));
    throw new Error(error.message || "Sign in failed.");
  }

  return response.json() as Promise<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      address?: {
        fullName?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      wishlistProductIds?: string[];
      identityVerified?: boolean;
    };
  }>;
}

export async function signInWithGoogle(payload: { credential: string }) {
  const response = await fetchWithPortFallback("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Google sign in failed." }));
    throw new Error(error.message || "Google sign in failed.");
  }

  return response.json() as Promise<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      address?: {
        fullName?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      wishlistProductIds?: string[];
      identityVerified?: boolean;
    };
  }>;
}

export async function requestSignUpOtp(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await fetchWithPortFallback("/api/auth/signup/request-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not send verification code." }));
    throw new Error(error.message || "Could not send verification code.");
  }

  return response.json() as Promise<{
    message: string;
    email: string;
    expiresInMinutes: number;
  }>;
}

export async function verifySignUpOtp(payload: { email: string; otp: string }) {
  const response = await fetchWithPortFallback("/api/auth/signup/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "OTP verification failed." }));
    throw new Error(error.message || "OTP verification failed.");
  }

  return response.json() as Promise<{
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      address?: {
        fullName?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      wishlistProductIds?: string[];
      identityVerified?: boolean;
    };
  }>;
}

export async function getCurrentUser(token: string) {
  const response = await fetchWithPortFallback("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  return response.json() as Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      address?: {
        fullName?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
      wishlistProductIds?: string[];
      identityVerified?: boolean;
    };
  }>;
}

export async function fetchWishlist(token: string) {
  const response = await fetchWithPortFallback("/api/wishlist", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch wishlist." }));
    throw new Error(error.message || "Could not fetch wishlist.");
  }

  return response.json() as Promise<{ productIds: string[]; products: Product[] }>;
}

export async function addToWishlist(token: string, productId: string) {
  const response = await fetchWithPortFallback(`/api/wishlist/${encodeURIComponent(productId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not add to wishlist." }));
    throw new Error(error.message || "Could not add to wishlist.");
  }

  return response.json() as Promise<{ message: string; productIds: string[] }>;
}

export async function removeFromWishlist(token: string, productId: string) {
  const response = await fetchWithPortFallback(`/api/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not remove from wishlist." }));
    throw new Error(error.message || "Could not remove from wishlist.");
  }

  return response.json() as Promise<{ message: string; productIds: string[] }>;
}

export async function updateUserProfile(
  token: string,
  payload: {
    name: string;
    phone?: string | null;
    address?: {
      fullName?: string;
      phone?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not update profile." }));
    throw new Error(error.message || "Could not update profile.");
  }

  return response.json() as Promise<{
    message: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      address?: {
        fullName?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    };
  }>;
}

export async function changeUserPassword(
  token: string,
  payload: { currentPassword: string; newPassword: string }
) {
  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not change password." }));
    throw new Error(error.message || "Could not change password.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function deleteUserAccount(token: string, payload: { password: string }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not delete account." }));
    throw new Error(error.message || "Could not delete account.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function adminLogin(payload: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Admin login failed." }));
    throw new Error(error.message || "Admin login failed.");
  }

  return response.json() as Promise<{
    token: string;
    admin: { id: string; name: string; email: string };
  }>;
}

export async function getAdminMe(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  return response.json() as Promise<{
    admin: { id: string; email: string; name: string; role: string };
  }>;
}

export async function fetchPublicBanners(params?: { device?: "desktop" | "mobile"; position?: string }) {
  const query = new URLSearchParams();
  if (params?.device) query.set("device", params.device);
  if (params?.position) query.set("position", params.position);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${API_BASE_URL}/api/banners${suffix}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch banners.");
  }

  return response.json() as Promise<Banner[]>;
}

export async function fetchAdminBanners(adminToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/banners`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch admin banners.");
  }

  return response.json() as Promise<Banner[]>;
}

export async function uploadBannerImage(file: File, adminToken: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/banner-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not upload banner image." }));
    throw new Error(error.message || "Could not upload banner image.");
  }

  const payload = (await response.json()) as { imageUrl: string };
  return payload.imageUrl;
}

export async function createBanner(
  adminToken: string,
  payload: {
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl: string;
    buttonText?: string;
    buttonLink?: string;
    position?: string;
    device: "desktop" | "mobile";
    sortOrder?: number;
    validFrom?: string | null;
    validUntil?: string | null;
    isActive?: boolean;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/admin/banners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create banner." }));
    throw new Error(error.message || "Could not create banner.");
  }

  return response.json() as Promise<Banner>;
}

export async function deleteBanner(adminToken: string, bannerId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/banners/${bannerId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not delete banner." }));
    throw new Error(error.message || "Could not delete banner.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function fetchPublicBlogs() {
  const response = await fetchWithPortFallback("/api/blogs", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch blogs.");
  }

  return response.json() as Promise<BlogPost[]>;
}

export async function fetchPublicBlogBySlug(slug: string) {
  const response = await fetchWithPortFallback(`/api/blogs/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch blog post." }));
    throw new Error(error.message || "Could not fetch blog post.");
  }

  return response.json() as Promise<BlogPost>;
}

export async function fetchAdminBlogs(adminToken: string) {
  const response = await fetchWithPortFallback("/api/admin/blogs", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch blogs." }));
    throw new Error(error.message || "Could not fetch blogs.");
  }

  return response.json() as Promise<BlogPost[]>;
}

export async function uploadBlogImage(file: File, adminToken: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/blog-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not upload blog image." }));
    throw new Error(error.message || "Could not upload blog image.");
  }

  const payload = (await response.json()) as { imageUrl: string };
  return payload.imageUrl;
}

export async function createBlogPost(
  adminToken: string,
  payload: {
    categoryId: string;
    titleI18n: { en: string; de: string };
    excerptI18n?: { en: string; de: string };
    contentHtmlI18n: { en: string; de: string };
    slug: string;
    coverImageUrl?: string;
    tags?: string[];
    readingTimeMinutes?: number;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
    };
    status: "draft" | "published";
    publishedAt?: string | null;
  }
) {
  const response = await fetchWithPortFallback("/api/admin/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create blog post." }));
    throw new Error(error.message || "Could not create blog post.");
  }

  return response.json() as Promise<BlogPost>;
}

export async function updateBlogPost(
  adminToken: string,
  blogId: string,
  payload: {
    categoryId: string;
    titleI18n: { en: string; de: string };
    excerptI18n?: { en: string; de: string };
    contentHtmlI18n: { en: string; de: string };
    slug: string;
    coverImageUrl?: string;
    tags?: string[];
    readingTimeMinutes?: number;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
    };
    status: "draft" | "published";
    publishedAt?: string | null;
  }
) {
  const response = await fetchWithPortFallback(`/api/admin/blogs/${encodeURIComponent(blogId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not update blog post." }));
    throw new Error(error.message || "Could not update blog post.");
  }

  return response.json() as Promise<BlogPost>;
}

export async function deleteBlogPost(adminToken: string, blogId: string) {
  const response = await fetchWithPortFallback(`/api/admin/blogs/${encodeURIComponent(blogId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not delete blog post." }));
    throw new Error(error.message || "Could not delete blog post.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function uploadProductImage(file: File, adminToken: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/product-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not upload product image." }));
    throw new Error(error.message || "Could not upload product image.");
  }

  const payload = (await response.json()) as { imageUrl: string };
  return payload.imageUrl;
}

export async function createProduct(
  adminToken: string,
  payload: {
    title: string;
    titleI18n?: { en: string; de: string };
    slug: string;
    description?: string;
    descriptionI18n?: { en: string; de: string };
    shortDescription?: string;
    shortDescriptionI18n?: { en: string; de: string };
    imageUrl: string;
    galleryImages?: string[];
    sku?: string;
    brand?: string;
    brandId: string;
    tags?: string[];
    categoryId: string;
    monthlyPrice: number;
    buyerPrice?: number;
    offerPrice?: number;
    stock?: number;
    stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
    lowStockWarning?: number;
    maxRentalQuantity?: number;
    unit?: string;
    weightKg?: number;
    minimumRentalMonths?: number;
    maximumRentalMonths?: number;
    minimumRentalWeeks?: number;
    maximumRentalWeeks?: number;
    minimumRentalDays?: number;
    maximumRentalDays?: number;
    rentalPeriodUnit?: "day" | "week" | "month";
    deliveryFee?: number;
    verificationRequired?: boolean;
    depositEnabled?: boolean;
    securityDeposit?: number;
    replacementValue?: number;
    refundable?: boolean;
    specifications?: Array<{ key: string; value: string }>;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
    };
    isMostPopular?: boolean;
    isActive?: boolean;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create product." }));
    throw new Error(error.message || "Could not create product.");
  }

  return response.json() as Promise<Product>;
}

export async function updateProduct(
  adminToken: string,
  productId: string,
  payload: {
    title: string;
    titleI18n?: { en: string; de: string };
    slug: string;
    description?: string;
    descriptionI18n?: { en: string; de: string };
    shortDescription?: string;
    shortDescriptionI18n?: { en: string; de: string };
    imageUrl: string;
    galleryImages?: string[];
    sku?: string;
    brand?: string;
    brandId: string;
    tags?: string[];
    categoryId: string;
    monthlyPrice: number;
    buyerPrice?: number;
    offerPrice?: number;
    stock?: number;
    stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
    lowStockWarning?: number;
    maxRentalQuantity?: number;
    unit?: string;
    weightKg?: number;
    minimumRentalMonths?: number;
    maximumRentalMonths?: number;
    minimumRentalWeeks?: number;
    maximumRentalWeeks?: number;
    minimumRentalDays?: number;
    maximumRentalDays?: number;
    rentalPeriodUnit?: "day" | "week" | "month";
    deliveryFee?: number;
    verificationRequired?: boolean;
    depositEnabled?: boolean;
    securityDeposit?: number;
    replacementValue?: number;
    refundable?: boolean;
    specifications?: Array<{ key: string; value: string }>;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
    };
    isMostPopular?: boolean;
    isActive?: boolean;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not update product." }));
    throw new Error(error.message || "Could not update product.");
  }

  return response.json() as Promise<Product>;
}

export async function fetchAdminProducts(adminToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch products.");
  }

  return response.json() as Promise<Product[]>;
}

export async function deleteProduct(adminToken: string, productId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not delete product." }));
    throw new Error(error.message || "Could not delete product.");
  }

  return response.json() as Promise<{ message: string }>;
}

export async function fetchMostPopularProducts() {
  const response = await fetchWithPortFallback("/api/products/popular", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch popular products.");
  }

  return response.json() as Promise<Product[]>;
}

export async function fetchPublicProducts() {
  const response = await fetchWithPortFallback("/api/products", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch products.");
  }

  return response.json() as Promise<Product[]>;
}

export async function fetchPublicProductBySlug(slug: string) {
  const response = await fetchWithPortFallback(`/api/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch product.");
  }

  return response.json() as Promise<Product>;
}

export async function fetchIdentityStatus(token: string) {
  const response = await fetchWithPortFallback("/api/payments/identity-status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch identity status." }));
    throw new Error(error.message || "Could not fetch identity status.");
  }

  return response.json() as Promise<{ verified: boolean; verificationSessionId: string }>;
}

export async function createIdentityVerificationSession(token: string) {
  const response = await fetchWithPortFallback("/api/payments/identity-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create identity session." }));
    throw new Error(error.message || "Could not create identity session.");
  }

  return response.json() as Promise<{ verified: boolean; sessionId?: string; url?: string }>;
}

export async function createCheckoutSession(
  token: string,
  payload: {
    items: Array<{
      productId?: string;
      slug?: string;
      imageUrl?: string;
      categoryName?: string;
      brandName?: string;
      title: string;
      quantity: number;
      unitPrice: number;
      baseUnitPrice?: number;
      durationValue?: number;
      durationUnit?: "day" | "week" | "month";
      startDate?: string;
      depositEnabled?: boolean;
      securityDeposit?: number;
      deliveryFee?: number;
      durationLabel?: string;
      currency?: string;
    }>;
    shippingAddress: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  }
) {
  const response = await fetchWithPortFallback("/api/payments/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not create checkout session." }));
    throw new Error(error.message || "Could not create checkout session.");
  }

  return response.json() as Promise<{ id: string; url: string; orderId: string; orderNumber: string }>;
}

export async function confirmCheckoutSession(token: string, payload: { sessionId: string }) {
  const response = await fetchWithPortFallback("/api/payments/checkout-confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not confirm checkout." }));
    throw new Error(error.message || "Could not confirm checkout.");
  }

  return response.json() as Promise<{ message: string; order: Order }>;
}

export async function fetchAdminOrders(adminToken: string) {
  const response = await fetchWithPortFallback("/api/admin/orders", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch orders." }));
    throw new Error(error.message || "Could not fetch orders.");
  }

  return response.json() as Promise<Order[]>;
}

export async function updateAdminOrderFulfillmentStatus(
  adminToken: string,
  orderId: string,
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"
) {
  const response = await fetchWithPortFallback(`/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ fulfillmentStatus }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not update order status." }));
    throw new Error(error.message || "Could not update order status.");
  }

  return response.json() as Promise<{ message: string; order: Order }>;
}

export async function submitSupportRequest(payload: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  locale?: "en" | "de";
  source?: string;
  pageUrl?: string;
}) {
  const response = await fetchWithPortFallback("/api/support-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not submit request." }));
    throw new Error(error.message || "Could not submit request.");
  }

  return response.json() as Promise<{ message: string; request: SupportRequest }>;
}

export async function fetchAdminSupportRequests(adminToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/support-requests`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not fetch support requests." }));
    throw new Error(error.message || "Could not fetch support requests.");
  }

  return response.json() as Promise<SupportRequest[]>;
}

export async function updateSupportRequestStatus(
  adminToken: string,
  requestId: string,
  status: "new" | "in_progress" | "resolved"
) {
  const response = await fetch(`${API_BASE_URL}/api/admin/support-requests/${requestId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Could not update support request." }));
    throw new Error(error.message || "Could not update support request.");
  }

  return response.json() as Promise<SupportRequest>;
}
