import { useState } from "react";
import { Lock, Star } from "lucide-react";
import type { CreatorLite } from "@/services/creatorSearch";
import CreatorProfileSheet from "@/components/memberspass/CreatorProfileSheet";

type CreatorCardProps = {
  creator: CreatorLite;
  locked?: boolean;
  variant?: "default" | "vic";
};

export default function CreatorCard({
  creator,
  locked,
  variant = "default",
}: CreatorCardProps) {
  const [open, setOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const img = creator.Profile_pic?.url;
  const isUgcReady = true;
  const isUgcFirst = true;
  const isVic = variant === "vic";

  return (
    <div className="relative w-full shrink-0 snap-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-3xl text-left shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.98]"
      >
        <div className="relative h-[290px] w-full">
          {img ? (
            <img src={img} alt={creator.name || "Creator"} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          {locked && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-neutral-900">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="text-left">
              <p className="text-lg font-semibold text-white">
                {creator.name || "Unnamed creator"}
              </p>
              {!isVic && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isUgcReady && (
                    <span className="rounded-full bg-white/85 px-2 py-1 text-[11px] font-medium text-neutral-900">
                      UGC-ready
                    </span>
                  )}
                  {isUgcFirst && (
                    <span className="rounded-full bg-white/85 px-2 py-1 text-[11px] font-medium text-neutral-900">
                      UGC first
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
      {isVic && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsFavorite((prev) => !prev);
          }}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove favourite" : "Add favourite"}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-neutral-800 shadow-md transition hover:scale-105 active:scale-95"
        >
          <Star className={isFavorite ? "h-4 w-4 fill-neutral-900" : "h-4 w-4"} />
        </button>
      )}

      <CreatorProfileSheet
        creator={creator}
        open={open}
        onClose={() => setOpen(false)}
        locked={locked}
        variant={variant}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((prev) => !prev)}
      />
    </div>
  );
}
