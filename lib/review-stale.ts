export const REVIEW_STALE_STORAGE_KEY = "pp.review.stale";
export const REVIEW_STALE_TTL_MS = 5 * 60 * 1000;

type StoredStaleState = {
  ids: string[];
  updatedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readStaleReviewState(): StoredStaleState | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(REVIEW_STALE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredStaleState>;
    if (!Array.isArray(parsed.ids) || typeof parsed.updatedAt !== "number") {
      return null;
    }

    return {
      ids: parsed.ids.filter((id): id is string => typeof id === "string"),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeStaleReviewState(ids: string[], updatedAt = Date.now()) {
  if (!isBrowser()) return;

  const uniqueIds = Array.from(new Set(ids));
  const payload: StoredStaleState = { ids: uniqueIds, updatedAt };
  window.sessionStorage.setItem(REVIEW_STALE_STORAGE_KEY, JSON.stringify(payload));
}

export function getFreshStaleReviewIds(now = Date.now()) {
  const state = readStaleReviewState();
  if (!state) return [];
  if (now - state.updatedAt > REVIEW_STALE_TTL_MS) return [];
  return state.ids;
}

export function shouldReconcileStaleReviews(now = Date.now()) {
  const state = readStaleReviewState();
  return !state || now - state.updatedAt > REVIEW_STALE_TTL_MS;
}
