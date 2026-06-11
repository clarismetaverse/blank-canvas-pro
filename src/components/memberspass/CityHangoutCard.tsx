import { MapPin, Calendar, Clock, Users } from "lucide-react";
import type { HangoutGroup } from "@/services/cityHangouts";

interface Props {
  group: HangoutGroup;
}

function formatDate(d: string) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function CityHangoutCard({ group }: Props) {
  const visibleModels = group.models.slice(0, 4);
  const remaining = Math.max(0, group.models.length - visibleModels.length);

  return (
    <div className="relative w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image area */}
      <div className="relative h-[140px] w-full bg-neutral-100">
        {group.restaurantCover ? (
          <img
            src={group.restaurantCover}
            alt={group.restaurantName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {/* Date + Time chip */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-700 backdrop-blur">
          <Calendar className="h-3 w-3 text-neutral-500" />
          <span>{formatDate(group.date)}</span>
          {group.timeframe ? (
            <>
              <span className="text-neutral-300">·</span>
              <Clock className="h-3 w-3 text-neutral-500" />
              <span>{group.timeframe}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Info area */}
      <div className="px-4 pt-3 pb-3.5">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <h3 className="text-sm font-semibold leading-tight text-neutral-900">
            {group.restaurantName}
          </h3>
        </div>

        {/* Models row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {visibleModels.map((m) => (
              <div
                key={m.id}
                className="h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-neutral-200"
                title={m.name}
              >
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-500">
                    {(m.name || "?").slice(0, 1)}
                  </div>
                )}
              </div>
            ))}
            {remaining > 0 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-[10px] font-semibold text-white">
                +{remaining}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            <span>
              {group.models.length} {group.models.length === 1 ? "model" : "models"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
