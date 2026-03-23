import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { cities as CITIES, CityData } from "./data/cities";
import { blogPosts } from "./data/blog";
import { companies } from "./data/companies";

// Pre-register all city routes so the Manus runtime recognizes them immediately
// This prevents the runtime from treating city URLs as 404s before React hydrates
if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__WOUTER_ROUTES__) {
    w.__WOUTER_ROUTES__ = [];
  }
  // Register static routes
  ['/', '/404', '/blog', '/seo-command-center', '/solar-fraud-report'].forEach((r: string) => {
    if (!w.__WOUTER_ROUTES__.includes(r)) w.__WOUTER_ROUTES__.push(r);
  });
  // Register all 50 city routes with the correct URL structure
  CITIES.forEach((city: CityData) => {
    const route = `/cancel-solar-contract/${city.slug}`;
    if (!w.__WOUTER_ROUTES__.includes(route)) {
      w.__WOUTER_ROUTES__.push(route);
    }
  });
  // Register all company routes
  companies.forEach(company => {
    const route = `/cancel-${company.slug}-solar-contract`;
    if (!w.__WOUTER_ROUTES__.includes(route)) {
      w.__WOUTER_ROUTES__.push(route);
    }
  });
  // Register all blog post routes
  blogPosts.forEach(post => {
    const route = `/blog/${post.slug}`;
    if (!w.__WOUTER_ROUTES__.includes(route)) {
      w.__WOUTER_ROUTES__.push(route);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
