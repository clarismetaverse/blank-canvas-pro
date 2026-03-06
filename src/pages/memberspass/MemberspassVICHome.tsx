import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Instagram, Lock, Music2, Search, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreatorCard from "@/components/memberspass/CreatorCard";
import CreatorProfileSheet from "@/components/memberspass/CreatorProfileSheet";
import type { CreatorLite } from "@/services/creatorSearch";
import { searchCreatorsTurbo } from "@/services/creatorSearchTurbo";
import { fetchInterestTopics, type InterestTopic } from "@/services/interestTopics";
import { fetchNewInTown } from "@/services/newInTown";

const placeholderCreators: CreatorLite[] = [
  {
    id: 1,
    name: "Aria Vela",
    IG_account: "aria.ugc",
    Profile_pic: {
      url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: 2,
    name: "Luca Mendez",
    IG_account: "luca.m",
    Profile_pic: {
      url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: 3,
    name: "Kei Nakamura",
    Tiktok_account: "keinakama",
    Profile_pic: {
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: 4,
    name: "Nina Rossi",
    IG_account: "nina.ugc",
    Profile_pic: {
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    },
  },
];

const featuredContent = [
  {
    title: "Top Experiences — February",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    creatorName: "Aria Vela",
  },
  {
    title: "Weekend Venue Highlights",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    creatorName: "Kei Nakamura",
  },
  {
    title: "Editors' Picks",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    creatorName: "Nina Rossi",
  },
];

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function creatorHandle(creator: CreatorLite) {
  if (creator.IG_account) {
    const handle = creator.IG_account.split("/").filter(Boolean).pop()?.replace("@", "") || creator.IG_account;
    return `@${handle}`;
  }
  if (creator.Tiktok_account) {
    const handle = creator.Tiktok_account.split("/").filter(Boolean).pop()?.replace("@", "") || creator.Tiktok_account;
    return `@${handle}`;
  }
  return "No social handle";
}

export default function MemberspassVICHome() {
  const navigate = useNavigate();
  const [points] = useState(2450);
  const [cityName] = useState(() => {
    if (typeof window === "undefined") return "your city";
    return localStorage.getItem("owner_city") || "your city";
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const debouncedQuery = useDebounced(rawQuery, 300);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [interestTopics, setInterestTopics] = useState<InterestTopic[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CreatorLite[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorLite | null>(null);
  const [newInTown, setNewInTown] = useState<CreatorLite[]>([]);
  const [newInTownLoading, setNewInTownLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadNewInTown = async () => {
      setNewInTownLoading(true);
      try {
        const items = await fetchNewInTown();
        if (!active) return;
        setNewInTown(items);
      } finally {
        if (active) setNewInTownLoading(false);
      }
    };

    loadNewInTown();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadTopics = async () => {
      try {
        const items = await fetchInterestTopics(controller.signal);
        setInterestTopics(items);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to load interest topics", error);
      }
    };

    loadTopics();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    const hasQuery = Boolean(debouncedQuery.trim());
    const hasTopics = selectedTopicIds.length > 0;

    if (!hasQuery && !hasTopics) {
      setSearchResults([]);
      setSearchLoading(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const runSearch = async () => {
      setSearchLoading(true);
      setHasSearched(true);
      try {
        const results = await searchCreatorsTurbo({
          q: debouncedQuery,
          topicIds: selectedTopicIds,
          signal: controller.signal,
        });
        if (!active) return;
        setSearchResults(results);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Creator search failed", error);
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    };

    runSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, searchOpen, selectedTopicIds]);

  const displayCreators = useMemo(() => {
    if (searchResults.length) return searchResults.slice(0, 10);
    if (newInTown.length) return newInTown.slice(0, 10);
    return placeholderCreators;
  }, [searchResults, newInTown]);

  const showNewInTownSkeletons = newInTownLoading && !searchResults.length && !newInTown.length;

  const premiumCreators = useMemo(() => placeholderCreators.slice(0, 3), []);

  const topicLabelById = useMemo(
    () => new Map(interestTopics.map((topic) => [topic.id, topic.interest_topics])),
    [interestTopics]
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0B0B0F]">
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600 hover:text-neutral-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-neutral-900">VIC</h1>
          <div className="h-8 w-8" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-16 pt-6">
        <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Discover top creators</h2>
              <p className="mt-2 text-sm text-neutral-500">Connect through curated experiences</p>
            </div>
            <span className="rounded-full border border-neutral-200 bg-[#FFF1F4] px-3 py-1 text-xs font-semibold text-[#FF5A7A]">
              {points.toLocaleString()} pts
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          >
            <Search className="h-4 w-4 text-neutral-400" />
            <span className={`text-sm ${rawQuery ? "text-neutral-900" : "text-neutral-400"}`}>
              {rawQuery || "Search creators"}
            </span>
          </button>

          {selectedCreator && (
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-[#FAFAFA] px-4 py-2 text-xs text-neutral-600">
              <span>
                Selected: <span className="font-semibold text-neutral-900">{selectedCreator.name}</span>
              </span>
              <button
                type="button"
                className="text-xs text-neutral-500 hover:text-neutral-900"
                onClick={() => {
                  setSelectedCreator(null);
                  setRawQuery("");
                }}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-neutral-900">New in {cityName}</h2>
            <span className="text-xs text-neutral-400">Swipe</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {showNewInTownSkeletons
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={`new-in-town-skeleton-${index}`} className="w-[75%] shrink-0 snap-start">
                    <div className="h-[290px] w-full rounded-3xl border border-neutral-200 bg-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)]" />
                  </div>
                ))
              : displayCreators.map((creator) => (
                  <div key={creator.id} className="w-[75%] shrink-0 snap-start">
                    <CreatorCard creator={creator} variant="vic" />
                  </div>
                ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-neutral-900">Featured profiles</h2>
            <span className="text-xs text-neutral-400">Swipe</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {featuredContent.map((item) => (
              <div
                key={item.title}
                className="w-72 shrink-0 snap-start overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="relative h-48 w-full">
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/80">{item.creatorName}</p>
                  </div>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-neutral-800">
                    <Sparkles className="h-3 w-3" />
                    Experience
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Private list</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <Lock className="h-3 w-3" />
                Locked — Pro Models & Key Influencers
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.alert("Unlock flow coming soon.")}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
            >
              Unlock
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {premiumCreators.map((creator) => (
              <div key={creator.id} className="w-[75%] shrink-0 snap-start">
                <CreatorCard creator={creator} locked variant="vic" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6">
          <div className="mx-auto flex h-full w-full max-w-md flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-neutral-200 p-4">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2">
                <Search className="h-4 w-4 text-neutral-400" />
                <input
                  autoFocus
                  value={rawQuery}
                  onChange={(event) => setRawQuery(event.target.value)}
                  placeholder="Search creator, Instagram, or TikTok"
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-full border border-neutral-200 p-2 text-neutral-600"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-neutral-200 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {interestTopics.map((topic) => {
                  const selected = selectedTopicIds.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() =>
                        setSelectedTopicIds((prev) =>
                          prev.includes(topic.id) ? prev.filter((id) => id !== topic.id) : [...prev, topic.id]
                        )
                      }
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                        selected
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-600"
                      }`}
                    >
                      {topic.interest_topics}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!hasSearched && (
                <p className="px-2 py-5 text-sm text-neutral-500">Start typing or choose interests to discover creators.</p>
              )}
              {searchLoading && <p className="px-2 py-3 text-sm text-neutral-500">Searching creators…</p>}
              {!searchLoading && hasSearched && searchResults.length === 0 && (
                <p className="px-2 py-3 text-sm text-neutral-500">No creators found. Try another keyword or interest.</p>
              )}
              {!searchLoading &&
                searchResults.map((creator) => {
                  const hasTikTok = Boolean(creator.Tiktok_account);
                  const interestLabels = (creator.user_interest_topics_turbo_id || [])
                    .map((id) => topicLabelById.get(id))
                    .filter(Boolean)
                    .slice(0, 3);

                  return (
                    <button
                      key={creator.id}
                      type="button"
                      onClick={() => {
                        setSelectedCreator(creator);
                        setSearchOpen(false);
                      }}
                      className="mb-2 w-full rounded-2xl border border-neutral-200 bg-white p-3 text-left hover:bg-neutral-50"
                    >
                      <div className="flex items-start gap-3">
                        {creator.Profile_pic?.url ? (
                          <img src={creator.Profile_pic.url} alt={creator.name || "Creator"} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-neutral-200" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-900">{creator.name || "Unnamed creator"}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{creatorHandle(creator)}</p>
                          {creator.bio && <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{creator.bio}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5">
                              {hasTikTok ? <Music2 className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
                              {hasTikTok ? "TikTok" : "Instagram"}
                            </span>
                            {interestLabels.map((label) => (
                              <span key={`${creator.id}-${label}`} className="rounded-full bg-neutral-100 px-2 py-0.5">
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <CreatorProfileSheet creator={selectedCreator} open={Boolean(selectedCreator)} onClose={() => setSelectedCreator(null)} variant="vic" />
    </div>
  );
}
