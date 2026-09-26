// VIC-only clone of PATCH /activity_invitation_decision (live API id 2139, SignupUpgrade).
// Identical decision logic; on approve it also opens the VIC <-> model chat (best effort).
// The original endpoint (id 2063) is deliberately left unchanged.
query "vic/activity_invitation_decision" verb=PATCH {
  api_group = "SignupUpgrade"
  auth = "VIC"

  input {
    int vicmembersactivity_id filters=min:1
    int item_id filters=min:1
    enum source {
      values = ["claris", "vic"]
    }

    enum decision {
      values = ["approve", "reject"]
    }
  }

  stack {
    var $chat {
      value = null
    }

    db.get VICMemberActivities {
      field_name = "id"
      field_value = $input.vicmembersactivity_id
    } as $activity

    precondition ($activity != null) {
      error_type = "notfound"
      error = "Activity not found"
    }

    precondition ($activity.organizer == $auth.id) {
      error_type = "accessdenied"
      error = "Only the activity organizer can manage invitations"
    }

    conditional {
      if ($input.source == "claris") {
        db.get BookingsTurbo {
          field_name = "id"
          field_value = $input.item_id
        } as $invitation

        precondition ($invitation != null) {
          error_type = "notfound"
          error = "Claris invitation not found"
        }

        precondition ($invitation.restaurant_id == $activity.restaurant_turbo_id && $invitation.BookingDay == $activity.Departure && $invitation.canceled == false) {
          error_type = "accessdenied"
          error = "Invitation does not belong to this activity"
        }

        precondition ($invitation.Approved == false && $invitation.Rejectedstatus == false && $invitation.ApprovalStatus) {
          error_type = "inputerror"
          error = "This invitation has already been decided"
        }

        conditional {
          if ($input.decision == "approve") {
            db.edit BookingsTurbo {
              field_name = "id"
              field_value = $invitation.id
              enforce_hidden_fields = false
              data = {
                Approved      : true
                ApprovalStatus: false
                Rejectedstatus: false
                canceled      : false
                isOwnerStatus : true
              }
            } as $updatedInvitation
          }

          else {
            db.edit BookingsTurbo {
              field_name = "id"
              field_value = $invitation.id
              enforce_hidden_fields = false
              data = {
                Approved      : false
                ApprovalStatus: false
                Rejectedstatus: true
                canceled      : false
                isOwnerStatus : true
              }
            } as $updatedInvitation
          }
        }
      }

      else {
        db.get invitebyVIC {
          field_name = "id"
          field_value = $input.item_id
        } as $invitation

        precondition ($invitation != null && $invitation.vicmemberactivity_id == $activity.id) {
          error_type = "notfound"
          error = "VIC invitation not found for this activity"
        }

        precondition ($invitation.status == "pending request" || $invitation.status == "invited") {
          error_type = "inputerror"
          error = "This invitation has already been decided"
        }

        db.edit invitebyVIC {
          field_name = "id"
          field_value = $invitation.id
          enforce_hidden_fields = false
          data = {
            status: $input.decision == "approve" ? "approved" : "rejected"
          }
        } as $updatedInvitation
      }
    }

    conditional {
      if ($input.decision == "approve") {
        precondition ($invitation.user_turbo_id != null && $invitation.user_turbo_id >= 1) {
          error_type = "badrequest"
          error = "Invitation has no linked Claris user for push notification"
        }

        function.run send_claris_push_to_user {
          input = {
            user_turbo_id: $invitation.user_turbo_id
            message      : "🎉 Congratulations, you have been picked to attend the most exclusive Claris activity in Bali! 🌅✨"
          }
        } as $pushNotification

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
              value = "vic/activity_invitation_decision: chat setup failed for activity " ~ ($activity.id|to_text)
            }
          }
        }
      }
    }
  }

  response = {
    success   : true
    source    : $input.source
    decision  : $input.decision
    invitation: $updatedInvitation
    chat      : $chat
  }
}
