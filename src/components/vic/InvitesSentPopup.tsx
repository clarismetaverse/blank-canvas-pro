import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  tripName: string;
  cityName?: string;
  total: number;
  delta: number;
  avatars: Array<{ id: number; name: string; url: string | null }>;
  hostAvatarUrl?: string | null;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function InvitesSentPopup({ open, onClose, onDone, tripName, cityName, total, delta, avatars, hostAvatarUrl }: Props) {
  const startValue = useMemo(() => Math.max(0, total - Math.max(0, delta)), [total, delta]);
  const [displayTotal, setDisplayTotal] = useState(startValue);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;

    const from = startValue;
    const to = total;
    setDisplayTotal(from);

    const durationMs = 720;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplayTotal(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, startValue, total, delta]);

  useEffect(() => {
    if (!open) return;
    setProgress(0);
    const timeout = window.setTimeout(() => setProgress(100), 20);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120] flex items-center justify-center px-5" initial="hidden" animate="visible" exit="exit">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={backdrop}
            onClick={onClose}
            aria-label="Close invites sent popup"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm rounded-[30px] border border-white/15 bg-neutral-950 p-5 text-white shadow-[0_35px_100px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute right-4 top-4 flex items-center gap-2">
              {hostAvatarUrl ? (
                <img src={hostAvatarUrl} alt="Host" className="h-8 w-8 rounded-full border border-white/20 object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-white/85">V</div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-2xl font-semibold tracking-[-0.02em]">Invites sent ✨</p>
            <p className="mt-1 truncate text-sm font-medium text-white/80">{tripName || "Untitled activity"}</p>
            {cityName ? <p className="mt-0.5 truncate text-xs text-white/55">{cityName}</p> : null}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center">
                {avatars.slice(0, 3).map((avatar, index) => (
                  <motion.div
                    key={avatar.id}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.08 + index * 0.04 }}
                    className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-950 bg-white/10 text-xs font-semibold uppercase text-white/70"
                    style={{ marginLeft: index === 0 ? 0 : -12 }}
                  >
                    {avatar.url ? <img src={avatar.url} alt={avatar.name} className="h-full w-full object-cover" /> : avatar.name.slice(0, 1)}
                    {index === 0 && delta > 0 ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-neutral-950 bg-emerald-400" /> : null}
                  </motion.div>
                ))}
                {total > 3 ? (
                  <div className="ml-2 inline-flex h-8 items-center rounded-full border border-white/20 bg-white/10 px-2 text-xs font-semibold text-white/90">+{total - 3}</div>
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="flex items-end gap-2">
                  <motion.div
                    key={displayTotal}
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="text-2xl font-semibold tracking-[-0.02em]"
                  >
                    {displayTotal}
                  </motion.div>

                  <div className="pb-1 text-sm text-white/70">total invited</div>

                  {delta > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
                      transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
                      className="ml-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90"
                    >
                      +{delta} added
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Activity</p>
              <p className="mt-1 truncate text-sm font-semibold text-white/90">{tripName || "Untitled activity"}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4 text-emerald-400" />
                Invites delivered ✨
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6A88] to-[#FF99AC]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onDone}
              className="mt-5 h-11 w-full rounded-full bg-white text-sm font-semibold text-neutral-950"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
