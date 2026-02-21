import { request } from "@/services/xano";

type PutTripsInviteResponse = {
  id?: number;
  [key: string]: unknown;
};

export async function putTripsInvite(trip_id: number, invited_users: number[]): Promise<PutTripsInviteResponse> {
  const normalizedInvitedUsers = Array.from(
    new Set(
      invited_users
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  ).sort((a, b) => a - b);

  return request<PutTripsInviteResponse>("/trips/invite", {
    method: "PUT",
    body: JSON.stringify({
      trip_id,
      invited_users: normalizedInvitedUsers,
    }),
  });
}

