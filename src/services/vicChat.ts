import type { StreamChat } from "stream-chat";
import { apiFetch } from "@/services";
import type { ActivityInvitedItem, ActivityInvitedStatus } from "@/services/activityInvited";

/**
 * VIC <-> model chat on the shared Claris Stream app.
 *
 * - VIC identity:   vic_<VIC.id>          (token signed by Xano, never generated in the browser)
 * - Model identity: influencer_<user_Turbo.id> (same identity used by the Creator PWA)
 * - Channel:        messaging:vicActivity_<activityId>_<userTurboId>
 *
 * Channels are created only by Xano (`/vic/chat/open`, and on approval), after it has checked that the
 * authenticated VIC organizes the activity and that the model answered or was approved.
 */

type VicChatTokenResponse = {
  api_key: string;
  user_id: string;
  token: string;
  expires_at: number;
};

export type VicChatChannelResponse = {
  cid: string;
  channel_id: string;
  members: string[];
};

/** Statuses for which the conversation exists or can be opened. */
const CHAT_ENABLED_STATUSES: ActivityInvitedStatus[] = ["pending request", "approved"];

export function isInvitationChatEnabled(invitation: Pick<ActivityInvitedItem, "status" | "type"> | null | undefined) {
  return Boolean(invitation && invitation.type !== "organizer" && CHAT_ENABLED_STATUSES.includes(invitation.status));
}

export function fetchVicChatToken() {
  return apiFetch<VicChatTokenResponse>("/vic/chat/token", { method: "GET" });
}

export function openVicActivityChat(params: {
  activityId: string | number;
  invitation: Pick<ActivityInvitedItem, "id" | "source" | "booking_id">;
}) {
  return apiFetch<VicChatChannelResponse>("/vic/chat/open", {
    method: "POST",
    body: {
      vicmembersactivity_id: Number(params.activityId),
      item_id: params.invitation.booking_id ?? params.invitation.id,
      source: params.invitation.source === "claris" ? "claris" : "vic",
    },
  });
}

let clientPromise: Promise<StreamChat> | null = null;
let connectedVicId: number | null = null;

/** Connects (once) the authenticated VIC to Stream using a server-issued token. */
export async function getVicChatClient(vic: { id: number; Name?: string; Picture?: { url?: string } | null }) {
  if (clientPromise && connectedVicId === vic.id) return clientPromise;
  if (clientPromise) await disconnectVicChat();

  connectedVicId = vic.id;
  clientPromise = (async () => {
    const [{ StreamChat }, initial] = await Promise.all([import("stream-chat"), fetchVicChatToken()]);
    const client = StreamChat.getInstance(initial.api_key);
    let firstToken: string | null = initial.token;
    await client.connectUser(
      {
        id: initial.user_id,
        name: vic.Name || "VIC",
        ...(vic.Picture?.url ? { image: vic.Picture.url } : {}),
      },
      async () => {
        if (firstToken) {
          const token = firstToken;
          firstToken = null;
          return token;
        }
        return (await fetchVicChatToken()).token;
      },
    );
    return client;
  })();

  try {
    return await clientPromise;
  } catch (error) {
    clientPromise = null;
    connectedVicId = null;
    throw error;
  }
}

export async function disconnectVicChat() {
  const pending = clientPromise;
  clientPromise = null;
  connectedVicId = null;
  if (!pending) return;
  try {
    const client = await pending;
    await client.disconnectUser();
  } catch {
    // Already disconnected or never connected.
  }
}

/** Creator-side style title: "Model · Activity · DD-MM-YY" from channel metadata. */
export function getVicChannelTitle(data: Record<string, unknown> | undefined) {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const parts = [text(data?.influencer_name), text(data?.activity_name), text(data?.booking_date_label)].filter(Boolean);
  return parts.length ? parts.join(" · ") : text(data?.name) || "Conversation";
}
