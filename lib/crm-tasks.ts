import {ApiError,digest} from "./http";

type Db={prepare:(query:string)=>D1PreparedStatement;batch:(statements:D1PreparedStatement[])=>Promise<unknown[]>};
type TaskInput={leadId:string;title:string;dueAt:number|null;assignee:string;author:string;idempotencyKey:string;now?:number};

export async function createCrmTask(db:Db,input:TaskInput){
  const requestHash=await digest(JSON.stringify({title:input.title,dueAt:input.dueAt,assignee:input.assignee}));
  const prior=await findTask(db,input.leadId,input.idempotencyKey);
  if(prior)return replay(prior,requestHash);
  if(!await db.prepare("SELECT id FROM leads WHERE id=?").bind(input.leadId).first())throw new ApiError(404,"Solicitação não encontrada.");

  const id=crypto.randomUUID(),now=input.now??Date.now();
  try{
    await db.batch([
      db.prepare("INSERT INTO crm_tasks (id,lead_id,title,due_at,assignee,completed_at,created_at,idempotency_key,request_hash) VALUES (?,?,?,?,?,NULL,?,?,?)")
        .bind(id,input.leadId,input.title,input.dueAt,input.assignee,now,input.idempotencyKey,requestHash),
      db.prepare("INSERT INTO lead_activities (id,lead_id,kind,body,author,created_at) VALUES (?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),input.leadId,"task","Tarefa criada: "+input.title,input.author,now)
    ]);
    return {id,replayed:false};
  }catch(error){
    const raced=await findTask(db,input.leadId,input.idempotencyKey);
    if(raced)return replay(raced,requestHash);
    throw error;
  }
}

async function findTask(db:Db,leadId:string,key:string){
  return db.prepare("SELECT id,request_hash FROM crm_tasks WHERE lead_id=? AND idempotency_key=?")
    .bind(leadId,key).first<{id:string;request_hash:string}>();
}

function replay(row:{id:string;request_hash:string},hash:string){
  if(row.request_hash!==hash)throw new ApiError(409,"A tarefa mudou. Inicie um novo envio.");
  return {id:row.id,replayed:true};
}
