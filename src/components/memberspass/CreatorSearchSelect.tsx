import * as React from "react";
import { Instagram, Music2, Search } from "lucide-react";
import { searchCreators, type CreatorLite } from "@/services/creatorSearch";

type InterestOption = {
  id: number;
  label: string;
};

type CreatorSearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  selectedInterests?: number[];
  onSelectedInterestsChange?: (ids: number[]) => void;
  interestOptions?: InterestOption[];
  onSelect: (creator: CreatorLite) => void;
  onResults?: (results: CreatorLite[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function CreatorSearchSelect({
  value,
  onChange,
  selectedInterests = [],
  onSelectedInterestsChange,
  interestOptions = [],
  onSelect,
  onResults,
  placeholder = "Search creators",
  disabled,
}: CreatorSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<CreatorLite[]>([]);
  const boxRef = React.useRef<HTMLDivElement | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const latestRequestRef = React.useRef(0);

  React.useEffect(() => {
    if (value.trim().length > 0 || selectedInterests.length > 0) {
      setOpen(true);
    }
  }, [value, selectedInterests]);

  React.useEffect(() => {
    const term = value.trim();

    if (!term && selectedInterests.length === 0) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const handler = window.setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;

      try {
        const data = await searchCreators({
          q: term,
          user_interest_topics_turbo_id: selectedInterests,
          signal: abortRef.current.signal,
        });
        if (requestId !== latestRequestRef.current) return;
        setResults(data);
        onResults?.(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Creator search failed", error);
        if (requestId !== latestRequestRef.current) return;
        setResults([]);
      } finally {
        if (requestId === latestRequestRef.current) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedInterests]);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      {interestOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {interestOptions.map((interest) => {
            const selected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? selectedInterests.filter((id) => id !== interest.id)
                    : [...selectedInterests, interest.id];
                  onSelectedInterestsChange?.(next);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-neutral-800 bg-neutral-900 text-neutral-100"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      )}

      {open && (loading || results.length > 0 || value.trim() || selectedInterests.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-neutral-700 bg-[#111216] shadow-xl">
          {loading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-700" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-neutral-800" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && results.length === 0 && (value.trim() || selectedInterests.length > 0) && (
            <div className="px-4 py-3 text-sm text-neutral-400">No creators found.</div>
          )}
          {!loading &&
            results.map((creator) => {
              const hasTikTok = Boolean(creator.Tiktok_account);
              return (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => {
                    onSelect(creator);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-900"
                >
                  {creator.Profile_pic?.url ? (
                    <img
                      src={creator.Profile_pic.url}
                      alt={creator.name || "Creator"}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-neutral-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {creator.name || "Unnamed creator"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5">
                        {hasTikTok ? <Music2 className="h-3 w-3" /> : <Instagram className="h-3 w-3" />}
                        {hasTikTok ? "TikTok" : "Instagram"}
                      </span>
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5">UGC-ready</span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
