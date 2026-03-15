require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { connectDatabase } = require("../db");
const Admin = require("../models/Admin");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Banner = require("../models/Banner");
const Product = require("../models/Product");

const CATEGORY_SEED = [
  { key: "phones-tablets", name: { en: "Phones & Tablets", de: "Handys & Tablets" }, slug: "phones-tablets", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "computers", name: { en: "Computers", de: "Computer" }, slug: "computers", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "cameras", name: { en: "Cameras", de: "Kameras" }, slug: "cameras", image: null, parentKey: null },
  { key: "gaming-vr", name: { en: "Gaming & VR", de: "Gaming & VR" }, slug: "gaming-vr", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "audio-music", name: { en: "Audio & Music", de: "Audio & Musik" }, slug: "audio-music", image: null, parentKey: null },
  { key: "wearables", name: { en: "Wearables", de: "Wearables" }, slug: "wearables", image: null, parentKey: null },
  { key: "smart-home", name: { en: "Smart Home", de: "Smart Home" }, slug: "smart-home", image: null, parentKey: null },
  { key: "home-office", name: { en: "Home Office", de: "Home Office" }, slug: "home-office", image: null, parentKey: null },
  { key: "kitchen", name: { en: "Kitchen", de: "Kueche" }, slug: "kitchen", image: null, parentKey: null },
  { key: "mobility", name: { en: "Mobility", de: "Mobilitaet" }, slug: "mobility", image: null, parentKey: null },
  { key: "smartphones", name: { en: "Smartphones", de: "Smartphones" }, slug: "smartphones", image: null, parentKey: "phones-tablets" },
  { key: "tablets", name: { en: "Tablets", de: "Tablets" }, slug: "tablets", image: null, parentKey: "phones-tablets" },
  { key: "laptops", name: { en: "Laptops", de: "Laptops" }, slug: "laptops", image: null, parentKey: "computers" },
  { key: "monitors", name: { en: "Monitors", de: "Monitore" }, slug: "monitors", image: null, parentKey: "computers" },
  { key: "mirrorless", name: { en: "Mirrorless", de: "Spiegellos" }, slug: "mirrorless", image: null, parentKey: "cameras" },
  { key: "dslr", name: { en: "DSLR", de: "DSLR" }, slug: "dslr", image: null, parentKey: "cameras" },
  { key: "consoles", name: { en: "Consoles", de: "Konsolen" }, slug: "consoles", image: null, parentKey: "gaming-vr" },
  { key: "vr-headsets", name: { en: "VR Headsets", de: "VR-Headsets" }, slug: "vr-headsets", image: null, parentKey: "gaming-vr" },
  { key: "photography-lighting", name: { en: "Photography Lighting", de: "Fotografie Licht" }, slug: "photography-lighting", image: "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "projectors", name: { en: "Projectors", de: "Projektoren" }, slug: "projectors", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "fitness-tech", name: { en: "Fitness Tech", de: "Fitness Technik" }, slug: "fitness-tech", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "baby-kids", name: { en: "Baby & Kids", de: "Baby & Kinder" }, slug: "baby-kids", image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "outdoor-tech", name: { en: "Outdoor Tech", de: "Outdoor Technik" }, slug: "outdoor-tech", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "health-beauty", name: { en: "Health & Beauty", de: "Gesundheit & Beauty" }, slug: "health-beauty", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "creative-studio", name: { en: "Creative Studio", de: "Kreativstudio" }, slug: "creative-studio", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "networking", name: { en: "Networking", de: "Netzwerk" }, slug: "networking", image: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=600&q=80", parentKey: null },
  { key: "studio-lights", name: { en: "Studio Lights", de: "Studiolichter" }, slug: "studio-lights", image: null, parentKey: "photography-lighting" },
  { key: "action-cams", name: { en: "Action Cams", de: "Action-Kameras" }, slug: "action-cams", image: null, parentKey: "photography-lighting" },
  { key: "walking-pads", name: { en: "Walking Pads", de: "Walking Pads" }, slug: "walking-pads", image: null, parentKey: "fitness-tech" },
  { key: "massage-guns", name: { en: "Massage Guns", de: "Massagepistolen" }, slug: "massage-guns", image: null, parentKey: "fitness-tech" },
  { key: "wifi-routers", name: { en: "WiFi Routers", de: "WLAN Router" }, slug: "wifi-routers", image: null, parentKey: "networking" },
  { key: "mesh-systems", name: { en: "Mesh Systems", de: "Mesh Systeme" }, slug: "mesh-systems", image: null, parentKey: "networking" },
];

const BRAND_SEED = [
  { name: "Apple", slug: "apple", image: "https://logo.clearbit.com/apple.com" },
  { name: "Samsung", slug: "samsung", image: "https://logo.clearbit.com/samsung.com" },
  { name: "Sony", slug: "sony", image: "https://logo.clearbit.com/sony.com" },
  { name: "MSI", slug: "msi", image: "https://logo.clearbit.com/msi.com" },
  { name: "HP", slug: "hp", image: "https://logo.clearbit.com/hp.com" },
  { name: "Canon", slug: "canon", image: "https://logo.clearbit.com/canon.com" },
  { name: "Acer", slug: "acer", image: "https://logo.clearbit.com/acer.com" },
  { name: "Microsoft", slug: "microsoft", image: "https://logo.clearbit.com/microsoft.com" },
];

const BANNER_SEED = [
  { title: "Spring Tech Deals", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1015/1600/600", buttonText: "", buttonLink: "", position: "home", device: "desktop", sortOrder: 1, isActive: true },
  { title: "Premium Devices", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1005/1600/600", buttonText: "", buttonLink: "", position: "home", device: "desktop", sortOrder: 2, isActive: true },
  { title: "Gaming Collection", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1044/1600/600", buttonText: "", buttonLink: "", position: "home", device: "desktop", sortOrder: 3, isActive: true },
  { title: "Audio Essentials", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1050/1600/600", buttonText: "", buttonLink: "", position: "home", device: "desktop", sortOrder: 4, isActive: true },
  { title: "Rent Smart Home", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1035/1600/600", buttonText: "", buttonLink: "", position: "home", device: "desktop", sortOrder: 5, isActive: true },
  { title: "Mobile Deal 1", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1015/900/1200", buttonText: "", buttonLink: "", position: "home", device: "mobile", sortOrder: 1, isActive: true },
  { title: "Mobile Deal 2", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1005/900/1200", buttonText: "", buttonLink: "", position: "home", device: "mobile", sortOrder: 2, isActive: true },
  { title: "Mobile Deal 3", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1044/900/1200", buttonText: "", buttonLink: "", position: "home", device: "mobile", sortOrder: 3, isActive: true },
  { title: "Mobile Deal 4", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1050/900/1200", buttonText: "", buttonLink: "", position: "home", device: "mobile", sortOrder: 4, isActive: true },
  { title: "Mobile Deal 5", subtitle: "", description: "", imageUrl: "https://picsum.photos/id/1035/900/1200", buttonText: "", buttonLink: "", position: "home", device: "mobile", sortOrder: 5, isActive: true },
];

const PRODUCT_SEED_BLUEPRINTS = [
  { title: "iPhone 15 Rental", slugBase: "iphone-15-rental", monthlyPrice: 49.9, replacementValue: 1199, tags: ["phone", "apple"] },
  { title: "Galaxy S24 Rental", slugBase: "galaxy-s24-rental", monthlyPrice: 44.9, replacementValue: 1099, tags: ["phone", "android"] },
  { title: "iPad Pro Rental", slugBase: "ipad-pro-rental", monthlyPrice: 39.9, replacementValue: 999, tags: ["tablet", "apple"] },
  { title: "MacBook Air M3 Rental", slugBase: "macbook-air-m3-rental", monthlyPrice: 59.9, replacementValue: 1399, tags: ["laptop", "apple"] },
  { title: "Dell XPS 13 Rental", slugBase: "dell-xps-13-rental", monthlyPrice: 54.9, replacementValue: 1299, tags: ["laptop", "windows"] },
  { title: "Sony A7 IV Rental", slugBase: "sony-a7-iv-rental", monthlyPrice: 89.9, replacementValue: 2499, tags: ["camera", "mirrorless"] },
  { title: "Canon EOS R8 Rental", slugBase: "canon-eos-r8-rental", monthlyPrice: 74.9, replacementValue: 1899, tags: ["camera", "creator"] },
  { title: "Meta Quest 3 Rental", slugBase: "meta-quest-3-rental", monthlyPrice: 34.9, replacementValue: 649, tags: ["vr", "gaming"] },
  { title: "PlayStation 5 Rental", slugBase: "ps5-rental", monthlyPrice: 29.9, replacementValue: 549, tags: ["console", "gaming"] },
  { title: "Xbox Series X Rental", slugBase: "xbox-series-x-rental", monthlyPrice: 28.9, replacementValue: 549, tags: ["console", "gaming"] },
  { title: "DJI Mini 4 Pro Rental", slugBase: "dji-mini-4-pro-rental", monthlyPrice: 46.9, replacementValue: 999, tags: ["drone", "camera"] },
  { title: "Bose QC Ultra Rental", slugBase: "bose-qc-ultra-rental", monthlyPrice: 18.9, replacementValue: 429, tags: ["audio", "headphones"] },
  { title: "AirPods Pro 2 Rental", slugBase: "airpods-pro-2-rental", monthlyPrice: 12.9, replacementValue: 279, tags: ["audio", "earbuds"] },
  { title: "Apple Watch Series 9 Rental", slugBase: "apple-watch-series-9-rental", monthlyPrice: 16.9, replacementValue: 499, tags: ["wearable", "watch"] },
  { title: "Garmin Forerunner 265 Rental", slugBase: "garmin-forerunner-265-rental", monthlyPrice: 15.9, replacementValue: 449, tags: ["wearable", "fitness"] },
  { title: "Dyson V15 Rental", slugBase: "dyson-v15-rental", monthlyPrice: 24.9, replacementValue: 799, tags: ["home", "cleaning"] },
  { title: "Philips LatteGo Rental", slugBase: "philips-lattego-rental", monthlyPrice: 21.9, replacementValue: 699, tags: ["kitchen", "coffee"] },
  { title: "LG OLED 55 Rental", slugBase: "lg-oled-55-rental", monthlyPrice: 62.9, replacementValue: 1799, tags: ["tv", "home"] },
  { title: "Herman Miller Chair Rental", slugBase: "herman-miller-chair-rental", monthlyPrice: 31.9, replacementValue: 1199, tags: ["office", "ergonomic"] },
  { title: "Surface Pro 10 Rental", slugBase: "surface-pro-10-rental", monthlyPrice: 42.9, replacementValue: 1299, tags: ["tablet", "office"] },
];

const TARGET_PRODUCT_COUNT = 30;

async function seedAdmin() {
  const email = "asad@gmail.com";
  const password = "asad1122";
  const existing = await Admin.findOne({ email });
  if (existing) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ name: "Asad", email, passwordHash });
}

async function seedCategories({ reset }) {
  if (reset) await Category.deleteMany({});

  const keyToId = new Map();
  for (const seed of CATEGORY_SEED.filter((item) => !item.parentKey)) {
    const existing = await Category.findOne({ slug: seed.slug });
    if (existing) {
      existing.name = seed.name;
      existing.image = seed.image;
      existing.parentId = null;
      await existing.save();
      keyToId.set(seed.key, existing._id);
    } else {
      const created = await Category.create({
        name: seed.name,
        slug: seed.slug,
        image: seed.image,
        parentId: null,
      });
      keyToId.set(seed.key, created._id);
    }
  }
  for (const seed of CATEGORY_SEED.filter((item) => item.parentKey)) {
    const parentId = keyToId.get(seed.parentKey) || null;
    if (!parentId) continue;
    const existing = await Category.findOne({ slug: seed.slug });
    if (existing) {
      existing.name = seed.name;
      existing.image = seed.image;
      existing.parentId = parentId;
      await existing.save();
    } else {
      await Category.create({
        name: seed.name,
        slug: seed.slug,
        image: seed.image,
        parentId,
      });
    }
  }
}

async function seedBrands({ reset }) {
  if (reset) await Brand.deleteMany({});
  const count = await Brand.countDocuments();
  if (count > 0) return;
  await Brand.insertMany(BRAND_SEED.map((brand) => ({ ...brand, isActive: true })));
}

async function seedBanners({ reset }) {
  if (reset) await Banner.deleteMany({});
  const count = await Banner.countDocuments();
  if (count > 0) return;
  await Banner.insertMany(BANNER_SEED);
}

async function seedProducts({ reset }) {
  if (reset) await Product.deleteMany({});

  const existingCount = await Product.countDocuments();
  if (existingCount >= TARGET_PRODUCT_COUNT) return;

  const categories = await Category.find().select("_id parentId").sort({ createdAt: 1 }).lean();
  const brands = await Brand.find({ isActive: true }).select("_id name").sort({ createdAt: 1 }).lean();
  if (!categories.length || !brands.length) return;

  const parentIds = new Set(categories.filter((item) => item.parentId).map((item) => String(item.parentId)));
  const leafCategories = categories.filter((item) => !parentIds.has(String(item._id)));
  const categoryPool = leafCategories.length > 0 ? leafCategories : categories;

  const toCreate = TARGET_PRODUCT_COUNT - existingCount;
  const existingSlugs = new Set((await Product.find().select("slug").lean()).map((item) => item.slug));
  const docs = [];

  for (let index = 0; index < toCreate; index += 1) {
    const blueprint = PRODUCT_SEED_BLUEPRINTS[index % PRODUCT_SEED_BLUEPRINTS.length];
    const category = categoryPool[index % categoryPool.length];
    const brand = brands[index % brands.length];

    let slug = `seed-${blueprint.slugBase}-${index + 1}`;
    let suffix = 1;
    while (existingSlugs.has(slug)) {
      suffix += 1;
      slug = `seed-${blueprint.slugBase}-${index + 1}-${suffix}`;
    }
    existingSlugs.add(slug);

    const titleEn = blueprint.title;
    const titleDe = `${blueprint.title} (DE)`;
    const shortEn = `Flexible rental for ${blueprint.title} with low monthly cost.`;
    const shortDe = `Flexible Miete fuer ${blueprint.title} mit niedrigen Monatskosten.`;

    const minimumRentalWeeks = 1 + (index % 3);
    const maximumRentalWeeks = minimumRentalWeeks + 4 + (index % 4);
    const minimumRentalMonths = 1 + (index % 2);
    const maximumRentalMonths = minimumRentalMonths + 10 + (index % 10);
    const stockStatus =
      index % 11 === 0 ? "preorder" : index % 9 === 0 ? "low_stock" : "in_stock";
    const stock = stockStatus === "preorder" ? 0 : 8 + (index % 9);
    const verificationRequired = index % 3 !== 0;

    docs.push({
      title: titleEn,
      titleI18n: { en: titleEn, de: titleDe },
      slug,
      description: `<p>${titleEn} is available for short and long-term rental plans.</p>`,
      descriptionI18n: {
        en: `<p>${titleEn} is available for short and long-term rental plans.</p>`,
        de: `<p>${titleDe} ist fuer kurze und lange Mietzeitraeume verfuegbar.</p>`,
      },
      shortDescription: shortEn,
      shortDescriptionI18n: { en: shortEn, de: shortDe },
      imageUrl: `https://picsum.photos/seed/${slug}/1200/800`,
      galleryImages: [
        `https://picsum.photos/seed/${slug}-1/1200/800`,
        `https://picsum.photos/seed/${slug}-2/1200/800`,
      ],
      sku: `SEED-${(index + 1).toString().padStart(4, "0")}`,
      brand: brand.name,
      brandId: brand._id,
      tags: blueprint.tags,
      categoryId: category._id,
      monthlyPrice: blueprint.monthlyPrice,
      buyerPrice: Math.round((blueprint.monthlyPrice + 12) * 10) / 10,
      offerPrice: blueprint.monthlyPrice,
      stock,
      stockStatus,
      lowStockWarning: 3,
      maxRentalQuantity: 2,
      unit: "piece",
      weightKg: 1.5 + (index % 5) * 0.4,
      minimumRentalMonths,
      maximumRentalMonths,
      minimumRentalWeeks,
      maximumRentalWeeks,
      minimumRentalDays: minimumRentalWeeks * 7,
      maximumRentalDays: maximumRentalWeeks * 7,
      rentalPeriodUnit: "week",
      deliveryFee: Math.round((4.9 + (index % 4) * 1.5) * 100) / 100,
      verificationRequired,
      depositEnabled: index % 2 === 0,
      securityDeposit: index % 2 === 0 ? Math.max(100, Math.round(blueprint.monthlyPrice * 15)) : 0,
      replacementValue: blueprint.replacementValue,
      refundable: true,
      specifications: [
        { key: "Condition", value: "Excellent" },
        { key: "Warranty", value: "Included during rental" },
      ],
      seo: {
        metaTitle: `${titleEn} | Mietly`,
        metaDescription: `Rent ${titleEn} with flexible terms and quick delivery.`,
        metaKeywords: [titleEn.toLowerCase(), "rental", "mietly"],
        canonicalUrl: "",
        ogTitle: `${titleEn} Rental`,
        ogDescription: `Monthly rental plan for ${titleEn}.`,
        ogImageUrl: `https://picsum.photos/seed/${slug}-og/1200/630`,
      },
      isMostPopular: index < 8,
      isActive: true,
    });
  }

  if (docs.length > 0) {
    await Product.insertMany(docs);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const resetAll = args.includes("--reset-all");
  const resetProducts = args.includes("--reset-products") || resetAll;
  const resetCatalog = args.includes("--reset-catalog") || resetAll;
  const resetBanners = args.includes("--reset-banners") || resetAll;

  await connectDatabase();
  await seedAdmin();
  await seedCategories({ reset: resetCatalog });
  await seedBrands({ reset: resetCatalog });
  await seedBanners({ reset: resetBanners });
  await seedProducts({ reset: resetProducts });

  const [categoryCount, brandCount, productCount, popularCount] = await Promise.all([
    Category.countDocuments(),
    Brand.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ isMostPopular: true }),
  ]);

  console.log(
    `Seed completed. Categories=${categoryCount}, Brands=${brandCount}, Products=${productCount}, MostPopular=${popularCount}`
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
