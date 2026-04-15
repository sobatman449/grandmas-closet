import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import UploadModal, { CATEGORIES } from "@/components/UploadModal";
import { useToast } from "@/hooks/use-toast";
import type { ClothingItem } from "@shared/schema";

const SHELF_CATS = ["shoes", "handbags", "jewelry", "bras_underwear", "accessories"];
const RACK_CATS  = ["tops", "bottoms", "dresses"];

function HangerItem({ item, onDelete }: { item: ClothingItem; onDelete: () => void }) {
  return (
    <div className="hanger-item group" data-testid={`hanger-item-${item.id}`}>
      <div className="hanger-hook" />
      <div className="hanger-bar" />
      <div className="relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="garment-image" />
        ) : (
          <div className="garment-image bg-muted flex items-center justify-center text-3xl rounded">
            {item.category === "tops" ? "👕" : item.category === "bottoms" ? "👖" : "👗"}
          </div>
        )}
        <button
          data-testid={`delete-item-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full items-center justify-center hidden group-hover:flex text-xs"
        >
          ×
        </button>
      </div>
      <span className="text-xs text-center text-muted-foreground max-w-[100px] truncate mt-1">
        {item.name}
      </span>
      {item.color && (
        <span className="text-xs text-muted-foreground/70">{item.color}</span>
      )}
    </div>
  );
}

function ShelfItem({ item, onDelete }: { item: ClothingItem; onDelete: () => void }) {
  return (
    <div className="shelf-item group" data-testid={`shelf-item-${item.id}`}>
      <div className="relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-contain rounded-lg bg-muted p-1" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl">
            {item.category === "shoes" ? "👠" : item.category === "handbags" ? "👜" : item.category === "jewelry" ? "💍" : "🧥"}
          </div>
        )}
        <button
          data-testid={`delete-shelf-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full items-center justify-center hidden group-hover:flex text-xs"
        >
          ×
        </button>
      </div>
      <span className="text-xs text-center max-w-[80px] truncate text-muted-foreground">{item.name}</span>
    </div>
  );
}

type Section = { id: string; label: string; icon: string; cats: string[] };
const SECTIONS: Section[] = [
  { id: "rack", label: "The Rack", icon: "👗", cats: RACK_CATS },
  { id: "accessories", label: "Accessories & Bags", icon: "👜", cats: ["handbags", "accessories"] },
  { id: "jewelry", label: "Jewelry", icon: "💍", cats: ["jewelry"] },
  { id: "shoes", label: "Shoes", icon: "👠", cats: ["shoes"] },
  { id: "intimates", label: "Intimates", icon: "🩱", cats: ["bras_underwear"] },
];

export default function ClosetPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("rack");
  const [activeCat, setActiveCat] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<ClothingItem[]>({
    queryKey: ["/api/items"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/items"] }); toast({ title: "Added to closet!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/items"] }),
  });

  const section = SECTIONS.find(s => s.id === activeSection)!;
  const sectionItems = items.filter(item => section.cats.includes(item.category));

  // For rack: filter by subcategory pill
  const rackCatItems = activeSection === "rack" && activeCat !== "all"
    ? sectionItems.filter(i => i.category === activeCat)
    : sectionItems;

  const totalCount = items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif"}} className="text-3xl font-semibold text-foreground">
            My Closet
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} {totalCount === 1 ? "piece" : "pieces"} in your collection
          </p>
        </div>
        <Button data-testid="btn-add-item" onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            data-testid={`section-tab-${s.id}`}
            className={`cat-pill flex items-center gap-1.5 ${activeSection === s.id ? "active" : ""}`}
            onClick={() => { setActiveSection(s.id); setActiveCat("all"); }}
          >
            <span>{s.icon}</span> {s.label}
            <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5 h-4">
              {items.filter(i => s.cats.includes(i.category)).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Category filter for rack */}
      {activeSection === "rack" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ value: "all", label: "All" }, ...CATEGORIES.filter(c => RACK_CATS.includes(c.value))].map(c => (
            <button
              key={c.value}
              className={`cat-pill text-sm ${activeCat === c.value ? "active" : ""}`}
              onClick={() => setActiveCat(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="processing-shimmer w-full h-40 rounded-xl" />
        </div>
      ) : rackCatItems.length === 0 ? (
        <div
          className="upload-zone h-48 cursor-pointer"
          onClick={() => setUploadOpen(true)}
        >
          <span className="text-4xl">{section.icon}</span>
          <span className="text-muted-foreground font-medium">Nothing here yet</span>
          <span className="text-sm text-muted-foreground">Click to add your first item</span>
        </div>
      ) : activeSection === "rack" ? (
        /* ── Hanging Rack ─────────────────────────────────────────── */
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="relative px-8">
            {/* Rail */}
            <div className="rack-rail">
              <div className="rack-support" style={{ left: "0px" }} />
              <div className="rack-support" style={{ right: "0px" }} />
            </div>
          </div>
          <div className="rack-scroll mt-2">
            {rackCatItems.map(item => (
              <HangerItem
                key={item.id}
                item={item}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
            {/* Add button at end of rack */}
            <div
              className="hanger-item cursor-pointer opacity-50 hover:opacity-100"
              onClick={() => setUploadOpen(true)}
              data-testid="rack-add-btn"
            >
              <div className="hanger-hook" />
              <div className="hanger-bar" />
              <div className="garment-image bg-muted flex items-center justify-center text-3xl rounded">
                <Plus size={28} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Add</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Shelf Grid ────────────────────────────────────────────── */
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="shelf-grid">
            {rackCatItems.map(item => (
              <ShelfItem key={item.id} item={item} onDelete={() => deleteMutation.mutate(item.id)} />
            ))}
            <div
              className="shelf-item cursor-pointer opacity-50 hover:opacity-100"
              onClick={() => setUploadOpen(true)}
            >
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <Plus size={20} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Add</span>
            </div>
          </div>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={(data) => addMutation.mutate(data)}
      />
    </div>
  );
}
