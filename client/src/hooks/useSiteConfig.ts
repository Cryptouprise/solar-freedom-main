import { trpc } from "@/lib/trpc";
import { SITE_CONFIG_DEFAULTS } from "@shared/const";

type SiteConfigPayload = {
  phone_number?: string;
  phone_number_e164?: string;
  assistant_name?: string;
  assistant_title?: string;
};

const MIN_E164_LENGTH = 8;

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeE164(phoneE164: string, fallbackFromDisplay: string): string {
  const cleaned = phoneE164.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+") && cleaned.length >= MIN_E164_LENGTH) return cleaned;

  const digits = normalizePhoneDigits(fallbackFromDisplay);
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return SITE_CONFIG_DEFAULTS.phone_number_e164;
}

export function useSiteConfig() {
  const query = trpc.content.getSiteConfig.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const cfg: SiteConfigPayload = query.data ?? {};
  const phoneDisplay = (cfg.phone_number || SITE_CONFIG_DEFAULTS.phone_number).trim();
  const phoneE164 = normalizeE164(
    (cfg.phone_number_e164 || "").trim(),
    phoneDisplay
  );
  const phoneDigits = normalizePhoneDigits(phoneE164);
  const assistantName = (cfg.assistant_name || SITE_CONFIG_DEFAULTS.assistant_name).trim();
  const assistantTitle = (cfg.assistant_title || SITE_CONFIG_DEFAULTS.assistant_title).trim();

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
