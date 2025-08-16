import { NextResponse } from "next/server";

export async function GET(_req, { params }) {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  const offset = Number(params?.offset ?? 0);

  const PAGE_SIZE = 12; // ← make this 9 or 12 to fit your 3-col grid

  try {
    const url = new URL("https://api.congress.gov/v3/bill");
    url.searchParams.set("api_key", apiKey ?? "");
    url.searchParams.set("format", "json");
    url.searchParams.set("sort", "updateDate:desc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url.toString(), {
      // Cache at the edge; tweak as desired:
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { bills: [], error: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Congress.gov v3 usually nests under data.bills.items
    const items =
      data?.bills?.items ??
      data?.bills ??
      data?.results ??
      data?.items ??
      [];

    const json = NextResponse.json({
      bills: items,
      pageSize: PAGE_SIZE,
      nextOffset: offset + PAGE_SIZE,
    });
    // Edge cache header (works with Vercel):
    json.headers.set("Cache-Control", "s-maxage=3600");
    return json;
  } catch (error) {
    console.error("error fetching data:", error);
    return NextResponse.json({ bills: [], error: "failed to fetch data" }, { status: 500 });
  }
}
