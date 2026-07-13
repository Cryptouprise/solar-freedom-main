import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// The Manus development runtime only needs route patterns. Enumerating every
// city, company, and article here pulled the complete content catalogs into the
// production entry bundle and eagerly downloaded all article bodies on every
// page view.
if (import.meta.env.DEV && typeof window !== "undefined") {
  const w = window as any;
  if (!w.__WOUTER_ROUTES__) {
    w.__WOUTER_ROUTES__ = [];
  }

  const registerRoute = (route: string) => {
    if (!w.__WOUTER_ROUTES__.includes(route)) w.__WOUTER_ROUTES__.push(route);
  };

  [
    "/",
    "/404",
    "/blog",
    "/how-it-works",
    "/seo-command-center",
    "/solar-contract-help",
    "/solar-panel-scam",
    "/solar-exit-options",
    "/solar-contract-laws",
    "/selling-house-with-solar",
    "/solar-lien-removal",
    "/solar-loan-help",
    "/solar-companies",
    "/sunrun",
    "/media",
    "/sitemap",
    "/privacy-policy",
    "/terms",
    "/cancel-solar-contract/:slug",
    "/cancel-:slug-solar-contract",
    "/blog/:slug",
    "/solar-contract-laws/:state",
  ].forEach(registerRoute);
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
    if (import.meta.env.DEV) console.error("[API] Query failed");
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (import.meta.env.DEV) console.error("[API] Mutation failed");
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
