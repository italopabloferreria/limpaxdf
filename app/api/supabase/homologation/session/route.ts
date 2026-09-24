import {NextRequest,NextResponse} from "next/server";
import {settings} from "@/lib/config";
import {createHomologationServerClient,homologationRequestAllowed} from "@/lib/supabase-homologation";

export async function GET(req:NextRequest){
  const s=settings();
  if(!homologationRequestAllowed(req,s))return NextResponse.json({error:"Homologação indisponível."},{status:404});
  const session=createHomologationServerClient(req,s);
  if(!session)return NextResponse.json({error:"Homologação indisponível."},{status:404});
  const {data,error}=await session.client.auth.getUser();
  let status:"signed_out"|"no_profile"|"inactive"|"authorized"="signed_out";
  let role:string|null=null;
  let profileUnavailable=false;
  if(!error&&data.user){
    const profile=await session.client.from("crm_user_profiles").select("user_id,role,active").eq("user_id",data.user.id).maybeSingle();
    if(profile.error)profileUnavailable=true;
    else if(!profile.data)status="no_profile";
    else if(!profile.data.active)status="inactive";
    else if(["admin","attendant"].includes(profile.data.role)){status="authorized";role=profile.data.role}
    else status="no_profile";
  }
  const response=profileUnavailable
    ?NextResponse.json({error:"Perfil indisponível."},{status:503})
    :NextResponse.json({status,role});
  for(const cookie of session.cookiesToWrite)response.cookies.set(cookie.name,cookie.value,cookie.options);
  response.headers.set("Cache-Control","no-store");
  return response;
}
