import {createServerClient} from "@supabase/ssr";
import type {NextRequest} from "next/server";
import type {Settings} from "./config";
import {getSupabaseConfig} from "./supabase";

export function homologationOrigin(s:Settings){
  if(s.SUPABASE_HOMOLOGATION_ENABLED!=="true")return null;
  const raw=s.SUPABASE_HOMOLOGATION_ORIGIN;
  if(!raw)return null;
  try{
    const url=new URL(raw);
    if(url.origin!==raw||!(["https:"].includes(url.protocol)||url.origin==="http://localhost:5173"))return null;
    return url.origin;
  }catch{return null}
}

export function createHomologationServerClient(req:NextRequest,s:Settings){
  const config=getSupabaseConfig(s);
  const origin=homologationOrigin(s);
  if(!config||!origin)return null;
  const cookiesToWrite:Array<{name:string;value:string;options:Record<string,unknown>}> = [];
  const client=createServerClient(config.url,config.publishableKey,{
    auth:{flowType:"pkce"},
    cookieOptions:{sameSite:"lax",secure:origin.startsWith("https://")},
    cookies:{
      getAll:()=>req.cookies.getAll(),
      setAll:(items)=>{for(const item of items)cookiesToWrite.push(item)}
    }
  });
  return {client,cookiesToWrite};
}

export function homologationRequestAllowed(req:NextRequest,s:Settings){
  const origin=homologationOrigin(s);
  return Boolean(origin&&req.nextUrl.origin===origin);
}
