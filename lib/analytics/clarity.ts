import { isPublicAnalyticsUrl, readConsent } from "lib/privacy/consent";

type SDK = typeof import("@microsoft/clarity").default;
let sdk: SDK | undefined;
let attempted = false;
let isolated = false;
let cancelled = false;
let loading: Promise<void> | undefined;

export function clarityDocumentActive() {
  return isolated;
}

// Used BEFORE programmatic navigation; a React effect after navigation is too late.
export function navigateAnalyticsDocument(href: string): boolean {
  if (!isolated) return false;
  cancelled = true;
  window.location.assign(href);
  return true;
}

function installDocumentIsolation() {
  isolated = true;
  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      navigateAnalyticsDocument(url.href);
    },
    true,
  );
  // Search forms contain arbitrary user input: perform a document navigation.
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (
        !(form instanceof HTMLFormElement) ||
        !form.hasAttribute("data-privacy-search")
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const url = new URL(form.action, location.href);
      for (const [key, value] of new FormData(form)) {
        if (typeof value === "string") url.searchParams.append(key, value);
      }
      navigateAnalyticsDocument(url.href);
    },
    true,
  );
  // A restored document must recheck consent and authentication before collecting.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) window.location.reload();
  });
  window.addEventListener("popstate", () => {
    cancelled = true;
    window.location.reload();
  });
}

function eligible() {
  return (
    !cancelled &&
    readConsent()?.analytics === true &&
    isPublicAnalyticsUrl(new URL(location.href)) &&
    !document.querySelector('[data-private-cart="open"]')
  );
}

export function startClarity(
  projectId: string,
  allowed: boolean,
): Promise<void> {
  if (
    typeof window === "undefined" ||
    !allowed ||
    !/^[a-z0-9]+$/i.test(projectId) ||
    !eligible()
  )
    return Promise.resolve();
  if (attempted) return loading ?? Promise.resolve();
  attempted = true;
  installDocumentIsolation();
  loading = import("@microsoft/clarity")
    .then(({ default: clarity }) => {
      if (!eligible()) return;
      sdk = clarity;
      // init queues the script; consentV2 is queued in the same synchronous task.
      clarity.init(projectId);
      clarity.consentV2({ analytics_Storage: "granted", ad_Storage: "denied" });
    })
    .catch(() => {
      /* Optional analytics must never break commerce. No personal logs. */
    });
  return loading;
}

export function clearClarityCookies() {
  // Only first-party cookies accessible to this origin; never authentication/cart cookies.
  const labels = location.hostname.split(".");
  const domains = ["", ...labels.map((_, i) => labels.slice(i).join("."))];
  const paths = [
    "/",
    ...location.pathname
      .split("/")
      .map((_, i, a) => a.slice(0, i + 1).join("/") || "/"),
  ];
  for (const name of ["_clck", "_clsk"])
    for (const domain of domains)
      for (const path of paths) {
        document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
      }
}

export function revokeClarity(persisted: boolean) {
  cancelled = isolated;
  try {
    sdk?.consentV2({ analytics_Storage: "denied", ad_Storage: "denied" });
  } catch {
    /* fail closed */
  }
  try {
    clearClarityCookies();
  } catch {
    /* Storage access can be blocked; still unload. */
  }
  if (isolated) {
    // Consent denial alone still allows cookieless tracking: destroy the document.
    // If storage failed, the query marker prevents a stale acceptance from restarting.
    const url = new URL(location.href);
    if (!persisted) url.searchParams.set("privacy-disabled", "1");
    location.replace(url.href);
  }
}
