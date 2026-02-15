const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

export type NewInTownUser = {
  name?: string;
  IG_account?: string;
  bio?: string;
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

export async function fetchNewInTown(): Promise<NewInTownUser[]> {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API}/newintown`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(msg || "New in town fetch failed");
    }

    const data = (await res.json()) as { users?: { items?: NewInTownUser[] } };
    return data?.users?.items ?? [];
  } catch (error) {
    console.error("Failed to fetch new in town creators", error);
    return [];
  }
}
