import {NextRequest,NextResponse} from "next/server";
import {settings} from "@/lib/config";
import {createHomologationServerClient,homologationRequestAllowed} from "@/lib/supabase-homologation";

export async function GET(req:NextRequest){
  const s=settings();
  if(!homologationRequestAllowed(req,s))return new Response("Homologação indisponível.",{status:404});
  const code=req.nextUrl.searchParams.get("code");
  if(!code||code.length>2048)return NextResponse.redirect(new URL("/supabase/homologacao?status=invalid",req.url));
  const session=createHomologationServerClient(req,s);
  if(!session)return new Response("Homologação indisponível.",{status:404});
  const {error}=await session.client.auth.exchangeCodeForSession(code);
  const destination=new URL(error?"/supabase/homologacao?status=error":"/supabase/homologacao",req.url);
  const response=NextResponse.redirect(destination);
  for(const cookie of session.cookiesToWrite)response.cookies.set(cookie.name,cookie.value,cookie.options);
  response.headers.set("Cache-Control","no-store");
  return response;
}
