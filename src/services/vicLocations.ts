import { getAuthToken } from "@/services/xano";

const CITY_ID_MAP: Record<string, string> = {
  Bali: "2",
  Dubai: "7",
  Milan: "10",
};

export type CreateRestaurantVICPayload = {
  Name: string;
  Adress: string;
  City: string;
};

export async function createRestaurantVIC(payload: {
  name: string;
  address: string;
  city: string;
  about?: string;
  eventDateTime?: string;
  coverFile?: File;
}): Promise<{ id: number }> {
  const cityId = CITY_ID_MAP[payload.city] ?? "0";
  const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append("Name", payload.name);
  formData.append("Adress", payload.address);
  formData.append("City", cityId);
  formData.append("cities2_id", cityId);

  // Hardcoded + extra fields — try multiple shapes since Xano multipart parsing varies
  formData.append("actions_turbo_id[]", "1");
  formData.append("category_venues_turbo[]", "55");
  formData.append("is_event", "true");

  formData.append("About", payload.about ?? "");

  if (payload.eventDateTime) {
    const ts = new Date(payload.eventDateTime).getTime();
    if (!Number.isNaN(ts)) {
      // send both as plain number and as array element
      formData.append("event_date_time", String(ts));
      formData.append("event_date_time[]", String(ts));
    }
  }

  if (payload.coverFile) {
    formData.append("Cover", payload.coverFile);
  }

  const res = await fetch(`${API}/RestaurantVIC`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RestaurantVIC creation failed (${res.status}): ${text}`);
  }

  return (await res.json()) as { id: number };
}
