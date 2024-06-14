import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
