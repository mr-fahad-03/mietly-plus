import { Category } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "cat-phones-tablets",
    name: { en: "Phones & Tablets", de: "Handys & Tablets" },
    slug: "phones-tablets",
    image: null,
    parentId: null,
  },
  {
    id: "cat-computers",
    name: { en: "Computers", de: "Computer" },
    slug: "computers",
    image: null,
    parentId: null,
  },
  {
    id: "cat-cameras",
    name: { en: "Cameras", de: "Kameras" },
    slug: "cameras",
    image: null,
    parentId: null,
  },
  {
    id: "cat-gaming-vr",
    name: { en: "Gaming & VR", de: "Gaming & VR" },
    slug: "gaming-vr",
    image: null,
    parentId: null,
  },
  {
    id: "cat-audio-music",
    name: { en: "Audio & Music", de: "Audio & Musik" },
    slug: "audio-music",
    image: null,
    parentId: null,
  },
  {
    id: "cat-wearables",
    name: { en: "Wearables", de: "Wearables" },
    slug: "wearables",
    image: null,
    parentId: null,
  },
  {
    id: "cat-smart-home",
    name: { en: "Smart Home", de: "Smart Home" },
    slug: "smart-home",
    image: null,
    parentId: null,
  },
  {
    id: "cat-home-office",
    name: { en: "Home Office", de: "Home Office" },
    slug: "home-office",
    image: null,
    parentId: null,
  },
  {
    id: "cat-kitchen",
    name: { en: "Kitchen", de: "Kueche" },
    slug: "kitchen",
    image: null,
    parentId: null,
  },
  {
    id: "cat-mobility",
    name: { en: "Mobility", de: "Mobilitaet" },
    slug: "mobility",
    image: null,
    parentId: null,
  },
];

