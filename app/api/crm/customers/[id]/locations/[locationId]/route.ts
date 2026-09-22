import {requireCrmMutation,requireCrmAdmin} from "@/lib/crm";
import {cleanOptional} from "@/lib/crm-customers";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
type LocationRow={label:string;postal_code:string|null;address:string|null;number:string|null;complement:string|null;district:string|null;city:string|null;state:string|null;reference:string|null;access_notes:string|null;is_primary:number};

const updateSchema=z.object({
  label:z.string().trim().min(2).max(100).optional(),
  postalCode:z.string().max(20).nullable().optional(),
  address:z.string().max(240).nullable().optional(),
  number:z.string().max(30).nullable().optional(),
  complement:z.string().max(120).nullable().optional(),
  district:z.string().max(120).nullable().optional(),
  city:z.string().max(120).nullable().optional(),
  state:z.string().max(2).nullable().optional(),
  reference:z.string().max(300).nullable().optional(),
  accessNotes:z.string().max(500).nullable().optional(),
  primary:z.boolean().optional()
}).strict();

/** PATCH /api/crm/customers/[id]/locations/[locationId] — edit a location */
export async function PATCH(req:Request,{params}:{params:Promise<{id:string;locationId:string}>}){
  try{
    const actor=await requireCrmMutation(req);
    const {id,locationId}=await params;
    if(!uuidSchema.safeParse(id).success||!uuidSchema.safeParse(locationId).success)
      throw new ApiError(400,"Identificador inválido.");
    const parsed=updateSchema.safeParse(await readJson(req));
    if(!parsed.success||!Object.keys(parsed.data).length)throw new ApiError(400,"Atualização inválida.");
    const data=parsed.data;
    const db=database(settings());

    const current=await db.prepare(
      "SELECT * FROM service_locations WHERE id=? AND customer_id=?"
    ).bind(locationId,id).first<LocationRow>();
    if(!current)throw new ApiError(404,"Local não encontrado.");

    const now=Date.now();
    const statements=[];

    if(data.primary){
      statements.push(db.prepare("UPDATE service_locations SET is_primary=0,updated_at=? WHERE customer_id=?").bind(now,id));
    }

    statements.push(
      db.prepare(
        "UPDATE service_locations SET label=?,postal_code=?,address=?,number=?,complement=?,district=?,city=?,state=?,reference=?,access_notes=?,is_primary=?,updated_at=? WHERE id=?"
      ).bind(
        data.label??current.label,
        data.postalCode===undefined?current.postal_code:cleanOptional(data.postalCode),
        data.address===undefined?current.address:cleanOptional(data.address),
        data.number===undefined?current.number:cleanOptional(data.number),
        data.complement===undefined?current.complement:cleanOptional(data.complement),
        data.district===undefined?current.district:cleanOptional(data.district),
        data.city===undefined?current.city:cleanOptional(data.city),
        data.state===undefined?current.state:(cleanOptional(data.state)?.toUpperCase()||null),
        data.reference===undefined?current.reference:cleanOptional(data.reference),
        data.accessNotes===undefined?current.access_notes:cleanOptional(data.accessNotes),
        data.primary===undefined?current.is_primary:(data.primary?1:0),
        now,locationId
      ),
      db.prepare("UPDATE customers SET updated_at=? WHERE id=?").bind(now,id),
      db.prepare("INSERT INTO crm_audit_log VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"customer",id,"location_updated",actor.email,JSON.stringify({locationId,...data}),now)
    );
    await db.batch(statements);
    return json({updatedAt:now});
  }catch(e){return failure(e)}
}

/** DELETE /api/crm/customers/[id]/locations/[locationId] — remove a location */
export async function DELETE(req:Request,{params}:{params:Promise<{id:string;locationId:string}>}){
  try{
    const actor=await requireCrmAdmin(req);
    const {id,locationId}=await params;
    if(!uuidSchema.safeParse(id).success||!uuidSchema.safeParse(locationId).success)
      throw new ApiError(400,"Identificador inválido.");
    const db=database(settings());
    const current=await db.prepare("SELECT id FROM service_locations WHERE id=? AND customer_id=?").bind(locationId,id).first();
    if(!current)throw new ApiError(404,"Local não encontrado.");
    const now=Date.now();
    await db.batch([
      db.prepare("DELETE FROM service_locations WHERE id=?").bind(locationId),
      db.prepare("UPDATE customers SET updated_at=? WHERE id=?").bind(now,id),
      db.prepare("INSERT INTO crm_audit_log VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"customer",id,"location_deleted",actor.email,JSON.stringify({locationId}),now)
    ]);
    return json({deleted:true});
  }catch(e){return failure(e)}
}
