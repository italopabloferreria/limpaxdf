import {ApiError} from "./http";

export function readSupabaseAccessToken(req:Request){
  const authorization=req.headers.get("authorization")?.trim();
  const explicit=req.headers.get("x-supabase-access-token")?.trim();
  if(authorization&&explicit)throw new ApiError(400,"Informe apenas uma sessão Supabase.");
  if(authorization){
    const match=/^Bearer\s+(.+)$/i.exec(authorization);
    if(!match)throw new ApiError(400,"Sessão Supabase inválida.");
    return normalizeSupabaseAccessToken(match[1]);
  }
  return normalizeSupabaseAccessToken(explicit);
}

export function normalizeSupabaseAccessToken(value:string|undefined|null){
  const token=value?.trim();
  if(!token)return undefined;
  if(token.length<32||token.length>8192||!isJwtLike(token)||/service[_-]?role/i.test(token)){
    throw new ApiError(400,"Sessão Supabase inválida.");
  }
  return token;
}

function isJwtLike(value:string){
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}
