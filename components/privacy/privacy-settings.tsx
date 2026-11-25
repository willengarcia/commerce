"use client";
import { PRIVACY_EVENT } from "lib/privacy/consent";

export function PrivacySettings() {
  return (
    <button
      type="button"
      className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
      onClick={() => window.dispatchEvent(new Event(PRIVACY_EVENT))}
    >
      Preferências de privacidade
    </button>
  );
}
