import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CITIES } from "./data/cities";

// Pre-register all city routes so the Manus runtime recognizes them immediately
// This prevents the runtime from treating city URLs as 404s before React hydrates
if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__WOUTER_ROUTES__) {
    w.__WOUTER_ROUTES__ = [];
  }
  // Register static routes
  ['/', '/404'].forEach((r: string) => {
    if (!w.__WOUTER_ROUTES__.includes(r)) w.__WOUTER_ROUTES__.push(r);
  });
  // Register all 50 city routes with the correct URL structure
  CITIES.forEach(city => {
    const route = `/cancel-solar-contract/${city.slug}`;
    if (!w.__WOUTER_ROUTES__.includes(route)) {
      w.__WOUTER_ROUTES__.push(route);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
