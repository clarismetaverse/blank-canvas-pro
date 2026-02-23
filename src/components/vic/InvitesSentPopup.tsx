import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  tripName: string;
  count: number;
  avatars: Array<{ id: number; name: string; url: string | null }>;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function InvitesSentPopup({ open, onClose, tripName, count, avatars }: Props) {
  useEffect(() => {
    if (!open) return;

    const audio = new Audio("/sounds/invite-success.wav");
    audio.volume = 0.35;

    const timeoutId = window.setTimeout(() => {
      audio.play().catch(() => {});
    }, 120);

    return () => window.clearTimeout(timeoutId);
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
            initial={{ opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.99, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
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
                  <div
                    key={avatar.id}
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-950 bg-white/10 text-xs font-semibold uppercase text-white/70"
                    style={{ marginLeft: index === 0 ? 0 : -12 }}
                  >
                    {avatar.url ? <img src={avatar.url} alt={avatar.name} className="h-full w-full object-cover" /> : avatar.name.slice(0, 1)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70">Invited {count} models</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs text-white/60">Activity</p>
              <p className="truncate text-sm font-semibold">{tripName || "Untitled activity"}</p>
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
