import { trpc } from "@/lib/trpc";

type SiteConfigPayload = {
  phone_number?: string;
  phone_number_e164?: string;
  assistant_name?: string;
  assistant_title?: string;
};

const DEFAULT_PHONE_DISPLAY = "(904) 921-4971";
const DEFAULT_PHONE_E164 = "+19049214971";
const DEFAULT_ASSISTANT_NAME = "Grace Silver";
const DEFAULT_ASSISTANT_TITLE = "AI Executive Assistant";

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeE164(phoneE164: string, fallbackFromDisplay: string): string {
  const cleaned = phoneE164.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+") && cleaned.length >= 8) return cleaned;

  const digits = normalizePhoneDigits(fallbackFromDisplay);
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return DEFAULT_PHONE_E164;
}

export function useSiteConfig() {
  const query = trpc.content.getSiteConfig.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const cfg: SiteConfigPayload = query.data ?? {};
  const phoneDisplay = (cfg.phone_number || DEFAULT_PHONE_DISPLAY).trim();
  const phoneE164 = normalizeE164(
    (cfg.phone_number_e164 || "").trim(),
    phoneDisplay
  );
  const phoneDigits = normalizePhoneDigits(phoneE164);
  const assistantName = (cfg.assistant_name || DEFAULT_ASSISTANT_NAME).trim();
  const assistantTitle = (cfg.assistant_title || DEFAULT_ASSISTANT_TITLE).trim();

  return {
    ...query,
    phoneDisplay,
    phoneE164,
    phoneDigits,
    phoneHref: `tel:${phoneE164}`,
    smsHref: `sms:${phoneE164}`,
    assistantName,
    assistantTitle,
  };
}
