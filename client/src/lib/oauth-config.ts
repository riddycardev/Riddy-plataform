/**
 * OAuth Configuration for Multiple Environments
 * Handles redirect URI selection based on current environment
 */

// Define all possible redirect URIs for different environments
const REDIRECT_URIS = {
  localhost: "http://localhost:3000/api/oauth/callback",
  dev: "https://3000-ie60kgnryzwjqibtggi80-4610cc2d.us2.manus.computer/api/oauth/callback",
  devCurrent: "https://3000-io2cqi6aiu2rmi04o0ps5-5ebaf5cf.us1.manus.computer/api/oauth/callback",
  manusSpace: "https://riddycar.manus.space/api/oauth/callback",
  manusSpaceSlug: "https://riddycar-5mke4ldv.manus.space/api/oauth/callback",
  production: "https://riddycar.com/api/oauth/callback",
  productionWWW: "https://www.riddycar.com/api/oauth/callback",
} as const;

type RedirectUriKey = keyof typeof REDIRECT_URIS;

/**
 * Detect current environment and return appropriate redirect URI
 */
export function getEnvironmentRedirectUri(): string {
  if (typeof window === "undefined") {
    return REDIRECT_URIS.localhost;
  }

  const origin = window.location.origin;
  const hostname = window.location.hostname;


  // Exact matches
  if (origin === "http://localhost:3000") {
    return REDIRECT_URIS.localhost;
  }

  if (origin.includes("3000-") && origin.includes(".manus.computer")) {
    return `${origin}/api/oauth/callback`;
  }

  if (origin === "https://riddycar.manus.space") {
    return REDIRECT_URIS.manusSpace;
  }

  if (origin === "https://riddycar-5mke4ldv.manus.space") {
    return REDIRECT_URIS.manusSpaceSlug;
  }

  if (origin === "https://www.riddycar.com") {
    return REDIRECT_URIS.productionWWW;
  }

  if (origin === "https://riddycar.com") {
    return REDIRECT_URIS.production;
  }

  // Fallback: use current origin as redirect URI
  // This allows for custom domains or staging environments
  const fallbackUri = `${origin}/api/oauth/callback`;
  console.warn(
    "[OAuth] Unknown environment, using fallback redirect URI:",
    fallbackUri
  );
  return fallbackUri;
}

/**
 * Get all registered redirect URIs (for documentation/debugging)
 */
export function getAllRegisteredRedirectUris(): string[] {
  return Object.values(REDIRECT_URIS);
}

/**
 * Check if current environment's redirect URI is registered
 */
export function isCurrentEnvironmentRegistered(): boolean {
  const currentUri = getEnvironmentRedirectUri();
  const registeredUris = getAllRegisteredRedirectUris();
  return registeredUris.includes(currentUri);
}

/**
 * Get environment name for logging/debugging
 */
export function getEnvironmentName(): RedirectUriKey | "custom" {
  if (typeof window === "undefined") {
    return "localhost";
  }

  const origin = window.location.origin;

  if (origin === "http://localhost:3000") return "localhost";
  if (origin.includes("3000-") && origin.includes(".manus.computer"))
    return "devCurrent";
  if (origin === "https://riddycar.manus.space") return "manusSpace";
  if (origin === "https://riddycar-5mke4ldv.manus.space") return "manusSpaceSlug";
  if (origin === "https://www.riddycar.com") return "productionWWW";
  if (origin === "https://riddycar.com") return "production";

  return "custom";
}
