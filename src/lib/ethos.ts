// Ethos Network API — free, no API key required
// Docs: https://developers.ethos.network/

const ETHOS_BASE = "https://api.ethos.network/api/v2";

interface EthosUser {
  id: number;
  profileId: number;
  score: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  description: string;
  status: string;
}

/**
 * Fetch a user's Ethos credibility score by their X username.
 * Returns the score (0-100+) or null if the user has no Ethos profile.
 */
export async function fetchEthosScore(xUsername: string): Promise<number | null> {
  try {
    const res = await fetch(`${ETHOS_BASE}/user/by/x/${encodeURIComponent(xUsername)}`, {
      headers: {
        "X-Ethos-Client": "creator-academy@1.0.0",
      },
    });

    if (!res.ok) {
      console.log("[ethos] User not found or API error:", res.status);
      return null;
    }

    const data: EthosUser = await res.json();
    return data.score ?? null;
  } catch (err) {
    console.error("[ethos] Fetch error:", err);
    return null;
  }
}
