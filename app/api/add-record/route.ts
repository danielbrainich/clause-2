import { NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from "@/utils/supaBaseClient";
import { getServerSession } from "next-auth";

export async function POST(req, res) {
  const { billNumber, billType, billTitle, congress, bioguideId, name } = await req.json();
  console.log("Received:", congress, billType, billNumber, bioguideId, name, billTitle);

  const session = await getServerSession();
  if (!session) {
    console.log("throw some kind of error here");
  }
  const email = session.user.email;
  let item_type, info, legislator_name, bill_title;

  if (bioguideId) {
    item_type = "legislator";
    info = bioguideId;
    legislator_name = name;

  } else {
    item_type = "bill";
    info = `${congress}-${billType}-${billNumber}`;
    bill_title = billTitle
  }

  try {
    const { data, error } = await supabase
      .from("saved_items")
      .insert([
        {
          email: email,
          item_type: item_type,
          info: info,
          legislator_name: legislator_name,
          bill_title: bill_title,
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
