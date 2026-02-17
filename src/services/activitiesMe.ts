import type { Activity } from "@/services/activityApi";
import { xanoFetch } from "@/services/xanoClient";

export async function fetchMyActivities(): Promise<Activity[]> {
  const data = await xanoFetch<Activity[]>("/motherboard/trips", {
    method: "GET",
  });

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}
