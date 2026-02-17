import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calendar, ChevronDown, ChevronUp, Clock, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CreatorLite } from "@/services/creatorSearch";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  tablePreviewLabel: string;
  coverUrl?: string | null;
  dateLabel?: string;
  timeLabel?: string;
  guests: number;
  invited: CreatorLite[];
  onRemoveInvite?: (creatorId: number) => void;
  onConfirm: () => void;
  loading?: boolean;
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

export default function ConfirmInvitesModal({
  open,
  onClose,
  onBack,
  tablePreviewLabel,
  coverUrl,
  dateLabel,
  timeLabel,
  guests,
  invited,
  onRemoveInvite,
  onConfirm,
  loading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center" initial="hidden" animate="visible" exit="exit">
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
            <div className="px-5 pb-5 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold">Confirm invites</p>
                  <p className="mt-1 text-xs text-white/70">For {tablePreviewLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/15 bg-white/10 p-2 text-white/80 hover:bg-white/15"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3">
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate text-sm font-semibold text-white">{tablePreviewLabel}</p>
                    <div className="space-y-1 text-xs text-white/75">
                      <p className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{dateLabel || "Date TBD"}</p>
                      <p className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{timeLabel || "Time TBD"}</p>
                      <p className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{guests} pax</p>
                    </div>
                  </div>
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10">
                    {coverUrl ? <img src={coverUrl} alt={tablePreviewLabel} className="h-full w-full object-cover" /> : null}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/60">Table details (TBD)</p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
                >
                  <span>Invited ({invited.length})</span>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                      <div className="max-h-44 space-y-2 overflow-y-auto p-3">
                        {invited.map((creator) => {
                          const creatorId = Number(creator.id);
                          const username = creator.IG_account || creator.Tiktok_account || "";
                          return (
                            <div key={creatorId} className="flex items-center gap-2">
                              <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                                {creator.Profile_pic?.url ? (
                                  <img src={creator.Profile_pic.url} alt={creator.name || "Creator"} className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-white">{creator.name || "Creator"}</p>
                                <p className="truncate text-xs text-white/60">{username ? `@${username.replace(/^@/, "")}` : "@unknown"}</p>
                              </div>
                              {onRemoveInvite ? (
                                <button
                                  type="button"
                                  onClick={() => onRemoveInvite(creatorId)}
                                  className="rounded-full border border-white/20 p-1 text-white/70 hover:bg-white/10"
                                  aria-label={`Remove ${creator.name || "creator"}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-200/10 p-3 text-xs text-amber-100">
                <p className="inline-flex items-center gap-2 font-semibold text-amber-50"><AlertTriangle className="h-3.5 w-3.5" />Table is not booked yet.</p>
                <p className="mt-1 text-amber-100/85">Invites create an activity request. VIC confirms availability and books the table once approved.</p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="h-11 flex-1 rounded-full border border-white/20 bg-transparent text-sm font-semibold text-white/90"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="h-11 flex-1 rounded-full bg-white text-sm font-semibold text-neutral-900 disabled:opacity-70"
                >
                  {loading ? "Creating…" : "Create activity"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
