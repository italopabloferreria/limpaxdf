import {requireCrmAdmin} from "@/lib/crm";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {z} from "zod";

const updateSchema=z.object({
  displayName:z.string().trim().max(180).nullable().optional(),
  role:z.enum(["admin","attendant"]).optional(),
  active:z.boolean().optional()
}).strict();

type UserProfileRow={
  email:string;
  display_name:string|null;
  role:string;
  active:number;
};

/** PATCH /api/crm/users/[email] — update a team member (admin only) */
export async function PATCH(req:Request,{params}:{params:Promise<{email:string}>}){
  try{
    const actor=await requireCrmAdmin(req);
    const {email}=await params;
    const target=decodeURIComponent(email).toLowerCase();
    const parsed=updateSchema.safeParse(await readJson(req));
    if(!parsed.success||!Object.keys(parsed.data).length)throw new ApiError(400,"Atualização inválida.");
    const data=parsed.data;
    const db=database(settings());
    const current=await db.prepare(
      "SELECT email,display_name,role,active FROM crm_user_profiles WHERE email=?"
    ).bind(target).first<UserProfileRow>();
    if(!current)throw new ApiError(404,"Membro não encontrado.");

    const nextRole=data.role??current.role;
    const nextActive=data.active===undefined?current.active:(data.active?1:0);
    const removesActiveAdmin=
      current.role==="admin"&&current.active===1&&
      (nextRole!=="admin"||nextActive!==1);
    const now=Date.now();
    const displayName=data.displayName===undefined?current.display_name:(data.displayName?.trim()||null);

    const update=removesActiveAdmin
      ? db.prepare(
          "UPDATE crm_user_profiles SET display_name=?,role=?,active=?,updated_at=? "+
          "WHERE email=? AND EXISTS ("+
          "SELECT 1 FROM crm_user_profiles WHERE email<>? AND role='admin' AND active=1"+
          ")"
        ).bind(displayName,nextRole,nextActive,now,target,target)
      : db.prepare(
          "UPDATE crm_user_profiles SET display_name=?,role=?,active=?,updated_at=? WHERE email=?"
        ).bind(displayName,nextRole,nextActive,now,target);

    // changes() observes the immediately preceding UPDATE inside the same D1 batch,
    // so a rejected conditional update cannot create an audit event.
    const audit=removesActiveAdmin
      ? db.prepare(
          "INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) "+
          "SELECT ?,?,?,?,?,?,? WHERE changes()=1"
        ).bind(crypto.randomUUID(),"user",target,"user_updated",actor.email,JSON.stringify(data),now)
      : db.prepare(
          "INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)"
        ).bind(crypto.randomUUID(),"user",target,"user_updated",actor.email,JSON.stringify(data),now);

    const [updated]=await db.batch([update,audit]);
    if(removesActiveAdmin&&Number(updated.meta.changes)!==1){
      throw new ApiError(409,"Não é possível remover o único administrador ativo.");
    }
    return json({updatedAt:now});
  }catch(e){return failure(e)}
}
