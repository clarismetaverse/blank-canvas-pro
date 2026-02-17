import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type InviteableModel = {
  id: number;
  name: string;
  ig?: string;
  avatarUrl?: string | null;
  tier?: "vip" | "top" | "pro" | "standard";
};

type Props = {
  open: boolean;
  onClose: () => void;
  venueLabel?: string;
  maxInvites?: number;
  initialSelected?: InviteableModel[];
  onConfirm: (selected: InviteableModel[]) => void;
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

const tierLabel = (tier?: InviteableModel["tier"]) => {
  if (!tier) return null;
  if (tier === "vip") return "VIP";
  if (tier === "top") return "Top";
  if (tier === "pro") return "Pro";
  return null;
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
  maxInvites = 8,
  initialSelected = [],
  onConfirm,
}: Props) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 260);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InviteableModel[]>([]);
  const [selected, setSelected] = useState<Map<number, InviteableModel>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const m = new Map<number, InviteableModel>();
    initialSelected.forEach((x) => m.set(x.id, x));
    setSelected(m);
    setQ("");
    setResults([]);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, initialSelected]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selectedCount = selected.size;
  const invitesLeft = Math.max(0, maxInvites - selectedCount);
  const canAddMore = selectedCount < maxInvites;

  const displayResults = useMemo(() => {
    const out: InviteableModel[] = [];
    selected.forEach((v) => out.push(v));
    const selectedIds = new Set(out.map((x) => x.id));
    results.forEach((r) => {
      if (!selectedIds.has(r.id)) out.push(r);
    });
    return out;
  }, [results, selected]);

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
        const res = await fetch("https://xbut-eryu-hhsg.f2.xano.io/api:vGd6XDW3/search/user_turbo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query }),
        });
        if (!res.ok) throw new Error("Search failed");

        const data = (await res.json()) as Array<Record<string, unknown>>;
        if (cancelled) return;

        const mapped: InviteableModel[] = (data ?? []).slice(0, 40).map((u) => ({
          id: Number(u.id),
          name: (u.name as string) ?? (u.Name as string) ?? (u.username as string) ?? "Creator",
          ig: (u.IG_account as string) ?? (u.ig as string) ?? (u.instagram as string) ?? undefined,
          avatarUrl:
            ((u.Profile_pic as { url?: string } | undefined)?.url ??
              (u.profile_pic as { url?: string } | undefined)?.url ??
              (u.avatar as { url?: string } | undefined)?.url ??
              null) as string | null,
          tier: ((u.tier as InviteableModel["tier"]) ?? ((u.vip as boolean) ? "vip" : undefined)) as
            | InviteableModel["tier"]
            | undefined,
        }));

        setResults(mapped);
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

  const toggle = (m: InviteableModel) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(m.id)) {
        next.delete(m.id);
        return next;
      }
      if (!canAddMore) return next;
      next.set(m.id, m);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected.values()));
    onClose();
  };

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
                  <p className="mt-1 text-xs text-white/65">
                    {venueLabel ? `For ${venueLabel}` : "Select the right people for this table."}
                  </p>
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
                  placeholder="Search by name or IG..."
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

            <div className="max-h-[56vh] overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {dq.trim().length < 2 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white/90">Start typing</p>
                  <p className="mt-1 text-xs text-white/60">Use at least 2 characters to search.</p>
                </div>
              ) : displayResults.length === 0 && !loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white/90">No results</p>
                  <p className="mt-1 text-xs text-white/60">Try a different keyword.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayResults.map((m) => {
                    const isSelected = selected.has(m.id);
                    const badge = tierLabel(m.tier);
                    const disabled = !isSelected && !canAddMore;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m)}
                        disabled={disabled}
                        className={`group flex w-full items-center gap-3 rounded-3xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-[#FF385C]/35 bg-gradient-to-br from-white/10 to-white/5"
                            : "border-white/10 bg-white/5 hover:bg-white/7"
                        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                              {m.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white/90">{m.name}</p>
                            {badge && (
                              <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                                {badge}
                              </span>
                            )}
                          </div>
                          {m.ig && <p className="truncate text-xs text-white/55">@{m.ig.replace(/^@/, "")}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF385C] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_14px_30px_rgba(255,56,92,0.25)]">
                              <Check className="h-3.5 w-3.5" />
                              Selected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                              Add
                              <ChevronRight className="h-3.5 w-3.5" />
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

              <p className="mt-2 text-center text-[11px] text-white/55">
                Invitations will be linked to this table and sent by VIC.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
