import {test,afterEach} from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync,type SQLInputValue} from "node:sqlite";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {env} from "./cloudflare-mock";
import {setRequestIdentity} from "./request-headers-mock";
import CrmPage from "../app/crm/page";

const email="admin@example.test";
const selected="65ff972e-a274-4e1f-a478-94b28d0818ad";
function database(){
  const sql=new DatabaseSync(":memory:");
  for(const name of ["0000_fat_supernaut","0001_panoramic_tarot","0002_burly_blue_shield","0003_hot_the_order"])sql.exec(readFileSync("drizzle/"+name+".sql","utf8"));
  const DB={prepare(query:string){let values:SQLInputValue[]=[];const statement={bind(...args:SQLInputValue[]){values=args;return statement},async first(){return sql.prepare(query).get(...values)??null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){const result=sql.prepare(query).run(...values);return {success:true,meta:{changes:Number(result.changes)}}}};return statement}} as unknown as D1Database;
  env.DB=DB;setRequestIdentity(email);
  sql.prepare("INSERT INTO crm_user_profiles(email,role,active,created_at,updated_at) VALUES(?,'admin',1,0,0)").run(email);
  return sql;
}
let sql:DatabaseSync|null=null;
afterEach(()=>{sql?.close();sql=null;for(const key of Object.keys(env))delete env[key];setRequestIdentity(null)});

test("CRM forwards a valid selected lead from the customer history deep link",async()=>{
  sql=database();
  const html=renderToStaticMarkup(await CrmPage({searchParams:Promise.resolve({selected})}));
  assert.match(html,new RegExp('data-selected="'+selected+'"'));
});
test("CRM ignores malformed selected lead identifiers",async()=>{
  sql=database();
  const html=renderToStaticMarkup(await CrmPage({searchParams:Promise.resolve({selected:"not-a-uuid"})}));
  assert.match(html,/data-selected="none"/);
});
