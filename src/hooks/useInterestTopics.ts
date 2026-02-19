import { useEffect, useMemo, useState } from "react";
import { fetchInterestTopics, type InterestTopic } from "@/services/interestTopics";

export function useInterestTopics() {
  const [topics, setTopics] = useState<InterestTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInterestTopics();
        if (!active) return;
        setTopics(data);
      } catch (error) {
        console.error("Failed to fetch interest topics", error);
        if (!active) return;
        setTopics([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const byId = useMemo(
    () =>
      topics.reduce<Record<number, InterestTopic>>((acc, topic) => {
        acc[topic.id] = topic;
        return acc;
      }, {}),
    [topics]
  );

  return { topics, byId, loading };
}
