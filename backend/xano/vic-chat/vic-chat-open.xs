// Open the VIC <-> model conversation for one invitation of an activity the authenticated VIC organizes.
// The chat is available only once the model has answered (pending request) or has been approved.
query "vic/chat/open" verb=POST {
  api_group = "SignupUpgrade"
  auth = "VIC"

  input {
    int vicmembersactivity_id filters=min:1
    int item_id filters=min:1
    enum source {
      values = ["claris", "vic"]
    }
  }

  stack {
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
      error = "Only the activity organizer can open this chat"
    }

    var $user_turbo_id {
      value = null
    }

    conditional {
      if ($input.source == "claris") {
        db.get BookingsTurbo {
          field_name = "id"
          field_value = $input.item_id
        } as $booking

        precondition ($booking != null && $booking.restaurant_id == $activity.restaurant_turbo_id && $booking.BookingDay == $activity.Departure && $booking.canceled == false) {
          error_type = "notfound"
          error = "Invitation not found for this activity"
        }

        precondition ($booking.Rejectedstatus == false && ($booking.Approved || $booking.ApprovalStatus)) {
          error_type = "accessdenied"
          error = "Chat opens when the model answers or is approved"
        }

        var.update $user_turbo_id {
          value = $booking.user_turbo_id
        }
      }

      else {
        db.get invitebyVIC {
          field_name = "id"
          field_value = $input.item_id
        } as $invitation

        precondition ($invitation != null && $invitation.vicmemberactivity_id == $activity.id) {
          error_type = "notfound"
          error = "Invitation not found for this activity"
        }

        precondition ($invitation.status == "pending request" || $invitation.status == "approved") {
          error_type = "accessdenied"
          error = "Chat opens when the model answers or is approved"
        }

        var.update $user_turbo_id {
          value = $invitation.user_turbo_id
        }
      }
    }

    precondition ($user_turbo_id != null && $user_turbo_id >= 1) {
      error_type = "badrequest"
      error = "Invitation has no linked Claris user"
    }

    function.run "vic_chat/ensure_channel" {
      input = {
        vicmembersactivity_id: $activity.id
        user_turbo_id        : $user_turbo_id
      }
    } as $channel
  }

  response = $channel
}
