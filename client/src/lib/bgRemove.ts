// In-browser background removal using @imgly/background-removal
// No API calls, no server — fully private, runs locally in the browser via WASM/WebGPU

let removeBackgroundFn: ((src: string | Blob) => Promise<Blob>) | null = null;

async function getRemoveBg() {
  if (!removeBackgroundFn) {
    const mod = await import("@imgly/background-removal");
    removeBackgroundFn = mod.removeBackground;
  }
  return removeBackgroundFn;
}

export async function removeBackground(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  onProgress?.(5);
  const removeBg = await getRemoveBg();
  onProgress?.(20);

  const blob = await removeBg(file, {
    progress: (_key: string, current: number, total: number) => {
      const pct = 20 + Math.round((current / total) * 70);
      onProgress?.(Math.min(pct, 90));
    },
  });
  onProgress?.(95);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
