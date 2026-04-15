import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Clothing Items ──────────────────────────────────────────────────────────
export const clothingItems = sqliteTable("clothing_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // tops | bottoms | dresses | shoes | handbags | jewelry | bras_underwear | accessories
  subcategory: text("subcategory"),
  color: text("color"),
  imageUrl: text("image_url"), // base64 data URL of processed (bg-removed) image
  originalImageUrl: text("original_image_url"), // base64 of original upload
  tags: text("tags").default("[]"), // JSON string array
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
});

export const insertClothingItemSchema = createInsertSchema(clothingItems).omit({
  id: true,
});
export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;

// ── Avatar Photos ────────────────────────────────────────────────────────────
export const avatarPhotos = sqliteTable("avatar_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("My Photo"),
  imageUrl: text("image_url").notNull(), // bg-removed base64
  originalImageUrl: text("original_image_url"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
});

export const insertAvatarPhotoSchema = createInsertSchema(avatarPhotos).omit({ id: true });
export type InsertAvatarPhoto = z.infer<typeof insertAvatarPhotoSchema>;
export type AvatarPhoto = typeof avatarPhotos.$inferSelect;

// ── Outfits ──────────────────────────────────────────────────────────────────
export const outfits = sqliteTable("outfits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  occasion: text("occasion"), // casual | work | formal | travel | special
  itemIds: text("item_ids").default("[]"), // JSON string array of clothingItem IDs
  notes: text("notes"),
  previewImageUrl: text("preview_image_url"), // composite snapshot if saved
});

export const insertOutfitSchema = createInsertSchema(outfits).omit({ id: true });
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfits.$inferSelect;

// ── Suitcases (Trip Plans) ───────────────────────────────────────────────────
export const suitcases = sqliteTable("suitcases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripName: text("trip_name").notNull(),
  destination: text("destination"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  itemIds: text("item_ids").default("[]"), // JSON string array
  outfitIds: text("outfit_ids").default("[]"), // JSON string array
  notes: text("notes"),
});

export const insertSuitcaseSchema = createInsertSchema(suitcases).omit({ id: true });
export type InsertSuitcase = z.infer<typeof insertSuitcaseSchema>;
export type Suitcase = typeof suitcases.$inferSelect;
