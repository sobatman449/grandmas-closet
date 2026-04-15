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
      className="fixed bottom-5 right-5 z-50 w-80 shadow-2xl overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))", borderRadius: 2, background: "hsl(var(--card))", animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* Header bar — noir masthead style */}
      <div
        style={{
          background: "hsl(var(--foreground))",
          color: "hsl(var(--background))",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={13} />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
            }}
          >
            What's New
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "hsl(var(--background) / 0.7)", cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <X size={14} />
        </button>
      </div>
      {/* Gold rule */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700 }}>{version}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground leading-snug">
              <span style={{ color: "var(--gold)", marginTop: 2, flexShrink: 0 }}>✦</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setVisible(false)}
          style={{
            width: "100%",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "hsl(var(--muted-foreground))",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            textAlign: "center" as const,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
