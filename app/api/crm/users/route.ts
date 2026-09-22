import {requireCrmAdmin} from "@/lib/crm";
import {database,failure,json,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {z} from "zod";

const createSchema=z.object({
  email:z.string().email().max(200),
  displayName:z.string().trim().max(180).optional(),
  role:z.enum(["admin","attendant"])
}).strict();

type UserRow={email:string;display_name:string|null;role:"admin"|"attendant";active:number;last_seen_at:number|null;created_at:number;updated_at:number};

/** GET /api/crm/users — list team members (admin only) */
export async function GET(){
  try{
    await requireCrmAdmin();
    const db=database(settings());
    const rows=await db.prepare(
      "SELECT email,display_name,role,active,last_seen_at,created_at,updated_at FROM crm_user_profiles ORDER BY active DESC,role,email"
    ).all<UserRow>();
    return json({users:rows.results.map(r=>({
      email:r.email,
      displayName:r.display_name,
      role:r.role,
      active:!!r.active,
      lastSeenAt:r.last_seen_at?Number(r.last_seen_at):null,
      createdAt:Number(r.created_at),
      updatedAt:Number(r.updated_at)
    }))});
  }catch(e){return failure(e)}
}

/** POST /api/crm/users — create or invite a team member (admin only) */
export async function POST(req:Request){
  try{
    const actor=await requireCrmAdmin(req);
    const parsed=createSchema.safeParse(await readJson(req));
    if(!parsed.success)throw new ApiError(400,"Dados do membro inválidos.");
    const data=parsed.data;
    const db=database(settings());
    const existing=await db.prepare("SELECT email FROM crm_user_profiles WHERE email=?").bind(data.email.toLowerCase()).first();
    if(existing)throw new ApiError(409,"Este e-mail já está cadastrado na equipe.");
    const now=Date.now();
    await db.batch([
      db.prepare("INSERT INTO crm_user_profiles (email,display_name,role,active,created_at,updated_at) VALUES (?,?,?,1,?,?)")
        .bind(data.email.toLowerCase(),data.displayName?.trim()||null,data.role,now,now),
      db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),"user",data.email.toLowerCase(),"user_created",actor.email,JSON.stringify({role:data.role}),now)
    ]);
    return json({email:data.email.toLowerCase()},201);
  }catch(e){return failure(e)}
}
