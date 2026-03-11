const UTM_STORAGE_KEY = "pp_utm";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type UtmParams = Partial<Record<UtmKey, string>>;

const isBrowser = () => typeof window !== "undefined";

const hasValues = (params: UtmParams) => Object.values(params).some(Boolean);

export function captureUtm() {
  if (!isBrowser()) {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const utm = UTM_KEYS.reduce<UtmParams>((acc, key) => {
    const value = searchParams.get(key)?.trim();

    if (value) {
      acc[key] = value;
    }

    return acc;
  }, {});

  if (!hasValues(utm)) {
    return;
  }

  window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
}

export function getUtmParams(): UtmParams {
  if (!isBrowser()) {
    return {};
  }

  const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return UTM_KEYS.reduce<UtmParams>((acc, key) => {
      const value = parsed[key];

      if (typeof value === "string" && value) {
        acc[key] = value;
      }

      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function hasUtm() {
  return hasValues(getUtmParams());
}
