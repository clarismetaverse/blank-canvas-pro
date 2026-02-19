import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  Heart,
  Lock,
  Music,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreatorCard from "@/components/memberspass/CreatorCard";
import { useInterestTopics } from "@/hooks/useInterestTopics";
import { fetchNewInTown } from "@/services/newInTown";
import { searchCreatorsTurbo, type CreatorLite } from "@/services/creatorSearch";

const placeholderCreators: CreatorLite[] = [
  {
    id: 1,
    name: "Aria Vela",
    IG_account: "aria.ugc",
    Tiktok_account: "ariaugc",
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

const NATIONALITY_OPTIONS = ["Italian", "Spanish", "French", "German", "UK", "US", "Japanese", "Brazilian"];

function getInterestIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("food") || normalized.includes("restaurant")) return Utensils;
  if (normalized.includes("music")) return Music;
  if (normalized.includes("beauty") || normalized.includes("fashion")) return Heart;
  if (normalized.includes("photo") || normalized.includes("video") || normalized.includes("content")) return Camera;
  return Sparkles;
}

export default function MemberspassVICHome() {
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [points] = useState(2450);
  const [cityName] = useState(() => {
    if (typeof window === "undefined") return "your city";
    return localStorage.getItem("owner_city") || "your city";
  });

  const { topics: interestTopics, byId: interestById, loading: interestsLoading } = useInterestTopics();

  const [query, setQuery] = useState("");
  const [lastResults, setLastResults] = useState<CreatorLite[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorLite | null>(null);
  const [newInTown, setNewInTown] = useState<CreatorLite[]>([]);
  const [newInTownLoading, setNewInTownLoading] = useState(true);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CreatorLite[]>([]);
  const [nationality, setNationality] = useState<string>("");
  const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>([]);

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
    if (!overlayOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOverlayOpen(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!overlayRef.current) return;
      if (!overlayRef.current.contains(event.target as Node)) {
        setOverlayOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;

    const trimmed = query.trim();
    const hasFilters = selectedInterestIds.length > 0 || nationality.trim().length > 0;

    if (!trimmed && !hasFilters) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);
        const data = await searchCreatorsTurbo({
          q: trimmed,
          interestIds: selectedInterestIds,
          nationality,
          signal: controller.signal,
        });
        setResults(data.slice(0, 12));
        if (data.length) {
          setLastResults(data);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Turbo creator search failed", error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [overlayOpen, query, selectedInterestIds, nationality]);

  const displayCreators = useMemo(() => {
    if (lastResults.length) return lastResults.slice(0, 10);
    if (newInTown.length) return newInTown.slice(0, 10);
    return placeholderCreators;
  }, [lastResults, newInTown]);

  const showNewInTownSkeletons = newInTownLoading && !lastResults.length && !newInTown.length;

  const premiumCreators = useMemo(() => placeholderCreators.slice(0, 3), []);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-neutral-100">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#111218]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-neutral-300 hover:text-white"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-neutral-100">VIC</h1>
          <div className="h-8 w-8" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-16 pt-6">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-neutral-950 p-5 shadow-[0_20px_55px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-100">Discover top creators</h2>
              <p className="mt-2 text-sm text-neutral-400">Connect through curated experiences</p>
            </div>
            <span className="rounded-full border border-white/15 bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-200">
              {points.toLocaleString()} pts
            </span>
          </div>

          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_32px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOverlayOpen(true);
                }}
                onFocus={() => setOverlayOpen(true)}
                placeholder="Search by name, IG, TikTok"
                className="w-full bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOverlayOpen((prev) => !prev)}
                className="rounded-full border border-white/10 bg-white/5 p-1.5 text-neutral-300"
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
            {selectedInterestIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedInterestIds.slice(0, 3).map((id) => (
                  <span key={id} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                    {interestById[id]?.name || `Topic ${id}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {overlayOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="relative"
              >
                <div ref={overlayRef} className="rounded-3xl border border-white/10 bg-neutral-900 p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Hybrid cockpit</p>
                    <button
                      type="button"
                      onClick={() => setOverlayOpen(false)}
                      className="rounded-full border border-white/10 bg-white/5 p-1.5 text-neutral-400 hover:text-neutral-100"
                      aria-label="Close search overlay"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <Search className="h-4 w-4 text-neutral-500" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Name, @instagram, @tiktok"
                        className="w-full bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters
                      </div>

                      <select
                        value={nationality}
                        onChange={(event) => setNationality(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                      >
                        <option value="">All nationalities</option>
                        {NATIONALITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-wrap gap-2">
                        {interestsLoading && (
                          <span className="text-xs text-neutral-500">Loading interests…</span>
                        )}
                        {!interestsLoading &&
                          interestTopics.map((topic) => {
                            const active = selectedInterestIds.includes(topic.id);
                            const Icon = getInterestIcon(topic.name);
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                onClick={() => {
                                  setSelectedInterestIds((prev) =>
                                    prev.includes(topic.id) ? prev.filter((id) => id !== topic.id) : [...prev, topic.id]
                                  );
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                                  active
                                    ? "border-fuchsia-300/60 bg-fuchsia-500/20 text-fuchsia-100"
                                    : "border-white/10 bg-white/5 text-neutral-300"
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                {topic.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="max-h-[320px] space-y-2 overflow-y-auto pt-1">
                      {searching && <div className="text-sm text-neutral-400">Searching creators…</div>}

                      {!searching && results.length === 0 && query.trim() && (
                        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-500">
                          No creators found.
                        </div>
                      )}

                      {!searching &&
                        results.map((creator) => (
                          <button
                            key={creator.id}
                            type="button"
                            onClick={() => {
                              setSelectedCreator(creator);
                              setQuery(creator.name || "");
                              setOverlayOpen(false);
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-left hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3">
                              {creator.Profile_pic?.url ? (
                                <img
                                  src={creator.Profile_pic.url}
                                  alt={creator.name || "Creator"}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-neutral-700" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-neutral-100">
                                  {creator.name || "Unnamed creator"}
                                </p>
                                <p className="truncate text-xs text-neutral-500">
                                  {creator.IG_account ? `@${creator.IG_account}` : creator.Tiktok_account ? `@${creator.Tiktok_account}` : "-"}
                                </p>
                              </div>
                            </div>
                            {creator.user_interest_topics_turbo_id && creator.user_interest_topics_turbo_id.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {creator.user_interest_topics_turbo_id.slice(0, 3).map((id) => (
                                  <span
                                    key={`${creator.id}-topic-${id}`}
                                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-neutral-300"
                                  >
                                    {interestById[id]?.name || `Topic ${id}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedCreator && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-xs text-neutral-400">
              <span>
                Selected: <span className="font-semibold text-neutral-100">{selectedCreator.name}</span>
              </span>
              <button
                type="button"
                className="text-xs text-neutral-400 hover:text-neutral-100"
                onClick={() => {
                  setSelectedCreator(null);
                  setQuery("");
                }}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-neutral-100">New in {cityName}</h2>
            <span className="text-xs text-neutral-500">Swipe</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {showNewInTownSkeletons
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={`new-in-town-skeleton-${index}`} className="w-[75%] shrink-0 snap-start">
                    <div className="h-[290px] w-full rounded-3xl border border-white/10 bg-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.3)]" />
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
            <h2 className="text-base font-semibold text-neutral-100">Featured profiles</h2>
            <span className="text-xs text-neutral-500">Swipe</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {featuredContent.map((item) => (
              <div
                key={item.title}
                className="w-72 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
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
              <h2 className="text-base font-semibold text-neutral-100">Private list</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <Lock className="h-3 w-3" />
                Locked — Pro Models & Key Influencers
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.alert("Unlock flow coming soon.")}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-200"
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
    </div>
  );
}
