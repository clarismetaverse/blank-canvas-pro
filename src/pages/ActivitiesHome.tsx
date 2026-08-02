import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ImagePlus, Mail, MapPin, Plane, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchEventTemps, type EventTemp, type InviteLite, type TripActivity } from "@/services/activities";
import { CURATE_CITIES, curateLocalActivity } from "@/services/curateActivity";
import { fetchVicActivities } from "@/services/vicActivity";
import type { Activity, ActivityStatus } from "@/services/activityApi";
import InviteExperienceSheet from "@/components/vic/InviteExperienceSheet";
import { fetchVicLocations, type VicLocation } from "@/services/vicLocationsList";
import { fetchActivityInvited } from "@/services/activityInvited";
type ActivitySeed = {
  title: string;
  city?: string;
  tags?: string[];
  imageUrl?: string;
  timing?: "Tonight" | "Weekend";
};

type CreateActivityFormState = {
  cityId: number;
  title: string;
  description: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  maxGuests: string;
};

const emptyCreateForm: CreateActivityFormState = {
  cityId: CURATE_CITIES[0].id,
  title: "",
  description: "",
  address: "",
  date: "",
  startTime: "",
  endTime: "",
  maxGuests: "5",
};

const cinematicTemplates: ActivitySeed[] = [
  {
    title: "Cannes",
    city: "Cannes",
    tags: ["Luxury", "Fashion"],
    imageUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Ibiza Opening",
    city: "Ibiza",
    tags: ["Nightlife", "Yachting"],
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Art Basel",
    city: "Miami",
    tags: ["Editorial", "Luxury"],
    imageUrl:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Fashion Week Closing Party",
    city: "Paris",
    tags: ["Fashion", "Nightlife"],
    imageUrl:
      "https://images.unsplash.com/photo-1495121605193-b116b5b09a7e?auto=format&fit=crop&w=1400&q=80",
  },
];




const easeOut = { duration: 0.35, ease: "easeOut" as const };
const ACTIVITY_PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80";

const statusLabelMap: Record<ActivityStatus, string> = {
  draft: "Draft",
  active: "Invited",
  reserved: "Reserved",
  confirmed: "Accepted",
  cancelled: "Cancelled",
  on_review: "On Review",
};

const toInviteStatus = (status?: ActivityStatus): InviteLite["status"] => {
  if (status === "confirmed") return "accepted";
  if (status === "cancelled") return "rejected";
  return "invited";
};

const mapActivityToTrip = (activity: Activity): TripActivity => {
  const invitedExpanded =
    activity.ModelsList && activity.ModelsList.length > 0 ? activity.ModelsList : activity.InvitedUsersExpanded ?? [];

  const invites: InviteLite[] = invitedExpanded.slice(0, 3).map((user, index) => ({
    id: String(user.id ?? `${activity.id}-${index}`),
    status: toInviteStatus(activity.status),
    creator: {
      name: user.name || "Invited creator",
      avatarUrl: user.Profile_pic?.url || "https://i.pravatar.cc/100?img=65",
      ig: "",
    },
  }));

  return {
    id: String(activity.id),
    title: activity.Name || "Untitled",
    subtitle: activity.Destination || "Local",
    coverUrl:
      activity.Tripcover && typeof activity.Tripcover === "object" && "url" in activity.Tripcover
        ? String((activity.Tripcover as { url?: string }).url || ACTIVITY_PLACEHOLDER_COVER)
        : ACTIVITY_PLACEHOLDER_COVER,
    dateLabel: activity.Starting_Day || "",
    locationLabel: activity.Destination || "Local",
    notes: activity.ActivitiesList || "",
    invites,
  };
};

export default function ActivitiesHome() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateActivityFormState>(emptyCreateForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [myActivities, setMyActivities] = useState<TripActivity[]>([]);
  const [myActivitiesRaw, setMyActivitiesRaw] = useState<Activity[]>([]);
  const [myActivitiesLoading, setMyActivitiesLoading] = useState(true);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteFilterType, setInviteFilterType] = useState<"local" | "trip" | "bali">("trip");
  const [eventTemps, setEventTemps] = useState<EventTemp[]>([]);
  const [eventTempsLoading, setEventTempsLoading] = useState(true);
  const [suggestedLocations, setSuggestedLocations] = useState<VicLocation[]>([]);
  const [suggestedLocationsLoading, setSuggestedLocationsLoading] = useState(true);
  const [invitedByActivity, setInvitedByActivity] = useState<Record<number, Array<{ id: number; name: string; avatarUrl: string }>>>({});

  const loadActivities = useCallback(async () => {
      setMyActivitiesLoading(true);
      try {
        const activities = await fetchVicActivities();
        setMyActivitiesRaw(activities);
        setMyActivities(activities.map(mapActivityToTrip));

        // Fetch invited creators per activity in parallel
        const entries = await Promise.all(
          activities.map(async (a) => {
            try {
              const invited = await fetchActivityInvited(a.id);
              const creators = invited
                .filter((i) => i.type === "invited" && i._user_turbo)
                .map((i) => ({
                  id: i.user_turbo_id,
                  name: i._user_turbo?.name || "Invited",
                  avatarUrl: i._user_turbo?.Profile_pic?.url || "",
                }))
                .filter((c) => c.avatarUrl);
              return [a.id, creators] as const;
            } catch {
              return [a.id, []] as const;
            }
          })
        );
        setInvitedByActivity(Object.fromEntries(entries));
      } catch (error) {
        console.error("Failed to load activities/me", error);
        setMyActivitiesRaw([]);
        setMyActivities([]);
      } finally {
        setMyActivitiesLoading(false);
      }
  }, []);

  useEffect(() => {
    const loadEventTemps = async () => {
      setEventTempsLoading(true);
      try {
        const temps = await fetchEventTemps();
        setEventTemps(temps.filter((t) => t.Name));
      } catch (error) {
        console.error("Failed to load event temps", error);
        setEventTemps([]);
      } finally {
        setEventTempsLoading(false);
      }
    };

    const loadSuggestedLocations = async () => {
      setSuggestedLocationsLoading(true);
      try {
        const items = await fetchVicLocations();
        setSuggestedLocations(items);
      } catch (error) {
        console.error("Failed to load vic_location", error);
        setSuggestedLocations([]);
      } finally {
        setSuggestedLocationsLoading(false);
      }
    };

    void loadActivities();
    void loadEventTemps();
    void loadSuggestedLocations();
  }, [loadActivities]);

  const openCreateSheet = (seed?: ActivitySeed) => {
    setForm({ ...emptyCreateForm, title: seed?.title ?? "", address: seed?.city ?? "" });
    setCoverFile(null);
    setCoverPreview("");
    setFormError("");
    setSheetOpen(true);
  };

  const handleCoverSelect = (file: File | null) => {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : "");
  };

  const maxGuestsValue = Number(form.maxGuests) > 0 ? Number(form.maxGuests) : 5;

  const canSubmit =
    !!coverFile &&
    !!form.title.trim() &&
    !!form.description.trim() &&
    !!form.address.trim() &&
    !!form.date &&
    !!form.startTime &&
    !!form.endTime;

  const handleCreateActivity = async () => {
    setFormError("");
    if (!canSubmit || !coverFile) {
      setFormError("Please complete every field and add a cover image.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setFormError("End time must be after the start time.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await curateLocalActivity({
        cityId: form.cityId,
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        activityDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        maxGuests: maxGuestsValue,
        cover: coverFile,
      });

      setSheetOpen(false);
      setForm(emptyCreateForm);
      handleCoverSelect(null);
      toast.success(`Activity submitted — ${result.status_label || "On Review"}`);
      await loadActivities();
    } catch (err) {
      console.error("Failed to curate activity:", err);
      setFormError("We couldn't create this activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0B0B0F]">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-[#FAFAFA]/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-md px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-neutral-900">Activities</h1>
              <p className="text-xs text-neutral-500">Create &amp; invite models</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md space-y-6 px-4 pb-16 pt-5">
        {(() => {
          const hasActivities = !myActivitiesLoading && myActivities.length > 0;

          const upcomingSection = (
            <motion.section
              key="upcoming"
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={easeOut}
            >
              <div className="mb-3 px-1">
                <h2 className="text-sm font-semibold text-neutral-900">Your upcoming activities</h2>
              </div>
              {myActivitiesLoading ? (
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1">
                  {[0, 1].map((item) => (
                    <div key={item} className="h-60 w-[84%] shrink-0 animate-pulse rounded-3xl border border-neutral-200 bg-neutral-200/70" />
                  ))}
                </div>
              ) : myActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                  No activities yet
                </div>
              ) : (
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1">
                  {myActivities.map((activity, index) => {
                    const raw = myActivitiesRaw[index];
                    const statusLabel =
                      raw?.statusLabel || (raw?.status ? statusLabelMap[raw.status] : "Invited");
                    const statusAccepted = raw?.status === "confirmed";
                    const statusOnReview = raw?.status === "on_review";
                    const fetchedInvited = invitedByActivity[Number(activity.id)] || [];
                    const previewAvatars = fetchedInvited.length > 0
                      ? fetchedInvited.slice(0, 4).map((c) => ({ id: String(c.id), creator: { name: c.name, avatarUrl: c.avatarUrl, ig: "" }, status: "invited" as const }))
                      : activity.invites;
                    const totalInvited = fetchedInvited.length > 0 ? fetchedInvited.length : (raw?.InvitedUsers?.length ?? 0);


                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() =>
                          navigate(
                            location.pathname.startsWith("/memberspass/vic/activities")
                              ? `/memberspass/vic/activities/${activity.id}`
                              : `/activities/${activity.id}`
                          )
                        }
                        className="relative h-72 w-[92%] shrink-0 snap-start overflow-hidden rounded-3xl border border-neutral-200 text-left shadow-[0_18px_38px_rgba(10,10,20,0.16)]"
                      >
                        <img src={activity.coverUrl} alt={activity.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/55" />
                        <div className="absolute left-4 top-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                              statusAccepted
                                ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                                : statusOnReview
                                  ? "border-amber-200 bg-amber-50/90 text-amber-700"
                                  : "border-neutral-200 bg-white/90 text-neutral-700"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 space-y-2.5">
                          <div>
                            <p className="text-base font-semibold text-white">{activity.title}</p>
                            <p className="text-xs text-white/80">{activity.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-white/40 bg-black/25 p-1 text-white">
                              {(previewAvatars.length > 0 || totalInvited > 0) ? <Mail className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                            </span>
                            {previewAvatars.length > 0 ? (
                              <div className="flex items-center -space-x-2">
                                {previewAvatars.map((invite) => (
                                  <img
                                    key={invite.id}
                                    src={invite.creator.avatarUrl}
                                    alt={invite.creator.name}
                                    className="h-7 w-7 rounded-full border border-white/80 object-cover"
                                  />
                                ))}
                                {totalInvited > previewAvatars.length && (
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/45 text-[10px] font-semibold text-white">
                                    +{totalInvited - previewAvatars.length}
                                  </span>
                                )}
                              </div>
                            ) : totalInvited > 0 ? (
                              <p className="text-xs text-white/85">{totalInvited} invited creator{totalInvited > 1 ? "s" : ""}</p>
                            ) : (
                              <p className="text-xs text-white/85">No invited creators yet</p>
                            )}
                          </div>

                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.section>
          );

          const createSection = (
            <motion.section
              key="create"
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...easeOut, delay: 0.05 }}
              className="relative"
            >
              <div className="flex items-center gap-2 px-1">
                <span className="h-px w-5 bg-[#c9a86a]/80" />
                <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#c9a86a]">By invitation</span>
              </div>
              <h2 className={`mt-2 px-1 font-serif leading-[1.1] tracking-tight text-neutral-900 ${hasActivities ? "text-[17px]" : "text-[22px]"}`}>
                Curate a moment
              </h2>
              {!hasActivities && (
                <p className="mt-1 px-1 text-[12px] leading-relaxed text-neutral-500">
                  Choose the form your gathering will take.
                </p>
              )}

              <div className={`grid grid-cols-2 gap-2.5 ${hasActivities ? "mt-3" : "mt-4"}`}>
                {([
                  { label: "Local activity", hint: "An intimate evening, close to home", icon: MapPin, type: "local" as const },
                  { label: "A trip", hint: "Days away, with chosen company", icon: Plane, type: "trip" as const },
                ]).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.type === "local") {
                        openCreateSheet();
                        return;
                      }
                      setInviteFilterType(item.type);
                      setInviteSheetOpen(true);
                    }}
                    className={`group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 sunset-gradient text-left transition hover:border-[#c9a86a]/40 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] active:scale-[0.99] ${
                      hasActivities ? "p-3" : "aspect-square p-3.5"
                    }`}
                  >
                    <span className={`flex items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition group-hover:border-[#c9a86a]/50 group-hover:text-[#c9a86a] ${hasActivities ? "h-7 w-7" : "h-9 w-9"}`}>
                      <item.icon className={hasActivities ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.5} />
                    </span>
                    <span className={`block ${hasActivities ? "mt-2" : ""}`}>
                      <span className={`block font-medium tracking-tight text-neutral-900 ${hasActivities ? "text-[13px]" : "text-[14px]"}`}>{item.label}</span>
                      {!hasActivities && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">{item.hint}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

            </motion.section>
          );

          return hasActivities ? (
            <>
              {upcomingSection}
              {createSection}
            </>
          ) : (
            <>
              {createSection}
              {upcomingSection}
            </>
          );
        })()}

        <motion.section
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...easeOut, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="px-1">
            <h2 className="text-sm font-semibold text-neutral-900">✨ Highlights and International events 🌍</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {eventTempsLoading ? (
              [0, 1].map((i) => (
                <div key={i} className="h-56 w-[76%] shrink-0 animate-pulse rounded-3xl border border-neutral-200 bg-neutral-200/70" />
              ))
            ) : eventTemps.length === 0 ? (
              <div className="w-full rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                No event templates yet
              </div>
            ) : (
              eventTemps.map((template) => {
                const coverUrl = template.Cover?.url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80";
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => navigate(`/activities/${template.id}`)}
                    className="relative h-56 w-[76%] shrink-0 snap-start overflow-hidden rounded-3xl border border-neutral-200 text-left shadow-[0_14px_34px_rgba(0,0,0,0.12)]"
                  >
                    <img src={coverUrl} alt={template.Name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />
                    <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-neutral-800">
                      {template.Type || "Template"}
                    </span>
                    <div className="absolute bottom-4 left-4">
                      <p className="text-lg font-semibold text-white">{template.Name}</p>
                      {template.Date_start && <p className="text-xs text-white/80">{template.Date_start}</p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...easeOut, delay: 0.15 }}
          className="space-y-3"
        >
          <h2 className="px-1 text-sm font-semibold text-neutral-900">Suggested locations</h2>
          <div className="space-y-3">
            {suggestedLocationsLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-[68px] animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100" />
              ))
            ) : suggestedLocations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
                No locations yet
              </div>
            ) : (
              suggestedLocations.slice(0, 6).map((loc) => {
                const cover = loc.Cover?.url || loc.GaIIery?.[0]?.url || ACTIVITY_PLACEHOLDER_COVER;
                const title = loc.Title || "Untitled location";
                const likedCount = 6 + ((loc.id * 13) % 38);
                const avatarSeeds = [
                  ((loc.id * 7) % 70) + 1,
                  ((loc.id * 11) % 70) + 1,
                  ((loc.id * 17) % 70) + 1,
                ];
                return (
                  <article
                    key={loc.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                  >
                    <img src={cover} alt={title} className="h-12 w-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">{title}</p>
                      {loc.Adress && <p className="truncate text-xs text-neutral-500">{loc.Adress}</p>}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {avatarSeeds.map((seed, i) => (
                            <img
                              key={i}
                              src={`https://i.pravatar.cc/40?img=${seed}`}
                              alt=""
                              className="h-4 w-4 rounded-full border border-white object-cover"
                            />
                          ))}
                        </div>
                        <span className="text-[10.5px] font-medium text-neutral-500">
                          Liked by {likedCount} models · {2 + ((loc.id * 5) % 14)} events held
                        </span>

                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateSheet({ title, city: loc.Adress })}
                      className="rounded-full border border-neutral-200 sunset-gradient px-3 py-1.5 text-xs font-semibold text-neutral-700"
                    >
                      Use
                    </button>
                  </article>
                );
              })

            )}
          </div>

        </motion.section>
      </main>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close create activity"
            />
            <motion.section
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              transition={easeOut}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl border border-neutral-200 bg-white px-4 pb-20 pt-4"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
              <h3 className="font-serif text-[19px] leading-tight text-neutral-900">Create a local activity</h3>
              <p className="mt-1 text-[11.5px] text-neutral-500">
                Curate the moment. Our team reviews it before it goes live.
              </p>

              <div className="mt-4 max-h-[62vh] space-y-3.5 overflow-y-auto pr-0.5">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-neutral-600">Cover image</span>
                  {coverPreview ? (
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                      <img src={coverPreview} alt="Activity cover" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleCoverSelect(null)}
                        className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm"
                        aria-label="Remove cover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 transition hover:border-[#c9a86a]/50">
                      <span className="inline-flex items-center gap-2 text-xs font-medium">
                        <ImagePlus className="h-4 w-4" />
                        Add a cover image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleCoverSelect(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">City</span>
                  <select
                    value={form.cityId}
                    onChange={(event) => setForm((prev) => ({ ...prev, cityId: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
                  >
                    {CURATE_CITIES.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Sunset dinner at Jungle Sky"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    placeholder="Tell your guests what the evening feels like."
                    className="w-full resize-none rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Address</span>
                  <input
                    value={form.address}
                    onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder="Venue name, street"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-neutral-600">Start time</span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-neutral-600">End time</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Maximum guests</span>
                  <input
                    type="number"
                    min={1}
                    value={form.maxGuests}
                    onChange={(event) => setForm((prev) => ({ ...prev, maxGuests: event.target.value }))}
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>
              </div>

              {formError && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] font-medium text-red-600">{formError}</p>
              )}

              <button
                type="button"
                disabled={submitting || !canSubmit}
                onClick={handleCreateActivity}
                className="mt-4 w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Create activity"}
              </button>

            </motion.section>
          </>
        )}
      </AnimatePresence>

      <InviteExperienceSheet
        open={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        creator={null}
        filterType={inviteFilterType}
      />
    </div>
  );
}
