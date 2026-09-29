import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import type {SupabaseClient} from "@supabase/supabase-js";
import {settings,type Settings} from "./config";
import {getSupabaseConfig} from "./supabase";
import {homologationOrigin} from "./supabase-homologation";

export type SupabaseCrmActor={email:string;displayName:string;role:"admin"|"attendant";isSuperAdmin:boolean};
export type SupabaseCrmPageAccess={client:SupabaseClient;actor:SupabaseCrmActor}|null;

export function supabaseCrmReadEnabled(s:Settings){
  return process.env.LIMPAX_DEPLOYMENT_TARGET==="vercel-preview"
    &&s.SUPABASE_DATA_MODE==="read_only"
    &&Boolean(homologationOrigin(s))
    &&Boolean(getSupabaseConfig(s));
}

export function supabaseCrmProfileEnabled(s:Settings){
  return process.env.LIMPAX_DEPLOYMENT_TARGET==="vercel-preview"
    &&s.SUPABASE_GOOGLE_APPROVALS_ENABLED==="true"
    &&Boolean(homologationOrigin(s))
    &&Boolean(getSupabaseConfig(s));
}

export async function supabaseCrmPageAccess(mode:"read"|"profile"="read"):Promise<SupabaseCrmPageAccess>{
  const s=settings();
  if(mode==="profile"?!supabaseCrmProfileEnabled(s):!supabaseCrmReadEnabled(s))return null;
  const config=getSupabaseConfig(s);
  if(!config)return null;
  const cookieStore=await cookies();
  const client=createServerClient(config.url,config.publishableKey,{
    auth:{flowType:"pkce"},
    cookieOptions:{sameSite:"lax",secure:true},
    cookies:{
      getAll:()=>cookieStore.getAll(),
      // Server Components cannot write cookies. Auth refresh is handled by
      // the homologation session endpoint before opening the CRM.
      setAll:()=>{}
    }
  });
  const {data:userData,error:userError}=await client.auth.getUser();
  if(userError||!userData.user?.id||!userData.user.email)return null;
  const {data:profile,error:profileError}=await client.from("crm_user_profiles")
    .select("email,display_name,role,active,is_super_admin")
    .eq("user_id",userData.user.id).maybeSingle();
  if(profileError||!profile?.active||!["admin","attendant"].includes(profile.role))return null;
  if(profile.is_super_admin&&profile.role!=="admin")return null;
  const role=profile.role as SupabaseCrmActor["role"];
  return {client,actor:{email:userData.user.email,displayName:profile.display_name||userData.user.email,role,isSuperAdmin:Boolean(profile.is_super_admin)}};
}
