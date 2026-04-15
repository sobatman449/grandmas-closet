import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/feedback", { body: trimmed });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Note sent!", description: "Thank you — your feedback has been logged." });
      setMessage("");
      setOpen(false);
    } catch {
      toast({ title: "Couldn't send feedback", description: "Check your connection and try again.", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <>
      {/* FAB trigger */}
      <button
        data-testid="btn-feedback-fab"
        className="feedback-fab"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        title="Send a note to Justin"
      >
        <MessageSquare size={17} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start p-5"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel — bottom-left anchored, above the FAB */}
          <div
            className="relative w-80 rounded-none shadow-2xl overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "2px",
              marginLeft: "0",
              marginBottom: "3.5rem",
              animation: "feedbackSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <style>{`
              @keyframes feedbackSlideUp {
                from { opacity:0; transform:translateY(12px); }
                to   { opacity:1; transform:translateY(0); }
              }
            `}</style>

            {/* Header */}
            <div
              style={{
                background: "hsl(var(--foreground))",
                color: "hsl(var(--background))",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={14} />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Send a Note
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "hsl(var(--background) / 0.7)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Gold rule */}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

            {/* Body */}
            <div style={{ padding: "16px" }}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: "hsl(var(--muted-foreground))",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Found a bug? Have a wish? Tell Justin —
                <br />it goes straight to his to-do list.
              </p>

              <textarea
                data-testid="feedback-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="The shoes section needs a filter by color..."
                rows={4}
                style={{
                  width: "100%",
                  background: "hsl(var(--muted) / 0.4)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "2px",
                  padding: "10px 12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "hsl(var(--foreground))",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.5,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--gold)"; }}
                onBlur={(e) => { e.target.style.borderColor = "hsl(var(--border))"; }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }}
              />

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  color: "hsl(var(--muted-foreground))",
                  letterSpacing: "0.06em",
                  marginTop: 6,
                  marginBottom: 12,
                }}
              >
                ⌘↵ to send
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  data-testid="btn-send-feedback"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="btn-noir"
                  style={{ flex: 1, justifyContent: "center", opacity: !message.trim() || sending ? 0.5 : 1 }}
                >
                  {sending ? (
                    <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Send size={13} />
                  )}
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
