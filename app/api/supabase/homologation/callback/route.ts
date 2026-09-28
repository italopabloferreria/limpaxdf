import {NextRequest,NextResponse} from "next/server";
import {settings} from "@/lib/config";
import {createHomologationServerClient,homologationRequestAllowed} from "@/lib/supabase-homologation";

export async function GET(req:NextRequest){
  const s=settings();
  if(!homologationRequestAllowed(req,s))return new Response("Homologação indisponível.",{status:404});
  const code=req.nextUrl.searchParams.get("code");
  if(!code||code.length>2048){
    const description=req.nextUrl.searchParams.get("error_description")||"";
    const status=description.includes("Usuário não registrado.")?"unregistered":"error";
    return NextResponse.redirect(new URL(`/supabase/homologacao?status=${status}`,req.url));
  }
  const session=createHomologationServerClient(req,s);
  if(!session)return new Response("Homologação indisponível.",{status:404});
  const {error}=await session.client.auth.exchangeCodeForSession(code);
  let status=error?"error":"";
  if(!error){
    const {data:userData,error:userError}=await session.client.auth.getUser();
    if(userError||!userData.user)status="error";
    else{
      const {data:profile,error:profileError}=await session.client.from("crm_user_profiles")
        .select("role,active").eq("user_id",userData.user.id).maybeSingle();
      if(profileError)status="error";
      else if(!profile?.active||!["admin","attendant"].includes(profile.role))status="unregistered";
    }
    if(status)await session.client.auth.signOut();
  }
  const destination=new URL(status?`/supabase/homologacao?status=${status}`:"/supabase/homologacao",req.url);
  const response=NextResponse.redirect(destination);
  for(const cookie of session.cookiesToWrite)response.cookies.set(cookie.name,cookie.value,cookie.options);
  response.headers.set("Cache-Control","no-store");
  return response;
}
