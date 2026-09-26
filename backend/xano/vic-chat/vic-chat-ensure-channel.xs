// Create (or repair) the Stream conversation between the VIC organizer of an activity and one model.
// Identities and channel ID are derived from Xano records only, never from client metadata.
// Channel: messaging:vicActivity_<activityId>_<userTurboId>
// Members: vic_<vicId> (organizer) + influencer_<userTurboId> (same identity used by the Creator PWA).
function "vic_chat/ensure_channel" {
  description = "Idempotently creates the Stream channel between a VIC activity organizer and a model, adding both as members."

  input {
    int vicmembersactivity_id filters=min:1
    int user_turbo_id filters=min:1
  }

  stack {
    db.get VICMemberActivities {
      field_name = "id"
      field_value = $input.vicmembersactivity_id
    } as $activity

    precondition ($activity != null && $activity.organizer != null && $activity.organizer >= 1) {
      error_type = "notfound"
      error = "Activity not found."
    }

    db.get VIC {
      field_name = "id"
      field_value = $activity.organizer
    } as $vic

    db.get user_Turbo {
      field_name = "id"
      field_value = $input.user_turbo_id
    } as $model

    precondition ($vic != null && $model != null) {
      error_type = "notfound"
      error = "Chat participants not found."
    }

    precondition ($env.STREAM_CHAT_SECRET != null && $env.STREAM_CHAT_SECRET != "") {
      error = "Chat is not configured."
    }

    var $vic_stream_id {
      value = "vic_" ~ ($vic.id|to_text)
    }

    var $model_stream_id {
      value = "influencer_" ~ ($model.id|to_text)
    }

    var $channel_id {
      value = "vicActivity_" ~ ($activity.id|to_text) ~ "_" ~ ($model.id|to_text)
    }

    // Build display metadata and the payloads in one place. Colons are removed from names because
    // the Creator PWA renders "first · last" colon-delimited parts of the channel name.
    api.lambda {
      code = """
        const clean = (value, fallback) => String(value ?? '').replace(/:/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
        const activity = $var.activity;
        const departure = String(activity.Departure ?? '');
        const dateLabel = /^\d{4}-\d{2}-\d{2}/.test(departure)
          ? `${departure.slice(8, 10)}-${departure.slice(5, 7)}-${departure.slice(2, 4)}`
          : '';
        const vicName = clean($var.vic.Name, 'VIC');
        const modelName = clean($var.model.NickName || $var.model.name, 'Creator');
        const activityName = clean(activity.Activity_Name, 'Activity');
        return {
          vic_user: {id: $var.vic_stream_id, name: vicName, ...($var.vic.Picture?.url ? {image: $var.vic.Picture.url} : {})},
          model_user: {id: $var.model_stream_id, name: modelName, ...($var.model.Profile_pic?.url ? {image: $var.model.Profile_pic.url} : {})},
          channel_data: {
            created_by_id: $var.vic_stream_id,
            members: [$var.vic_stream_id, $var.model_stream_id],
            name: [vicName, activityName, dateLabel].filter(Boolean).join(':'),
            channel_kind: 'vic_activity',
            vic_activity_id: String(activity.id),
            vic_id: String($var.vic.id),
            user_turbo_id: String($var.model.id),
            vic_name: vicName,
            influencer_name: modelName,
            activity_name: activityName,
            booking_date_label: dateLabel,
            ...(activity.restaurant_turbo_id ? {restaurant_id: String(activity.restaurant_turbo_id)} : {}),
          },
        };
        """
      timeout = 5
    } as $payload

    // Short-lived server JWT. Never return it or the Stream secret to the browser.
    api.lambda {
      code = """
        return (async function signServerToken(secret) {
          const bytes = new TextEncoder();
          const b64url = value => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
          const header = b64url(bytes.encode(JSON.stringify({alg: 'HS256', typ: 'JWT'})));
          const payload = b64url(bytes.encode(JSON.stringify({server: true, exp: Math.floor(Date.now() / 1000) + 60})));
          const input = `${header}.${payload}`;
          const key = await crypto.subtle.importKey('raw', bytes.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
          const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes.encode(input)));
          return `${input}.${b64url(signature)}`;
        })($env.STREAM_CHAT_SECRET);
        """
      timeout = 5
    } as $stream_token

    // Only create Stream users that do not exist yet, so existing Creator profiles are never overwritten.
    api.request {
      url = "https://chat.stream-io-api.com/users?api_key=yyxbd7vtds7r"
      method = "GET"
      params = {payload: {filter_conditions: {id: {"$in": [$vic_stream_id, $model_stream_id]}}, limit: 2}|json_encode}
      headers = [
        "Stream-Auth-Type: jwt"
        "Authorization: " ~ $stream_token
      ]
      timeout = 10
    } as $user_query

    precondition ($user_query.response.status >= 200 && $user_query.response.status < 300) {
      error = "Could not check chat users."
    }

    api.lambda {
      code = """
        const existing = new Set(($var.user_query.response.result.users || []).map(user => user.id));
        const users = {};
        for (const user of [$var.payload.vic_user, $var.payload.model_user]) {
          if (!existing.has(user.id)) users[user.id] = user;
        }
        return {count: Object.keys(users).length, users};
        """
      timeout = 5
    } as $missing_users

    conditional {
      if ($missing_users.count > 0) {
        api.request {
          url = "https://chat.stream-io-api.com/users?api_key=yyxbd7vtds7r"
          method = "POST"
          headers = [
            "Stream-Auth-Type: jwt"
            "Authorization: " ~ $stream_token
            "Content-Type: application/json"
          ]
          params = {users: $missing_users.users}
          timeout = 10
        } as $user_upsert

        precondition ($user_upsert.response.status >= 200 && $user_upsert.response.status < 300) {
          error = "Could not prepare chat users."
        }
      }
    }

    // Get-or-create. Existing channel data and history are preserved.
    api.request {
      url = "https://chat.stream-io-api.com/channels/messaging/" ~ $channel_id ~ "/query?api_key=yyxbd7vtds7r"
      method = "POST"
      headers = [
        "Stream-Auth-Type: jwt"
        "Authorization: " ~ $stream_token
        "Content-Type: application/json"
      ]
      params = {data: $payload.channel_data, state: false, watch: false, presence: false}
      timeout = 10
    } as $channel_query

    precondition ($channel_query.response.status >= 200 && $channel_query.response.status < 300) {
      error = "Could not open the conversation."
    }

    // Repair membership if the channel already existed without one of the two participants.
    api.request {
      url = "https://chat.stream-io-api.com/channels/messaging/" ~ $channel_id ~ "?api_key=yyxbd7vtds7r"
      method = "POST"
      headers = [
        "Stream-Auth-Type: jwt"
        "Authorization: " ~ $stream_token
        "Content-Type: application/json"
      ]
      params = {add_members: [$vic_stream_id, $model_stream_id]}
      timeout = 10
    } as $channel_members

    precondition ($channel_members.response.status >= 200 && $channel_members.response.status < 300) {
      error = "Could not update the conversation members."
    }
  }

  response = {
    cid       : "messaging:" ~ $channel_id
    channel_id: $channel_id
    members   : [$vic_stream_id, $model_stream_id]
  }
}
