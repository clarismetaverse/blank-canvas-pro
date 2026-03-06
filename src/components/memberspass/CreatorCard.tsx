import { useState } from "react";
import { Lock, Star } from "lucide-react";
import type { CreatorLite } from "@/services/creatorSearch";
import CreatorProfileSheet from "@/components/memberspass/CreatorProfileSheet";

type CreatorCardProps = {
  creator: CreatorLite;
  locked?: boolean;
  variant?: "default" | "vic" | "vic-search";
  interests?: string[];
  mode?: "default" | "select";
  isInvited?: boolean;
  onInvite?: (creator: CreatorLite) => void;
};

export default function CreatorCard({
  creator,
  locked,
  variant = "default",
  interests,
  mode = "default",
  isInvited = false,
  onInvite,
}: CreatorCardProps) {
  const [open, setOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const img = creator.Profile_pic?.url;
  const isUgcReady = true;
  const isUgcFirst = true;
  const isVic = variant === "vic";
  const isVicSearch = variant === "vic-search";
  const isVicSurface = isVic || isVicSearch;
  const displayName = formatCreatorDisplayName(creator.name);
  const luxuryTagline = getLuxuryTagline(creator.id);

  return (
    <div className="relative w-full shrink-0 snap-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-3xl text-left shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.98]"
      >
        <div className={`relative w-full ${isVicSearch ? "h-[308px]" : "h-[348px]"}`}>
          {img ? (
            <img src={img} alt={creator.name || "Creator"} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100" />
          )}
          <div className={`absolute inset-0 ${isVicSearch ? "bg-gradient-to-t from-black/85 via-black/35 to-transparent" : "bg-gradient-to-t from-black/90 via-black/40 to-transparent"}`} />
          {locked && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-neutral-900">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          )}
          {mode === "select" && isInvited && (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
              Invited ✓
            </span>
          )}
          <div className={`absolute bottom-0 left-0 right-0 ${isVicSearch ? "p-3.5 pb-4" : "p-4"}`}>
            <div className="text-left">
              <p className="text-lg font-semibold text-white">
                {isVicSearch ? displayName : creator.name || "Unnamed creator"}
              </p>
              {!isVicSurface && (
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

          {isVicSearch && interests && interests.length > 0 && (
            <div className="absolute bottom-1.5 left-3.5 right-4 flex flex-wrap gap-1.5">
              {interests.slice(0, 2).map((interest) => (
                <span
                  key={`${creator.id}-${interest}`}
                  className="rounded-md bg-black/18 px-1.5 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm"
                >
                  #{interest.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {isVicSearch && (
          <div className="border-t border-black/5 bg-white px-4 py-3">
            <p className="truncate text-[12px] font-medium text-neutral-600">{luxuryTagline}</p>
          </div>
        )}
      </button>
      {isVicSurface && mode !== "select" && (
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
        mode={mode}
        isInvited={isInvited}
        onInvite={(selectedCreator) => {
          onInvite?.(selectedCreator);
          setOpen(false);
        }}
        isFavorite={isFavorite}
        onToggleFavorite={() => setIsFavorite((prev) => !prev)}
      />
    </div>
  );
}

const luxuryTaglines = [
  "Curates elevated nights between beach clubs and private tables.",
  "Known for discreet access to fashion dinners and art salons.",
  "Moves between yachting weekends and members-only city moments.",
  "Hosts refined escapes blending wellness, design, and travel.",
  "Shapes polished social scenes with understated luxury taste.",
];

function getLuxuryTagline(creatorId: number) {
  return luxuryTaglines[Math.abs(creatorId) % luxuryTaglines.length];
}

function formatCreatorDisplayName(name?: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Unnamed creator";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}
