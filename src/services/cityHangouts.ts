export interface HangoutModel {
  id: number;
  name?: string;
  avatar?: string;
}

export interface HangoutGroup {
  key: string;
  restaurantId: number;
  restaurantName: string;
  restaurantCover?: string;
  date: string; // BookingDay YYYY-MM-DD
  timeframe?: string; // e.g. "19:00 – 21:00" or "Anytime"
  models: HangoutModel[];
}

interface RawHangout {
  id: number;
  user_turbo_id?: number;
  restaurant_id?: number;
  BookingDay?: string | null;
  booking_time?: number | null;
  canceled?: boolean;
  HourStart?: string;
  HourEnd?: string;
  MinuteStart?: string | null;
  MinuteEnd?: string | null;
  _restaurant_turbo?: {
    Name?: string;
    Cover?: { url?: string } | null;
  };
  _user_turbo?: {
    id?: number;
    name?: string;
    NickName?: string;
    Profile_pic?: { url?: string } | null;
  };
}

const BASE = "https://xbut-eryu-hhsg.f2.xano.io/api:bwh6Xc5O";

function buildTimeframe(h: RawHangout): string | undefined {
  const pad = (s?: string | null) => {
    if (!s) return "00";
    const n = String(s).trim();
    return n.length === 1 ? `0${n}` : n;
  };
  if (h.HourStart || h.HourEnd) {
    const start = h.HourStart ? `${pad(h.HourStart)}:${pad(h.MinuteStart)}` : null;
    const end = h.HourEnd ? `${pad(h.HourEnd)}:${pad(h.MinuteEnd)}` : null;
    if (start && end) return `${start} – ${end}`;
    if (start) return `from ${start}`;
    if (end) return `until ${end}`;
  }
  if (h.booking_time && h.booking_time > 0) {
    const d = new Date(h.booking_time);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return undefined;
}

export async function fetchCityHangouts(city?: string): Promise<HangoutGroup[]> {
  const url = new URL(`${BASE}/modelhangouts`);
  if (city) url.searchParams.set("city", city);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`hangouts ${res.status}`);
  const raw: RawHangout[] = await res.json();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups = new Map<string, HangoutGroup>();
  for (const h of raw) {
    if (h.canceled) continue;
    if (!h.restaurant_id || !h.BookingDay) continue;
    const dateObj = new Date(`${h.BookingDay}T00:00:00`);
    if (Number.isNaN(dateObj.getTime()) || dateObj < today) continue;

    const key = `${h.restaurant_id}-${h.BookingDay}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        restaurantId: h.restaurant_id,
        restaurantName: h._restaurant_turbo?.Name || "Hangout",
        restaurantCover: h._restaurant_turbo?.Cover?.url,
        date: h.BookingDay,
        timeframe: buildTimeframe(h),
        models: [],
      };
      groups.set(key, g);
    }
    const userId = h._user_turbo?.id ?? h.user_turbo_id;
    if (userId && !g.models.some((m) => m.id === userId)) {
      g.models.push({
        id: userId,
        name: h._user_turbo?.NickName || h._user_turbo?.name,
        avatar: h._user_turbo?.Profile_pic?.url,
      });
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return b.models.length - a.models.length;
    });
}
