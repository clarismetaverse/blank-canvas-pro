const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

export type CreatorLite = {
  id: number;
  name?: string;
  IG_account?: string;
  Tiktok_account?: string;
  Profile_pic?: { url?: string } | null;
};

function getToken() {
  return (
    localStorage.getItem("user_turbo_id_token") ||
    localStorage.getItem("user_turbo_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

export async function searchCreators(q: string, signal?: AbortSignal): Promise<CreatorLite[]> {
  const term = (q || "").trim();
  if (!term) return [];

  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}/search/user_turbo`, {
    method: "POST",
    headers,
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
