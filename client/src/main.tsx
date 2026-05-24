import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { cities } from "./data/cities";
import { companies } from "./data/companies";

// Register known routes for the Manus runtime without making the initial JS bundle
// parse the full city/company/blog content library before the app becomes usable.
if (typeof window !== 'undefined') {
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
    "/seo-command-center",
    "/solar-fraud-report",
    "/solar-contract-help",
    "/solar-panel-scam",
    "/solar-exit-options",
    "/solar-contract-laws",
    "/selling-house-with-solar",
    "/solar-lien-removal",
    "/solar-loan-help",
    "/solar-companies",
    "/sunrun",
  ].forEach(registerRoute);

  cities.forEach((city) => registerRoute(`/cancel-solar-contract/${city.slug}`));
  companies.forEach((company) =>
    registerRoute(`/cancel-${company.slug}-solar-contract`)
  );

  void import("./data/blog").then((blogModule) => {
    blogModule.blogPosts.forEach((post) => registerRoute(`/blog/${post.slug}`));
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
