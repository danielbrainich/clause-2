import { NextApiRequest } from "next";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supaBaseClient";
import { getServerSession } from "next-auth";

export async function GET(req: NextApiRequest, res: NextResponse) {
  const session = await getServerSession();
  if (!session) {
    console.log("throw some kind of error here");
  }
  const email = session.user.email;

  try {
    let { data, error } = await supabase
      .from("saved_items")
      .select("item_type, info")
      .eq("email", email);

    if (error) throw error;
    const nextResponse = NextResponse.json(data);
    return nextResponse;
  } catch (error) {
    console.error("Error accessing Supabase", error);
    return NextResponse.json({ error: "failed to fetch data" });
  }
}
