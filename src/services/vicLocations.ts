import { apiFetch } from "@/services";

export type VenueCity = {
  id: number;
  name: string;
};

type RawVenueCity = {
  id?: number | string | null;
  ID?: number | string | null;
  name?: string | null;
  Name?: string | null;
  City?: string | null;
  city?: string | null;
};

export type CreateLocationPayload = {
  Name: string;
  Adress: string;
  City: number;
};

function normalizeVenueCity(raw: RawVenueCity): VenueCity | null {
  const idCandidate = raw.id ?? raw.ID;
  const id = Number(idCandidate);
  const name = raw.name ?? raw.Name ?? raw.City ?? raw.city ?? "";

  if (!Number.isFinite(id) || id <= 0 || !name.trim()) {
    return null;
  }

  return {
    id,
    name: name.trim(),
  };
}

export async function fetchVenueCities(): Promise<VenueCity[]> {
  const response = await apiFetch<RawVenueCity[] | { items?: RawVenueCity[]; data?: RawVenueCity[] }>("/cities_Upgrade");
  const items = Array.isArray(response) ? response : response.items ?? response.data ?? [];

  return items
    .map(normalizeVenueCity)
    .filter((city): city is VenueCity => city !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}
