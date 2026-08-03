type OneSignalDeferredFn = (oneSignal: {
  login: (externalId: string) => Promise<void> | void;
  logout: () => Promise<void> | void;
}) => void;

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredFn[];
  }
}

function queue(fn: OneSignalDeferredFn) {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(fn);
}

export function identifyOneSignalUser(userId: string | number | null | undefined) {
  if (userId === null || userId === undefined || userId === "") return;
  queue(async (OneSignal) => {
    try {
      await OneSignal.login(String(userId));
    } catch (err) {
      console.warn("[oneSignal] login failed", err);
    }
  });
}

export function clearOneSignalUser() {
  queue(async (OneSignal) => {
    try {
      await OneSignal.logout();
    } catch (err) {
      console.warn("[oneSignal] logout failed", err);
    }
  });
}
