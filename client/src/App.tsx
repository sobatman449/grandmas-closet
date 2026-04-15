import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import ClosetPage from "./pages/ClosetPage";
import WhatsNewBanner from "./components/WhatsNewBanner";
import OutfitsPage from "./pages/OutfitsPage";
import SuitcasePage from "./pages/SuitcasePage";
import TryOnPage from "./pages/TryOnPage";

function Nav() {
  const [location] = useLocation();
  const links = [
    { href: "/", label: "My Closet", icon: "👗" },
    { href: "/outfits", label: "Outfits", icon: "✨" },
    { href: "/suitcases", label: "Suitcases", icon: "🧳" },
    { href: "/tryon", label: "Try-On", icon: "🪞" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <svg aria-label="My Closet" viewBox="0 0 32 32" width="28" height="28" fill="none">
            <rect x="4" y="14" width="24" height="14" rx="3" fill="hsl(340,35%,45%)" opacity="0.15" stroke="hsl(340,35%,45%)" strokeWidth="1.5"/>
            <line x1="16" y1="2" x2="16" y2="14" stroke="hsl(40,70%,55%)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 6 Q16 2 20 6" stroke="hsl(40,70%,55%)" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <line x1="4" y1="14" x2="28" y2="14" stroke="hsl(40,70%,55%)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="font-display text-lg font-semibold text-primary" style={{fontFamily:"'Cormorant Garamond',serif"}}>My Closet</span>
        </div>
        <nav className="flex gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}>
              <button
                data-testid={`nav-${l.href.replace("/","") || "home"}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${location === l.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <div className="min-h-dvh bg-background">
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6">
            <Switch>
              <Route path="/" component={ClosetPage} />
              <Route path="/outfits" component={OutfitsPage} />
              <Route path="/suitcases" component={SuitcasePage} />
              <Route path="/tryon" component={TryOnPage} />
            </Switch>
          </main>
        </div>
      </Router>
      <WhatsNewBanner />
      <Toaster />
    </QueryClientProvider>
  );
}
