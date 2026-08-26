import { Download, MoreVertical, Plus, Share, SquarePlus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePwaInstall, type InstallPlatform } from "@/hooks/usePwaInstall";

type Step = { icon: typeof Share; text: string };

const platformSteps: Record<InstallPlatform, Step[]> = {
  ios: [
    { icon: Share, text: "In Safari, tap the Share button." },
    { icon: Plus, text: "Choose “Add to Home Screen”." },
    { icon: SquarePlus, text: "Tap “Add” to open VIC like a native app." },
  ],
  android: [
    { icon: MoreVertical, text: "Open the Chrome menu." },
    { icon: Plus, text: "Choose “Install app” or “Add to Home screen”." },
    { icon: SquarePlus, text: "Confirm to add the VIC icon to your home screen." },
  ],
  desktop: [
    { icon: Download, text: "Click the install icon in the browser address bar." },
    { icon: MoreVertical, text: "Or open the browser menu and choose “Install VIC”." },
    { icon: SquarePlus, text: "Confirm to launch VIC in its own window." },
  ],
};

const platformLabel: Record<InstallPlatform, string> = {
  ios: "iPhone or iPad",
  android: "Android",
  desktop: "desktop",
};

export function PwaInstallPrompt() {
  const { platform, canPromptNatively, shouldOffer, promptInstall, dismiss } = usePwaInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (!shouldOffer) return null;

  const install = async () => {
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      <aside className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#E7B74E]/30 bg-[#121316]/95 p-3 shadow-2xl backdrop-blur-xl md:bottom-6">
        <img
          src="/icons/v3/icon-192.png"
          alt=""
          aria-hidden="true"
          className="h-12 w-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Install VIC</p>
          <p className="truncate text-xs text-white/60">Faster access, full-screen experience.</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-xl bg-gradient-to-r from-[#E7B74E] to-[#B77A22] text-black hover:opacity-90"
          onClick={() => void install()}
        >
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install suggestion"
          className="rounded-lg p-1 text-white/50 transition hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </aside>

      {showInstructions ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vic-install-title"
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#E7B74E]/25 bg-[#121316] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#E7B74E]">
                  VIC on {platformLabel[platform]}
                </p>
                <h2 id="vic-install-title" className="mt-2 text-xl font-semibold text-white">
                  Add VIC to your home screen
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 p-2 text-white/60 hover:text-white"
                aria-label="Close installation instructions"
                onClick={() => setShowInstructions(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-6 space-y-4">
              {platformSteps[platform].map((step, index) => (
                <li key={step.text} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7B74E]/12 text-[#E7B74E]">
                    <step.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="pt-1.5 text-sm leading-relaxed text-white/75">
                    <span className="font-semibold text-white">{index + 1}.</span> {step.text}
                  </p>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-[#E7B74E] to-[#B77A22] text-black hover:opacity-90"
              onClick={() => setShowInstructions(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
