import { NextResponse } from "next/server";

export const GET = async (res, req) => {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  const congress = 118;

  try {
    const response = await fetch(
      `https://api.congress.gov/v3/member/congress/${congress}?api_key=${apiKey}&limit=250`
    );
    if (!response.ok) {
      throw new Error(`http error. status: ${response.status}`);
    }
    const data = await response.json();
    const array = data.members;

    const response2 = await fetch(
      `https://api.congress.gov/v3/member/congress/${congress}?api_key=${apiKey}&offset=250&limit=250`
    );
    if (!response2.ok) {
      throw new Error(`http error. status: ${response2.status}`);
    }
    const data2 = await response2.json();
    const array2 = data2.members;

    const response3 = await fetch(
      `https://api.congress.gov/v3/member/congress/${congress}?api_key=${apiKey}&offset=500&limit=250`
    );
    if (!response3.ok) {
      throw new Error(`http error. status: ${response3.status}`);
    }
    const data3 = await response3.json();
    const array3 = data3.members;

    const fullArray = [...array, ...array2, ...array3];
    const nextResponse = NextResponse.json(fullArray);
    return nextResponse;

  } catch (error) {
    console.error(`error fetching data: ${error}`);
    return NextResponse.json({ error: "failed to fetch data" });
  }
};
