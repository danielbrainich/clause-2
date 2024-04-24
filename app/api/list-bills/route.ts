import { NextResponse } from "next/server";

export const GET = async () => {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;

  try {
    const res = await fetch(
      `https://api.congress.gov/v3/bill?api_key=${apiKey}`
    );
    if (!res.ok) {
      throw new Error(`http error. status: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`error fetching data: ${error}`);
    return NextResponse.json({ error: "failed to fetch data" });
  }
};
