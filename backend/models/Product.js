const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleI18n: {
      en: { type: String, default: "", trim: true },
      de: { type: String, default: "", trim: true },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    descriptionI18n: {
      en: { type: String, default: "", trim: true },
      de: { type: String, default: "", trim: true },
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    shortDescriptionI18n: {
      en: { type: String, default: "", trim: true },
      de: { type: String, default: "", trim: true },
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    offerPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "preorder"],
      default: "in_stock",
    },
    lowStockWarning: {
      type: Number,
      default: 5,
      min: 0,
    },
    maxRentalQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    weightKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumRentalMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maximumRentalMonths: {
      type: Number,
      required: true,
      min: 1,
      default: 24,
    },
    minimumRentalWeeks: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maximumRentalWeeks: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },
    minimumRentalDays: {
      type: Number,
      required: true,
      min: 1,
      default: 7,
    },
    maximumRentalDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    rentalPeriodUnit: {
      type: String,
      enum: ["day", "week", "month"],
      default: "week",
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    verificationRequired: {
      type: Boolean,
      default: true,
    },
    depositEnabled: {
      type: Boolean,
      default: false,
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    replacementValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundable: {
      type: Boolean,
      default: true,
    },
    specifications: {
      type: [
        {
          key: { type: String, trim: true },
          value: { type: String, trim: true },
        },
      ],
      default: [],
    },
    seo: {
      metaTitle: { type: String, default: "", trim: true },
      metaDescription: { type: String, default: "", trim: true },
      metaKeywords: { type: [String], default: [] },
      canonicalUrl: { type: String, default: "", trim: true },
      ogTitle: { type: String, default: "", trim: true },
      ogDescription: { type: String, default: "", trim: true },
      ogImageUrl: { type: String, default: "", trim: true },
    },
    isMostPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
