import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import ClosetPage from "./pages/ClosetPage";
import OutfitsPage from "./pages/OutfitsPage";
import SuitcasePage from "./pages/SuitcasePage";
import TryOnPage from "./pages/TryOnPage";
import WhatsNewBanner from "./components/WhatsNewBanner";
import InstallBanner from "./components/InstallBanner";
import FeedbackButton from "./components/FeedbackButton";

const NAV_LINKS = [
  { href: "/",          label: "Closet"    },
  { href: "/outfits",   label: "Outfits"   },
  { href: "/suitcases", label: "Suitcases" },
  { href: "/tryon",     label: "Try-On"    },
];

function Masthead() {
  const [location] = useLocation();
  return (
    <header className="masthead sticky top-0 z-40">
      <div className="masthead-inner">
        {/* Wordmark */}
        <div className="masthead-wordmark">
          {/* Inline SVG logo: minimal gold hanger mark */}
          <svg aria-label="My Closet" viewBox="0 0 28 28" width="22" height="22" fill="none">
            <circle cx="14" cy="7" r="3.5" stroke="#C9A84C" strokeWidth="1.5"/>
            <line x1="14" y1="10.5" x2="14" y2="15" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4"  y1="15"   x2="24" y2="15"  stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4"  y1="15"   x2="6"  y2="20"  stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="24" y1="15"   x2="22" y2="20"  stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          My Closet
        </div>

        {/* Nav */}
        <nav className="masthead-nav">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}>
              <button
                data-testid={`nav-${l.href.replace("/", "") || "home"}`}
                className={`nav-link ${location === l.href ? "active" : ""}`}
              >
                {l.label}
              </button>
            </Link>
          ))}
        </nav>
      </div>
      {/* Thin gold rule under nav */}
      <div className="gold-rule" />
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <div className="min-h-dvh bg-background">
          <Masthead />
          <main
            className="max-w-5xl mx-auto px-6 py-8"
            style={{ paddingLeft: "max(1.5rem, env(safe-area-inset-left))", paddingRight: "max(1.5rem, env(safe-area-inset-right))" }}
          >
            <Switch>
              <Route path="/"          component={ClosetPage}   />
              <Route path="/outfits"   component={OutfitsPage}  />
              <Route path="/suitcases" component={SuitcasePage} />
              <Route path="/tryon"     component={TryOnPage}    />
            </Switch>
          </main>
        </div>
        <FeedbackButton />
        <WhatsNewBanner />
        <InstallBanner />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
