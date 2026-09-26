// Issue a Stream user token for the authenticated VIC only (identity vic_<VIC.id>).
// Unlike the Creator/Venue devToken paths, the VIC browser never chooses its own Stream identity.
query "vic/chat/token" verb=GET {
  api_group = "SignupUpgrade"
  auth = "VIC"

  input {
  }

  stack {
    precondition ($auth.id != null && $auth.id >= 1) {
      error_type = "unauthorized"
      error = "VIC account not found."
    }

    precondition ($env.STREAM_CHAT_SECRET != null && $env.STREAM_CHAT_SECRET != "") {
      error = "Chat is not configured."
    }

    var $stream_user_id {
      value = "vic_" ~ ($auth.id|to_text)
    }

    api.lambda {
      code = """
        return (async function signUserToken(secret, userId) {
          const bytes = new TextEncoder();
          const b64url = value => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
          const now = Math.floor(Date.now() / 1000);
          const exp = now + 60 * 60 * 24;
          const header = b64url(bytes.encode(JSON.stringify({alg: 'HS256', typ: 'JWT'})));
          const payload = b64url(bytes.encode(JSON.stringify({user_id: userId, iat: now - 5, exp})));
          const input = `${header}.${payload}`;
          const key = await crypto.subtle.importKey('raw', bytes.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
          const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes.encode(input)));
          return {token: `${input}.${b64url(signature)}`, expires_at: exp};
        })($env.STREAM_CHAT_SECRET, $var.stream_user_id);
        """
      timeout = 5
    } as $signed
  }

  response = {
    api_key   : "yyxbd7vtds7r"
    user_id   : $stream_user_id
    token     : $signed.token
    expires_at: $signed.expires_at
  }
}
