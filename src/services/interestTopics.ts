const API = "https://xbut-eryu-hhsg.f2.xano.io/api:bwh6Xc5O";

export type InterestTopic = {
  id: number;
  interest_topics: string;
};

const TOPIC_NORMALIZATION: Record<string, string> = {
  WeIIness: "Wellness",
  PiIates: "Pilates",
};

export function normalizeInterestLabel(label?: string): string {
  if (!label) return "";
  return TOPIC_NORMALIZATION[label] ?? label;
}

export async function fetchInterestTopics(signal?: AbortSignal): Promise<InterestTopic[]> {
  const res = await fetch(`${API}/user_interest_topics`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || "Failed to fetch interest topics");
  }

  const data = (await res.json()) as InterestTopic[];
  if (!Array.isArray(data)) return [];

  return data
    .map((topic) => ({
      id: Number(topic.id),
      interest_topics: normalizeInterestLabel(topic.interest_topics),
    }))
    .filter((topic) => Number.isFinite(topic.id) && Boolean(topic.interest_topics));
}
