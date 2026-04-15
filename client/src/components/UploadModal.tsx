import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { removeBackground, fileToDataUrl } from "@/lib/bgRemove";
import { useToast } from "@/hooks/use-toast";
import { Upload, ImageIcon } from "lucide-react";

export const CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses & Suits" },
  { value: "shoes", label: "Shoes" },
  { value: "handbags", label: "Handbags" },
  { value: "jewelry", label: "Jewelry" },
  { value: "bras_underwear", label: "Bras & Underwear" },
  { value: "accessories", label: "Accessories" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: string;
    color: string;
    imageUrl: string;
    originalImageUrl: string;
  }) => void;
}

export default function UploadModal({ open, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tops");
  const [color, setColor] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrag, setIsDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    setFile(f);
    const orig = await fileToDataUrl(f);
    setPreview(orig);
    setProcessed(null);
    setProgress(0);
    setName(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleProcess = async () => {
    if (!file || !preview) return;
    setIsProcessing(true);
    try {
      const result = await removeBackground(file, setProgress);
      setProcessed(result);
      toast({ title: "Background removed!", description: "Looking great." });
    } catch (e) {
      toast({ title: "Background removal failed", description: "Using original image instead.", variant: "destructive" });
      setProcessed(preview);
    }
    setIsProcessing(false);
  };

  const handleSave = () => {
    if (!processed && !preview) return;
    onSave({
      name: name || "Untitled Item",
      category,
      color,
      imageUrl: processed || preview!,
      originalImageUrl: preview!,
    });
    resetState();
    onClose();
  };

  const resetState = () => {
    setFile(null); setPreview(null); setProcessed(null);
    setName(""); setColor(""); setProgress(0); setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetState(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{fontFamily:"'Cormorant Garamond',serif"}} className="text-xl">Add to Closet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            data-testid="upload-dropzone"
            className={`upload-zone h-40 ${isDrag ? "dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={(e) => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {preview ? (
              <img src={processed || preview} alt="preview" className="max-h-32 object-contain rounded" />
            ) : (
              <>
                <Upload size={28} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Drop photo here or click to browse</span>
              </>
            )}
          </div>

          {/* BG removal */}
          {preview && !processed && (
            <div className="space-y-2">
              {isProcessing ? (
                <>
                  <div className="text-xs text-muted-foreground text-center">Removing background… {progress}%</div>
                  <Progress value={progress} className="h-1.5" />
                </>
              ) : (
                <Button data-testid="btn-remove-bg" onClick={handleProcess} variant="outline" size="sm" className="w-full">
                  <ImageIcon size={14} className="mr-2" /> Remove Background
                </Button>
              )}
            </div>
          )}

          {processed && (
            <div className="text-xs text-center text-green-600 font-medium">✓ Background removed</div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Blue blouse" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input data-testid="input-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Dusty rose" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => { resetState(); onClose(); }} className="flex-1">Cancel</Button>
            <Button
              data-testid="btn-save-item"
              onClick={handleSave}
              disabled={!preview || isProcessing}
              className="flex-1"
            >
              Add to Closet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
