import {ApiError} from "./http";
import type {CrmStatus} from "./crm-shared";

type Db={prepare:(query:string)=>D1PreparedStatement;batch:(statements:D1PreparedStatement[])=>Promise<unknown[]>};

export async function updateLeadStatus(db:Db,{leadId,status,author,mode,now=Date.now()}:{leadId:string;status:CrmStatus;author:string;mode?:"review"|"live";now?:number}){
  const existing=await db.prepare("SELECT id,status FROM leads WHERE id=?"+(mode?" AND mode=?":""))
    .bind(...(mode?[leadId,mode]:[leadId])).first<{id:string;status:string}>();
  if(!existing)throw new ApiError(404,"Solicitação não encontrada.");

  await db.batch([
    db.prepare("UPDATE leads SET status=?,updated_at=? WHERE id=?").bind(status,now,leadId),
    db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(),leadId,"update","Status: "+status,author,now)
  ]);

  return {id:leadId,status,updatedAt:now};
}
