import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertClothingItemSchema, insertAvatarPhotoSchema, insertOutfitSchema, insertSuitcaseSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Clothing Items ──────────────────────────────────────────────────────
  app.get("/api/items", (_req, res) => {
    res.json(storage.getAllItems());
  });

  app.get("/api/items/:id", (req, res) => {
    const item = storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.post("/api/items", (req, res) => {
    const parsed = insertClothingItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createItem(parsed.data));
  });

  app.patch("/api/items/:id", (req, res) => {
    const item = storage.updateItem(Number(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  app.delete("/api/items/:id", (req, res) => {
    storage.deleteItem(Number(req.params.id));
    res.json({ ok: true });
  });

  // ── Avatars ─────────────────────────────────────────────────────────────
  app.get("/api/avatars", (_req, res) => {
    res.json(storage.getAllAvatars());
  });

  app.post("/api/avatars", (req, res) => {
    const parsed = insertAvatarPhotoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createAvatar(parsed.data));
  });

  app.post("/api/avatars/:id/default", (req, res) => {
    storage.setDefaultAvatar(Number(req.params.id));
    res.json({ ok: true });
  });

  app.delete("/api/avatars/:id", (req, res) => {
    storage.deleteAvatar(Number(req.params.id));
    res.json({ ok: true });
  });

  // ── Outfits ─────────────────────────────────────────────────────────────
  app.get("/api/outfits", (_req, res) => {
    res.json(storage.getAllOutfits());
  });

  app.post("/api/outfits", (req, res) => {
    const parsed = insertOutfitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createOutfit(parsed.data));
  });

  app.patch("/api/outfits/:id", (req, res) => {
    const outfit = storage.updateOutfit(Number(req.params.id), req.body);
    if (!outfit) return res.status(404).json({ error: "Not found" });
    res.json(outfit);
  });

  app.delete("/api/outfits/:id", (req, res) => {
    storage.deleteOutfit(Number(req.params.id));
    res.json({ ok: true });
  });

  // ── Suitcases ───────────────────────────────────────────────────────────
  app.get("/api/suitcases", (_req, res) => {
    res.json(storage.getAllSuitcases());
  });

  app.post("/api/suitcases", (req, res) => {
    const parsed = insertSuitcaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    res.json(storage.createSuitcase(parsed.data));
  });

  app.patch("/api/suitcases/:id", (req, res) => {
    const sc = storage.updateSuitcase(Number(req.params.id), req.body);
    if (!sc) return res.status(404).json({ error: "Not found" });
    res.json(sc);
  });

  app.delete("/api/suitcases/:id", (req, res) => {
    storage.deleteSuitcase(Number(req.params.id));
    res.json({ ok: true });
  });

  return httpServer;
}
