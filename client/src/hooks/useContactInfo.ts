/**
 * Ephemeral contact details shared between forms and the booking modal.
 *
 * Contact PII intentionally lives in memory only. Older versions wrote it to
 * `localStorage`; every hook consumer now removes that legacy value on mount.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";

const LEGACY_STORAGE_KEY = "sf_contact_info";

export interface ContactInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  fullName: string;
}

const EMPTY_CONTACT_INFO: ContactInfo = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  fullName: "",
};

let contactInfo = EMPTY_CONTACT_INFO;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return contactInfo;
}

function publish(next: ContactInfo) {
  contactInfo = next;
  listeners.forEach((listener) => listener());
}

export function clearLegacyContactStorage(
  storage?: Pick<Storage, "removeItem">
) {
  try {
    const target = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
    target?.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
}

// Remove legacy PII as soon as this module is loaded in the browser.
clearLegacyContactStorage();

export function useContactInfo() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CONTACT_INFO);

  useEffect(() => {
    clearLegacyContactStorage();
  }, []);

  const updateContactInfo = useCallback(
    (updates: Partial<Omit<ContactInfo, "fullName">>) => {
      const next = {
        firstName: updates.firstName ?? contactInfo.firstName,
        lastName: updates.lastName ?? contactInfo.lastName,
        phone: updates.phone ?? contactInfo.phone,
        email: updates.email ?? contactInfo.email,
      };
      publish({
        ...next,
        fullName: [next.firstName, next.lastName].filter(Boolean).join(" "),
      });
    },
    []
  );

  const clearContactInfo = useCallback(() => {
    clearLegacyContactStorage();
    publish(EMPTY_CONTACT_INFO);
  }, []);

  return { contactInfo: current, updateContactInfo, clearContactInfo };
}
