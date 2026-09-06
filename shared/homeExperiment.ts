export const HOME_EXPERIMENT = "home_intake_v1";
export const HOME_FORM_VARIANTS = [
  "home_intake_v1_five_step",
  "home_intake_v1_callback",
] as const;
export type HomeFormVariant = (typeof HOME_FORM_VARIANTS)[number];
export const CALLBACK_SCOPE = "requested_callback_only_v1";
export const CALLBACK_CONSENT_TEXT = "I request a call from Solar Freedom about my solar contract. This permits only my requested callback, not marketing calls, texts, or emails.";

export function isHomeFormVariant(value: unknown): value is HomeFormVariant {
  return HOME_FORM_VARIANTS.includes(value as HomeFormVariant);
}
