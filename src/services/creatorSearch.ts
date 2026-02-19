import { xanoFetch } from "@/services/xanoClient";

export type CreatorLite = {
  id: number;
  name?: string;
  IG_account?: string;
  Tiktok_account?: string;
  Profile_pic?: { url?: string } | null;
};

type CreatorSearchParams = {
  q: string;
  user_interest_topics_turbo_id?: number[];
  signal?: AbortSignal;
};

export async function searchCreators({
  q,
  user_interest_topics_turbo_id = [],
  signal,
}: CreatorSearchParams): Promise<CreatorLite[]> {
  const term = (q || "").trim();

  if (!term && user_interest_topics_turbo_id.length === 0) return [];

  const data = await xanoFetch<CreatorLite[]>("/search/user_turbo", {
    method: "POST",
    body: {
      q: term,
      user_interest_topics_turbo_id,
    },
    signal,
  });

  return Array.isArray(data) ? data : [];
}
