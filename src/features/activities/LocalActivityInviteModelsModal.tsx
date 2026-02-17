import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CreatorLite } from "@/services/creatorSearch";
import { searchCreators } from "@/services/creatorSearch";
import { fetchNewInTown } from "@/services/newInTown";

type Props = {
  open: boolean;
  onClose: () => void;
  venueLabel?: string;
  cityName?: string;
  maxInvites?: number;
  initialSelected?: CreatorLite[];
  onConfirm: (selected: CreatorLite[]) => void;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sheet = {
  hidden: { y: "10%", opacity: 0, scale: 0.99 },
  visible: { y: 0, opacity: 1, scale: 1 },
  exit: { y: "10%", opacity: 0, scale: 0.99 },
};

function useDebounced<T>(value: T, delay = 260) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LocalActivityInviteModelsModal({
  open,
  onClose,
  venueLabel,
  cityName = "your city",
  maxInvites = 8,
  initialSelected = [],
  onConfirm,
}: Props) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 260);
  const [loading, setLoading] = useState(false);
  const [newInTownLoading, setNewInTownLoading] = useState(false);
  const [newInTown, setNewInTown] = useState<CreatorLite[]>([]);
  const [results, setResults] = useState<CreatorLite[]>([]);
  const [selected, setSelected] = useState<Map<number, CreatorLite>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const m = new Map<number, CreatorLite>();
    initialSelected.forEach((x) => m.set(Number(x.id), x));
    setSelected(m);

    setQ("");
    setResults([]);
    window.setTimeout(() => inputRef.current?.focus(), 50);

    let active = true;
    const load = async () => {
      setNewInTownLoading(true);
      try {
        const items = await fetchNewInTown();
        if (!active) return;
        const pageBase = 500000;
        const mapped: CreatorLite[] = items.map((item, index) => ({
          id: pageBase + index + 1,
          name: item.name,
          IG_account: item.IG_account,
          Tiktok_account: (item as { Tiktok_account?: string }).Tiktok_account,
          Profile_pic: item.Profile_pic,
        }));
        setNewInTown(mapped);
      } catch {
        if (active) setNewInTown([]);
      } finally {
        if (active) setNewInTownLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [open, initialSelected]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const query = dq.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const found = await searchCreators(query);
        if (cancelled) return;
        setResults((found ?? []).slice(0, 40));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dq, open]);

  const selectedCount = selected.size;
  const invitesLeft = Math.max(0, maxInvites - selectedCount);
  const canAddMore = selectedCount < maxInvites;

  const baseList = useMemo(() => {
    if (dq.trim().length >= 2) return results;
    return newInTown;
  }, [dq, results, newInTown]);

  const displayList = useMemo(() => {
    const out: CreatorLite[] = [];
    selected.forEach((v) => out.push(v));
    const ids = new Set(out.map((x) => Number(x.id)));
    baseList.forEach((r) => {
      if (!ids.has(Number(r.id))) out.push(r);
    });
    return out;
  }, [baseList, selected]);

  const toggle = (c: CreatorLite) => {
    const id = Number(c.id);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (!canAddMore) return next;
      next.set(id, c);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected.values()));
    onClose();
  };

  const headerTitle = dq.trim().length >= 2 ? "Search results" : `New in ${cityName}`;
  const showSkeletons = newInTownLoading && dq.trim().length < 2 && !newInTown.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center" initial="hidden" animate="visible" exit="exit">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={backdrop}
            onClick={onClose}
            aria-label="Close"
          />

          <motion.div
            variants={sheet}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[28px] border border-white/10 bg-neutral-950 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="relative overflow-hidden px-5 pb-4 pt-5">
              <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[#FF385C]/25 blur-3xl" />
              <div className="pointer-events-none absolute -left-14 -bottom-20 h-56 w-56 rounded-full bg-[#7A1E54]/30 blur-3xl" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium invites
                  </p>
                  <p className="mt-2 text-xl font-semibold">Invite models</p>
                  <p className="mt-1 text-xs text-white/65">{venueLabel ? `For ${venueLabel}` : "Select the right people for this table."}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-white/60" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or IG…"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                {loading && <span className="text-[11px] font-semibold text-white/55">Searching…</span>}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                  Selected <span className="text-white">{selectedCount}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                  Invites left <span className="text-white">{invitesLeft}</span>
                </span>
                {!canAddMore && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#FF385C]/30 bg-[#FF385C]/15 px-3 py-1 text-[11px] font-semibold text-[#FFB3C0]">
                    Max reached
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 pb-2">
              <p className="text-xs font-semibold text-white/70">{headerTitle}</p>
            </div>

            <div className="max-h-[56vh] overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {showSkeletons ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`sk-${i}`} className="h-[78px] w-full animate-pulse rounded-3xl border border-white/10 bg-white/5" />
                  ))}
                </div>
              ) : displayList.length === 0 && !loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white/90">No results</p>
                  <p className="mt-1 text-xs text-white/60">Try a different keyword.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayList.map((m) => {
                    const id = Number(m.id);
                    const isSelected = selected.has(id);
                    const disabled = !isSelected && !canAddMore;
                    const avatarUrl = m?.Profile_pic?.url;
                    const ig = m?.IG_account;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(m)}
                        disabled={disabled}
                        className={`group flex w-full items-center gap-3 rounded-3xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-[#FF385C]/35 bg-gradient-to-br from-white/10 to-white/5"
                            : "border-white/10 bg-white/5 hover:bg-white/7"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={m.name ?? "Creator"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                              {(m.name ?? "C").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white/90">{m.name ?? "Creator"}</p>
                          {ig && <p className="truncate text-xs text-white/55">@{ig.replace(/^@/, "")}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF385C] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_14px_30px_rgba(255,56,92,0.25)]">
                              <Check className="h-3.5 w-3.5" />
                              Selected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                              Add <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-neutral-950/85 px-4 pb-5 pt-3 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="h-11 flex-1 rounded-full bg-white text-sm font-semibold text-neutral-900 shadow-[0_18px_40px_rgba(255,255,255,0.08)] active:scale-[0.99]"
                >
                  Confirm invites
                </button>
              </div>

              <p className="mt-2 text-center text-[11px] text-white/55">Invitations will be linked to this table.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
