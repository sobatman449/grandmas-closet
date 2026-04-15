import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Shirt, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Outfit, ClothingItem } from "@shared/schema";

const OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "work", label: "Work" },
  { value: "formal", label: "Formal" },
  { value: "travel", label: "Travel" },
  { value: "special", label: "Special Event" },
];

function OutfitCard({ outfit, items, onDelete }: { outfit: Outfit; items: ClothingItem[]; onDelete: () => void }) {
  const ids: number[] = JSON.parse(outfit.itemIds || "[]");
  const pieces = items.filter(i => ids.includes(i.id));

  return (
    <div data-testid={`outfit-card-${outfit.id}`} className="editorial-card space-y-3 group">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.05rem",fontWeight:700,letterSpacing:"-0.01em"}}>{outfit.name}</h3>
          {outfit.occasion && (
            <Badge variant="secondary" className="mt-1 text-xs">{outfit.occasion}</Badge>
          )}
        </div>
        <button
          data-testid={`delete-outfit-${outfit.id}`}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Mini rack */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pieces.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No pieces selected</div>
        ) : pieces.map(item => (
          <div key={item.id} className="flex-shrink-0 flex flex-col items-center gap-1">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-14 h-16 object-contain rounded bg-muted p-1" />
            ) : (
              <div className="w-14 h-16 rounded bg-muted flex items-center justify-center text-xl">
                {item.category === "tops" ? "👕" : item.category === "bottoms" ? "👖" : item.category === "shoes" ? "👠" : "👗"}
              </div>
            )}
            <span className="text-xs text-muted-foreground max-w-[56px] truncate">{item.name}</span>
          </div>
        ))}
      </div>

      {outfit.notes && (
        <p className="text-xs text-muted-foreground border-t border-border pt-2">{outfit.notes}</p>
      )}
    </div>
  );
}

function BuildOutfitModal({ open, onClose, items, onSave }: {
  open: boolean;
  onClose: () => void;
  items: ClothingItem[];
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("casual");
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, occasion, notes, itemIds: JSON.stringify(selectedIds) });
    setName(""); setOccasion("casual"); setNotes(""); setSelectedIds([]);
    onClose();
  };

  const groupedItems: Record<string, ClothingItem[]> = {};
  items.forEach(item => {
    if (!groupedItems[item.category]) groupedItems[item.category] = [];
    groupedItems[item.category].push(item);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.15rem",fontWeight:700}}>Build an Outfit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Outfit Name</Label>
              <Input data-testid="input-outfit-name" value={name} onChange={e => setName(e.target.value)} placeholder="Sunday Brunch" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Occasion</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Wear with gold earrings" />
          </div>

          {/* Piece picker */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Pick Your Pieces</Label>
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Add items to your closet first
              </div>
            ) : (
              Object.entries(groupedItems).map(([cat, catItems]) => (
                <div key={cat} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cat.replace(/_/g," ")}</div>
                  <div className="flex gap-2 flex-wrap">
                    {catItems.map(item => {
                      const selected = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          data-testid={`pick-item-${item.id}`}
                          onClick={() => toggle(item.id)}
                          className={`relative cursor-pointer rounded-lg border-2 transition-all p-1 flex flex-col items-center gap-1
                            ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-contain rounded" />
                          ) : (
                            <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xl">👕</div>
                          )}
                          <span className="text-xs max-w-[60px] truncate text-center">{item.name}</span>
                          {selected && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                              <Check size={10} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-muted-foreground">{selectedIds.length} piece{selectedIds.length !== 1 ? "s" : ""} selected</div>

          <div className="flex gap-2">
            <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Cancel</button>
            <button
              data-testid="btn-save-outfit"
              className="btn-noir flex-1 justify-center"
              onClick={handleSave}
              disabled={!name.trim()}
              style={{opacity: !name.trim() ? 0.5 : 1}}
            >
              Save Outfit
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OutfitsPage() {
  const [buildOpen, setBuildOpen] = useState(false);
  const [filterOccasion, setFilterOccasion] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: outfits = [] } = useQuery<Outfit[]>({ queryKey: ["/api/outfits"] });
  const { data: items = [] } = useQuery<ClothingItem[]>({ queryKey: ["/api/items"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/outfits", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/outfits"] }); toast({ title: "Outfit saved!" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/outfits/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/outfits"] }),
  });

  const filtered = filterOccasion === "all" ? outfits : outfits.filter(o => o.occasion === filterOccasion);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Outfits</h1>
          <p className="page-subtitle">{outfits.length} {outfits.length === 1 ? "look" : "looks"} assembled</p>
        </div>
        <button data-testid="btn-new-outfit" onClick={() => setBuildOpen(true)} className="btn-noir">
          <Plus size={15} /> New Outfit
        </button>
      </div>

      {/* Occasion filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "all", label: "All" }, ...OCCASIONS].map(o => (
          <button
            key={o.value}
            className={`cat-pill ${filterOccasion === o.value ? "active" : ""}`}
            onClick={() => setFilterOccasion(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="upload-zone h-48 cursor-pointer"
          onClick={() => setBuildOpen(true)}
        >
          <Shirt size={36} className="text-muted-foreground" />
          <span className="text-muted-foreground font-medium">No outfits yet</span>
          <span className="text-sm text-muted-foreground">Click to assemble your first look</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(outfit => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={items}
              onDelete={() => deleteMutation.mutate(outfit.id)}
            />
          ))}
        </div>
      )}

      <BuildOutfitModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        items={items}
        onSave={(data) => createMutation.mutate(data)}
      />
    </div>
  );
}
