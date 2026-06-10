import { getAuthToken } from "@/services/xano";
import type { Activity } from "@/services/activityApi";

const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

export async function fetchVicActivities(): Promise<Activity[]> {
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}/vic_activity`, { method: "GET", headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vic_activity fetch failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as unknown;
  if (Array.isArray(data)) return data as Activity[];
  if (data && typeof data === "object" && "id" in (data as Record<string, unknown>)) {
    return [data as Activity];
  }
  return [];
}
