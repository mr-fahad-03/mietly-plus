const mongoose = require("mongoose");

const localizedTextSchema = new mongoose.Schema(
  {
    en: { type: String, default: "", trim: true },
    de: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const blogSeoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    metaKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "", trim: true },
    ogTitle: { type: String, default: "", trim: true },
    ogDescription: { type: String, default: "", trim: true },
    ogImageUrl: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema(
  {
    titleI18n: {
      type: localizedTextSchema,
      default: () => ({ en: "", de: "" }),
    },
    excerptI18n: {
      type: localizedTextSchema,
      default: () => ({ en: "", de: "" }),
    },
    contentHtmlI18n: {
      type: localizedTextSchema,
      default: () => ({ en: "", de: "" }),
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readingTimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    seo: {
      type: blogSeoSchema,
      default: () => ({
        metaTitle: "",
        metaDescription: "",
        metaKeywords: [],
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImageUrl: "",
      }),
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
