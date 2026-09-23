import {settings} from "@/lib/config";
import {json} from "@/lib/http";
import {checkSupabaseHealth} from "@/lib/supabase";

export async function GET(){
  const result=await checkSupabaseHealth(settings());
  return json({
    status:result.configured&&result.auth?.ok?"ok":"not-ready",
    supabase:result
  },result.configured?200:503);
}

