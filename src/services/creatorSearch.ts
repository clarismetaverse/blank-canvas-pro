const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

export type CreatorLite = {
  id: number;
  name?: string;
  IG_account?: string;
  Tiktok_account?: string;
  Profile_pic?: { url?: string } | null;
  user_interest_topics_turbo_id?: number[];
};

export type CreatorSearchTurboParams = {
  q: string;
  interestIds?: number[];
  nationality?: string;
  signal?: AbortSignal;
};

function getToken() {
  return (
    localStorage.getItem("user_turbo_id_token") ||
    localStorage.getItem("user_turbo_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

function buildHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    // Xano VIC tokens must NOT use "Bearer" prefix on this API group
    const normalizedToken = token.startsWith("Bearer ") ? token.replace(/^Bearer\s+/i, "") : token;
    headers["Authorization"] = normalizedToken;
  }
  return headers;
}

export async function searchCreators(q: string, signal?: AbortSignal): Promise<CreatorLite[]> {
  const term = (q || "").trim();
  if (!term) return [];

  const res = await fetch(`${API}/search/user_turbo`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ q: term }),
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || "Creator search failed");
  }

  const data = (await res.json()) as CreatorLite[];
  return Array.isArray(data) ? data : [];
}

export async function searchCreatorsTurbo({
  q,
  interestIds = [],
  nationality,
  signal,
}: CreatorSearchTurboParams): Promise<CreatorLite[]> {
  const term = (q || "").trim();
  const selectedNationality = (nationality || "").trim();
  const hasFilters = interestIds.length > 0 || selectedNationality.length > 0;
  if (!term && !hasFilters) return [];

  const body: Record<string, unknown> = {
    q: term,
    user_interest_topics_turbo_id: interestIds,
  };

  if (selectedNationality) {
    body.nationality = selectedNationality;
  }

  const res = await fetch(`${API}/search/user_turbo`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || "Creator turbo search failed");
  }

  const data = (await res.json()) as CreatorLite[];
  return Array.isArray(data) ? data : [];
}
