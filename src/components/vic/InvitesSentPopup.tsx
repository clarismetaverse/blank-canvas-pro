import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  tripName: string;
  total: number;
  delta: number;
  avatars: Array<{ id: number; name: string; url: string | null }>;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function InvitesSentPopup({ open, onClose, tripName, total, delta, avatars }: Props) {
  const startValue = useMemo(() => Math.max(0, total - Math.max(0, delta)), [total, delta]);
  const [displayTotal, setDisplayTotal] = useState(startValue);

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
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-2xl font-semibold tracking-[-0.02em]">Invites sent ✨</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center">
                {avatars.slice(0, 3).map((avatar, index) => (
                  <motion.div
                    key={avatar.id}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.08 + index * 0.04 }}
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-950 bg-white/10 text-xs font-semibold uppercase text-white/70"
                    style={{ marginLeft: index === 0 ? 0 : -12 }}
                  >
                    {avatar.url ? <img src={avatar.url} alt={avatar.name} className="h-full w-full object-cover" /> : avatar.name.slice(0, 1)}
                  </motion.div>
                ))}
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

                  <div className="pb-1 text-sm text-white/70">models invited</div>

                  {delta > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(6px)" }}
                      transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
                      className="ml-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90"
                    >
                      +{delta}
                    </motion.div>
                  )}
                </div>

                <p className="mt-1 truncate text-xs text-white/55">{tripName || "Untitled activity"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs text-white/60">Status</p>
              <p className="truncate text-sm font-semibold">Invites updated successfully</p>
            </div>

            <button
              type="button"
              onClick={onClose}
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
