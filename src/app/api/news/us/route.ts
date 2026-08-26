import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  image: string;
  accent: string;
};

const accents = ["#1B4B8A", "#0F766E", "#6750A4", "#8B5000", "#005DB7"];

const fallback: NewsArticle[] = [
  {
    id: "1",
    title: "Senate reaches last-minute deal on federal funding",
    description: "Leaders said the stopgap keeps agencies open while talks continue on a longer bill.",
    source: "Associated Press",
    publishedAt: "2h ago",
    url: "https://apnews.com",
    image: "",
    accent: accents[0],
  },
  {
    id: "2",
    title: "West Coast storm knocks out power to hundreds of thousands",
    description: "Utilities warned of more outages as atmospheric river rains move inland.",
    source: "Reuters",
    publishedAt: "3h ago",
    url: "https://www.reuters.com",
    image: "",
    accent: accents[1],
  },
  {
    id: "3",
    title: "NASA target date set for next crewed Artemis flight",
    description: "Officials outlined remaining hardware tests before the lunar mission window.",
    source: "The Washington Post",
    publishedAt: "5h ago",
    url: "https://www.washingtonpost.com",
    image: "",
    accent: accents[2],
  },
  {
    id: "4",
    title: "Markets rally as inflation reading cools more than expected",
    description: "Investors priced in a gentler path for borrowing costs after the CPI print.",
    source: "Bloomberg",
    publishedAt: "6h ago",
    url: "https://www.bloomberg.com",
    image: "",
    accent: accents[3],
  },
];

function relativeTime(iso?: string) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const hours = Math.max(1, Math.round((Date.now() - then) / 36e5));
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function fromNewsApi(payload: {
  articles?: {
    title?: string;
    description?: string;
    url?: string;
    urlToImage?: string;
    publishedAt?: string;
    source?: { name?: string };
  }[];
}): NewsArticle[] {
  return (payload.articles ?? [])
    .filter((article) => article.title && article.title !== "[Removed]")
    .slice(0, 12)
    .map((article, index) => ({
      id: article.url || String(index),
      title: article.title || "",
      description: article.description || "",
      source: article.source?.name || "US news",
      publishedAt: relativeTime(article.publishedAt),
      url: article.url || "",
      image: article.urlToImage || "",
      accent: accents[index % accents.length],
    }));
}

function fromGuardian(payload: {
  response?: {
    results?: {
      id: string;
      webTitle: string;
      webUrl: string;
      webPublicationDate?: string;
      fields?: { trailText?: string; thumbnail?: string };
      pillarName?: string;
    }[];
  };
}): NewsArticle[] {
  return (payload.response?.results ?? []).slice(0, 12).map((result, index) => ({
    id: result.id,
    title: result.webTitle,
    description: result.fields?.trailText?.replace(/<[^>]+>/g, "") || "",
    source: "The Guardian",
    publishedAt: relativeTime(result.webPublicationDate),
    url: result.webUrl,
    image: result.fields?.thumbnail || "",
    accent: accents[index % accents.length],
  }));
}

async function liveHeadlines(query: string): Promise<NewsArticle[]> {
  try {
    const newsApi = await fetchJson("https://saurav.tech/NewsAPI/top-headlines/category/general/us.json");
    const articles = fromNewsApi(newsApi);
    if (articles.length) return filterQuery(articles, query);
  } catch {
    /* try guardian */
  }
  const guardian = await fetchJson(
    "https://content.guardianapis.com/search?section=us-news&show-fields=trailText,thumbnail&page-size=12&api-key=test",
  );
  return filterQuery(fromGuardian(guardian), query);
}

function filterQuery(articles: NewsArticle[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter((article) =>
    `${article.title} ${article.description} ${article.source}`.toLowerCase().includes(q),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const fail = url.searchParams.get("fail") === "1";
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };

  if (fail) {
    return NextResponse.json(
      { status: "error", message: "Simulated US news feed outage." },
      { status: 503, headers },
    );
  }

  try {
    const articles = await liveHeadlines(query);
    return NextResponse.json(
      { country: "US", status: "ok", query, articles: articles.length ? articles : filterQuery(fallback, query) },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        country: "US",
        status: "ok",
        query,
        articles: filterQuery(fallback, query),
        degraded: true,
      },
      { headers },
    );
  }
}
