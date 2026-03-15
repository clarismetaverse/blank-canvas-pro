import { AnimatePresence, motion } from "framer-motion";
import { Calendar, MapPin, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMyActivities } from "@/services/activitiesMe";
import type { Activity } from "@/services/activityApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (activity: Activity) => void;
  creatorName?: string;
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

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=600&q=80";

export default function ActivityPickerModal({ open, onClose, onSelect, creatorName }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchMyActivities();
        if (!active) return;
        setActivities(data.filter((a) => a.Name));
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const getCoverUrl = (activity: Activity): string => {
    if (activity.Tripcover && typeof activity.Tripcover === "object" && "url" in activity.Tripcover) {
      return String((activity.Tripcover as { url?: string }).url || PLACEHOLDER_COVER);
    }
    return PLACEHOLDER_COVER;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdrop}
            onClick={onClose}
            aria-label="Close"
          />

          <motion.div
            variants={sheet}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[28px] border border-neutral-200 bg-[#FAFAFA] text-neutral-900 shadow-[0_-10px_60px_rgba(0,0,0,0.15)]"
          >
            {/* Header */}
            <div className="relative overflow-hidden px-5 pb-4 pt-5">
              <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-blue-500/8 blur-3xl" />
              <div className="pointer-events-none absolute -left-14 -bottom-20 h-56 w-56 rounded-full bg-purple-500/8 blur-3xl" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Select activity
                  </p>
                  <p className="mt-2 text-xl font-semibold text-neutral-900">Your activities</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {creatorName
                      ? `Pick an activity to invite ${creatorName}`
                      : "Choose which activity to add invites to."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[56vh] overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`sk-${i}`}
                      className="h-[80px] w-full animate-pulse rounded-3xl border border-neutral-200 bg-neutral-100"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-900">Failed to load</p>
                  <p className="mt-1 text-xs text-neutral-500">Please try again later.</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-semibold text-neutral-900">No upcoming activities</p>
                  <p className="mt-1 text-xs text-neutral-500">Create an activity first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const coverUrl = getCoverUrl(activity);
                    const invitedCount = Array.isArray(activity.InvitedUsers)
                      ? activity.InvitedUsers.length
                      : 0;

                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => onSelect(activity)}
                        className="group flex w-full items-center gap-4 rounded-3xl border border-neutral-200 bg-white px-4 py-4 text-left transition hover:bg-neutral-50 active:scale-[0.99]"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                          <img
                            src={coverUrl}
                            alt={activity.Name || "Activity"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {activity.Name}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                            {activity.Destination && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.Destination}
                              </span>
                            )}
                            {activity.Starting_Day && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {activity.Starting_Day}
                              </span>
                            )}
                          </div>
                          {invitedCount > 0 && (
                            <p className="mt-1 text-[11px] text-neutral-400">
                              {invitedCount} invited
                            </p>
                          )}
                        </div>

                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition">
                          Select
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 bg-[#FAFAFA]/95 px-4 pb-5 pt-3 backdrop-blur">
              <button
                type="button"
                onClick={onClose}
                className="h-11 w-full rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
