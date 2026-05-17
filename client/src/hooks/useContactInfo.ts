/**
 * useContactInfo — Sticky contact info hook
 *
 * Persists name, phone, and email to localStorage so users never have to
 * retype their contact details across any form on the site.
 *
 * Usage:
 *   const { contactInfo, updateContactInfo, clearContactInfo } = useContactInfo();
 *   // contactInfo.firstName, contactInfo.lastName, contactInfo.phone, contactInfo.email
 *   // Call updateContactInfo({ phone: "..." }) to update individual fields
 */

import { useState, useCallback } from "react";

const STORAGE_KEY = "sf_contact_info";

export interface ContactInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Combined full name — convenience field */
  fullName: string;
}

function loadFromStorage(): ContactInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { firstName: "", lastName: "", phone: "", email: "", fullName: "" };
    const parsed = JSON.parse(raw);
    const firstName = parsed.firstName || "";
    const lastName = parsed.lastName || "";
    return {
      firstName,
      lastName,
      phone: parsed.phone || "",
      email: parsed.email || "",
      fullName: [firstName, lastName].filter(Boolean).join(" "),
    };
  } catch {
    return { firstName: "", lastName: "", phone: "", email: "", fullName: "" };
  }
}

function saveToStorage(info: Omit<ContactInfo, "fullName">) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // localStorage may be unavailable in private browsing — fail silently
  }
}

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(loadFromStorage);

  const updateContactInfo = useCallback(
    (updates: Partial<Omit<ContactInfo, "fullName">>) => {
      setContactInfo((prev) => {
        const next = {
          firstName: updates.firstName ?? prev.firstName,
          lastName: updates.lastName ?? prev.lastName,
          phone: updates.phone ?? prev.phone,
          email: updates.email ?? prev.email,
        };
        saveToStorage(next);
        return {
          ...next,
          fullName: [next.firstName, next.lastName].filter(Boolean).join(" "),
        };
      });
    },
    []
  );

  const clearContactInfo = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setContactInfo({ firstName: "", lastName: "", phone: "", email: "", fullName: "" });
  }, []);

  return { contactInfo, updateContactInfo, clearContactInfo };
}
