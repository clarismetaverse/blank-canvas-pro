import { request } from "@/services/xano";

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

  return request<{ id: number }>("/RestaurantVIC", {
    method: "POST",
    body: JSON.stringify({
      Name: payload.name,
      Adress: payload.address,
      City: cityId,
    }),
  });
}
