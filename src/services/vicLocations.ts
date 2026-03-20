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
}): Promise<{ id: number }> {
  const cityId = CITY_ID_MAP[payload.city] ?? "0";
  const API = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API}/RestaurantVIC`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      Name: payload.name,
      Adress: payload.address,
      City: cityId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RestaurantVIC creation failed (${res.status}): ${text}`);
  }

  return (await res.json()) as { id: number };
}
