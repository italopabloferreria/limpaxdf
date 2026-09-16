import {requireCrmMutation} from "@/lib/crm";
import {database,json,failure,readJson,ApiError} from "@/lib/http";
import {settings} from "@/lib/config";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
const schema=z.object({body:z.string().trim().min(1).max(2000)}).strict();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireCrmMutation(req);const {id}=await params;if(!uuidSchema.safeParse(id).success)throw new ApiError(400,"Identificador inválido.");const parsed=schema.safeParse(await readJson(req));if(!parsed.success)throw new ApiError(400,"Nota inválida.");const db=database(settings());const result=await db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) SELECT ?,?, 'note',?,?,? WHERE EXISTS(SELECT 1 FROM leads WHERE id=?)").bind(crypto.randomUUID(),id,parsed.data.body,user.email,Date.now(),id).run();if(!result.meta.changes)throw new ApiError(404,"Solicitação não encontrada.");return json({saved:true},201)}catch(e){return failure(e)}}
