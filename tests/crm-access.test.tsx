import {test, afterEach} from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync, type SQLInputValue} from "node:sqlite";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {env} from "./cloudflare-mock";
import {setRequestIdentity,withRequestIdentity} from "./request-headers-mock";
import {requireCrmUser} from "../lib/crm";
import CrmPage from "../app/crm/page";
import CustomersPage from "../app/crm/clientes/page";
import {GET as listCustomers} from "../app/api/crm/customers/route";
import {DELETE as deleteContact} from "../app/api/crm/customers/[id]/contacts/[contactId]/route";
import {DELETE as deleteLocation} from "../app/api/crm/customers/[id]/locations/[locationId]/route";
import {PATCH as updateUser} from "../app/api/crm/users/[email]/route";
import {PATCH as updateCustomerLifecycle} from "../app/api/crm/customers/[id]/lifecycle/route";

const email = "operator@example.test";
const origin = "https://limpax-fluindo.italopablo.chatgpt.site";
type Statement = {run(): Promise<unknown>};
const openDatabases: DatabaseSync[] = [];
function database() {
  const sql = new DatabaseSync(":memory:"); openDatabases.push(sql);
  sql.exec("PRAGMA foreign_keys=ON");
  for (const name of ["0000_fat_supernaut","0001_panoramic_tarot","0002_burly_blue_shield","0003_hot_the_order","0004_faulty_thanos"]) {
    sql.exec(readFileSync("drizzle/"+name+".sql","utf8"));
  }
  const queries: string[] = [];
  let batchTail:Promise<unknown>=Promise.resolve();
  const wrapper = {
    prepare(query: string) {
      let values: SQLInputValue[] = [];
      const statement = {
        bind(...args: SQLInputValue[]) { values=args; return statement; },
        async first() { queries.push(query); return sql.prepare(query).get(...values) ?? null; },
        async all() { queries.push(query); return {results:sql.prepare(query).all(...values)}; },
        async run() { queries.push(query); const result=sql.prepare(query).run(...values); return {success:true,meta:{changes:Number(result.changes)}}; },
      };
      return statement;
    },
    async batch(statements: Statement[]) {
      const execute=async()=>{
        sql.exec("BEGIN");
        try { const results=[]; for(const statement of statements) results.push(await statement.run()); sql.exec("COMMIT"); return results; }
        catch(error) { sql.exec("ROLLBACK"); throw error; }
      };
      const result=batchTail.then(execute,execute);
      batchTail=result.then(()=>undefined,()=>undefined);
      return result;
    },
  };
  return {sql,queries,DB:wrapper as unknown as D1Database};
}
function setup(profile?: {role:string;active:number}, allowlist = true) {
  const fixture=database();
  Object.assign(env,{DB:fixture.DB,...(allowlist?{CRM_ADMIN_EMAILS:email}:{})});
  setRequestIdentity(email);
  if(profile) fixture.sql.prepare("INSERT INTO crm_user_profiles(email,role,active,created_at,updated_at) VALUES(?,?,?,0,0)").run(email,profile.role,profile.active);
  return fixture;
}
afterEach(()=>{
  for(const key of Object.keys(env)) delete env[key];
  setRequestIdentity(null);
  for(const sql of openDatabases.splice(0)) sql.close();
});
function noBusinessReads(queries:string[]) {
  assert.equal(queries.some(query=>/\bFROM\s+(leads|customers|customer_contacts|service_locations)\b/i.test(query)),false);
}
async function assertPagesDenied(pattern:RegExp) {
  for(const page of [CrmPage,CustomersPage]) {
    const html=renderToStaticMarkup(await page());
    assert.doesNotMatch(html,/data-workspace/);
    assert.match(html,pattern);
  }
}

test("revoked environment admin is denied by both real SSR pages and customer API before PII reads",async()=>{
  const {queries}=setup({role:"admin",active:0});
  await assert.rejects(requireCrmUser(),{status:403});
  assert.equal((await listCustomers(new Request(origin+"/api/crm/customers"))).status,403);
  await assertPagesDenied(/desativada|autorizada/i);
  noBusinessReads(queries);
});
test("DB-only user is accepted consistently in pages and API",async()=>{
  setup({role:"attendant",active:1},false);
  assert.equal((await requireCrmUser()).role,"attendant");
  assert.equal((await listCustomers(new Request(origin+"/api/crm/customers"))).status,200);
  for(const page of [CrmPage,CustomersPage]) assert.match(renderToStaticMarkup(await page()),/data-role="attendant"/);
});
test("persisted demotion overrides environment admin in SSR and API",async()=>{
  setup({role:"attendant",active:1});
  assert.equal((await requireCrmUser()).role,"attendant");
  for(const page of [CrmPage,CustomersPage]) assert.match(renderToStaticMarkup(await page()),/data-role="attendant"/);
});
for(const profile of [{role:"unknown",active:1},{role:"admin",active:2}]) {
  test("invalid persisted profile cannot fall back to environment: "+JSON.stringify(profile),async()=>{
    const {queries}=setup(profile);
    await assert.rejects(requireCrmUser(),{status:403});
    await assertPagesDenied(/autorizada|inválid/i);
    noBusinessReads(queries);
  });
}
test("missing profiles table fails closed for allowlisted user and returns safe page",async()=>{
  const {sql,queries}=setup(); sql.exec("DROP TABLE crm_user_profiles");
  await assert.rejects(requireCrmUser(),{status:503});
  assert.equal((await listCustomers(new Request(origin+"/api/crm/customers"))).status,503);
  await assertPagesDenied(/indisponível/i);
  noBusinessReads(queries);
});
test("missing DB fails closed for allowlisted user",async()=>{
  env.CRM_ADMIN_EMAILS=email; setRequestIdentity(email);
  await assert.rejects(requireCrmUser(),{status:503});
  await assertPagesDenied(/indisponível/i);
});
test("missing identity shows sign in without reading business data",async()=>{
  const {queries}=setup(); setRequestIdentity(null);
  await assert.rejects(requireCrmUser(),{status:401});
  await assertPagesDenied(/Entrar no CRM/);
  assert.deepEqual(queries,[]);
});
test("confirmed absence of profile preserves explicit environment bootstrap only",async()=>{
  setup();
  assert.equal((await requireCrmUser()).role,"admin");
  delete env.CRM_ADMIN_EMAILS;
  await assert.rejects(requireCrmUser(),{status:403});
});
test("last-seen write failure does not override a successful authorization",async()=>{
  const {sql}=setup({role:"attendant",active:1});
  sql.exec("CREATE TRIGGER reject_last_seen BEFORE UPDATE ON crm_user_profiles BEGIN SELECT RAISE(ABORT, 'synthetic write failure'); END");
  assert.equal((await requireCrmUser()).role,"attendant");
});
function customerFixture(role:string) {
  const fixture=setup({role,active:1});
  const id=crypto.randomUUID(),contactId=crypto.randomUUID(),locationId=crypto.randomUUID();
  fixture.sql.prepare("INSERT INTO customers(id,kind,name,created_at,updated_at) VALUES(?,'person','Synthetic customer',0,0)").run(id);
  fixture.sql.prepare("INSERT INTO customer_contacts(id,customer_id,name,created_at,updated_at) VALUES(?,?,'Synthetic contact',0,0)").run(contactId,id);
  fixture.sql.prepare("INSERT INTO service_locations(id,customer_id,label,created_at,updated_at) VALUES(?,?,'Synthetic location',0,0)").run(locationId,id);
  return {...fixture,id,contactId,locationId};
}
function mutation(path:string, requestOrigin=origin) {
  return new Request(origin+path,{method:"DELETE",headers:{origin:requestOrigin}});
}
test("attendant cannot permanently delete contacts or locations, with no data or audit mutation",async()=>{
  const {sql,id,contactId,locationId}=customerFixture("attendant");
  assert.equal((await deleteContact(mutation("/api/crm/customers/"+id+"/contacts/"+contactId),{params:Promise.resolve({id,contactId})})).status,403);
  assert.equal((await deleteLocation(mutation("/api/crm/customers/"+id+"/locations/"+locationId),{params:Promise.resolve({id,locationId})})).status,403);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM customer_contacts").get()!.n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM service_locations").get()!.n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_audit_log").get()!.n,0);
});
test("admin deletes contact and location with audit, while invalid origin remains denied",async()=>{
  const {sql,id,contactId,locationId}=customerFixture("admin");
  assert.equal((await deleteContact(mutation("/api/crm/customers/"+id+"/contacts/"+contactId,"https://other.test"),{params:Promise.resolve({id,contactId})})).status,403);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM customer_contacts").get()!.n,1);
  assert.equal((await deleteContact(mutation("/api/crm/customers/"+id+"/contacts/"+contactId),{params:Promise.resolve({id,contactId})})).status,200);
  assert.equal((await deleteLocation(mutation("/api/crm/customers/"+id+"/locations/"+locationId),{params:Promise.resolve({id,locationId})})).status,200);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM customer_contacts").get()!.n,0);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM service_locations").get()!.n,0);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_audit_log").get()!.n,2);
});

function lifecycleMutation(id:string,archived:boolean,requestOrigin=origin){
  return new Request(origin+"/api/crm/customers/"+id+"/lifecycle",{method:"PATCH",headers:{origin:requestOrigin,"content-type":"application/json"},body:JSON.stringify({archived})});
}
test("customer archive and restore are admin-only, origin-protected and audited",async()=>{
  const attendant=customerFixture("attendant");
  assert.equal((await updateCustomerLifecycle(lifecycleMutation(attendant.id,true),{params:Promise.resolve({id:attendant.id})})).status,403);
  assert.equal(attendant.sql.prepare("SELECT archived_at FROM customers WHERE id=?").get(attendant.id)!.archived_at,null);
  assert.equal(attendant.sql.prepare("SELECT COUNT(*) n FROM crm_audit_log").get()!.n,0);

  const admin=customerFixture("admin");
  assert.equal((await updateCustomerLifecycle(lifecycleMutation(admin.id,true,"https://other.test"),{params:Promise.resolve({id:admin.id})})).status,403);
  assert.equal((await updateCustomerLifecycle(lifecycleMutation(admin.id,true),{params:Promise.resolve({id:admin.id})})).status,200);
  assert.notEqual(admin.sql.prepare("SELECT archived_at FROM customers WHERE id=?").get(admin.id)!.archived_at,null);
  assert.equal((await updateCustomerLifecycle(lifecycleMutation(admin.id,false),{params:Promise.resolve({id:admin.id})})).status,200);
  assert.equal(admin.sql.prepare("SELECT archived_at FROM customers WHERE id=?").get(admin.id)!.archived_at,null);
  assert.equal(admin.sql.prepare("SELECT COUNT(*) n FROM crm_audit_log WHERE action IN ('archived','restored')").get()!.n,2);
});

function userUpdate(actor:string,target:string,data:Record<string,unknown>){
  const request=new Request(origin+"/api/crm/users/"+encodeURIComponent(target),{
    method:"PATCH",
    headers:{origin,"content-type":"application/json"},
    body:JSON.stringify(data)
  });
  return withRequestIdentity(actor,()=>updateUser(request,{params:Promise.resolve({email:encodeURIComponent(target)})}));
}
function addAdmin(sql:DatabaseSync,address:string){
  sql.prepare("INSERT INTO crm_user_profiles(email,role,active,created_at,updated_at) VALUES(?,'admin',1,0,0)").run(address);
}
test("bootstrap admin cannot deactivate the only persisted active admin",async()=>{
  const {sql}=setup();
  const persisted="owner@example.test";
  addAdmin(sql,persisted);
  const response=await userUpdate(email,persisted,{active:false});
  assert.equal(response.status,409);
  assert.equal(sql.prepare("SELECT active FROM crm_user_profiles WHERE email=?").get(persisted)!.active,1);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_audit_log").get()!.n,0);
});
test("concurrent cross-deactivation keeps one active admin and audits only the accepted change",async()=>{
  const {sql}=setup({role:"admin",active:1},false);
  const second="second-admin@example.test";
  addAdmin(sql,second);
  const responses=await Promise.all([
    userUpdate(email,second,{active:false}),
    userUpdate(second,email,{active:false})
  ]);
  assert.deepEqual(responses.map(response=>response.status).sort(),[200,409]);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_user_profiles WHERE role='admin' AND active=1").get()!.n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_audit_log WHERE action='user_updated'").get()!.n,1);
});
