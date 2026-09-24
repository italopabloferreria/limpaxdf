import {crmStatuses,type CrmStatus} from "./crm-shared";
import type {Settings} from "./config";
import {ApiError,database} from "./http";
import {createSupabaseUserClient} from "./supabase";

type D1Like={prepare:(query:string)=>D1PreparedStatement};
type CrmLeadRow={id:string;seq:number;payload:string;status:CrmStatus;mode:string;created_at:number;updated_at?:number|null;assigned_to?:string|null;next_action_at?:number|null};
type SupabaseLeadRow=Omit<CrmLeadRow,"payload">&{payload:Record<string,unknown>|string|null};
type SupabaseQueryResult<T>={data:T[]|null;error:{message?:string}|null;count?:number|null};
type SupabaseQuery<T>=PromiseLike<SupabaseQueryResult<T>>&{
  eq:(column:string,value:string)=>SupabaseQuery<T>;
  or:(filters:string)=>SupabaseQuery<T>;
  order:(column:string,options?:{ascending?:boolean;nullsFirst?:boolean})=>SupabaseQuery<T>;
  range:(from:number,to:number)=>SupabaseQuery<T>;
};
export type SupabaseLeadReadClient={
  from:(table:"leads")=>{select:<T=SupabaseLeadRow>(columns:string,options?:{count?: "exact";head?:boolean})=>SupabaseQuery<T>};
};

export type CrmLead={id:string;seq:number;status:CrmStatus;mode:string;createdAt:number;updatedAt:number;assignedTo:string|null;nextActionAt:number|null;contact:{name:string;phone:string;email:string;problem:string;region:string;property:string}};
export type CrmLeadListOptions={page?:number;pageSize?:number;status?:CrmStatus;search?:string};
export type CrmLeadList={leads:CrmLead[];total:number;page:number;pageSize:number;pages:number;totals:Record<string,number>};

export function readLeadPayload(payload:string){try{return JSON.parse(payload) as Record<string,unknown>}catch{return {}}}

export function mapCrmLead(row:CrmLeadRow|Record<string,unknown>):CrmLead{const typed=row as CrmLeadRow;const data=readLeadPayload(String(typed.payload||""));return {id:String(typed.id),seq:Number(typed.seq),status:typed.status as CrmStatus,mode:String(typed.mode),createdAt:Number(typed.created_at),updatedAt:Number(typed.updated_at||typed.created_at),assignedTo:typed.assigned_to?String(typed.assigned_to):null,nextActionAt:typed.next_action_at==null?null:Number(typed.next_action_at),contact:{name:String(data.name||"Sem nome"),phone:String(data.phone||""),email:String(data.email||""),problem:String(data.problem||"outro"),region:String(data.region||""),property:String(data.property||"")}}}

export async function listCrmLeads(db:D1Like,options:CrmLeadListOptions={}):Promise<CrmLeadList>{const {page=1,pageSize=50,status,search}=options;const safePage=Math.max(1,Math.trunc(page)),safeSize=Math.min(100,Math.max(10,Math.trunc(pageSize))),conditions:string[]=[],values:unknown[]=[];if(status){conditions.push("status=?");values.push(status)}if(search){conditions.push("LOWER(payload) LIKE ? ESCAPE '\\'");values.push("%"+escapeLike(search.toLowerCase())+"%")};const where=conditions.length?" WHERE "+conditions.join(" AND "):"";const count=await db.prepare("SELECT COUNT(*) AS total FROM leads"+where).bind(...values).first<{total:number}>(),total=Number(count?.total||0),pages=Math.max(1,Math.ceil(total/safeSize)),current=Math.min(safePage,pages);const rows=await db.prepare("SELECT seq,id,payload,status,mode,created_at,updated_at,assigned_to,next_action_at FROM leads"+where+" ORDER BY COALESCE(updated_at,created_at) DESC,id DESC LIMIT ? OFFSET ?").bind(...values,safeSize,(current-1)*safeSize).all<CrmLeadRow>();const grouped=await db.prepare("SELECT status,COUNT(*) AS total FROM leads GROUP BY status").all<{status:string;total:number}>();return {leads:rows.results.map(mapCrmLead),total,page:current,pageSize:safeSize,pages,totals:Object.fromEntries(grouped.results.map(row=>[row.status,Number(row.total)]))}}

export async function listCrmLeadsFromSupabase(client:SupabaseLeadReadClient,options:CrmLeadListOptions={}):Promise<CrmLeadList>{
  const {page=1,pageSize=50,status,search}=options;
  const safePage=Math.max(1,Math.trunc(page)),safeSize=Math.min(100,Math.max(10,Math.trunc(pageSize)));
  const countResult=await applySupabaseLeadFilters(leadSelect(client,{head:true}),{status,search});
  if(countResult.error)throw new ApiError(503,"Leitura Supabase indisponível.");
  const total=Number(countResult.count||0),pages=Math.max(1,Math.ceil(total/safeSize)),current=Math.min(safePage,pages),from=(current-1)*safeSize;
  const rowsQuery=applySupabaseLeadFilters(leadSelect(client),{status,search})
    .order("updated_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,from+safeSize-1);
  // HEAD counts are not truncated by the Data API row cap and never fetch payloads.
  const [rowsResult,...counts]=await Promise.all([rowsQuery,...crmStatuses.map(value=>leadSelect(client,{head:true}).eq("status",value))]);
  if(rowsResult.error||counts.some(result=>result.error))throw new ApiError(503,"Leitura Supabase indisponível.");
  const totals=Object.fromEntries(crmStatuses.map((value,index)=>[value,Number(counts[index].count||0)]));
  return {leads:(rowsResult.data||[]).map(mapSupabaseLead),total,page:current,pageSize:safeSize,pages,totals};
}

export async function listCrmWorkspaceLeads(s:Settings,options:CrmLeadListOptions={},accessToken?:string):Promise<CrmLeadList>{if(s.SUPABASE_DATA_MODE!=="read_only")return listCrmLeads(database(s),options);if(!accessToken)throw new ApiError(503,"Sessão Supabase ainda não integrada ao CRM.");const client=createSupabaseUserClient(s,accessToken);if(!client)throw new ApiError(503,"Supabase não configurado.");
return listCrmLeadsFromSupabase(client as unknown as SupabaseLeadReadClient,options)}

function escapeLike(value:string){return value.replace(/[\\%_]/g,match=>"\\"+match)}
function leadSelect(client:SupabaseLeadReadClient,options?:{head?:boolean}){return client.from("leads").select<SupabaseLeadRow>(options?.head?"id":"seq,id,payload,status,mode,created_at,updated_at,assigned_to,next_action_at",{count:"exact",head:options?.head})}
function applySupabaseLeadFilters<T>(query:SupabaseQuery<T>,{status,search}:Pick<CrmLeadListOptions,"status"|"search">){
  if(status)query=query.eq("status",status);
  if(search){
    const pattern=("%"+escapePostgrestLike(search)+"%").replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    query=query.or(["name","phone","email","problem","region","property"].map(field=>`payload->>${field}.ilike."${pattern}"`).join(","));
  }
  return query;
}
function mapSupabaseLead(row:SupabaseLeadRow){return mapCrmLead({...row,payload:typeof row.payload==="string"?row.payload:JSON.stringify(row.payload||{})})}
function escapePostgrestLike(value:string){return value.replace(/[\\%_]/g,match=>"\\"+match)}
