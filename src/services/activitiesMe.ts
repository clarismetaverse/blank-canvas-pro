import type { Activity } from "@/services/activityApi";
import { xanoFetch } from "@/services/xanoClient";

type ActivitiesMeResponse = Activity[] | { items?: Activity[]; activities?: Activity[] };

export async function fetchMyActivities(): Promise<Activity[]> {
  const data = await xanoFetch<ActivitiesMeResponse>("/activities/me", {
    method: "POST",
    body: {},
  });

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.activities)) {
    return data.activities;
  }

  return [];
}
