import type { Activity } from "@/services/activityApi";
import { xanoFetch } from "@/services/xanoClient";

type ActivitiesMeResponse =
  | Activity[]
  | Activity
  | { items?: Activity[]; activities?: Activity[] };

export async function fetchMyActivities(): Promise<Activity[]> {
  const data = await xanoFetch<ActivitiesMeResponse>("/activities/me", {
    method: "POST",
    body: {},
  });

  if (Array.isArray(data)) {
    return data;
  }

  // Single activity object returned
  if (data && typeof data === "object" && "id" in data && !("items" in data) && !("activities" in data)) {
    return [data as Activity];
  }

  if (Array.isArray((data as any).items)) {
    return (data as any).items;
  }

  if (Array.isArray((data as any).activities)) {
    return (data as any).activities;
  }

  return [];
}
