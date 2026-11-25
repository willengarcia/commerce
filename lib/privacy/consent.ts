export const CONSENT_VERSION = "1.0.0";
export const CONSENT_KEY = "platun.privacy-consent";
export const CONSENT_DAYS = 180;
export const PRIVACY_EVENT = "platun:privacy-settings";

export type Consent = {
  version: string;
  necessary: true;
  analytics: boolean;
  advertising: false;
  decidedAt: string;
  expiresAt: string;
};

export function makeConsent(analytics: boolean, now = Date.now()): Consent {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics,
    advertising: false,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CONSENT_DAYS * 86400000).toISOString(),
  };
}

export function parseConsent(
  raw: string | null,
  now = Date.now(),
): Consent | null {
  try {
    const c = JSON.parse(raw ?? "null");
    if (
      !c ||
      c.version !== CONSENT_VERSION ||
      c.necessary !== true ||
      typeof c.analytics !== "boolean" ||
      c.advertising !== false ||
      typeof c.decidedAt !== "string" ||
      typeof c.expiresAt !== "string"
    )
      return null;
    const start = Date.parse(c.decidedAt),
      end = Date.parse(c.expiresAt);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start > now ||
      end <= now ||
      end <= start ||
      end - start > CONSENT_DAYS * 86400000
    )
      return null;
    // Reconstruct the allowlist; never preserve extra data from localStorage.
    return {
      version: c.version,
      necessary: true,
      analytics: c.analytics,
      advertising: false,
      decidedAt: c.decidedAt,
      expiresAt: c.expiresAt,
    };
  } catch {
    return null;
  }
}

export function readConsent(): Consent | null {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent): boolean {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    return true;
  } catch {
    return false;
  }
}

// No free-text search, query parameters, fragments, slugs or unknown pages.
export function isPublicAnalyticsUrl(url: URL): boolean {
  return (
    !url.search &&
    !url.hash &&
    (url.pathname === "/" ||
      url.pathname === "/search" ||
      url.pathname === "/privacy-policy" ||
      /^\/product\/[1-9]\d*$/.test(url.pathname) ||
      /^\/search\/category\/[1-9]\d*$/.test(url.pathname))
  );
}
