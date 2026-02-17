import { request } from "@/services/xano";

const ACTIVITY_API_BASE = "https://xbut-eryu-hhsg.f2.xano.io/api:bwh6Xc5O";

export type ActivityStatus = "draft" | "active" | "reserved" | "confirmed" | "cancelled";

export type ActivityPayload = {
  Name: string;
  Destination: string;
  Starting_Day: string | null;
  Return: string | null;
  VICS: number[];
  Tripcover: Record<string, unknown> | null;
  ParticipantsMinimumNumber: number;
  ActivitiesList: string;
  InvitedUsers: number[];
  event_temp_id: number;
  host: number;
  status: ActivityStatus;
  ModelLimit: number;
};

export type Activity = ActivityPayload & {
  id: number;
  created_at?: number;
  updated_at?: number;
};

export async function createActivity(payload: ActivityPayload): Promise<Activity> {
  return request<Activity>(`${ACTIVITY_API_BASE}/activity`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchActivity(
  activityId: number,
  patch: Partial<Omit<ActivityPayload, "event_temp_id" | "host">>
): Promise<Activity> {
  return request<Activity>(`${ACTIVITY_API_BASE}/activity/patch`, {
    method: "PATCH",
    body: JSON.stringify({
      trip_id: activityId,
      ...patch,
    }),
  });
}
