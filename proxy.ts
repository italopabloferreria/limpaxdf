import {NextResponse,type NextRequest} from "next/server";
import {settings} from "./lib/config";

export function proxy(req:NextRequest){
  let connectSrc="'self'";
  if(req.nextUrl.pathname==="/supabase/homologacao"){
    const s=settings();
    try{
      const url=new URL(s.SUPABASE_URL||s.NEXT_PUBLIC_SUPABASE_URL||"");
      if(s.SUPABASE_HOMOLOGATION_ENABLED==="true"&&url.protocol==="https:"&&url.hostname.endsWith(".supabase.co"))connectSrc+=" "+url.origin;
    }catch{/* Fail closed when the configured URL is invalid. */}
  }
  const response=NextResponse.next();
  response.headers.set("X-Content-Type-Options","nosniff");
  response.headers.set("Referrer-Policy","strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy",`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src ${connectSrc}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com`);
  return response;
}
export const config={matcher:["/((?!_next/static|media|fonts|favicon).*)"]};
