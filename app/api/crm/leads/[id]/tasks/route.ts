import {requireCrmMutation,toDateTime} from "@/lib/crm";
import {database,json,failure,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {createCrmTask} from "@/lib/crm-tasks";
import {z} from "zod";
const schema=z.object({title:z.string().trim().min(1).max(300),dueAt:z.string().optional(),assignee:z.string().trim().max(150).optional()}).strict();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireCrmMutation(req);const {id}=await params;if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");const key=req.headers.get("idempotency-key");if(!uuidSchema.safeParse(key).success)throw new ApiError(400,"Identificador de envio inválido.");const parsed=schema.safeParse(await readJson(req));if(!parsed.success)throw new ApiError(400,"Tarefa inválida.");const result=await createCrmTask(database(settings()),{leadId:id,title:parsed.data.title,dueAt:toDateTime(parsed.data.dueAt),assignee:parsed.data.assignee||user.email,author:user.email,idempotencyKey:key!});return json(result,result.replayed?200:201)}catch(e){return failure(e)}}
