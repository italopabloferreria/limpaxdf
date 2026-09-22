import {requireCrmMutation,requireCrmUser} from "@/lib/crm";
import {cleanOptional,digits,listCustomers,validateTaxId} from "@/lib/crm-customers";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {captureMode,settings} from "@/lib/config";
import {operationalDataMode} from "@/lib/crm-lifecycle";
import {z} from "zod";

const querySchema=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(10).max(100).default(30),search:z.string().trim().max(120).default(""),mode:z.enum(["review","live"]).optional(),state:z.enum(["active","archived"]).default("active")});
const createSchema=z.object({kind:z.enum(["person","organization"]),name:z.string().trim().min(2).max(180),tradeName:z.string().max(180).optional(),taxId:z.string().max(30).optional(),notes:z.string().max(2000).optional(),contact:z.object({name:z.string().trim().min(2).max(180),role:z.string().max(100).optional(),phone:z.string().max(30).optional(),email:z.string().email().max(200).or(z.literal("")).optional()}).optional(),location:z.object({label:z.string().trim().min(2).max(100),postalCode:z.string().max(20).optional(),address:z.string().max(240).optional(),number:z.string().max(30).optional(),complement:z.string().max(120).optional(),district:z.string().max(120).optional(),city:z.string().max(120).optional(),state:z.string().max(2).optional(),reference:z.string().max(300).optional(),accessNotes:z.string().max(500).optional()}).optional()}).strict();

export async function GET(req:Request){
  try{
    const actor=await requireCrmUser();
    const parsed=querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if(!parsed.success)throw new ApiError(400,"Filtros inválidos.");
    if(parsed.data.state==="archived"&&actor.role!=="admin")throw new ApiError(403,"Ação disponível apenas para administradores.");
    return json(await listCustomers(database(settings()),{...parsed.data,sourceMode:parsed.data.mode,archived:parsed.data.state==="archived"}));
  }catch(e){return failure(e)}
}

export async function POST(req:Request){
  try{
    const actor=await requireCrmMutation(req);
    const parsed=createSchema.safeParse(await readJson(req));
    if(!parsed.success)throw new ApiError(400,"Revise os dados do cliente.");
    const data=parsed.data;
    const db=database(settings());

    // Validate CPF/CNPJ if provided
    const taxResult=validateTaxId(data.taxId);
    if(!taxResult.valid)throw new ApiError(400,"CPF ou CNPJ inválido. Verifique os dígitos.");

    // Check uniqueness
    if(taxResult.normalized&&await db.prepare("SELECT id FROM customers WHERE tax_id_normalized=?").bind(taxResult.normalized).first())
      throw new ApiError(409,"Já existe um cliente com este CPF ou CNPJ.");

    const id=crypto.randomUUID(),now=Date.now(),sourceMode=operationalDataMode(captureMode(settings()));
    const statements=[
      db.prepare("INSERT INTO customers (id,kind,name,trade_name,tax_id,tax_id_normalized,notes,source_mode,origin,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id,data.kind,data.name,cleanOptional(data.tradeName),cleanOptional(data.taxId),taxResult.normalized,cleanOptional(data.notes),sourceMode,"manual",now,now)
    ];
    if(data.contact)statements.push(
      db.prepare("INSERT INTO customer_contacts (id,customer_id,name,role,phone,phone_normalized,email,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,1,?,?)")
        .bind(crypto.randomUUID(),id,data.contact.name,cleanOptional(data.contact.role),cleanOptional(data.contact.phone),digits(data.contact.phone),cleanOptional(data.contact.email)?.toLowerCase()||null,now,now)
    );
    if(data.location)statements.push(
      db.prepare("INSERT INTO service_locations (id,customer_id,label,postal_code,address,number,complement,district,city,state,reference,access_notes,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)")
        .bind(crypto.randomUUID(),id,data.location.label,cleanOptional(data.location.postalCode),cleanOptional(data.location.address),cleanOptional(data.location.number),cleanOptional(data.location.complement),cleanOptional(data.location.district),cleanOptional(data.location.city),cleanOptional(data.location.state)?.toUpperCase()||null,cleanOptional(data.location.reference),cleanOptional(data.location.accessNotes),now,now)
    );
    statements.push(
      db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"customer",id,"created",actor.email,JSON.stringify({kind:data.kind}),now)
    );

    try{
      await db.batch(statements);
    }catch(e){
      // Handle unique constraint violation from race condition
      if(e instanceof Error&&e.message.includes("UNIQUE constraint failed"))
        throw new ApiError(409,"Já existe um cliente com este CPF ou CNPJ.");
      throw e;
    }
    return json({id},201);
  }catch(e){return failure(e)}
}
