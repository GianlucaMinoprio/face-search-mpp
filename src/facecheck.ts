const FACECHECK_BASE = "https://facecheck.id";

const MIN_SCORE = 55;
const HIGH_CONFIDENCE_SCORE = 70;
const MAX_MATCHES = 20;

const PROFILE_DOMAINS = [
  "linkedin.com",
  "xing.com",
  "github.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
];

interface FaceCheckMatch {
  score: number;
  url: string;
  base64: string;
  guid: string;
  index: number;
}

type Confidence = "high" | "possible" | "unlikely";

interface MatchResult {
  score: number;
  confidence: Confidence;
  url: string;
  source: string;
  isProfile: boolean;
  thumbnail: string;
  guid: string;
}

interface FaceSearchResult {
  bestProfile: MatchResult | null;
  bestMatch: MatchResult | null;
  matches: MatchResult[];
  totalRawMatches: number;
}

function getConfidence(score: number): Confidence {
  if (score >= HIGH_CONFIDENCE_SCORE) return "high";
  if (score >= 60) return "possible";
  return "unlikely";
}

function getDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^(www\.|m\.)/, "");
    return host;
  } catch {
    return url;
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function isProfileUrl(url: string): boolean {
  const domain = getDomain(url);
  return PROFILE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function mapMatch(m: FaceCheckMatch, includeThumbnail: boolean): MatchResult {
  return {
    score: m.score,
    confidence: getConfidence(m.score),
    url: m.url,
    source: getDomain(m.url),
    isProfile: isProfileUrl(m.url),
    thumbnail: includeThumbnail
      ? `data:image/webp;base64,${m.base64}`
      : "",
    guid: m.guid,
  };
}

async function uploadImage(
  imageBuffer: Buffer,
  filename: string,
  apiToken: string,
): Promise<string> {
  const form = new FormData();
  const mimeType = guessMimeType(filename);
  form.append("images", new Blob([new Uint8Array(imageBuffer)], { type: mimeType }), filename);
  form.append("id_search", "");

  const res = await fetch(`${FACECHECK_BASE}/api/upload_pic`, {
    method: "POST",
    headers: {
      Authorization: apiToken,
      Accept: "application/json",
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`FaceCheck upload failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    id_search: string;
    error?: string;
  };
  if (data.error) {
    throw new Error(`FaceCheck upload error: ${data.error}`);
  }

  return data.id_search;
}

async function pollSearch(
  idSearch: string,
  apiToken: string,
): Promise<FaceCheckMatch[]> {
  const maxAttempts = 60;
  const pollInterval = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${FACECHECK_BASE}/api/search`, {
      method: "POST",
      headers: {
        Authorization: apiToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id_search: idSearch,
        with_progress: true,
        status_only: false,
        demo: false,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `FaceCheck search failed: ${res.status} ${res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      output?: { items: FaceCheckMatch[] };
      progress?: number;
      error?: string;
    };

    if (data.error) {
      throw new Error(`FaceCheck search error: ${data.error}`);
    }

    if (data.output?.items) {
      return data.output.items;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("FaceCheck search timed out");
}

export async function searchFace(
  imageBuffer: Buffer,
  filename: string,
  apiToken: string,
): Promise<FaceSearchResult> {
  const idSearch = await uploadImage(imageBuffer, filename, apiToken);
  const rawMatches = await pollSearch(idSearch, apiToken);

  // Filter by minimum score, then sort: profiles first (by score), then others (by score)
  const filtered = rawMatches
    .filter((m) => m.score >= MIN_SCORE)
    .sort((a, b) => {
      const aProfile = isProfileUrl(a.url) ? 1 : 0;
      const bProfile = isProfileUrl(b.url) ? 1 : 0;
      if (aProfile !== bProfile) return bProfile - aProfile;
      return b.score - a.score;
    });

  // Only include thumbnails for top 5
  const matches = filtered
    .slice(0, MAX_MATCHES)
    .map((m, i) => mapMatch(m, i < 5));

  // Best profile match (LinkedIn, etc.)
  const bestProfile = matches.find((m) => m.isProfile) ?? null;

  // Best overall match by score
  const allByScore = filtered.sort((a, b) => b.score - a.score);
  const bestMatch = allByScore.length > 0
    ? mapMatch(allByScore[0], true)
    : null;

  return {
    bestProfile,
    bestMatch,
    matches,
    totalRawMatches: rawMatches.length,
  };
}
