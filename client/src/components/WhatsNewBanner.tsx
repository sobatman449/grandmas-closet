import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Sparkles } from "lucide-react";

interface ChangelogData {
  version: string;
  date: string;
  bullets: string[];
}

interface WhatsNewResponse {
  updated: boolean;
  changelog: ChangelogData | null;
}

export default function WhatsNewBanner() {
  const [visible, setVisible] = useState(false);

  const { data } = useQuery<WhatsNewResponse>({
    queryKey: ["/api/whats-new"],
    // Only fetch once on mount — the server clears the flag after the first read
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (data?.updated && data?.changelog) {
      // Small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (!visible || !data?.changelog) return null;

  const { version, date, bullets } = data.changelog;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl shadow-xl border border-border bg-card overflow-hidden"
      style={{ animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span
            className="text-sm font-semibold text-primary"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            What's New
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-0.5"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-foreground">{version}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground leading-snug">
              <span className="text-primary mt-0.5 flex-shrink-0">✦</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setVisible(false)}
          className="w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors py-1"
        >
          Got it — close
        </button>
      </div>
    </div>
  );
}
