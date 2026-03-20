export type VenueCity = {
  id: number;
  name: string;
  imageUrl?: string;
};

type XanoCityResponseItem = {
  id: number;
  CityName: string;
  City?: {
    url?: string;
  } | null;
};

export type CreateVicLocationRequest = {
  Name: string;
  Adress: string;
  City: number;
};

export type CreateVicLocationResponse = {
  id?: number;
  Name?: string;
  Adress?: string;
  City?: number;
  Cover?: string | { url?: string } | null;
};

const API_BASE = "https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3";

/**
 * Safe JSON handler
 */
async function safeJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorBody = await response.json();
      if (typeof errorBody?.message === "string") {
        message = errorBody.message;
      } else if (typeof errorBody?.error === "string") {
        message = errorBody.error;
      }
    } catch {
      // ignore
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/**
 * GET cities
 */
export async function fetchVenueCities(): Promise<VenueCity[]> {
  const response = await fetch(`${API_BASE}/cities_Upgrade`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await safeJson<XanoCityResponseItem[]>(response);

  return data.map((item) => ({
    id: item.id,
    name: item.CityName,
    imageUrl: item.City?.url,
  }));
}

/**
 * POST create restaurant (VIC)
 */
export async function createVicLocation(
  payload: CreateVicLocationRequest
): Promise<CreateVicLocationResponse> {
  const response = await fetch(`${API_BASE}/Restaurant/VIC`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return safeJson<CreateVicLocationResponse>(response);
}
