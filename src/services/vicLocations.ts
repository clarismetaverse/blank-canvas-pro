import { request } from "@/services/xano";

export type VicLocationCity = {
  id: number;
  CityName: string;
  City?: {
    url?: string;
  } | null;
};

type CreateVicLocationPayload = {
  Name: string;
  Address: string;
  cities_id: number;
  Cover?: string | null;
};

type CreateVicLocationResponse = {
  id?: number;
  Name?: string;
  Address?: string;
  cities_id?: number | null;
  CityName?: string;
  Cover?: string | { url?: string | null } | null;
};

const CREATE_LOCATION_ENDPOINTS = [
  "/restaurants_Upgrade",
  "/restaurant_Upgrade",
  "/locations_Upgrade",
  "/location_Upgrade",
] as const;

export async function fetchVicLocationCities(): Promise<VicLocationCity[]> {
  const data = await request<VicLocationCity[] | VicLocationCity>("/cities_Upgrade");
  const cities = Array.isArray(data) ? data : data ? [data] : [];

  return cities
    .filter((city): city is VicLocationCity => Number.isFinite(Number(city?.id)) && typeof city?.CityName === "string")
    .sort((a, b) => a.CityName.localeCompare(b.CityName));
}

export async function createVicLocation(payload: CreateVicLocationPayload): Promise<CreateVicLocationResponse> {
  let lastError: unknown = null;

  for (const endpoint of CREATE_LOCATION_ENDPOINTS) {
    try {
      return await request<CreateVicLocationResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to create location");
}
