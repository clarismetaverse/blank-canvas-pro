import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LoaderCircle, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import CreateLocationCoverPicker from "@/components/vic/CreateLocationCoverPicker";
import type { CreateLocationInput } from "@/components/vic/LocalVenueTypes";
import { fetchVenueCities, type VenueCity } from "@/services/vicLocations";

type AddNewLocationSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateLocationInput) => void;
};

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const card = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

const fieldBaseClass =
  "block rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition focus-within:border-neutral-300 focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.06)]";

export default function AddNewLocationSheet({
  open,
  onClose,
  onCreate,
}: AddNewLocationSheetProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState<VenueCity | null>(null);
  const [cities, setCities] = useState<VenueCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const cityPickerRef = useRef<HTMLDivElement | null>(null);

  const resetForm = () => {
    setName("");
    setAddress("");
    setSelectedCity(null);
    setCoverUrl("");
    setCoverFile(null);
    setCityPickerOpen(false);
    setCitiesError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setCityPickerOpen(false);
      return;
    }

    let active = true;

    const loadCities = async () => {
      setCitiesLoading(true);
      setCitiesError(null);

      try {
        const nextCities = await fetchVenueCities();
        if (!active) return;
        setCities(nextCities);
      } catch {
        if (!active) return;
        setCities([]);
        setCitiesError("Unable to load cities right now.");
      } finally {
        if (active) {
          setCitiesLoading(false);
        }
      }
    };

    void loadCities();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!cityPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!cityPickerRef.current) return;
      if (!cityPickerRef.current.contains(event.target as Node)) {
        setCityPickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCityPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [cityPickerOpen]);

  const canCreate = useMemo(() => {
    return Boolean(name.trim() && address.trim() && selectedCity);
  }, [name, address, selectedCity]);

  const handleCreate = () => {
    if (!canCreate || !selectedCity) return;

    onCreate({
      Name: name.trim(),
      Adress: address.trim(),
      City: selectedCity.id,
      cityName: selectedCity.name,
      coverUrl: coverUrl.trim() || undefined,
      coverFile: coverFile ?? undefined,
    });

    resetForm();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            type="button"
            className="absol
