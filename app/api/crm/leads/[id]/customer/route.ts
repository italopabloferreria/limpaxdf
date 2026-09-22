import {requireCrmUser,requireCrmMutation} from "@/lib/crm";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
import {assertCompatibleLifecycle} from "@/lib/crm-lifecycle";

const linkSchema=z.object({
  customerId:z.string().uuid(),
  contactId:z.string().uuid().optional(),
  locationId:z.string().uuid().optional()
}).strict();

/** GET /api/crm/leads/[id]/customer — get the linked customer for a lead */
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireCrmUser();
    const {id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const db=database(settings());
    const link=await db.prepare(
      "SELECT lc.*,c.name AS customer_name,c.trade_name,c.kind FROM lead_customer_links lc JOIN customers c ON c.id=lc.customer_id WHERE lc.lead_id=?"
    ).bind(id).first<{customer_id:string;customer_name:string;trade_name:string|null;kind:string;contact_id:string|null;location_id:string|null;linked_at:number;linked_by:string}>();
    if(!link)return json({linked:false});
    return json({
      linked:true,
      customerId:link.customer_id,
      customerName:link.trade_name||link.customer_name,
      customerKind:link.kind,
      contactId:link.contact_id,
      locationId:link.location_id,
      linkedAt:Number(link.linked_at),
      linkedBy:link.linked_by
    });
  }catch(e){return failure(e)}
}

/** POST /api/crm/leads/[id]/customer — link a lead to a customer */
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireCrmMutation(req);
    const {id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const parsed=linkSchema.safeParse(await readJson(req));
    if(!parsed.success)throw new ApiError(400,"Dados de vínculo inválidos.");
    const data=parsed.data;
    const db=database(settings());

    // Validate lead exists
    const lead=await db.prepare("SELECT id,mode FROM leads WHERE id=?").bind(id).first<{id:string;mode:string}>();
    if(!lead)
      throw new ApiError(404,"Solicitação não encontrada.");

    // Validate customer exists and is not archived
    const customer=await db.prepare("SELECT id,source_mode FROM customers WHERE id=? AND archived_at IS NULL").bind(data.customerId).first<{id:string;source_mode:string}>();
    if(!customer)
      throw new ApiError(404,"Cliente não encontrado.");
    assertCompatibleLifecycle(lead.mode,customer.source_mode);

    // Validate contact belongs to this customer if provided
    if(data.contactId){
      const contact=await db.prepare("SELECT customer_id FROM customer_contacts WHERE id=?").bind(data.contactId).first<{customer_id:string}>();
      if(!contact||contact.customer_id!==data.customerId)throw new ApiError(400,"O contato informado não pertence a este cliente.");
    }

    // Validate location belongs to this customer if provided
    if(data.locationId){
      const location=await db.prepare("SELECT customer_id FROM service_locations WHERE id=?").bind(data.locationId).first<{customer_id:string}>();
      if(!location||location.customer_id!==data.customerId)throw new ApiError(400,"O local informado não pertence a este cliente.");
    }

    const now=Date.now();
    await db.batch([
      // Upsert link: replace if already linked to a different customer
      db.prepare(
        "INSERT INTO lead_customer_links (lead_id,customer_id,contact_id,location_id,linked_at,linked_by) VALUES (?,?,?,?,?,?) ON CONFLICT(lead_id) DO UPDATE SET customer_id=?,contact_id=?,location_id=?,linked_at=?,linked_by=?"
      ).bind(id,data.customerId,data.contactId||null,data.locationId||null,now,actor.email,
             data.customerId,data.contactId||null,data.locationId||null,now,actor.email),
      db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) VALUES (?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),id,"link","Cliente vinculado: "+data.customerId,actor.email,now),
      db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"lead",id,"customer_linked",actor.email,JSON.stringify({customerId:data.customerId}),now)
    ]);
    return json({linked:true},201);
  }catch(e){return failure(e)}
}

/** DELETE /api/crm/leads/[id]/customer — unlink a lead from its customer */
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireCrmMutation(req);
    const {id}=await params;
    if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");
    const db=database(settings());
    const existing=await db.prepare("SELECT customer_id FROM lead_customer_links WHERE lead_id=?").bind(id).first<{customer_id:string}>();
    if(!existing)throw new ApiError(404,"Este atendimento não possui vínculo.");
    const now=Date.now();
    await db.batch([
      db.prepare("DELETE FROM lead_customer_links WHERE lead_id=?").bind(id),
      db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) VALUES (?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),id,"unlink","Vínculo com cliente removido",actor.email,now),
      db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"lead",id,"customer_unlinked",actor.email,JSON.stringify({customerId:existing.customer_id}),now)
    ]);
    return json({linked:false});
  }catch(e){return failure(e)}
}
