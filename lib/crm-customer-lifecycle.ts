import {ApiError} from "./http";

type Db={prepare:(query:string)=>D1PreparedStatement;batch:(statements:D1PreparedStatement[])=>Promise<unknown[]>};

export async function changeCustomerArchiveState(db:Db,id:string,archived:boolean,author:string,now=Date.now()){
  const current=await db.prepare("SELECT archived_at FROM customers WHERE id=?").bind(id).first<{archived_at:number|null}>();
  if(!current)throw new ApiError(404,"Cliente não encontrado.");
  if(archived&&current.archived_at!==null)throw new ApiError(409,"Este cliente já está arquivado.");
  if(!archived&&current.archived_at===null)throw new ApiError(409,"Este cliente já está ativo.");
  const action=archived?"archived":"restored";
  await db.batch([
    db.prepare("UPDATE customers SET archived_at=?,updated_at=? WHERE id=?").bind(archived?now:null,now,id),
    db.prepare("INSERT INTO crm_audit_log (id,entity_type,entity_id,action,author,data,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),"customer",id,action,author,null,now)
  ]);
  return {archivedAt:archived?now:null};
}
