import FormData from "form-data";

const FACECHECK_BASE = "https://facecheck.id";

interface FaceCheckMatch {
  score: number;
  url: string;
  base64: string;
  guid: string;
  index: number;
}

interface FaceSearchResult {
  match: {
    score: number;
    url: string;
    thumbnail: string;
    guid: string;
  } | null;
  allMatches: Array<{
    score: number;
    url: string;
    thumbnail: string;
    guid: string;
  }>;
}

async function uploadImage(
  imageBuffer: Buffer,
  filename: string,
  apiToken: string,
): Promise<string> {
  const form = new FormData();
  form.append("images", imageBuffer, { filename, contentType: "image/jpeg" });
  form.append("id_search", "");

  const res = await fetch(`${FACECHECK_BASE}/api/upload_pic`, {
    method: "POST",
    headers: {
      Authorization: apiToken,
      Accept: "application/json",
    },
    body: form as unknown as BodyInit,
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
  const matches = await pollSearch(idSearch, apiToken);

  const sorted = matches.sort((a, b) => b.score - a.score);

  const mapMatch = (m: FaceCheckMatch) => ({
    score: m.score,
    url: m.url,
    thumbnail: `data:image/webp;base64,${m.base64}`,
    guid: m.guid,
  });

  return {
    match: sorted.length > 0 ? mapMatch(sorted[0]) : null,
    allMatches: sorted.map(mapMatch),
  };
}
