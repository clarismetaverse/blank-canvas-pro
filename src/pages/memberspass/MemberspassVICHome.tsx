import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreatorCard from "@/components/memberspass/CreatorCard";
import CreatorSearchSelect from "@/components/memberspass/CreatorSearchSelect";
import type { CreatorLite } from "@/services/creatorSearch";
import { fetchNewInTown } from "@/services/newInTown";

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

export default function MemberspassVICHome() {
  const navigate = useNavigate();
  const [points] = useState(2450);
  const [cityName] = useState(() => {
    if (typeof window === "undefined") return "your city";
    return localStorage.getItem("owner_city") || "your city";
  });

  const [query, setQuery] = useState("");
  const [lastResults, setLastResults] = useState<CreatorLite[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorLite | null>(null);
  const [newInTown, setNewInTown] = useState<CreatorLite[]>([]);
  const [newInTownLoading, setNewInTownLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const displayCreators = useMemo(() => {
    if (lastResults.length) return lastResults.slice(0, 10);
    if (newInTown.length) return newInTown.slice(0, 10);
    return placeholderCreators;
  }, [lastResults, newInTown]);

  const showNewInTownSkeletons = newInTownLoading && !lastResults.length && !newInTown.length;

  const premiumCreators = useMemo(() => placeholderCreators.slice(0, 3), []);
  const candidateCreators = useMemo(() => displayCreators.slice(0, 3), [displayCreators]);
  const membersCreators = useMemo(() => displayCreators.slice(0, 6), [displayCreators]);
  const suggestedCreators = useMemo(() => [...placeholderCreators, ...displayCreators].slice(0, 6), [displayCreators]);
  const isSearchActive = isSearchFocused || query.trim().length > 0;

  const membersLargeIndexes = new Set([0, 3]);
  const suggestedLargeIndexes = new Set([1]);
  const memberBadges = ["LOCAL", "NEW", "FEATURED"];
  const suggestedBadges = ["FEATURED", "NEW"];

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

      <div className="mx-auto w-full max-w-md space-y-10 px-4 pb-16 pt-6">
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

          <CreatorSearchSelect
            value={query}
            onChange={setQuery}
            onFocusChange={setIsSearchFocused}
            onSelect={(creator) => {
              setSelectedCreator(creator);
              setQuery(creator.name || "");
            }}
            onResults={(results) => {
              setLastResults(results);
            }}
            showDropdown={false}
          />

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
                  setQuery("");
                }}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        {isSearchActive ? (
          <section className="space-y-3" aria-label="Search results">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-neutral-900">
                {query.trim().length > 0 ? "Search results" : "Browse creators"}
              </h2>
              <span className="text-xs text-neutral-400">{displayCreators.length} shown</span>
            </div>

            <div className="space-y-4 pb-2">
              {displayCreators.map((creator) => (
                <CreatorCard key={`search-${creator.id}`} creator={creator} variant="vic-search" />
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Candidates</h2>
                  <p className="mt-1 text-xs text-neutral-500">3 awaiting endorsement</p>
                </div>
                <span className="text-xs text-neutral-400">Swipe</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-proximity">
                {showNewInTownSkeletons
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div key={`new-in-town-skeleton-${index}`} className="w-[220px] shrink-0 snap-start">
                        <div className="h-[300px] w-full rounded-[22px] border border-neutral-200 bg-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)]" />
                      </div>
                    ))
                  : candidateCreators.map((creator) => (
                      <div key={creator.id} className="w-[220px] shrink-0 snap-start">
                        <CreatorCard creator={creator} variant="vic" size="candidate" />
                      </div>
                    ))}
              </div>
            </section>

            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-semibold text-neutral-900">Members in {cityName}</h2>
                <span className="text-xs text-neutral-400">Swipe</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-proximity">
                {membersCreators.map((creator, index) => (
                  <div
                    key={`members-${creator.id}-${index}`}
                    className={`${membersLargeIndexes.has(index) ? "w-[210px]" : "w-[180px]"} shrink-0 snap-start`}
                  >
                    <CreatorCard
                      creator={creator}
                      variant="vic"
                      size={membersLargeIndexes.has(index) ? "large" : "normal"}
                      badge={index < memberBadges.length ? memberBadges[index] : undefined}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-semibold text-neutral-900">Suggested for you</h2>
                <span className="text-xs text-neutral-400">Swipe</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-proximity">
                {suggestedCreators.map((creator, index) => (
                  <div
                    key={`suggested-${creator.id}-${index}`}
                    className={`${suggestedLargeIndexes.has(index) ? "w-[210px]" : "w-[180px]"} shrink-0 snap-start`}
                  >
                    <CreatorCard
                      creator={creator}
                      variant="vic"
                      size={suggestedLargeIndexes.has(index) ? "large" : "normal"}
                      badge={index < suggestedBadges.length ? suggestedBadges[index] : undefined}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 pt-1">
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
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-proximity">
                {premiumCreators.map((creator) => (
                  <div key={creator.id} className="w-[180px] shrink-0 snap-start">
                    <CreatorCard creator={creator} locked variant="vic" size="normal" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
