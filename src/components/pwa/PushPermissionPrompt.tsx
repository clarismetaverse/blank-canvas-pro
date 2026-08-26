import { BellRing, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { enablePushNotifications, readPushPermission } from "@/services/oneSignal";

const PROMPT_DELAY_MS = 2_000;
const REPROMPT_AFTER_MS = 7 * 24 * 60 * 60 * 1_000;

function dismissalKey(userId: string | number) {
  return `vic.push-prompt-dismissed:${userId}`;
}

function isUninstalledIosWebApp() {
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return isIos && !standalone;
}

export function PushPermissionPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    setOpen(false);
    if (userId == null || isUninstalledIosWebApp()) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void readPushPermission(userId)
        .then((state) => {
          if (cancelled || (state !== "default" && state !== "disabled")) return;
          const dismissedAt = Number(window.localStorage.getItem(dismissalKey(userId)) ?? 0);
          if (Date.now() - dismissedAt < REPROMPT_AFTER_MS) return;
          setOpen(true);
        })
        .catch(() => undefined);
    }, PROMPT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId]);

  if (!open || userId == null) return null;

  const postpone = () => {
    window.localStorage.setItem(dismissalKey(userId), String(Date.now()));
    setOpen(false);
  };

  const enable = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const enabled = await enablePushNotifications(userId);
      if (!enabled) throw new Error("Push notifications were not enabled.");
      window.localStorage.removeItem(dismissalKey(userId));
      setOpen(false);
      toast.success("VIC notifications are now enabled.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Push notifications could not be enabled.",
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vic-push-title"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#E7B74E]/30 bg-[#101114] shadow-2xl">
        <div className="relative bg-[radial-gradient(circle_at_top,#3A2C16_0%,#151619_58%,#101114_100%)] px-6 pb-6 pt-8 text-center">
          <Sparkles className="absolute right-6 top-6 h-5 w-5 text-[#FFE29A]/70" aria-hidden="true" />
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE29A] via-[#E7B74E] to-[#B77A22] text-black shadow-[0_14px_36px_rgba(231,183,78,0.25)]">
            <BellRing className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 id="vic-push-title" className="mt-5 text-xl font-semibold text-white">
            Stay inside the circle
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Get notified about private activities, invitations and important VIC updates.
          </p>
        </div>
        <div className="space-y-2 px-6 pb-6">
          <Button
            type="button"
            disabled={requesting}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#E7B74E] to-[#B77A22] text-base text-black hover:opacity-90"
            onClick={() => void enable()}
          >
            {requesting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <BellRing className="h-4 w-4" aria-hidden="true" />
            )}
            Enable notifications
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={requesting}
            className="h-10 w-full rounded-xl text-white/55 hover:bg-white/5 hover:text-white"
            onClick={postpone}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
