import type {CrmStatus} from "./crm-shared";

type D1Like={prepare:(query:string)=>D1PreparedStatement};
type CrmLeadRow={id:string;seq:number;payload:string;status:CrmStatus;mode:string;created_at:number;updated_at?:number|null;assigned_to?:string|null;next_action_at?:number|null};

export type CrmLead={id:string;seq:number;status:CrmStatus;mode:string;createdAt:number;updatedAt:number;assignedTo:string|null;nextActionAt:number|null;contact:{name:string;phone:string;email:string;problem:string;region:string;property:string}};

export function readLeadPayload(payload:string){try{return JSON.parse(payload) as Record<string,unknown>}catch{return {}}}

export function mapCrmLead(row:CrmLeadRow|Record<string,unknown>):CrmLead{const typed=row as CrmLeadRow;const data=readLeadPayload(String(typed.payload||""));return {id:String(typed.id),seq:Number(typed.seq),status:typed.status as CrmStatus,mode:String(typed.mode),createdAt:Number(typed.created_at),updatedAt:Number(typed.updated_at||typed.created_at),assignedTo:typed.assigned_to?String(typed.assigned_to):null,nextActionAt:typed.next_action_at==null?null:Number(typed.next_action_at),contact:{name:String(data.name||"Sem nome"),phone:String(data.phone||""),email:String(data.email||""),problem:String(data.problem||"outro"),region:String(data.region||""),property:String(data.property||"")}}}

export async function listCrmLeads(db:D1Like,{page=1,pageSize=50,status,search}:{page?:number;pageSize?:number;status?:CrmStatus;search?:string}={}){const safePage=Math.max(1,Math.trunc(page)),safeSize=Math.min(100,Math.max(10,Math.trunc(pageSize))),conditions:string[]=[],values:unknown[]=[];if(status){conditions.push("status=?");values.push(status)}if(search){conditions.push("LOWER(payload) LIKE ? ESCAPE '\\'");values.push("%"+escapeLike(search.toLowerCase())+"%")};const where=conditions.length?" WHERE "+conditions.join(" AND "):"";const count=await db.prepare("SELECT COUNT(*) AS total FROM leads"+where).bind(...values).first<{total:number}>(),total=Number(count?.total||0),pages=Math.max(1,Math.ceil(total/safeSize)),current=Math.min(safePage,pages);const rows=await db.prepare("SELECT seq,id,payload,status,mode,created_at,updated_at,assigned_to,next_action_at FROM leads"+where+" ORDER BY COALESCE(updated_at,created_at) DESC,id DESC LIMIT ? OFFSET ?").bind(...values,safeSize,(current-1)*safeSize).all<CrmLeadRow>();const grouped=await db.prepare("SELECT status,COUNT(*) AS total FROM leads GROUP BY status").all<{status:string;total:number}>();return {leads:rows.results.map(mapCrmLead),total,page:current,pageSize:safeSize,pages,totals:Object.fromEntries(grouped.results.map(row=>[row.status,Number(row.total)]))}}

function escapeLike(value:string){return value.replace(/[\\%_]/g,match=>"\\"+match)}
