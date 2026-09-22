import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {changeCustomerArchiveState} from "../lib/crm-customer-lifecycle";
import {listCustomers} from "../lib/crm-customers";

function database(){
  const sql=new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  for(const migration of ["drizzle/0000_fat_supernaut.sql","drizzle/0001_panoramic_tarot.sql","drizzle/0002_burly_blue_shield.sql","drizzle/0003_hot_the_order.sql","drizzle/0004_faulty_thanos.sql"])sql.exec(readFileSync(migration,"utf8"));
  const wrapper={prepare(query:string){let values:unknown[]=[];const statement={bind(...next:unknown[]){values=next;return statement},async first<T>(){return (sql.prepare(query).get(...values as []) as T|undefined)??null},async all<T>(){return {results:sql.prepare(query).all(...values as []) as T[]}},async run(){return sql.prepare(query).run(...values as [])}};return statement},async batch(statements:Array<{run:()=>Promise<unknown>}>){sql.exec("BEGIN");try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec("COMMIT");return results}catch(error){sql.exec("ROLLBACK");throw error}}};
  return {sql,db:wrapper as unknown as D1Database};
}

test("archive preserves customer relations and writes one audit event",async()=>{
  const {sql,db}=database(),now=1_800_000_000_000,customerId=crypto.randomUUID(),leadId=crypto.randomUUID();
  sql.prepare("INSERT INTO customers (id,kind,name,created_at,updated_at) VALUES (?,?,?,?,?)").run(customerId,"person","Cliente Teste",now-10,now-10);
  sql.prepare("INSERT INTO customer_contacts (id,customer_id,name,is_primary,created_at,updated_at) VALUES (?,?,?,1,?,?)").run(crypto.randomUUID(),customerId,"Contato",now-10,now-10);
  sql.prepare("INSERT INTO leads (id,idempotency,payload_hash,payload,mode,status,created_at,privacy_version,marketing,upload_hash,upload_expires,upload_count) VALUES (?,?,?,?,?,'novo',?,'test',0,?,?,0)").run(leadId,crypto.randomUUID(),"hash","{}","review",now-10,"upload",now+10);
  sql.prepare("INSERT INTO lead_customer_links (lead_id,customer_id,linked_at,linked_by) VALUES (?,?,?,?)").run(leadId,customerId,now-5,"admin@example.test");

  await changeCustomerArchiveState(db,customerId,true,"admin@example.test",now);

  assert.equal(sql.prepare("SELECT archived_at FROM customers WHERE id=?").get(customerId)!.archived_at,now);
  assert.equal(sql.prepare("SELECT COUNT(*) total FROM customer_contacts WHERE customer_id=?").get(customerId)!.total,1);
  assert.equal(sql.prepare("SELECT COUNT(*) total FROM lead_customer_links WHERE customer_id=?").get(customerId)!.total,1);
  assert.deepEqual({...sql.prepare("SELECT action,author FROM crm_audit_log WHERE entity_id=?").get(customerId)!},{action:"archived",author:"admin@example.test"});
  await assert.rejects(changeCustomerArchiveState(db,customerId,true,"admin@example.test",now+1),/já está arquivado/i);
  assert.equal(sql.prepare("SELECT COUNT(*) total FROM crm_audit_log WHERE entity_id=?").get(customerId)!.total,1);
  sql.close();
});

test("active and archived listings are separated and restoration is audited",async()=>{
  const {sql,db}=database(),now=1_800_000_000_000,activeId=crypto.randomUUID(),archivedId=crypto.randomUUID();
  sql.prepare("INSERT INTO customers (id,kind,name,source_mode,created_at,updated_at) VALUES (?,?,?,?,?,?)").run(activeId,"person","Ativo","review",now,now);
  sql.prepare("INSERT INTO customers (id,kind,name,source_mode,created_at,updated_at,archived_at) VALUES (?,?,?,?,?,?,?)").run(archivedId,"person","Arquivado","review",now,now,now);

  assert.deepEqual((await listCustomers(db,{sourceMode:"review"})).customers.map(item=>item.id),[activeId]);
  assert.deepEqual((await listCustomers(db,{sourceMode:"review",archived:true})).customers.map(item=>item.id),[archivedId]);
  await changeCustomerArchiveState(db,archivedId,false,"admin@example.test",now+1);
  assert.equal(sql.prepare("SELECT archived_at FROM customers WHERE id=?").get(archivedId)!.archived_at,null);
  assert.equal(sql.prepare("SELECT action FROM crm_audit_log WHERE entity_id=?").get(archivedId)!.action,"restored");
  sql.close();
});
