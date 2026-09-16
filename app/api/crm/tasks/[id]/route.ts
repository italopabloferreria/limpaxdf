import {requireCrmUser} from "@/lib/crm";
import {database,json,failure,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
const schema=z.object({completed:z.boolean()}).strict();
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireCrmUser();const {id}=await params;if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");const parsed=schema.safeParse(await readJson(req));if(!parsed.success)throw new ApiError(400,"Atualização inválida.");const db=database(settings());const task=await db.prepare("SELECT id,lead_id,title,completed_at FROM crm_tasks WHERE id=?").bind(id).first<any>();if(!task)throw new ApiError(404,"Tarefa não encontrada.");const now=Date.now(),completedAt=parsed.data.completed?now:null;await db.batch([db.prepare("UPDATE crm_tasks SET completed_at=? WHERE id=?").bind(completedAt,id),db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),task.lead_id,"task",(parsed.data.completed?"Tarefa concluída: ":"Tarefa reaberta: ")+task.title,user.email,now)]);return json({id,completedAt})}catch(e){return failure(e)}}
