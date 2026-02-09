// apps/backend/src/utils/googleSearch.ts
import axios from "axios";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function googleSearch(query: string): Promise<SearchResult[]> {
  const pairs: { apiKey: string; cseId: string }[] = [];

  // Collect pairs based on env variables like GOOGLE_API_KEY_1, GOOGLE_CSE_ID_1
  for (let i = 1; ; i++) {
    const apiKey = process.env[`GOOGLE_API_KEY_${i}`];
    const cseId = process.env[`GOOGLE_CSE_ID_${i}`];
    if (!apiKey || !cseId) break;
    pairs.push({ apiKey, cseId });
  }

  if (pairs.length === 0) {
    console.error("No Google API key/CSE ID pairs found in .env");
    return [];
  }

  // Randomly rotate among available pairs
  for (const { apiKey, cseId } of pairs.sort(() => Math.random() - 0.5)) {
    try {
      const res = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: apiKey,
            cx: cseId,
            q: query,
          },
        }
      );
      //@ts-expect-error
      const items = res.data.items || [];
      return items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
    } catch (err: any) {
      const status = err.response?.status;
      console.warn(
        `Google Search failed for key ${apiKey.slice(0, 8)}... (${status})`
      );
      continue;
    }
  }

  console.error("All Google CSE keys failed.");
  return [];
}
