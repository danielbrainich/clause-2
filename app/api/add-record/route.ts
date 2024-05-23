import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supaBaseClient";
import { getServerSession } from "next-auth";

export async function POST(req: NextApiRequest, res: NextResponse) {
  const { billNumber, billType, congress, bioguideId } = await req.json();
  console.log("Received:", congress, billType, billNumber, bioguideId);

  const session = await getServerSession();
  if (!session) {
    console.log("throw some kind of error here");
  }
  const email = session.user.email;
  let item_type, info;

  if (bioguideId) {
    item_type = "legislator";
    info = bioguideId;
  } else {
    item_type = "bill";
    info = `${congress}-${billType}-${billNumber}`;
  }

  try {
    const { data, error } = await supabase
      .from("saved_items")
      .insert([
        {
          email: email,
          item_type: item_type,
          info: info,
        },
      ])
      .select();
    if (error) throw error;
    const nextResponse = NextResponse.json(data);
    return nextResponse;
  } catch (error) {
    console.error("Error accessing Supabase", error);
    return NextResponse.json({ error: "failed to fetch data" });
  }
}
