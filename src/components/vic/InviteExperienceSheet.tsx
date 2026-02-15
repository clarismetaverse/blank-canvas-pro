import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronRight, MoonStar, Ship, Sparkles, User, Utensils, Waves, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreatorLite } from "@/services/creatorSearch";

type InviteExperienceSheetProps = {
  open: boolean;
  onClose: () => void;
  creator: CreatorLite | null;
};

type ExperienceItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sheet = {
  hidden: { y: "12%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: "12%", opacity: 0 },
};

const upcomingExperiences: ExperienceItem[] = [
  { id: "upcoming-cannes", title: "Cannes", subtitle: "Limited spots" },
  { id: "upcoming-f1", title: "F1", subtitle: "VIP access" },
  { id: "upcoming-festival", title: "Festival", subtitle: "Community favorite" },
];

const tripsEndpoint = "https://xbut-eryu-hhsg.f2.xano.io/api:bwh6Xc5O/motherboard/trips";

const activityItems: ActivityItem[] = [
  {
    id: "private-dinner",
    title: "Private dinner",
    description: "Signature table placement, arrival coordination, and a curated tasting path for an intimate evening.",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "yacht-day",
    title: "Yacht day",
    description: "Departures timed to golden hour, premium onboard service, and custom swim or lunch stopovers.",
    imageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "beach-club",
    title: "Beach club",
    description: "Front-row loungers, soundtrack and bottle planning, and smooth concierge-managed flow.",
    imageUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "shopping-styling",
    title: "Shopping & styling",
    description: "Personalized store routing with stylist picks, fitting slots, and private appointment handling.",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "photoshoot",
    title: "Photoshoot / content day",
    description: "Moodboard-aligned locations, shot planning, and timeline support from glam to golden hour.",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "night-out",
    title: "Night out / club",
    description: "A seamless after-dark route with priority entry, table booking, and trusted host support.",
    imageUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=900&q=80",
  },
];

const formatTripDate = (value?: string) => {
  if (!value) {
    return "TBD";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const activityIcons = {
  "private-dinner": Utensils,
  "yacht-day": Ship,
  "beach-club": Waves,
  "shopping-styling": Sparkles,
  photoshoot: Calendar,
  "night-out": MoonStar,
} as const;

export default function InviteExperienceSheet({ open, onClose, creator }: InviteExperienceSheetProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [upcomingItems, setUpcomingItems] = useState<ExperienceItem[]>(upcomingExperiences);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<ActivityItem["id"][]>([]);
  const [activityRequests, setActivityRequests] = useState<Record<string, string>>({});
  const [highlightActivities, setHighlightActivities] = useState(false);
  const [isStickyHeader, setIsStickyHeader] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activitiesSectionRef = useRef<HTMLElement | null>(null);

  const creatorName = creator?.name || "Creator";

  useEffect(() => {
    let isMounted = true;

    const loadTrips = async () => {
      setUpcomingLoading(true);
      try {
        const response = await fetch(tripsEndpoint);
        if (!response.ok) {
          throw new Error("Failed to load trips");
        }
        const trips = (await response.json()) as Array<{
          Name?: string;
          Destination?: string;
          Starting_Day?: string;
          Return?: string;
          Tripcover?: { url?: string | null } | null;
        }>;
        const mapped = trips.map((trip, index) => {
          const title = trip.Name ?? "Upcoming trip";
          const start = formatTripDate(trip.Starting_Day);
          const end = formatTripDate(trip.Return);
          const subtitle = trip.Destination ? `${trip.Destination} • ${start} → ${end}` : `${start} → ${end}`;
          return {
            id: `trip-${trip.Name ?? "trip"}-${trip.Starting_Day ?? index}`,
            title,
            subtitle,
            imageUrl: trip.Tripcover?.url ?? undefined,
          } satisfies ExperienceItem;
        });
        if (isMounted) {
          setUpcomingItems(mapped.length ? mapped : upcomingExperiences);
        }
      } catch (_error) {
        if (isMounted) {
          setUpcomingItems(upcomingExperiences);
        }
      } finally {
        if (isMounted) {
          setUpcomingLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTrip = useMemo(
    () => upcomingItems.find((item) => item.id === activeTripId) ?? null,
    [activeTripId, upcomingItems]
  );

  const selectedActivityDetails = useMemo(
    () => activityItems.filter((item) => selectedActivities.includes(item.id)),
    [selectedActivities]
  );

  const isTopCreator = useMemo(() => {
    const creatorWithTier = creator as (CreatorLite & { tier?: string; vip?: boolean }) | null;
    if (!creatorWithTier) {
      return false;
    }
    if (creatorWithTier.tier === "top" || creatorWithTier.vip === true) {
      return true;
    }
    // TODO: replace this heuristic with a backend-driven signal.
    const normalizedName = creatorWithTier.name?.toLowerCase() ?? "";
    const account = creatorWithTier.IG_account?.toLowerCase() ?? "";
    return normalizedName.includes("top") || account.includes("verified") || creatorWithTier.id % 7 === 0;
  }, [creator]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    const handleScroll = () => {
      if (!activeTripId) {
        setIsStickyHeader(false);
        return;
      }
      setIsStickyHeader(node.scrollTop > 280);
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, [activeTripId]);

  const canSubmitProposal = proposalText.trim().length > 10;
  const canSendInvitation = Boolean(activeTrip) && (selectedActivities.length > 0 || canSubmitProposal);

  const handleToggleSelectedActivity = (activityId: ActivityItem["id"]) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]
    );
  };

  const handleHighlightActivities = () => {
    activitiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightActivities(true);
    window.setTimeout(() => {
      setHighlightActivities(false);
    }, 1500);
  };

  const handleInvite = () => {
    if (!canSendInvitation) {
      return;
    }
    setConfirmationOpen(true);
  };

  const handleConfirmSend = () => {
    if (!activeTrip) {
      return;
    }
    setConfirmationOpen(false);
    onClose();
    navigate("/invite/accepted", {
      state: {
        venueName: activeTrip.title,
        collabTitle: selectedActivities.length
          ? `${selectedActivities.length} selected activities`
          : proposalText.trim() || "Curated collaboration",
        coverUrl: activeTrip.imageUrl,
      },
    });
  };

  const creatorAvatar = (creator as (CreatorLite & { Profile_pic?: { url?: string | null } }) | null)?.Profile_pic?.url;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial="hidden" animate="visible" exit="exit">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdrop}
            onClick={onClose}
            aria-label="Close invite experience"
          />
          <motion.div
            ref={scrollRef}
            className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto overscroll-y-contain rounded-t-[28px] bg-white shadow-2xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            variants={sheet}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <AnimatePresence>
              {activeTrip && isStickyHeader && (
                <motion.div
                  className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/85 px-4 py-3 backdrop-blur"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <p className="text-sm font-semibold text-neutral-900">{activeTrip.title}</p>
                  <button
                    type="button"
                    className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm"
                    onClick={() => setActiveTripId(null)}
                  >
                    Back to trips
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeTrip ? (
                <motion.div
                  key="event-view"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6 px-5 pb-24 pt-4"
                >
                  <section>
                    <motion.div
                      layoutId={`trip-card-${activeTrip.id}`}
                      className="relative h-[360px] w-full overflow-hidden rounded-3xl text-white"
                    >
                      {activeTrip.imageUrl ? (
                        <img src={activeTrip.imageUrl} alt={activeTrip.title} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-neutral-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <button
                        type="button"
                        className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-800"
                        onClick={() => setActiveTripId(null)}
                      >
                        Back to trips
                      </button>
                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-3xl font-semibold">{activeTrip.title}</p>
                        {activeTrip.subtitle && <p className="mt-1 text-sm text-white/75">{activeTrip.subtitle}</p>}
                      </div>
                    </motion.div>
                  </section>

                  {isTopCreator && (
                    <section className="relative overflow-hidden rounded-3xl border border-[#FF5A7A]/20 bg-gradient-to-br from-[#1f1022] via-[#3b1a39] to-[#7A1E54] p-5 text-white shadow-[0_20px_40px_rgba(122,30,84,0.35)]">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-3xl" />
                      <div className="relative">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                          <Sparkles className="h-3.5 w-3.5" />
                          Top creator signal
                        </p>
                        <p className="mt-3 text-xl font-semibold">Prepare a top-level handcrafted plan</p>
                        <p className="mt-1 text-sm text-white/80">
                          Maximize your acceptance rate with a curated itinerary.
                        </p>
                        <button
                          type="button"
                          onClick={handleHighlightActivities}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
                        >
                          Build handcrafted plan
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  <section
                    ref={activitiesSectionRef}
                    className={`space-y-3 rounded-3xl bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition ${
                      highlightActivities ? "ring-2 ring-[#FF5A7A]/50 ring-offset-2" : ""
                    }`}
                  >
                    <div>
                      <p className="text-xl font-semibold text-neutral-900 flex items-center gap-2">{creatorAvatar ? <img src={creatorAvatar} alt={creatorName} className="h-7 w-7 rounded-full object-cover shrink-0" /> : <User className="h-5 w-5 text-neutral-500 shrink-0" />}Pre-plan an activity program with {creatorName}</p>
                      <p className="mt-1 text-sm text-neutral-500">Select your ideal moments and let VIC curate every detail.</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900">Program builder</p>
                        {activeTrip.subtitle && <p className="text-xs font-medium text-neutral-500">{activeTrip.subtitle}</p>}
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="border-b border-neutral-200 pb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">1. Check-in</p>
                          <p className="mt-1 text-xs text-neutral-500">Arrival, welcome setup and first-touch coordination.</p>
                        </div>

                        <div className="space-y-3 border-b border-neutral-200 pb-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">2. Choose the moments you want to include</p>
                            <p className="mt-1 text-xs text-neutral-500">Build your handcrafted activity flow for the core stay.</p>
                          </div>
                          {activityItems.map((activity) => {
                            const isOpen = expandedActivityId === activity.id;
                            const isSelected = selectedActivities.includes(activity.id);
                            const Icon = activityIcons[activity.id as keyof typeof activityIcons] || Sparkles;
                            return (
                              <article
                                key={activity.id}
                                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
                              >
                                <div className="relative h-44 w-full">
                                  <img src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                  <div className="absolute bottom-4 left-4 right-4">
                                    <p className="inline-flex items-center gap-2 text-xs font-semibold text-white/80">
                                      <Icon className="h-4 w-4" />
                                      Signature moment
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-white">{activity.title}</p>
                                  </div>
                                </div>
                                <div className="space-y-3 px-4 pb-4 pt-3">
                                  <p className="text-xs text-neutral-600">{activity.description}</p>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSelectedActivity(activity.id)}
                                      className={`rounded-full px-4 py-2 text-xs font-semibold text-white ${
                                        isSelected ? "bg-[#FF5A7A]" : "bg-neutral-900"
                                      }`}
                                    >
                                      {isSelected ? "Added" : "Add to plan"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedActivityId((prev) => (prev === activity.id ? null : activity.id))}
                                      className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700"
                                    >
                                      Request concierge
                                    </button>
                                  </div>
                                  <AnimatePresence initial={false}>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className="overflow-hidden"
                                      >
                                        <div className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                          <textarea
                                            rows={3}
                                            value={activityRequests[activity.id] ?? ""}
                                            onChange={(event) =>
                                              setActivityRequests((prev) => ({ ...prev, [activity.id]: event.target.value }))
                                            }
                                            placeholder="Share the concierge details you need..."
                                            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-700 focus:border-[#FF5A7A]/60 focus:outline-none"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => window.alert("Request sent")}
                                            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                                          >
                                            Send request
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">3. Return</p>
                          <p className="mt-1 text-xs text-neutral-500">Departure, checkout timing and final transport plan.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-white p-4">
                      <p className="text-sm font-semibold text-neutral-900">Your plan</p>
                      {selectedActivityDetails.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedActivityDetails.map((activity) => (
                            <span
                              key={activity.id}
                              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                            >
                              {activity.title}
                              <button
                                type="button"
                                onClick={() => handleToggleSelectedActivity(activity.id)}
                                className="rounded-full bg-white p-0.5 text-neutral-500"
                                aria-label={`Remove ${activity.title}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">No moments selected yet.</p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm font-semibold text-neutral-900">Optional proposal note</p>
                      <textarea
                        rows={3}
                        value={proposalText}
                        onChange={(event) => setProposalText(event.target.value)}
                        placeholder="Share what kind of experience you want..."
                        className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-[#FF5A7A]/60 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        {canSubmitProposal ? "Proposal text is valid." : "Write at least 11 characters to enable invitation by proposal text."}
                      </p>
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-6 px-5 pb-24 pt-6"
                >
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-neutral-900">Upcoming trips</p>
                      <button
                        type="button"
                        className="rounded-full bg-neutral-100 p-2 text-neutral-700"
                        onClick={onClose}
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {upcomingLoading
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <div
                              key={`upcoming-skeleton-${index}`}
                              className="min-h-[280px] w-full animate-pulse rounded-3xl bg-neutral-200/80"
                            />
                          ))
                        : upcomingItems.map((item) => {
                            const isSelected = selectedId === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setActiveTripId(item.id);
                                }}
                                className={`relative min-h-[280px] w-full overflow-hidden rounded-3xl text-left text-white shadow-lg transition active:scale-[0.99] ${
                                  isSelected ? "ring-2 ring-[#FF5A7A]/50" : ""
                                }`}
                              >
                                <motion.div layoutId={`trip-card-${item.id}`} className="absolute inset-0">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 bg-neutral-900" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                </motion.div>
                                <div className="relative flex h-full flex-col justify-end p-6">
                                  <div className="space-y-1">
                                    <p className="text-2xl font-semibold text-white">{item.title}</p>
                                    {item.subtitle && <p className="text-sm text-white/75">{item.subtitle}</p>}
                                  </div>
                                  {isSelected && (
                                    <span className="mt-4 inline-flex w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900">
                                      Selected
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="sticky bottom-0 z-20 -mx-0 mt-2 border-t border-neutral-200 bg-white/95 px-5 pb-4 pt-4 backdrop-blur">
              <button
                type="button"
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition ${
                  canSendInvitation ? "bg-neutral-900" : "bg-neutral-300"
                }`}
                disabled={!canSendInvitation}
                onClick={handleInvite}
              >
                Send invitation
              </button>
              <button
                type="button"
                className={`mt-3 w-full text-xs font-semibold ${canSendInvitation ? "text-neutral-700" : "text-neutral-400"}`}
                disabled={!canSendInvitation}
              >
                Share profile
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {confirmationOpen && activeTrip && (
              <motion.div className="fixed inset-0 z-[70] flex items-center justify-center px-5" initial="hidden" animate="visible" exit="exit">
                <motion.button
                  type="button"
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  variants={backdrop}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={() => setConfirmationOpen(false)}
                  aria-label="Close invitation confirmation"
                />
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-neutral-950 p-4 text-white shadow-[0_40px_100px_rgba(0,0,0,0.45)]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-[#FF385C] hover:text-[#FF385C]"
                    >
                      Invite {creatorName}
                    </button>
                    {creatorAvatar ? (
                      <img src={creatorAvatar} alt={creatorName} className="h-10 w-10 rounded-full border border-white/30 object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-semibold">
                        {creatorName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-white/90">{creatorName}</p>
                  </div>

                  <div className="relative mb-4 h-56 w-full overflow-hidden rounded-3xl">
                    {activeTrip.imageUrl ? (
                      <img src={activeTrip.imageUrl} alt={activeTrip.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-neutral-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-2xl font-semibold">{activeTrip.title}</p>
                      {activeTrip.subtitle && <p className="mt-1 text-sm text-white/75">{activeTrip.subtitle}</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Plan preview</p>
                    {selectedActivityDetails.length ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-white/90">
                        {selectedActivityDetails.slice(0, 3).map((activity) => (
                          <li key={`preview-${activity.id}`} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                            {activity.title}
                          </li>
                        ))}
                        {selectedActivityDetails.length > 3 && (
                          <li className="text-xs text-white/70">+ {selectedActivityDetails.length - 3} more</li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-white/70">No activities selected.</p>
                    )}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmationOpen(false)}
                      className="flex-1 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white/90"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSend}
                      className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900"
                    >
                      Confirm &amp; send
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
