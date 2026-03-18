import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, CheckCircle2, ChevronDown, LoaderCircle, MapPin, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CreateLocationCoverPicker from "@/components/vic/CreateLocationCoverPicker";
import type { CreateLocationInput } from "@/components/vic/LocalVenueTypes";
import { createVicLocation, fetchVicLocationCities, type VicLocationCity } from "@/services/vicLocations";

type AddNewLocationSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateLocationInput) => void;
};

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const card = { hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1 }, exit: { y: 20, opacity: 0 } };

const initialState = {
  name: "",
  address: "",
  cityId: "",
  coverUrl: "",
};

export default function AddNewLocationSheet({ open, onClose, onCreate }: AddNewLocationSheetProps) {
  const [{ name, address, cityId, coverUrl }, setForm] = useState(initialState);
  const [cities, setCities] = useState<VicLocationCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitError(null);
      setCityPickerOpen(false);
      return;
    }

    let isMounted = true;

    const loadCities = async () => {
      setCitiesLoading(true);
      setCitiesError(null);

      try {
        const nextCities = await fetchVicLocationCities();
        if (!isMounted) return;
        setCities(nextCities);
        setForm((prev) => {
          if (prev.cityId || !nextCities.length) return prev;
          return { ...prev, cityId: String(nextCities[0].id) };
        });
      } catch (error) {
        if (!isMounted) return;
        setCities([]);
        setCitiesError(error instanceof Error ? error.message : "Unable to load cities right now.");
      } finally {
        if (isMounted) setCitiesLoading(false);
      }
    };

    void loadCities();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const selectedCity = useMemo(
    () => cities.find((item) => String(item.id) === cityId) ?? null,
    [cities, cityId]
  );

  const canCreate = useMemo(
    () => Boolean(name.trim() && address.trim() && selectedCity && !citiesLoading && !isSubmitting),
    [address, citiesLoading, isSubmitting, name, selectedCity]
  );

  const updateField = (field: "name" | "address" | "cityId" | "coverUrl", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialState);
    setSubmitError(null);
    setCityPickerOpen(false);
  };

  const handleSelectCity = (nextCityId: number) => {
    updateField("cityId", String(nextCityId));
    setCityPickerOpen(false);
  };

  const handleCreate = async () => {
    if (!canCreate || !selectedCity) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await createVicLocation({
        Name: name.trim(),
        Adress: address.trim(),
        City: selectedCity.id,
        Cover: coverUrl.trim() || null,
      });

      onCreate({
        id: response.id ? `custom-${response.id}` : `custom-${Date.now()}`,
        backendId: response.id,
        name: response.Name?.trim() || name.trim(),
        address: response.Adress?.trim() || response.Address?.trim() || address.trim(),
        city: selectedCity.CityName,
        cityId: response.City ?? selectedCity.id,
        coverUrl:
          typeof response.Cover === "string"
            ? response.Cover
            : response.Cover?.url || coverUrl.trim() || undefined,
      });

      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create location right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const helperTone = citiesError ? "text-amber-700" : "text-neutral-500";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center p-4" initial="hidden" animate="visible" exit="exit">
          <motion.button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" variants={backdrop} onClick={onClose} />
          <motion.div
            variants={card}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-white/30 bg-[#FFFEFC] shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="border-b border-[#F1E7EC] bg-[radial-gradient(circle_at_top,_rgba(255,90,122,0.18),_transparent_48%),linear-gradient(180deg,#fff9fb_0%,#fffefc_100%)] px-4 pb-4 pt-5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#F7D8E2] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A1E54] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Private venue
                  </span>
                  <p className="mt-3 text-xl font-semibold text-neutral-900">Add new location</p>
                  <p className="mt-1 text-sm text-neutral-500">Create a private venue entry for this plan.</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full bg-white/80 p-2 text-neutral-700 shadow-sm" aria-label="Close add location">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(122,30,84,0.08)] sm:grid-cols-3">
                {[
                  { label: "Private only", value: "Linked to this plan" },
                  { label: "City source", value: citiesLoading ? "Syncing…" : `${cities.length} destinations` },
                  { label: "Submission", value: "Saved to backend" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[#FFF9FB] px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="space-y-3">
                <label className="block rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition focus-within:border-neutral-300 focus-within:shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <span className="mb-2 block text-xs font-semibold text-neutral-500">Venue name</span>
                  <input
                    value={name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="e.g. Private Rooftop by the Marina"
                    className="w-full bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </label>

                <label className="block rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition focus-within:border-neutral-300 focus-within:shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <span className="mb-2 block text-xs font-semibold text-neutral-500">Address</span>
                  <input
                    value={address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="Street, district"
                    className="w-full bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </label>

                <div className="rounded-2xl border border-[#EED9E4] bg-[linear-gradient(180deg,#fffafb_0%,#fffefe_100%)] p-3 shadow-[0_10px_30px_rgba(122,30,84,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A1E54]">City picker</span>
                      <p className="mt-1 text-xs text-neutral-500">Choose from the synced destination list used by the backend.</p>
                    </div>
                    {selectedCity ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm">
                        ID {selectedCity.id}
                      </span>
                    ) : null}
                  </div>

                  <div className="relative mt-3">
                    <button
                      type="button"
                      onClick={() => setCityPickerOpen((prev) => !prev)}
                      disabled={citiesLoading || !cities.length || isSubmitting}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-left shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition hover:border-[#E8CBD8] disabled:cursor-not-allowed disabled:opacity-70"
                      aria-expanded={cityPickerOpen}
                      aria-label="Select city"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Selected destination</p>
                        <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
                          {citiesLoading
                            ? "Loading city list…"
                            : selectedCity?.CityName || (cities.length ? "Choose a city" : "No cities available")}
                        </p>
                      </div>
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3F7] text-[#7A1E54]">
                        <ChevronDown className={`h-4 w-4 transition ${cityPickerOpen ? "rotate-180" : ""}`} />
                      </span>
                    </button>

                    <AnimatePresence>
                      {cityPickerOpen && cities.length ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 overflow-hidden rounded-3xl border border-[#EED9E4] bg-white/95 shadow-[0_24px_60px_rgba(122,30,84,0.16)] backdrop-blur"
                        >
                          <div className="border-b border-[#F5E6EC] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Available cities</p>
                            <p className="mt-1 text-sm text-neutral-500">Tap a destination to lock the backend City ID and continue the local activity flow.</p>
                          </div>
                          <div className="max-h-64 space-y-2 overflow-y-auto p-3">
                            {cities.map((cityOption) => {
                              const active = cityOption.id === selectedCity?.id;

                              return (
                                <button
                                  key={cityOption.id}
                                  type="button"
                                  onClick={() => handleSelectCity(cityOption.id)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                    active
                                      ? "border-[#E8BCD0] bg-[#FFF4F8] shadow-[0_10px_24px_rgba(122,30,84,0.08)]"
                                      : "border-neutral-200 bg-white hover:border-[#E8CBD8] hover:bg-[#FFF9FB]"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-neutral-900">{cityOption.CityName}</p>
                                    <p className="mt-1 text-xs text-neutral-500">Backend City value: {cityOption.id}</p>
                                  </div>
                                  <span
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                                      active
                                        ? "border-[#E3A6C0] bg-[#7A1E54] text-white"
                                        : "border-neutral-200 bg-white text-transparent"
                                    }`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <p className={`mt-3 text-xs ${helperTone}`}>
                    {citiesLoading
                      ? "Loading destination list…"
                      : citiesError
                        ? "Couldn’t load cities. Try reopening the sheet."
                        : selectedCity
                          ? `The backend payload will submit City: ${selectedCity.id} for ${selectedCity.CityName}.`
                          : "Select a city from the synced destination list."}
                  </p>
                </div>

                <CreateLocationCoverPicker coverUrl={coverUrl} onChange={(value) => updateField("coverUrl", value)} />
              </div>

              {submitError ? (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              {!submitError && !citiesError && selectedCity ? (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Ready to create this venue in {selectedCity.CityName} and attach it back into the local activity flow.</span>
                </div>
              ) : null}

              <button
                type="button"
                disabled={!canCreate}
                onClick={() => void handleCreate()}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  canCreate ? "bg-neutral-900 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)] hover:bg-neutral-800" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {isSubmitting ? "Creating location…" : "Create location"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
