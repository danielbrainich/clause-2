import { NextResponse, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { supabase } from "@/utils/supaBaseClient";

export async function POST(res: NextResponse, req: NextRequest) {
  const session = await getServerSession(authConfig);

  //   if (!session || !session.user || !session.user.email) {
  //     res.status(401).json({ error: 'Authentication required' });
  //     return;
  //   }

  const { item_type, info } = req.params;
  const userEmail = session.user.email;

  try {
    const { data, error } = await supabase
      .from("saved_items")
      .insert([
        {
          email: "userEmail",
          item_type: item_type,
          info: info,
        },
      ])
      .select();
    console.log("hello");
    if (error) throw error;
    const nextResponse = NextResponse.json(data);
    return nextResponse;
  } catch (error) {
    console.error("Error accessing Supabase", error);
    return NextResponse.json({ error: "failed to fetch data" });
  }
}
