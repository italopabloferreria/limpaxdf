import {NextRequest,NextResponse} from "next/server";
import {settings} from "@/lib/config";
import {createHomologationServerClient,homologationOrigin,homologationRequestAllowed} from "@/lib/supabase-homologation";

export async function POST(req:NextRequest){
  const s=settings();
  if(!homologationRequestAllowed(req,s))return NextResponse.json({error:"Homologação indisponível."},{status:404});
  if(req.headers.get("origin")!==homologationOrigin(s))return NextResponse.json({error:"Origem inválida."},{status:403});
  const session=createHomologationServerClient(req,s);
  if(!session)return NextResponse.json({error:"Homologação indisponível."},{status:404});
  const {error}=await session.client.auth.signOut();
  const response=error
    ?NextResponse.json({error:"Não foi possível encerrar a sessão."},{status:503})
    :NextResponse.json({signedOut:true});
  for(const cookie of session.cookiesToWrite)response.cookies.set(cookie.name,cookie.value,cookie.options);
  response.headers.set("Cache-Control","no-store");
  return response;
}
