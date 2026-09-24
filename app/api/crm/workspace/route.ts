import {requireCrmUser} from "@/lib/crm";
import {crmStatuses} from "@/lib/crm-shared";
import {json,failure} from "@/lib/http";
import {settings} from "@/lib/config";
import {listCrmWorkspaceLeads} from "@/lib/crm-data";
import {readSupabaseAccessToken} from "@/lib/supabase-session";
import {z} from "zod";

const querySchema=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(10).max(100).default(50),status:z.enum(crmStatuses).optional(),search:z.string().trim().max(120).optional()});
export async function GET(req:Request){try{await requireCrmUser();const parsed=querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));if(!parsed.success)return json({error:"Filtros inválidos."},400);const s=settings();return json(await listCrmWorkspaceLeads(s,parsed.data,readSupabaseAccessToken(req)))}catch(e){return failure(e)}}
