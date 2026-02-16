

## Fix Login-to-Homepage Flow

### Problem
After successful login via `POST /auth_vic_login`, the profile fetch `GET /vic` fails with "token belongs to a different object type", causing a redirect loop back to `/login`.

### Root Cause
The `fetchWithAuth` helper in `src/services/vic.ts` has a retry mechanism that strips the `Bearer` prefix on 401/403. This inconsistent auth header format may be confusing the Xano endpoint. Additionally, the `apiFetch` utility in `src/services/index.ts` has its own unauthorized handling that clears the token and dispatches an event, potentially conflicting with the profile fetch flow.

### Changes

**1. Simplify `src/services/vic.ts` — use `apiFetch` instead of raw fetch**

Replace the custom `fetchWithAuth` + `fetchVicProfile` with a single call using the existing `apiFetch` utility. This ensures consistent authorization header format (`Bearer {token}`) and eliminates the confusing retry logic.

- Remove `fetchWithAuth` function
- Update `fetchVicProfile` to accept a token, temporarily set it, then call `apiFetch<VicUser>("/vic")`
- Or simply pass the token as a header override to `apiFetch`

**2. Update `src/contexts/AuthProvider.tsx` — prevent redirect on profile failure during login**

Currently, `hydrateUser` navigates to `/login` if the profile fetch fails. During the login flow itself, this creates a loop. Instead:

- Only navigate to `/login` on failure during the bootstrap (page reload) path
- During the login callback, let the error propagate so the Login page can show an error message
- Split `hydrateUser` behavior: bootstrap silently clears session; login throws on failure

**3. Add console logging for debugging (temporary)**

Add a `console.error` in `fetchVicProfile` when the response is not OK, logging the status and response body. This will help diagnose if the issue recurs.

### Technical Details

The key change in `vic.ts`:
```typescript
export async function fetchVicProfile(token: string): Promise<VicUser | null> {
  if (!token) return null;
  try {
    const profile = await apiFetch<Record<string, unknown>>("/vic", {
      headers: { Authorization: `Bearer ${token}` },
    });
    // map fields to VicUser...
    return { id, Name, email, Diamonds, Invites, bio, Picture };
  } catch {
    return null;
  }
}
```

This removes the dual-format auth retry and uses the same fetch infrastructure as all other API calls.
