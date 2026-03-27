import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
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

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
