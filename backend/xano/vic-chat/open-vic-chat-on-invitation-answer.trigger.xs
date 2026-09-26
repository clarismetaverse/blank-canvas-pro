// Open the VIC <-> model Stream chat as soon as a native VIC invitation is answered or approved.
// Live as table trigger id 2 on invitebyVIC. Chat failures are caught so the invitation write is never blocked.
table_trigger open_vic_chat_on_invitation_answer {
  table = "invitebyVIC"

  input {
    json new
    json old
    enum action {
      values = ["insert", "update", "delete", "truncate"]
    }

    text datasource
  }

  stack {
    var $new_status {
      value = $input.new|get:"status":""
    }

    var $old_status {
      value = $input.old|get:"status":""
    }

    conditional {
      if (($new_status == "pending request" || $new_status == "approved") && ($input.action == "insert" || $old_status != $new_status) && ($input.new|get:"type":"") != "organizer" && ($input.new|get:"user_turbo_id":0) >= 1 && ($input.new|get:"vicmemberactivity_id":0) >= 1) {
        try_catch {
          try {
            function.run "vic_chat/ensure_channel" {
              input = {
                vicmembersactivity_id: $input.new|get:"vicmemberactivity_id":0
                user_turbo_id        : $input.new|get:"user_turbo_id":0
              }
            } as $chat_channel
          }

          catch {
            debug.log {
              value = "open_vic_chat_on_invitation_answer: chat setup failed for invitation " ~ (($input.new|get:"id":0)|to_text)
            }
          }
        }
      }
    }
  }

  actions = {insert: true, update: true}
  datasources = ["live"]
}
