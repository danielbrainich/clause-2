import { NextResponse } from "next/server";

export const GET = async (res, req) => {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  const { congress, billType, billNumber, requestType } = req.params;

  try {
    const response = await fetch(
      `https://api.congress.gov/v3/bill/${congress}/${billType.toLowerCase()}/${billNumber}/${requestType}?api_key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`http error. status: ${res.status}`);
    }
    const data = await response.json();
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`error fetching data: ${error}`);
    return NextResponse.json({ error: "failed to fetch data" });
  }
};
