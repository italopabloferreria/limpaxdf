import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Settings } from "./config";

export type SupabaseRuntimeConfig={
  projectRef:string;
  region:string;
  url:string;
  publishableKey:string;
};

export type SupabaseHealthResult={
  configured:boolean;
  projectRef?:string;
  region?:string;
  host?:string;
  auth?:{ok:boolean;status:number;statusText:string;version?:string};
  error?:string;
};

function readEnvValue(s:Settings,key:keyof Settings){
  const fromSettings=s[key];
  if(typeof fromSettings==="string"&&fromSettings.trim())return fromSettings.trim();
  return undefined;
}

export function getSupabaseConfig(s:Settings):SupabaseRuntimeConfig|null{
  const url=readEnvValue(s,"SUPABASE_URL")||readEnvValue(s,"NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey=readEnvValue(s,"SUPABASE_PUBLISHABLE_KEY")||readEnvValue(s,"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const projectRef=readEnvValue(s,"SUPABASE_PROJECT_REF")||inferProjectRef(url);
  const region=readEnvValue(s,"SUPABASE_REGION")||"[VALIDAR]";
  if(!url||!publishableKey||!projectRef)return null;
  if(!isSupabasePublicKey(publishableKey))return null;
  return {projectRef,region,url,publishableKey};
}

export function isSupabasePublicKey(key:string){
  if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))return true;
  // Legacy anon keys are JWTs; privileged roles are encoded, not plaintext.
  try{
    const parts=key.split('.');
    if(parts.length!==3)return false;
    const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    return payload.role==='anon';
  }catch{return false}
}

export function inferProjectRef(url?:string){
  if(!url)return undefined;
  try{
    const host=new URL(url).hostname;
    const [ref,domain]=host.split(".");
    return domain==="supabase"&&ref?ref:undefined;
  }catch{return undefined}
}

export function createSupabasePublicClient(s:Settings):SupabaseClient|null{
  const cfg=getSupabaseConfig(s);
  if(!cfg)return null;
  return createClient(cfg.url,cfg.publishableKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{"X-Client-Info":"limpax-crm-homologation"}}
  });
}

export function createSupabaseUserClient(s:Settings,accessToken:string):SupabaseClient|null{
  const cfg=getSupabaseConfig(s);
  if(!cfg)return null;
  return createClient(cfg.url,cfg.publishableKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{"X-Client-Info":"limpax-crm-read-session","Authorization":"Bearer "+accessToken}}
  });
}

export async function checkSupabaseHealth(s:Settings,fetcher:typeof fetch=fetch):Promise<SupabaseHealthResult>{
  const cfg=getSupabaseConfig(s);
  if(!cfg)return {configured:false,error:"Supabase não configurado."};
  let host:string;
  try{host=new URL(cfg.url).hostname}catch{return {configured:false,error:"URL Supabase inválida."}}
  try{
    const response=await fetcher(new URL("/auth/v1/health",cfg.url),{
      method:"GET",
      headers:{apikey:cfg.publishableKey},
      cache:"no-store"
    });
    let version:string|undefined;
    try{const body=await response.clone().json() as {version?:string};version=body.version}catch{}
    return {configured:true,projectRef:cfg.projectRef,region:cfg.region,host,auth:{ok:response.ok,status:response.status,statusText:response.statusText,version}};
  }catch(error){
    return {configured:true,projectRef:cfg.projectRef,region:cfg.region,host,error:error instanceof Error?error.message:"Falha ao consultar Supabase."};
  }
}


