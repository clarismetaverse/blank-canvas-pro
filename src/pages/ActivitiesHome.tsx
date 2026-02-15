import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchTrips, type InviteLite, type TripActivity } from "@/services/activities";
type ActivitySeed = {
  title: string;
  city?: string;
  tags?: string[];
  imageUrl?: string;
  timing?: "Tonight" | "Weekend";
};

type ActivityFormState = {
  name: string;
  city: string;
  date: string;
  tags: string[];
};

const availableTags = ["Fashion", "Nightlife", "Yachting", "Wellness", "Luxury", "Editorial"];

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

const suggestedLocalActivities: ActivitySeed[] = [
  {
    title: "Golden Hour Marina Shoot",
    city: "Cannes Marina",
    timing: "Tonight",
    tags: ["Luxury", "Editorial"],
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "After-hours Gallery Walk",
    city: "Old Town",
    timing: "Weekend",
    tags: ["Fashion", "Wellness"],
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
  },
  {
    title: "Beach Club Soft Launch",
    city: "Croisette",
    timing: "Tonight",
    tags: ["Nightlife", "Yachting"],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
];

const easeOut = { duration: 0.35, ease: "easeOut" as const };

const getInvitePreview = (invites: InviteLite[]) => {
  const accepted = invites.filter((invite) => invite.status === "accepted");
  const invited = invites.filter((invite) => invite.status === "invited");
  const hasAccepted = accepted.length > 0;
  const source = hasAccepted ? accepted : invited;

  return {
    hasAccepted,
    preview: source.slice(0, 4),
    overflow: Math.max(source.length - 4, 0),
  };
};

export default function ActivitiesHome() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<ActivityFormState>({ name: "", city: "", date: "", tags: [] });
  const [myActivities, setMyActivities] = useState<TripActivity[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      const trips = await fetchTrips();
      setMyActivities(trips);
    };

    void loadTrips();
  }, []);

  const inviteRoute = useMemo(
    () =>
      location.pathname.startsWith("/memberspass/vic/activities")
        ? "/memberspass/vic/activities/invite"
        : "/activities/invite",
    [location.pathname]
  );

  const openCreateSheet = (seed?: ActivitySeed) => {
    setForm({
      name: seed?.title ?? "",
      city: seed?.city ?? "",
      date: "",
      tags: seed?.tags ?? [],
    });
    setSheetOpen(true);
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
    }));
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
        {myActivities.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 8, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={easeOut}>
            <div className="mb-3 px-1">
              <h2 className="text-sm font-semibold text-neutral-900">Your activities</h2>
            </div>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1">
              {myActivities.map((activity) => (
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
                  className="relative h-52 w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl border border-neutral-200 text-left shadow-[0_18px_38px_rgba(10,10,20,0.16)]"
                >
                  <img src={activity.coverUrl} alt={activity.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/55" />
                  <div className="absolute left-4 top-4">
                    {(() => {
                      const statusAccepted = activity.invites.some((invite) => invite.status === "accepted");
                      return (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
                            statusAccepted
                              ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
                              : "border-neutral-200 bg-white/90 text-neutral-700"
                          }`}
                        >
                          {statusAccepted ? "Accepted" : "Invited"}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 space-y-2.5">
                    <div>
                      <p className="text-base font-semibold text-white">{activity.title}</p>
                      <p className="text-xs text-white/80">{activity.subtitle}</p>
                    </div>
                    {(() => {
                      const { hasAccepted, preview, overflow } = getInvitePreview(activity.invites);
                      const StatusIcon = hasAccepted ? Check : Mail;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/40 bg-black/25 p-1 text-white">
                            <StatusIcon className="h-3 w-3" />
                          </span>
                          <div className="flex items-center -space-x-2">
                            {preview.map((invite) => (
                              <img
                                key={invite.id}
                                src={invite.creator.avatarUrl}
                                alt={invite.creator.name}
                                className="h-7 w-7 rounded-full border border-white/80 object-cover"
                              />
                            ))}
                            {overflow > 0 && (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/45 text-[10px] font-semibold text-white">
                                +{overflow}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...easeOut, delay: 0.05 }}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Create a moment</h2>
          <p className="mt-2 text-sm text-neutral-500">Pick a template or build your own.</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...easeOut, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="px-1">
            <h2 className="text-sm font-semibold text-neutral-900">Event templates</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {cinematicTemplates.map((template) => (
              <button
                key={template.title}
                type="button"
                onClick={() => openCreateSheet(template)}
                className="relative h-56 w-[76%] shrink-0 snap-start overflow-hidden rounded-3xl border border-neutral-200 text-left shadow-[0_14px_34px_rgba(0,0,0,0.12)]"
              >
                <img src={template.imageUrl} alt={template.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />
                <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-neutral-800">
                  Template
                </span>
                <div className="absolute bottom-4 left-4">
                  <p className="text-lg font-semibold text-white">{template.title}</p>
                  <p className="text-xs text-white/80">{template.city}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openCreateSheet()}
            className="w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            Create custom
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ ...easeOut, delay: 0.15 }}
          className="space-y-3"
        >
          <h2 className="px-1 text-sm font-semibold text-neutral-900">Suggested local activities</h2>
          <div className="space-y-3">
            {suggestedLocalActivities.map((item) => (
              <article
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
              >
                <img src={item.imageUrl} alt={item.title} className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-500">{item.timing}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateSheet(item)}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700"
                >
                  Use
                </button>
              </article>
            ))}
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
              className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md rounded-t-3xl border border-neutral-200 bg-white px-4 pb-6 pt-4"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
              <h3 className="text-base font-semibold text-neutral-900">Create activity</h3>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Activity name"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">City / area (optional)</span>
                  <input
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    placeholder="Cannes"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-600">Date (optional)</span>
                  <input
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    placeholder="May 10"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </label>

                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-600">Tags (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const selected = form.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            selected
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 bg-white text-neutral-600"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(inviteRoute, {
                    state: {
                      activityName: form.name.trim(),
                      city: form.city.trim(),
                      date: form.date.trim(),
                      tags: form.tags,
                    },
                  })
                }
                className="mt-5 w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
