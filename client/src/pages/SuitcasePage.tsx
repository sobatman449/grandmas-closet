import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Luggage, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Suitcase, ClothingItem, Outfit } from "@shared/schema";

function NewSuitcaseModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!tripName.trim()) return;
    onSave({ tripName, destination, startDate, endDate, notes, itemIds: "[]", outfitIds: "[]" });
    setTripName(""); setDestination(""); setStartDate(""); setEndDate(""); setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.15rem",fontWeight:700}}>New Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Trip Name</Label>
            <Input data-testid="input-trip-name" value={tripName} onChange={e => setTripName(e.target.value)} placeholder="Beach Vacation 2025" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Destination</Label>
            <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Florida Keys" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Warm weather, 5 days..." rows={2} className="resize-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 justify-center" onClick={onClose}>Cancel</button>
            <button data-testid="btn-save-suitcase" className="btn-noir flex-1 justify-center" onClick={handleSave} disabled={!tripName.trim()} style={{opacity: !tripName.trim() ? 0.5 : 1}}>Create Trip</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PackModal({ open, onClose, suitcase, items, outfits, onUpdate }: {
  open: boolean;
  onClose: () => void;
  suitcase: Suitcase | null;
  items: ClothingItem[];
  outfits: Outfit[];
  onUpdate: (id: number, data: any) => void;
}) {
  const [tab, setTab] = useState<"items" | "outfits">("items");

  if (!suitcase) return null;
  const itemIds: number[] = JSON.parse(suitcase.itemIds || "[]");
  const outfitIds: number[] = JSON.parse(suitcase.outfitIds || "[]");

  const toggleItem = (id: number) => {
    const updated = itemIds.includes(id) ? itemIds.filter(i => i !== id) : [...itemIds, id];
    onUpdate(suitcase.id, { itemIds: JSON.stringify(updated) });
  };

  const toggleOutfit = (id: number) => {
    const updated = outfitIds.includes(id) ? outfitIds.filter(i => i !== id) : [...outfitIds, id];
    onUpdate(suitcase.id, { outfitIds: JSON.stringify(updated) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.15rem",fontWeight:700}}>
            Pack for {suitcase.tripName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <button className={`cat-pill ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>
            Individual Pieces ({itemIds.length})
          </button>
          <button className={`cat-pill ${tab === "outfits" ? "active" : ""}`} onClick={() => setTab("outfits")}>
            Whole Outfits ({outfitIds.length})
          </button>
        </div>

        {tab === "items" && (
          <div className="flex gap-3 flex-wrap">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Add items to your closet first</div>
            ) : items.map(item => {
              const packed = itemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  data-testid={`pack-item-${item.id}`}
                  onClick={() => toggleItem(item.id)}
                  className={`relative cursor-pointer rounded-xl border-2 p-2 flex flex-col items-center gap-1 transition-all
                    ${packed ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-contain rounded" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center text-xl">👕</div>
                  )}
                  <span className="text-xs max-w-[60px] truncate text-center">{item.name}</span>
                  {packed && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <Check size={10} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "outfits" && (
          <div className="grid grid-cols-1 gap-3">
            {outfits.length === 0 ? (
              <div className="text-sm text-muted-foreground">Build outfits first</div>
            ) : outfits.map(outfit => {
              const packed = outfitIds.includes(outfit.id);
              const oItemIds: number[] = JSON.parse(outfit.itemIds || "[]");
              const oItems = items.filter(i => oItemIds.includes(i.id));
              return (
                <div
                  key={outfit.id}
                  data-testid={`pack-outfit-${outfit.id}`}
                  onClick={() => toggleOutfit(outfit.id)}
                  className={`cursor-pointer rounded-xl border-2 p-3 flex items-center gap-3 transition-all
                    ${packed ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex gap-1">
                    {oItems.slice(0, 3).map(i => i.imageUrl ? (
                      <img key={i.id} src={i.imageUrl} alt={i.name} className="w-10 h-10 object-contain rounded bg-muted p-0.5" />
                    ) : (
                      <div key={i.id} className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg">👕</div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{outfit.name}</div>
                    <div className="text-xs text-muted-foreground">{oItems.length} pieces · {outfit.occasion}</div>
                  </div>
                  {packed && <Check size={18} className="text-primary flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={onClose} className="btn-noir w-full mt-4 justify-center">Done Packing</button>
      </DialogContent>
    </Dialog>
  );
}

export default function SuitcasePage() {
  const [newOpen, setNewOpen] = useState(false);
  const [packingSuitcase, setPackingSuitcase] = useState<Suitcase | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suitcases = [] } = useQuery<Suitcase[]>({ queryKey: ["/api/suitcases"] });
  const { data: items = [] } = useQuery<ClothingItem[]>({ queryKey: ["/api/items"] });
  const { data: outfits = [] } = useQuery<Outfit[]>({ queryKey: ["/api/outfits"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/suitcases", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/suitcases"] }); toast({ title: "Trip created!" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/suitcases/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suitcases"] });
      // Update local state for the modal
      if (packingSuitcase) {
        data.json().then((updated: Suitcase) => setPackingSuitcase(updated));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suitcases/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/suitcases"] }),
  });

  const handleUpdate = (id: number, data: any) => {
    updateMutation.mutate({ id, data });
    // Optimistically update local modal state
    if (packingSuitcase && packingSuitcase.id === id) {
      setPackingSuitcase(prev => prev ? { ...prev, ...data } : prev);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Suitcases</h1>
          <p className="page-subtitle">Plan what to pack for every trip</p>
        </div>
        <button data-testid="btn-new-trip" onClick={() => setNewOpen(true)} className="btn-noir">
          <Plus size={15} /> New Trip
        </button>
      </div>

      {suitcases.length === 0 ? (
        <div className="upload-zone h-48 cursor-pointer" onClick={() => setNewOpen(true)}>
          <span className="text-4xl">🧳</span>
          <span className="text-muted-foreground font-medium">No trips planned yet</span>
          <span className="text-sm text-muted-foreground">Click to start packing</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suitcases.map(sc => {
            const itemIds: number[] = JSON.parse(sc.itemIds || "[]");
            const outfitIds: number[] = JSON.parse(sc.outfitIds || "[]");
            const packedItems = items.filter(i => itemIds.includes(i.id));

            return (
              <div key={sc.id} data-testid={`suitcase-card-${sc.id}`} className="editorial-card space-y-3 group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.05rem",fontWeight:700,letterSpacing:"-0.01em"}}>{sc.tripName}</h3>
                    {sc.destination && <p className="text-sm text-muted-foreground">{sc.destination}</p>}
                    {(sc.startDate || sc.endDate) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sc.startDate} {sc.endDate ? `→ ${sc.endDate}` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    data-testid={`delete-suitcase-${sc.id}`}
                    onClick={() => deleteMutation.mutate(sc.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Packed preview */}
                <div className="suitcase-grid">
                  {packedItems.slice(0, 8).map(item => (
                    <div key={item.id} className="suitcase-slot">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <span className="text-xl">👕</span>
                      )}
                    </div>
                  ))}
                  {packedItems.length === 0 && (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-2">Empty suitcase</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {itemIds.length} item{itemIds.length !== 1 ? "s" : ""} · {outfitIds.length} outfit{outfitIds.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    data-testid={`btn-pack-${sc.id}`}
                    className="btn-ghost"
                    style={{padding:"6px 12px",fontSize:11}}
                    onClick={() => setPackingSuitcase(sc)}
                  >
                    Pack Suitcase
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewSuitcaseModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={(data) => createMutation.mutate(data)}
      />

      <PackModal
        open={!!packingSuitcase}
        onClose={() => setPackingSuitcase(null)}
        suitcase={packingSuitcase}
        items={items}
        outfits={outfits}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
