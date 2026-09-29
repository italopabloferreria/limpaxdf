import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {settings} from "@/lib/config";
import {supabaseCrmPageAccess,supabaseCrmWriteEnabled} from "@/lib/supabase-crm-access";
import {homologationOrigin} from "@/lib/supabase-homologation";
import {crmStatuses} from "@/lib/crm-shared";

const bodySchema=z.object({
  action:z.enum(["create","update"]),
  id:z.string().uuid(),
  name:z.string().trim().min(2).max(180),
  phone:z.string().trim().max(40),
  email:z.union([z.literal(""),z.string().trim().email().max(254)]),
  problem:z.string().trim().min(2).max(500),
  region:z.string().trim().max(120),
  status:z.enum(crmStatuses),
  expectedUpdatedAt:z.number().int().positive().nullable()
}).strict().superRefine((value,ctx)=>{
  if((value.action==="create") !== (value.expectedUpdatedAt===null) ||
     (value.action==="create"&&value.status!=="novo")){
    ctx.addIssue({code:z.ZodIssueCode.custom,message:"Versão do atendimento inválida."});
  }
});

export async function POST(req:NextRequest){
  const s=settings();
  const origin=homologationOrigin(s);
  if(!supabaseCrmWriteEnabled(s))return NextResponse.json({error:"Cadastro indisponível nesta prévia."},{status:503});
  if(!origin||req.headers.get("origin")!==origin||!req.headers.get("content-type")?.startsWith("application/json")){
    return NextResponse.json({error:"Origem da solicitação inválida."},{status:403});
  }
  let body:unknown;
  try{body=await req.json()}catch{return NextResponse.json({error:"Dados inválidos."},{status:400})}
  const parsed=bodySchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Revise os dados do atendimento."},{status:400});
  const access=await supabaseCrmPageAccess("write");
  if(!access)return NextResponse.json({error:"Entre com uma conta Google aprovada."},{status:401});
  if(!access.actor.isSuperAdmin)return NextResponse.json({error:"Ação disponível apenas para o proprietário nesta prévia."},{status:403});

  const {action,id,name,phone,email,problem,region,status,expectedUpdatedAt}=parsed.data;
  const {data,error}=await access.client.rpc("crm_save_review_lead",{
    p_action:action,p_id:id,p_name:name,p_phone:phone,p_email:email,
    p_problem:problem,p_region:region,p_status:status,p_expected_updated_at:expectedUpdatedAt
  });
  if(error){
    const conflict=error.code==="23505"||error.code==="P0002";
    return NextResponse.json({error:conflict?"Atendimento alterado ou já existente. Recarregue e tente novamente.":"Não foi possível salvar o atendimento."},{status:conflict?409:503});
  }
  return NextResponse.json({id:String(data)},{status:action==="create"?201:200,headers:{"Cache-Control":"no-store"}});
}
