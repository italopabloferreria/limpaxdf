import {requireCrmUser} from "@/lib/crm";
import {crmStatuses} from "@/lib/crm-shared";
import {database,json,failure} from "@/lib/http";
import {settings} from "@/lib/config";

export async function GET(){try{await requireCrmUser();const db=database(settings());const rows=await db.prepare("SELECT seq,id,payload,status,mode,created_at,updated_at,assigned_to,next_action_at FROM leads ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 150").all<any>();const totals=Object.fromEntries(crmStatuses.map(status=>[status,0]));for(const row of rows.results)totals[String(row.status)] = (totals[String(row.status)]||0)+1;return json({leads:rows.results.map(row=>({id:row.id,seq:row.seq,status:row.status,mode:row.mode,createdAt:row.created_at,updatedAt:row.updated_at||row.created_at,assignedTo:row.assigned_to,nextActionAt:row.next_action_at,contact:pickContact(row.payload)})),totals})}catch(e){return failure(e)}}
function pickContact(payload:string){try{const data=JSON.parse(payload);return {name:data.name||"Sem nome",phone:data.phone||"",email:data.email||"",problem:data.problem||"outro",region:data.region||"",property:data.property||""}}catch{return {name:"Registro inválido",phone:"",email:"",problem:"outro",region:"",property:""}}}
