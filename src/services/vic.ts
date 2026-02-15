export type VicUser = {
  id: number;
  Name: string;
  email: string;
  Diamonds: number;
  Invites: number;
  bio?: string;
  Picture?: { url?: string } | null;
};

const BASE = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

async function fetchWithAuth(url: string, token: string) {
  let res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if ((res.status === 401 || res.status === 403) && token) {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
  }

  return res;
}

export async function fetchVicProfile(token: string): Promise<VicUser | null> {
  if (!token) return null;

  const res = await fetchWithAuth(`${BASE}/vic`, token);
  if (!res.ok) return null;

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;

  const profile = json as Record<string, unknown>;

  return {
    id: Number(profile.id),
    Name: String(profile.Name ?? ""),
    email: String(profile.email ?? ""),
    Diamonds: Number(profile.Diamonds ?? 0),
    Invites: Number(profile.Invites ?? 0),
    bio: typeof profile.bio === "string" ? profile.bio : "",
    Picture:
      profile.Picture && typeof profile.Picture === "object"
        ? (profile.Picture as { url?: string })
        : null,
  };
}
