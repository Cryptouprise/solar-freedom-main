import { refreshGscPageMetrics } from "../server/gscRefresh.ts";

const refreshed = await refreshGscPageMetrics();
console.log(JSON.stringify({
  refreshedAt: new Date().toISOString(),
  ...refreshed,
}, null, 2));
