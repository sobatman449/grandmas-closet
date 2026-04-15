import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when NOT already installed as a PWA
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = (navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("install-banner-dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("install-banner-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-3"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none mt-0.5">👗</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Add My Closet to your Home Screen</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Tap <Share size={11} className="inline mx-0.5 text-blue-500" /> <strong>Share</strong> then <strong>Add to Home Screen</strong> for the full app experience.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Little arrow pointing at the share button */}
      <div
        style={{
          position: "absolute",
          bottom: "max(0.5rem, env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid hsl(var(--border))",
          marginTop: "6px",
        }}
      />
    </div>
  );
}
