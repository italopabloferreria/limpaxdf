import {test} from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {updateLeadStatus} from "../lib/crm-lead-status";
import {createCrmTask} from "../lib/crm-tasks";
import {toDateTime} from "../lib/crm";
import {validateTaxId} from "../lib/crm-customers";
type SqlValue=string|number|bigint|null|Uint8Array;
type TestStatement={run:()=>Promise<unknown>};

function database(){
  const sql=new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  for(const migration of ["drizzle/0000_fat_supernaut.sql","drizzle/0001_panoramic_tarot.sql","drizzle/0002_burly_blue_shield.sql","drizzle/0003_hot_the_order.sql","drizzle/0004_faulty_thanos.sql","drizzle/0005_task_idempotency.sql"]){
    sql.exec(readFileSync(migration,"utf8"));
  }
  const DB={
    prepare(query:string){
      let values:SqlValue[]=[];
      const statement={
        bind(...next:SqlValue[]){values=next;return statement},
        async first<T>(){return (sql.prepare(query).get(...values)??null) as T|null},
        async all<T>(){return {results:sql.prepare(query).all(...values) as T[]}},
        async run(){return sql.prepare(query).run(...values)}
      };
      return statement;
    },
    async batch(statements:TestStatement[]){
      sql.exec("BEGIN");
      try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec("COMMIT");return results}
      catch(error){sql.exec("ROLLBACK");throw error}
    }
  } as unknown as D1Database;
  return {sql,DB};
}

function insertLead(sql:DatabaseSync,id:string,mode="live"){
  const now=1_700_000_000_000;
  sql.prepare("INSERT INTO leads (id,idempotency,payload_hash,payload,mode,origin,status,created_at,updated_at,privacy_version,marketing,upload_hash,upload_expires,upload_count) VALUES (?,?,?,?,?,'test','novo',?,?,'test',0,'upload',?,0)")
    .run(id,crypto.randomUUID(),"hash","{}",mode,now,now,now+1_000);
}

test("legacy-compatible status updates timestamp and activity atomically",async()=>{
  const {sql,DB}=database();
  const leadId=crypto.randomUUID();
  insertLead(sql,leadId);
  const updated=await updateLeadStatus(DB,{leadId,status:"qualificado",author:"integration:crm-status",mode:"live",now:1_800_000_000_000});
  assert.deepEqual(updated,{id:leadId,status:"qualificado",updatedAt:1_800_000_000_000});
  assert.deepEqual({...sql.prepare("SELECT status,updated_at FROM leads WHERE id=?").get(leadId)!},{status:"qualificado",updated_at:1_800_000_000_000});
  const activity=sql.prepare("SELECT kind,body,author FROM lead_activities WHERE lead_id=?").get(leadId);
  assert.deepEqual({...activity!},{kind:"update",body:"Status: qualificado",author:"integration:crm-status"});
  sql.close();
});

test("task creation replays the same request and rejects a changed retry",async()=>{
  const {sql,DB}=database();
  const leadId=crypto.randomUUID(),key=crypto.randomUUID();
  insertLead(sql,leadId);
  const input={leadId,title:"Confirmar acesso",dueAt:1_800_000_000_000,assignee:"atendimento@limpax.test",author:"atendimento@limpax.test",idempotencyKey:key};
  const created=await createCrmTask(DB,{...input,now:1_700_000_000_100});
  const replay=await createCrmTask(DB,{...input,now:1_700_000_000_200});
  assert.equal(replay.id,created.id);
  assert.equal(replay.replayed,true);
  assert.equal(sql.prepare("SELECT count(*) AS count FROM crm_tasks").get()!.count,1);
  assert.equal(sql.prepare("SELECT count(*) AS count FROM lead_activities WHERE kind='task'").get()!.count,1);
  await assert.rejects(createCrmTask(DB,{...input,title:"Outro conteúdo",now:1_700_000_000_300}),{status:409});
  sql.close();
});

test("date and tax document validation reject non-empty malformed values",()=>{
  assert.equal(validateTaxId("abc").valid,false);
  assert.equal(validateTaxId("   ").valid,true);
  assert.throws(()=>toDateTime("2026-02-30T10:00:00-03:00"),{status:400});
  assert.throws(()=>toDateTime("2026-09-21T10:00"),{status:400});
  assert.equal(toDateTime("2026-09-21T10:00:00-03:00"),Date.parse("2026-09-21T10:00:00-03:00"));
});
