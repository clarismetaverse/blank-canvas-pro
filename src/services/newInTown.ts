import { apiFetch } from "@/services";

export type NewInTownUser = {
  name?: string;
  IG_account?: string;
  bio?: string;
  Profile_pic?: { url?: string } | null;
};

type NewInTownResponse = {
  users?: { items?: NewInTownUser[] };
};

export async function fetchNewInTown(): Promise<NewInTownUser[]> {
  try {
    const data = await apiFetch<NewInTownResponse>("/newintown", {
      method: "POST",
      body: {},
    });

    return data.users?.items ?? [];
  } catch (error) {
    console.error("Failed to fetch new in town creators", error);
    return [];
  }
}
