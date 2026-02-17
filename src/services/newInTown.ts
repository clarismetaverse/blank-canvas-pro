import type { CreatorLite } from "@/services/creatorSearch";
import { request } from "@/services/xano";

type NewInTownResponse = {
  users?: {
    items?: Array<{
      id?: number;
      name?: string;
      IG_account?: string;
      Tiktok_account?: string;
      Profile_pic?: { url?: string } | null;
    }>;
  };
};

export async function fetchNewInTown(): Promise<CreatorLite[]> {
  try {
    const data = await request<NewInTownResponse>("/newintown", {
      method: "POST",
      body: JSON.stringify({}),
    });

    return (data.users?.items ?? [])
      .map((item) => ({
        id: Number(item.id),
        name: item.name,
        IG_account: item.IG_account,
        Tiktok_account: item.Tiktok_account,
        Profile_pic: item.Profile_pic,
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0);
  } catch (error) {
    console.error("Failed to fetch new in town creators", error);
    return [];
  }
}
