import { NextResponse, NextRequest } from "next/server";

export const GET = async (res: NextResponse, req: NextRequest) => {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  const { offset } = req.params;

  try {
    const response = await fetch(
      `https://api.congress.gov/v3/bill?api_key=${apiKey}&offset=${offset}`
    );
    if (!response.ok) {
      throw new Error(`http error. status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`error fetching data: ${error}`);
    return NextResponse.json({ error: "failed to fetch data" });
  }
};
