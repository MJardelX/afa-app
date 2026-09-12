import { rateLimit } from "@/lib/rate-limit";
import { currentProfile } from "@/server/players";

/**
 * Per-user throttle for the typeahead server actions. RLS already scopes what
 * comes back to the caller's academy; this just blunts someone scraping the
 * directory through a live session. Returns false when the caller has run out
 * of budget (or isn't signed in) so the action can quietly return no results.
 */
export async function searchAllowed(): Promise<boolean> {
  const profile = await currentProfile();
  if (!profile) return false;
  return rateLimit(`search:${profile.id}`, 60, 60_000).ok;
}
