import { getAuthToken } from "@/services/xano";

const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

export const CURATE_CITIES = [
  { id: 2, label: "Dubai" },
  { id: 1, label: "Milano" },
  { id: 3, label: "Bali" },
] as const;

export type CurateActivityInput = {
  cityId: number;
  title: string;
  description: string;
  address: string;
  activityDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxGuests: number;
  cover: File;
};

export type CurateActivityResponse = {
  status?: string;
  status_label?: string;
  vic_activity_id?: number;
  activity?: Record<string, unknown>;
};

function toIso(date: string, time: string): string {
  const [h, m] = time.split(":").map((v) => Number(v));
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

export async function curateLocalActivity(input: CurateActivityInput): Promise<CurateActivityResponse> {
  const [startHour, startMinute] = input.startTime.split(":").map((v) => Number(v));
  const [endHour, endMinute] = input.endTime.split(":").map((v) => Number(v));

  const fd = new FormData();
  fd.append("city_id", String(input.cityId));
  fd.append("title", input.title);
  fd.append("description", input.description);
  fd.append("address", input.address);
  fd.append("activity_date", input.activityDate);
  fd.append("starts_at", toIso(input.activityDate, input.startTime));
  fd.append("ends_at", toIso(input.activityDate, input.endTime));
  fd.append("start_hour", String(startHour || 0));
  fd.append("start_minute", String(startMinute || 0));
  fd.append("end_hour", String(endHour || 0));
  fd.append("end_minute", String(endMinute || 0));
  fd.append("max_guests", String(input.maxGuests || 5));
  fd.append("cover", input.cover);

  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}/activities/curate`, {
    method: "POST",
    headers,
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`activities/curate failed (${res.status}): ${text}`);
  }

  return (await res.json()) as CurateActivityResponse;
}
