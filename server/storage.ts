import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import {
  clothingItems, avatarPhotos, outfits, suitcases,
  type ClothingItem, type InsertClothingItem,
  type AvatarPhoto, type InsertAvatarPhoto,
  type Outfit, type InsertOutfit,
  type Suitcase, type InsertSuitcase,
} from "@shared/schema";

const sqlite = new Database("closet.db");
const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS clothing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    color TEXT,
    image_url TEXT,
    original_image_url TEXT,
    tags TEXT DEFAULT '[]',
    notes TEXT,
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS avatar_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'My Photo',
    image_url TEXT NOT NULL,
    original_image_url TEXT,
    is_default INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS outfits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    occasion TEXT,
    item_ids TEXT DEFAULT '[]',
    notes TEXT,
    preview_image_url TEXT
  );
  CREATE TABLE IF NOT EXISTS suitcases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_name TEXT NOT NULL,
    destination TEXT,
    start_date TEXT,
    end_date TEXT,
    item_ids TEXT DEFAULT '[]',
    outfit_ids TEXT DEFAULT '[]',
    notes TEXT
  );
`);

export interface IStorage {
  // Clothing
  getAllItems(): ClothingItem[];
  getItemsByCategory(category: string): ClothingItem[];
  getItem(id: number): ClothingItem | undefined;
  createItem(item: InsertClothingItem): ClothingItem;
  updateItem(id: number, item: Partial<InsertClothingItem>): ClothingItem | undefined;
  deleteItem(id: number): void;

  // Avatars
  getAllAvatars(): AvatarPhoto[];
  createAvatar(avatar: InsertAvatarPhoto): AvatarPhoto;
  deleteAvatar(id: number): void;
  setDefaultAvatar(id: number): void;

  // Outfits
  getAllOutfits(): Outfit[];
  getOutfit(id: number): Outfit | undefined;
  createOutfit(outfit: InsertOutfit): Outfit;
  updateOutfit(id: number, outfit: Partial<InsertOutfit>): Outfit | undefined;
  deleteOutfit(id: number): void;

  // Suitcases
  getAllSuitcases(): Suitcase[];
  getSuitcase(id: number): Suitcase | undefined;
  createSuitcase(sc: InsertSuitcase): Suitcase;
  updateSuitcase(id: number, sc: Partial<InsertSuitcase>): Suitcase | undefined;
  deleteSuitcase(id: number): void;
}

export const storage: IStorage = {
  getAllItems: () => db.select().from(clothingItems).all(),
  getItemsByCategory: (category) => db.select().from(clothingItems).where(eq(clothingItems.category, category)).all(),
  getItem: (id) => db.select().from(clothingItems).where(eq(clothingItems.id, id)).get(),
  createItem: (item) => db.insert(clothingItems).values(item).returning().get(),
  updateItem: (id, item) => db.update(clothingItems).set(item).where(eq(clothingItems.id, id)).returning().get(),
  deleteItem: (id) => { db.delete(clothingItems).where(eq(clothingItems.id, id)).run(); },

  getAllAvatars: () => db.select().from(avatarPhotos).all(),
  createAvatar: (avatar) => db.insert(avatarPhotos).values(avatar).returning().get(),
  deleteAvatar: (id) => { db.delete(avatarPhotos).where(eq(avatarPhotos.id, id)).run(); },
  setDefaultAvatar: (id) => {
    db.update(avatarPhotos).set({ isDefault: false }).run();
    db.update(avatarPhotos).set({ isDefault: true }).where(eq(avatarPhotos.id, id)).run();
  },

  getAllOutfits: () => db.select().from(outfits).all(),
  getOutfit: (id) => db.select().from(outfits).where(eq(outfits.id, id)).get(),
  createOutfit: (outfit) => db.insert(outfits).values(outfit).returning().get(),
  updateOutfit: (id, outfit) => db.update(outfits).set(outfit).where(eq(outfits.id, id)).returning().get(),
  deleteOutfit: (id) => { db.delete(outfits).where(eq(outfits.id, id)).run(); },

  getAllSuitcases: () => db.select().from(suitcases).all(),
  getSuitcase: (id) => db.select().from(suitcases).where(eq(suitcases.id, id)).get(),
  createSuitcase: (sc) => db.insert(suitcases).values(sc).returning().get(),
  updateSuitcase: (id, sc) => db.update(suitcases).set(sc).where(eq(suitcases.id, id)).returning().get(),
  deleteSuitcase: (id) => { db.delete(suitcases).where(eq(suitcases.id, id)).run(); },
};
