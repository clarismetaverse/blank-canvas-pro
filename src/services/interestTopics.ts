import { xanoFetch } from "@/services/xanoClient";

export type InterestTopic = {
  id: number;
  name: string;
};

type RawInterestTopic = {
  id: number;
  name?: string;
  Name?: string;
};

export async function fetchInterestTopics(): Promise<InterestTopic[]> {
  const payload = await xanoFetch<RawInterestTopic[] | RawInterestTopic>("/user_interest_topics", {
    method: "GET",
  });

  const list = Array.isArray(payload) ? payload : payload ? [payload] : [];

  return list
    .map((topic) => ({
      id: topic.id,
      name: (topic.name || topic.Name || "").trim(),
    }))
    .filter((topic) => topic.id && topic.name.length > 0);
}
