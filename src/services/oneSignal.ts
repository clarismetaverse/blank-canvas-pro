interface OneSignalApi {
  login: (externalId: string) => Promise<void> | void;
  logout: () => Promise<void> | void;
  Notifications?: {
    permission?: boolean;
    permissionNative?: string;
    requestPermission?: () => Promise<void> | void;
  };
  User?: {
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void> | void;
    };
  };
  Slidedown?: {
    promptPush?: () => Promise<void> | void;
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

async function ensurePushSubscription(OneSignal: OneSignalApi) {
  try {
    const granted = OneSignal.Notifications?.permission === true;
    const subscription = OneSignal.User?.PushSubscription;

    if (granted) {
      if (subscription && subscription.optedIn !== true && subscription.optIn) {
        await subscription.optIn();
      }
      return;
    }

    if (OneSignal.Slidedown?.promptPush) {
      await OneSignal.Slidedown.promptPush();
    }
  } catch (err) {
    console.warn("[oneSignal] push subscription setup failed", err);
  }
}

export function identifyOneSignalUser(userId: string | number | null | undefined) {
  if (userId === null || userId === undefined || userId === "") return;
  queue(async (OneSignal) => {
    try {
      await OneSignal.login(String(userId));
    } catch (err) {
      console.warn("[oneSignal] login failed", err);
    }
    await ensurePushSubscription(OneSignal);
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
