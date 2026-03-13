/**
 * Twitter241 (RapidAPI) verification service
 * Verifies comments and reposts via API
 * Likes and bookmarks are trust-based (no API endpoint available)
 * Includes 5-minute cache to reduce API usage
 */

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;
const RAPIDAPI_HOST = "twitter241.p.rapidapi.com";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface VerificationResult {
  verified: boolean;
  reason?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory cache: "comments:tweetId" or "retweets:tweetId" → API response
const cache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch comments for a tweet (cached)
 */
async function fetchComments(tweetId: string): Promise<any[]> {
  const cacheKey = `comments:${tweetId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log("[verify] Using cached comments for", tweetId);
    return cached;
  }

  const res = await fetch(
    `https://${RAPIDAPI_HOST}/post-comments?pid=${tweetId}`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    }
  );

  if (!res.ok) {
    console.error("[verify] Comment API error:", res.status);
    throw new Error("API error");
  }

  const data = await res.json();
  const comments = data?.result?.timeline ?? data?.result ?? [];
  setCache(cacheKey, comments);
  return comments;
}

/**
 * Fetch retweeters for a tweet (cached)
 */
async function fetchRetweeters(tweetId: string): Promise<any[]> {
  const cacheKey = `retweets:${tweetId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log("[verify] Using cached retweets for", tweetId);
    return cached;
  }

  const res = await fetch(
    `https://${RAPIDAPI_HOST}/post-retweets?pid=${tweetId}`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    }
  );

  if (!res.ok) {
    console.error("[verify] Repost API error:", res.status);
    throw new Error("API error");
  }

  const data = await res.json();
  const retweeters = data?.result?.timeline ?? data?.result ?? [];
  setCache(cacheKey, retweeters);
  return retweeters;
}

/**
 * Search for a username in API results
 * Handles various response formats from Twitter241
 */
function findUserInResults(results: any[], username: string): boolean {
  if (!results || !Array.isArray(results)) return false;

  const lowerUsername = username.toLowerCase();

  return results.some((item: any) => {
    const screenName =
      item?.user?.screen_name ??
      item?.core?.user_results?.result?.legacy?.screen_name ??
      item?.legacy?.screen_name ??
      item?.screen_name ??
      "";
    return screenName.toLowerCase() === lowerUsername;
  });
}

/**
 * Main verification function
 * Routes to the correct verification method based on engagement type
 */
export async function verifyEngagement(
  tweetId: string,
  engagerUsername: string,
  engagementType: "like" | "comment" | "repost" | "bookmark"
): Promise<VerificationResult> {
  // Likes and bookmarks are trust-based — auto-verified
  if (engagementType === "like" || engagementType === "bookmark") {
    return { verified: true };
  }

  try {
    if (engagementType === "comment") {
      // First try cached data (saves API calls if user is already in the list)
      const comments = await fetchComments(tweetId);
      const found = findUserInResults(comments, engagerUsername);
      if (found) return { verified: true };

      // Not found in cache — fetch fresh data (user may have commented after cache was saved)
      const cacheKey = `comments:${tweetId}`;
      if (cache.has(cacheKey)) {
        cache.delete(cacheKey);
        const freshComments = await fetchComments(tweetId);
        const freshFound = findUserInResults(freshComments, engagerUsername);
        if (freshFound) return { verified: true };
      }

      return { verified: false, reason: "Comment not found" };
    }

    if (engagementType === "repost") {
      // First try cached data
      const retweeters = await fetchRetweeters(tweetId);
      const found = findUserInResults(retweeters, engagerUsername);
      if (found) return { verified: true };

      // Not found in cache — fetch fresh data
      const cacheKey = `retweets:${tweetId}`;
      if (cache.has(cacheKey)) {
        cache.delete(cacheKey);
        const freshRetweeters = await fetchRetweeters(tweetId);
        const freshFound = findUserInResults(freshRetweeters, engagerUsername);
        if (freshFound) return { verified: true };
      }

      return { verified: false, reason: "Repost not found" };
    }
  } catch {
    return { verified: false, reason: "Verification failed — try again" };
  }

  return { verified: false, reason: "Unknown engagement type" };
}
