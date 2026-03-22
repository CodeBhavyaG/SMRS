const DEFAULT_API_BASE_URL = "http://localhost:3000";

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

  if (!raw) {
    return DEFAULT_API_BASE_URL;
  }

  // Common misconfiguration: pointing API base to Vite dev server port.
  if (/:8080$/.test(raw)) {
    return raw.replace(/:8080$/, ":3000");
  }

  return raw;
}