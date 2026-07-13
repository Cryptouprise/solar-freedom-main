import React from "react";
import {
  CONTACT_CONSENT_DISCLOSURE,
  SMS_CONSENT_DISCLOSURE,
} from "@shared/leadConsent";

interface ContactConsentFieldsProps {
  idPrefix: string;
  contactConsent: boolean;
  smsConsent: boolean;
  website: string;
  onContactConsentChange: (checked: boolean) => void;
  onSmsConsentChange: (checked: boolean) => void;
  onWebsiteChange: (value: string) => void;
  className?: string;
}

export function ContactConsentFields({
  idPrefix,
  contactConsent,
  smsConsent,
  website,
  onContactConsentChange,
  onSmsConsentChange,
  onWebsiteChange,
  className = "",
}: ContactConsentFieldsProps) {
  const contactId = `${idPrefix}-contact-consent`;
  const smsId = `${idPrefix}-sms-consent`;
  const websiteId = `${idPrefix}-website`;

  return (
    <fieldset className={`space-y-3 ${className}`}>
      <legend className="sr-only">Contact permissions</legend>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor={websiteId}>Leave this field blank</label>
        <input
          id={websiteId}
          name="website"
          type="text"
          value={website}
          onChange={event => onWebsiteChange(event.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      <label
        htmlFor={contactId}
        className="flex cursor-pointer items-start gap-2.5 text-left text-xs leading-relaxed text-zinc-400"
      >
        <input
          id={contactId}
          name="contactConsent"
          type="checkbox"
          checked={contactConsent}
          required
          aria-required="true"
          onChange={event => {
            const checked = event.target.checked;
            onContactConsentChange(checked);
            if (!checked && smsConsent) onSmsConsentChange(false);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
        />
        <span>
          <span className="font-semibold text-zinc-300">Required: </span>
          {CONTACT_CONSENT_DISCLOSURE}
        </span>
      </label>

      <label
        htmlFor={smsId}
        className="flex cursor-pointer items-start gap-2.5 text-left text-xs leading-relaxed text-zinc-400"
      >
        <input
          id={smsId}
          name="smsConsent"
          type="checkbox"
          checked={smsConsent}
          onChange={event => onSmsConsentChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
        />
        <span>{SMS_CONSENT_DISCLOSURE}</span>
      </label>

      <p className="text-left text-[11px] leading-relaxed text-zinc-500">
        How submitted information is handled is described in the{" "}
        <a className="underline hover:text-zinc-300" href="/privacy-policy">
          Privacy Policy
        </a>
        . Website use is subject to the{" "}
        <a className="underline hover:text-zinc-300" href="/terms">
          Terms of Use
        </a>
        .
      </p>
    </fieldset>
  );
}
