import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_PROJECT_URL as string;
const supabaseKey = process.env.SUPABASE_API_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and API key must be provided");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
