import {requireCrmMutation,requireCrmUser} from "@/lib/crm";
import {cleanOptional,getCustomer,validateTaxId} from "@/lib/crm-customers";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";

type CustomerRecord={
  kind:"person"|"organization";
  name:string;
  trade_name:string|null;
  tax_id:string|null;
  tax_id_normalized:string|null;
  notes:string|null;
};

function isUniqueConstraintError(error:unknown){
  return error instanceof Error&&error.message.includes("UNIQUE constraint failed");
}

const schema=z.object({
  kind:z.enum(["person","organization"]).optional(),
  name:z.string().trim().min(2).max(180).optional(),
  tradeName:z.string().max(180).nullable().optional(),
  taxId:z.string().max(30).nullable().optional(),
  notes:z.string().max(2000).nullable().optional()
}).strict();

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireCrmUser();
    const {id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const includeArchived=new URL(req.url).searchParams.get("archived")==="include";
    if(includeArchived&&actor.role!=="admin")throw new ApiError(403,"Ação disponível apenas para administradores.");
    return json(await getCustomer(database(settings()),id,{includeArchived}));
  }catch(e){return failure(e)}
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireCrmMutation(req);
    const {id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const parsed=schema.safeParse(await readJson(req));
    if(!parsed.success||!Object.keys(parsed.data).length)throw new ApiError(400,"Atualização inválida.");
    const db=database(settings());
    const current=await db.prepare("SELECT kind,name,trade_name,tax_id,tax_id_normalized,notes FROM customers WHERE id=? AND archived_at IS NULL").bind(id).first<CustomerRecord>();
    if(!current)throw new ApiError(404,"Cliente não encontrado.");

    const data=parsed.data;

    // Validate CPF/CNPJ if being changed
    let taxNormalized:string|null;
    if(data.taxId===undefined){
      taxNormalized=current.tax_id_normalized;
    }else{
      const taxResult=validateTaxId(data.taxId);
      if(!taxResult.valid)throw new ApiError(400,"CPF ou CNPJ inválido. Verifique os dígitos.");
      taxNormalized=taxResult.normalized;
    }

    // Check uniqueness against other customers
    if(taxNormalized&&await db.prepare("SELECT id FROM customers WHERE tax_id_normalized=? AND id<>?").bind(taxNormalized,id).first())
      throw new ApiError(409,"Já existe outro cliente com este CPF ou CNPJ.");

    const now=Date.now();
    try{
      await db.batch([
        db.prepare("UPDATE customers SET kind=?,name=?,trade_name=?,tax_id=?,tax_id_normalized=?,notes=?,updated_at=? WHERE id=?")
          .bind(
            data.kind??current.kind,
            data.name??current.name,
            data.tradeName===undefined?current.trade_name:cleanOptional(data.tradeName),
            data.taxId===undefined?current.tax_id:cleanOptional(data.taxId),
            taxNormalized,
            data.notes===undefined?current.notes:cleanOptional(data.notes),
            now,id
          ),
        db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)")
          .bind(crypto.randomUUID(),"customer",id,"updated",actor.email,JSON.stringify(Object.keys(data)),now)
      ]);
    }catch(e){
      if(isUniqueConstraintError(e))
        throw new ApiError(409,"Já existe outro cliente com este CPF ou CNPJ.");
      throw e;
    }
    return json({updatedAt:now});
  }catch(e){return failure(e)}
}
