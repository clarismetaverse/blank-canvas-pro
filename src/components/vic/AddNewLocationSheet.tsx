import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";
import CreateLocationCoverPicker from "@/components/vic/CreateLocationCoverPicker";
import type { CreateLocationInput } from "@/components/vic/LocalVenueTypes";
import type { ClubCity } from "@/services/membersClubs";

type AddNewLocationSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateLocationInput) => void;
};

const CITIES: ClubCity[] = ["Bali", "Dubai", "Milan"];

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const card = { hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1 }, exit: { y: 20, opacity: 0 } };

export default function AddNewLocationSheet({ open, onClose, onCreate }: AddNewLocationSheetProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState<ClubCity | "">("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const canCreate = useMemo(() => Boolean(name.trim() && address.trim() && city), [name, address, city]);

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      name: name.trim(),
      address: address.trim(),
      city: city,
      coverUrl: coverUrl.trim() || undefined,
      coverFile: coverFile ?? undefined,
    });
    setName("");
    setAddress("");
    setCity("");
    setCoverUrl("");
    setCoverFile(null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center p-4" initial="hidden" animate="visible" exit="exit">
          <motion.button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" variants={backdrop} onClick={onClose} />
          <motion.div variants={card} transition={{ duration: 0.26, ease: "easeOut" }} className="relative z-10 w-full max-w-lg space-y-4 rounded-[28px] border border-white/30 bg-[#FFFEFC] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-neutral-900">Add new location</p>
                <p className="mt-1 text-sm text-neutral-500">Create a private venue entry for this plan.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full bg-neutral-100 p-2 text-neutral-700" aria-label="Close add location">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block rounded-2xl border border-neutral-200 bg-white p-3">
                <span className="mb-2 block text-xs font-semibold text-neutral-500">Venue name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Private Rooftop by the Marina" className="w-full bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none" />
              </label>
              <label className="block rounded-2xl border border-neutral-200 bg-white p-3">
                <span className="mb-2 block text-xs font-semibold text-neutral-500">Address</span>
                <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, district" className="w-full bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none" />
              </label>

              {/* City picker dropdown — no free text input */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCityPickerOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">City</span>
                    <span className={`block text-sm font-medium ${city ? "text-neutral-900" : "text-neutral-400"}`}>
                      {city || "Select a city"}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${cityPickerOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {cityPickerOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                    >
                      {CITIES.map((c) => (
                        <li key={c}>
                          <button
                            type="button"
                            onClick={() => {
                              setCity(c);
                              setCityPickerOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-3 text-sm font-medium transition hover:bg-neutral-50 ${
                              city === c ? "bg-neutral-50 text-neutral-900" : "text-neutral-700"
                            }`}
                          >
                            {c}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <CreateLocationCoverPicker coverUrl={coverUrl} onChange={setCoverUrl} />
            </div>

            <button
              type="button"
              disabled={!canCreate}
              onClick={handleCreate}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${canCreate ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"}`}
            >
              <MapPin className="h-4 w-4" />
              Create location
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
