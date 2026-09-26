# VIC ↔ model chat

Last reviewed: 2026-09-26.

The VIC app talks to Claris models on the **same Stream Chat application and `messaging` channel type**
used by the Creator PWA (`creator.joinclaris.com`) and the Venue PWA (`owner.joinclaris.com`).
It is not a separate chat system.

## Identities and channel

| Role            | Stream user ID                 | Source                           |
| --------------- | ------------------------------ | -------------------------------- |
| VIC (organizer) | `vic_<VIC.id>`                 | Xano `VIC` table                 |
| Model           | `influencer_<user_Turbo.id>`   | Same identity as the Creator PWA |

One conversation per activity and model:

```text
messaging:vicActivity_<VICMemberActivities.id>_<user_Turbo.id>
```

Channel data: `channel_kind: "vic_activity"`, `vic_activity_id`, `vic_id`, `user_turbo_id`, `vic_name`,
`influencer_name`, `activity_name`, `booking_date_label` (DD-MM-YY), optional `restaurant_id`, and
`name = "<VIC name>:<activity name>:<DD-MM-YY>"`. The Creator PWA renders that name as
`<VIC name> · <DD-MM-YY>`, so it needs no code change: its `/chat` list already shows every `messaging`
channel where `influencer_<id>` is a member, and `/chat/vicActivity_<a>_<u>` opens it directly.

Booking channel IDs (`<bookingId>`, `venueDealBooking_<bookingId>`) are untouched. The `vicActivity_`
namespace never collides with them.

## When the chat is activated

The chat exists only after the model **answered** the invitation or was **accepted**:

| Invitation source (`/activity_invited`)   | Chat enabled when                                          |
| ----------------------------------------- | ---------------------------------------------------------- |
| Native VIC (`invitebyVIC`)                | `status` is `pending request` or `approved`                |
| Claris booking (`BookingsTurbo`)          | not rejected/canceled and `ApprovalStatus` or `Approved`   |

`invited`, `rejected` and `cancelled` never open a chat.

## Backend (Xano workspace 1, group SignupUpgrade `api:vGd6XDW3`)

Sources are checked in under `backend/xano/vic-chat/`.

- `function vic_chat/ensure_channel` (id 308): loads activity, organizer VIC and model from Xano,
  creates missing Stream users only (existing Creator profiles are never overwritten), get-or-creates
  the channel with `created_by_id = vic_<id>`, then `add_members` both participants (idempotent repair).
  Uses the workspace-only `STREAM_CHAT_SECRET`, like `restaurant_owner/chat/sync`.
- `GET /vic/chat/token` (auth VIC, id 2137): returns a 24 h Stream **user token signed by Xano** for
  `vic_<auth.id>`. The VIC browser never calls `devToken`, so it cannot pick another identity.
- `POST /vic/chat/open` (auth VIC, id 2138): `{vicmembersactivity_id, item_id, source}`. Checks that the
  VIC organizes the activity, that the invitation belongs to it and is in a chat-enabled state, then
  calls `vic_chat/ensure_channel`. Returns `{cid, channel_id, members}`.
- Proposed, not yet applied: open the chat automatically on approval inside
  `PATCH /activity_invitation_decision` (see `activity-invitation-decision.patch.md`).

## Frontend

- `src/services/vicChat.ts`: token fetch, `openVicActivityChat`, singleton Stream client with a token
  provider (refreshes through Xano), disconnect on logout/401.
- `src/pages/VicChat.tsx`: `/chat` (conversation list filtered by `vic_<id>` membership) and
  `/chat/:channelId` (full-screen conversation; the query also requires membership).
- `ActivityDetail`: the **Chat** button on accepted models and a **Message** button in the model sheet
  for answered/approved invitations call `/vic/chat/open` and navigate to the conversation.
- Bottom navigation has a **Chat** tab. The Stream UI bundle is lazy-loaded.

## Push notifications

- Model side: Stream sends message pushes through the existing Creator FCM provider `InfluencerWeb`
  (Firebase project `claris-c1821`). No change is needed.
- VIC side: **not implemented yet.** The VIC PWA only has OneSignal (product pushes). Chat push for VICs
  needs a VIC Firebase web app + a Stream Firebase provider (e.g. `VicWeb`) + `addDevice` in this app.

## Verification checklist

1. Log in as a VIC that organizes an activity with an answered or approved invitation.
2. Open the activity, tap **Chat** (accepted) or the model → **Message** (answered).
3. In the Stream Dashboard Channel Explorer, confirm `messaging:vicActivity_<a>_<u>` with members
   `vic_<id>` and `influencer_<u>`.
4. Log in on `creator.joinclaris.com` as that model: the conversation appears in `/chat`; reply and
   check the VIC receives it in real time.
5. Try `/vic/chat/open` for an `invited` or `rejected` invitation, and for another VIC's activity:
   both must be refused.
