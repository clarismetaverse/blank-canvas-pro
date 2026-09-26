# Proposed change to live `PATCH /activity_invitation_decision` (SignupUpgrade, API id 2063)

Status: **prepared, NOT applied**. Apply only after review.

1. At the top of `stack` (before the first `db.get`), declare:

```xs
    var $chat {
      value = null
    }
```

2. Inside the existing `if ($input.decision == "approve")` branch, immediately after
`function.run send_claris_push_to_user { ... } as $pushNotification`, insert:

```xs
        // Open the VIC <-> model chat. A chat failure must never undo the approval.
        try_catch {
          try {
            function.run "vic_chat/ensure_channel" {
              input = {
                vicmembersactivity_id: $activity.id
                user_turbo_id        : $invitation.user_turbo_id
              }
            } as $chat_channel

            var.update $chat {
              value = $chat_channel
            }
          }

          catch {
            debug.log {
              value = "vic_chat/ensure_channel failed for activity " ~ ($activity.id|to_text)
            }
          }
        }
```

3. Extend the response with `chat: $chat` (null for rejections or when chat setup failed).

Behavior impact: approval/rejection logic, push message, and the `BookingsTurbo` / `invitebyVIC`
updates are unchanged. The only addition is a best-effort Stream call on approve.
