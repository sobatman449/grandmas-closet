import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertClothingItemSchema, insertAvatarPhotoSchema, insertOutfitSchema, insertSuitcaseSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

// Parse the latest version block from CHANGELOG.md
function parseLatestChangelog(): { version: string; date: string; bullets: string[] } | null {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    const raw = fs.readFileSync(changelogPath, "utf-8");
    const lines = raw.split("\n");
    let version = "";
    let date = "";
    const bullets: string[] = [];
    let inBlock = false;

    for (const line of lines) {
      const h2 = line.match(/^## (.+?) — (.+)$/);
      if (h2) {
        if (inBlock) break; // only want the first (newest) block
        version = h2[1].trim();
        date = h2[2].trim();
        inBlock = true;
        continue;
      }
      if (inBlock && line.startsWith("- ")) {
        bullets.push(line.slice(2).trim());
      }
    }

    return version ? { version, date, bullets } : null;
  } catch {
    return null;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Update / Changelog ──────────────────────────────────────────────────
  // The Windows launcher writes a .updated flag file after a successful pull.
  // The frontend polls this endpoint once on load; if updated=true, it shows
  // the What's New banner and then clears the flag.
  app.get("/api/whats-new", (_req, res) => {
    const flagPath = path.join(process.cwd(), ".updated");
    const wasUpdated = fs.existsSync(flagPath);
    if (wasUpdated) {
      try { fs.unlinkSync(flagPath); } catch {}
    }
    const changelog = parseLatestChangelog();
    res.json({ updated: wasUpdated, changelog });
  });

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
