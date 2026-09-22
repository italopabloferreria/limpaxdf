import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

type LifecycleModule={
  assertCompatibleLifecycle(leadMode:unknown,customerMode:unknown):void;
  operationalDataMode(mode:string):"review"|"live";
};

async function lifecycleModule():Promise<LifecycleModule|null>{
  try{return await import("../lib/crm-lifecycle") as LifecycleModule}catch{return null}
}

test("lifecycle rejects review/live mixing and normalizes non-live capture to review",async()=>{
  const lifecycle=await lifecycleModule();
  assert.ok(lifecycle,"CRM lifecycle policy module must exist");
  assert.doesNotThrow(()=>lifecycle.assertCompatibleLifecycle("review","review"));
  assert.doesNotThrow(()=>lifecycle.assertCompatibleLifecycle("live","live"));
  assert.throws(()=>lifecycle.assertCompatibleLifecycle("live","review"),/dados diferentes/i);
  assert.throws(()=>lifecycle.assertCompatibleLifecycle("unknown","review"),/classificação/i);
  assert.equal(lifecycle.operationalDataMode("live"),"live");
  assert.equal(lifecycle.operationalDataMode("disabled"),"review");
});

test("migration classifies legacy customers as review/unknown without promoting data",()=>{
  const sql=new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  for(const migration of ["drizzle/0000_fat_supernaut.sql","drizzle/0001_panoramic_tarot.sql","drizzle/0002_burly_blue_shield.sql","drizzle/0003_hot_the_order.sql"])sql.exec(readFileSync(migration,"utf8"));
  const id=crypto.randomUUID(),now=Date.now();
  sql.prepare("INSERT INTO customers (id,kind,name,created_at,updated_at) VALUES (?,?,?,?,?)").run(id,"person","Dado legado",now,now);
  sql.exec(readFileSync("drizzle/0004_faulty_thanos.sql","utf8"));
  const customer=sql.prepare("SELECT source_mode,origin,import_batch FROM customers WHERE id=?").get(id)!;
  assert.deepEqual({...customer},{source_mode:"review",origin:"unknown",import_batch:null});
  const leadColumns=sql.prepare("PRAGMA table_info(leads)").all().map(row=>row.name);
  assert.ok(leadColumns.includes("origin"));
  assert.ok(leadColumns.includes("import_batch"));
  sql.close();
});
