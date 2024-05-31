import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supaBaseClient";
import { getServerSession } from "next-auth";

export async function DELETE(res: NextResponse, req: NextRequest) {
  const { id } = req.params;

  const session = await getServerSession();
  if (!session) {
    console.log("throw some kind of error here");
  }
  const email = session.user.email;

  try {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("id", id)
      .eq("email", email);
    if (error) {
      throw error;
    }
    return NextResponse.json({ message: "Record deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error accessing Supabase", error);
    return NextResponse.json({ error: "failed to fetch data" });
  }
}
