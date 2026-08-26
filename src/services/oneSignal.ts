interface OneSignalApi {
  login: (externalId: string) => Promise<void> | void;
  logout: () => Promise<void> | void;
  Notifications?: {
    permission?: boolean;
    permissionNative?: string;
    requestPermission?: () => Promise<boolean | void> | boolean | void;
  };
  User?: {
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void> | void;
      optOut?: () => Promise<void> | void;
    };
  };
}

type OneSignalDeferredFn = (oneSignal: OneSignalApi) => void;

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

export type PushPermissionState = "unsupported" | "default" | "denied" | "enabled" | "disabled";

const READY_TIMEOUT_MS = 15_000;

function isSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function withOneSignal<T>(action: (oneSignal: OneSignalApi) => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    if (!isSupported()) {
      reject(new Error("Push notifications are unavailable in this browser."));
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("The notification service did not become ready."));
    }, READY_TIMEOUT_MS);

    queue(async (oneSignal) => {
      if (settled) return;
      try {
        const value = await action(oneSignal);
        settled = true;
        window.clearTimeout(timeout);
        resolve(value);
      } catch (error) {
        settled = true;
        window.clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

export function identifyOneSignalUser(userId: string | number | null | undefined) {
  if (userId === null || userId === undefined || userId === "") return;
  const externalId = String(userId);
  queue(async (OneSignal) => {
    try {
      await OneSignal.login(externalId);
      const subscription = OneSignal.User?.PushSubscription;
      if (OneSignal.Notifications?.permission === true && subscription?.optedIn !== true) {
        await subscription?.optIn?.();
      }
    } catch (err) {
      console.warn("[oneSignal] login failed", err);
    }
  });
}

export async function readPushPermission(
  userId: string | number,
): Promise<PushPermissionState> {
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") return "default";

  return withOneSignal(async (oneSignal) => {
    await oneSignal.login(String(userId));
    return oneSignal.User?.PushSubscription?.optedIn ? "enabled" : "disabled";
  });
}

export async function enablePushNotifications(userId: string | number) {
  return withOneSignal(async (oneSignal) => {
    await oneSignal.login(String(userId));
    const permission = await oneSignal.Notifications?.requestPermission?.();
    if (permission === false || Notification.permission === "denied") {
      throw new Error("Notifications were blocked in your browser settings.");
    }
    await oneSignal.User?.PushSubscription?.optIn?.();
    return Boolean(oneSignal.User?.PushSubscription?.optedIn);
  });
}

export async function disablePushNotifications(userId: string | number) {
  return withOneSignal(async (oneSignal) => {
    await oneSignal.login(String(userId));
    const subscription = oneSignal.User?.PushSubscription;
    await subscription?.optOut?.();
    return !subscription?.optedIn;
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
