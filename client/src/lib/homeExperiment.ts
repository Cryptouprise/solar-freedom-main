import { HOME_EXPERIMENT, HOME_FORM_VARIANTS, isHomeFormVariant, type HomeFormVariant } from "@shared/homeExperiment";
import { trackEvent } from "./analytics";

let assignment: HomeFormVariant | undefined;
const KEY = `sf_${HOME_EXPERIMENT}`;

export function getHomeFormVariant(): HomeFormVariant {
  if (assignment) return assignment;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (isHomeFormVariant(stored)) return (assignment = stored);
  } catch { /* Storage may be blocked; keep this page's assignment in memory. */ }
  const random = new Uint32Array(1);
  window.crypto.getRandomValues(random);
  assignment = HOME_FORM_VARIANTS[random[0] < 0x80000000 ? 0 : 1];
  try { window.localStorage.setItem(KEY, assignment); } catch { /* Optional storage. */ }
  return assignment;
}

export function getExperimentSessionId(): string | undefined {
  try {
    let id = window.localStorage.getItem("sf_session_id");
    if (!id) {
      id = `sf_${window.crypto.randomUUID()}`;
      window.localStorage.setItem("sf_session_id", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function recordHomeExposure(formName: HomeFormVariant) {
  trackEvent("experiment_exposure", { experiment_id: HOME_EXPERIMENT, form_name: formName, page_path: "/" });
  const sessionId = getExperimentSessionId();
  if (!sessionId) return;
  void fetch("/api/journey/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "experiment_exposure",
      sessionId,
      page: "/",
      detail: JSON.stringify({ experimentId: HOME_EXPERIMENT, formName }),
    }),
    keepalive: true,
  }).catch(() => { /* Measurement must not block intake. */ });
}
