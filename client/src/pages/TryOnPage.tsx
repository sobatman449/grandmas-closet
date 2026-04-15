import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Upload, User, Trash2, RotateCcw, Plus } from "lucide-react";
import { removeBackground, fileToDataUrl } from "@/lib/bgRemove";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type { ClothingItem, AvatarPhoto } from "@shared/schema";

interface Overlay {
  id: string;
  itemId: number;
  imageUrl: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function DraggableOverlay({
  overlay, selected, onSelect, onChange, onDelete
}: {
  overlay: Overlay;
  selected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<Overlay>) => void;
  onDelete: () => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startOX: overlay.x, startOY: overlay.y
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onChange({
        x: dragRef.current.startOX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.startOY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: overlay.width, startH: overlay.height
    };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const newW = Math.max(40, resizeRef.current.startW + (ev.clientX - resizeRef.current.startX));
      const newH = Math.max(40, resizeRef.current.startH + (ev.clientY - resizeRef.current.startY));
      onChange({ width: newW, height: newH });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onSelect();
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX, startY: touch.clientY,
      startOX: overlay.x, startOY: overlay.y
    };
    const onMove = (ev: TouchEvent) => {
      if (!dragRef.current) return;
      const t = ev.touches[0];
      onChange({
        x: dragRef.current.startOX + (t.clientX - dragRef.current.startX),
        y: dragRef.current.startOY + (t.clientY - dragRef.current.startY),
      });
    };
    const onEnd = () => { dragRef.current = null; window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  return (
    <div
      data-testid={`overlay-${overlay.id}`}
      className="overlay-item"
      style={{ left: overlay.x, top: overlay.y, width: overlay.width, height: overlay.height, zIndex: selected ? 20 : 10 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img src={overlay.imageUrl} alt={overlay.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      {selected && (
        <>
          <div
            className="resize-handle"
            onMouseDown={handleResizeDown}
          />
          <div
            className="delete-handle"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            ×
          </div>
        </>
      )}
    </div>
  );
}

export default function TryOnPage() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [avatarBgProgress, setAvatarBgProgress] = useState(0);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [activeAvatarId, setActiveAvatarId] = useState<number | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: avatars = [] } = useQuery<AvatarPhoto[]>({ queryKey: ["/api/avatars"] });
  const { data: items = [] } = useQuery<ClothingItem[]>({ queryKey: ["/api/items"] });

  const createAvatarMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/avatars", data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/avatars"] });
      res.json().then((avatar: AvatarPhoto) => setActiveAvatarId(avatar.id));
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/avatars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avatars"] });
      setActiveAvatarId(null);
    },
  });

  const activeAvatar = avatars.find(a => a.id === activeAvatarId) || avatars[0] || null;

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    setIsProcessingAvatar(true);
    setAvatarBgProgress(0);
    try {
      const original = await fileToDataUrl(file);
      const processed = await removeBackground(file, setAvatarBgProgress);
      createAvatarMutation.mutate({
        name: file.name.replace(/\.[^/.]+$/, ""),
        imageUrl: processed,
        originalImageUrl: original,
      });
      toast({ title: "Photo added!" });
    } catch {
      toast({ title: "Processing failed", variant: "destructive" });
    }
    setIsProcessingAvatar(false);
  };

  const addOverlay = (item: ClothingItem) => {
    const id = `overlay-${Date.now()}`;
    const newOverlay: Overlay = {
      id,
      itemId: item.id,
      imageUrl: item.imageUrl || "",
      name: item.name,
      x: 20 + Math.random() * 40,
      y: 60 + Math.random() * 40,
      width: 120,
      height: 140,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setSelectedId(id);
    setShowItemPicker(false);
  };

  const updateOverlay = (id: string, updates: Partial<Overlay>) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const itemsWithImages = items.filter(i => i.imageUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Try It On</h1>
          <p className="page-subtitle">See how your pieces look on you</p>
        </div>
        <div className="flex gap-2">
          {overlays.length > 0 && (
            <button className="btn-ghost" style={{padding:"6px 12px",fontSize:11,gap:6,display:"inline-flex",alignItems:"center"}} onClick={() => setOverlays([])}>
              <RotateCcw size={13} /> Clear
            </button>
          )}
          <button
            data-testid="btn-add-overlay"
            className="btn-noir"
            style={{padding:"6px 14px"}}
            onClick={() => setShowItemPicker(true)}
            disabled={!activeAvatar}
          >
            <Plus size={13} /> Add Piece
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div
            ref={canvasRef}
            className="tryon-canvas-wrapper bg-card border border-border rounded-xl w-full overflow-hidden relative"
            style={{ minHeight: 480 }}
            onClick={() => setSelectedId(null)}
          >
            {activeAvatar ? (
              <>
                <img
                  src={activeAvatar.imageUrl}
                  alt="You"
                  className="w-full object-contain"
                  style={{ maxHeight: 480, margin: "0 auto", display: "block" }}
                  draggable={false}
                />
                {overlays.map(ov => (
                  <DraggableOverlay
                    key={ov.id}
                    overlay={ov}
                    selected={selectedId === ov.id}
                    onSelect={() => setSelectedId(ov.id)}
                    onChange={(updates) => updateOverlay(ov.id, updates)}
                    onDelete={() => deleteOverlay(ov.id)}
                  />
                ))}
                {overlays.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-muted-foreground bg-card/80 backdrop-blur px-4 py-3 rounded-xl">
                      <p className="text-sm font-medium">Add pieces from your closet</p>
                      <p className="text-xs mt-1">Drag them into position, resize to fit</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                className="upload-zone cursor-pointer h-80"
                onClick={() => avatarInputRef.current?.click()}
              >
                <User size={40} className="text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Upload a photo of yourself</span>
                <span className="text-sm text-muted-foreground text-center max-w-xs">
                  Background will be removed automatically — only you will show
                </span>
                {isProcessingAvatar && <Progress value={avatarBgProgress} className="w-40 h-1.5" />}
              </div>
            )}
          </div>

          {selectedId && (
            <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg py-2">
              Drag to move · Drag the pink dot to resize · × to remove
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Photos */}
          <div className="editorial-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"hsl(var(--foreground))"}}>My Photos</h3>
              <button
                data-testid="btn-upload-avatar"
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Upload size={12} /> Add
              </button>
            </div>
            <input
              ref={avatarInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
            />
            {isProcessingAvatar && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Removing background… {avatarBgProgress}%</div>
                <Progress value={avatarBgProgress} className="h-1" />
              </div>
            )}
            {avatars.length === 0 ? (
              <div className="text-xs text-muted-foreground">No photos yet</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {avatars.map(av => (
                  <div
                    key={av.id}
                    data-testid={`avatar-thumb-${av.id}`}
                    className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
                      ${activeAvatarId === av.id || (!activeAvatarId && av === avatars[0]) ? "border-primary" : "border-border"}`}
                    onClick={() => setActiveAvatarId(av.id)}
                  >
                    <img src={av.imageUrl} alt={av.name} className="w-16 h-20 object-contain bg-muted" />
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAvatarMutation.mutate(av.id); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-destructive text-white rounded-full text-xs flex items-center justify-center"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clothing on canvas */}
          {overlays.length > 0 && (
            <div className="editorial-card space-y-3">
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"hsl(var(--foreground))"}}>On Canvas</h3>
              <div className="space-y-2">
                {overlays.map(ov => (
                  <div key={ov.id} className="flex items-center gap-2 group">
                    <img src={ov.imageUrl} alt={ov.name} className="w-8 h-8 object-contain rounded bg-muted p-0.5" />
                    <span className="text-xs flex-1 truncate">{ov.name}</span>
                    <button
                      onClick={() => deleteOverlay(ov.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick-add from closet */}
          {showItemPicker && (
            <div className="editorial-card space-y-3" style={{borderColor:"var(--gold)",borderWidth:1}}>
              <div className="flex items-center justify-between">
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"hsl(var(--foreground))"}}>Pick a Piece</h3>
                <button onClick={() => setShowItemPicker(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              </div>
              {itemsWithImages.length === 0 ? (
                <div className="text-xs text-muted-foreground">Add items with photos to your closet first</div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {itemsWithImages.map(item => (
                    <div
                      key={item.id}
                      data-testid={`add-overlay-${item.id}`}
                      onClick={() => addOverlay(item)}
                      className="cursor-pointer rounded-lg border border-border hover:border-primary p-1 flex flex-col items-center gap-1 transition-all hover:bg-primary/5"
                    >
                      <img src={item.imageUrl!} alt={item.name} className="w-12 h-12 object-contain rounded" />
                      <span className="text-xs max-w-[50px] truncate text-center">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
