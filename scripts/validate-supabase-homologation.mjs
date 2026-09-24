import fs from "node:fs";
import path from "node:path";
import {createClient} from "@supabase/supabase-js";

const projectRoot=process.cwd();
const args=new Set(process.argv.slice(2));
const remote=args.has("--remote");
const values={...readEnvFile(path.join(projectRoot,".env.local")),...process.env};
const failures=[];

const requiredPublic=["SUPABASE_PROJECT_REF","SUPABASE_REGION","SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY"];
for(const key of requiredPublic){
  if(!present(values[key]))failures.push(`missing ${key}`);
}

if(values.SUPABASE_PROJECT_REF&&values.SUPABASE_PROJECT_REF!=="lkamarbpjqlibxlmcico")failures.push("project ref is not the Sao Paulo project");
if(values.SUPABASE_REGION&&values.SUPABASE_REGION!=="sa-east-1")failures.push("region is not sa-east-1");
if(values.SUPABASE_URL&&!/^https:\/\/lkamarbpjqlibxlmcico\.supabase\.co$/.test(values.SUPABASE_URL))failures.push("URL does not match the Sao Paulo Supabase project");
if(Object.entries(values).some(([key,value])=>/service[_-]?role/i.test(key)||/service[_-]?role/i.test(String(value))))failures.push("service_role must not be present for homologation validation");

const token=readAccessToken(values);
if(remote&&!token)failures.push("missing SUPABASE_CRM_ACCESS_TOKEN or SUPABASE_USER_JWT for remote validation");
if(remote&&values.LIMPAX_SUPABASE_REMOTE_VALIDATION!=="authorized")failures.push("set LIMPAX_SUPABASE_REMOTE_VALIDATION=authorized to run remote validation");
const fixtureBatch=values.SUPABASE_HOMOLOGATION_BATCH?.trim();
if(remote&&!/^homologation-[a-z0-9][a-z0-9-]{2,63}$/.test(fixtureBatch||""))failures.push("set SUPABASE_HOMOLOGATION_BATCH to a dedicated synthetic batch (homologation-...)");

if(failures.length){
  console.error("Supabase homologation validation: FAIL");
  for(const failure of failures)console.error("- "+failure);
  process.exit(1);
}

if(!remote){
  console.log("Supabase homologation validation dry-run: PASS");
  console.log(`project=${values.SUPABASE_PROJECT_REF} region=${values.SUPABASE_REGION}`);
  console.log(`hasUserToken=${Boolean(token)}`);
  console.log(`hasFixtureBatch=${Boolean(fixtureBatch)}`);
  console.log("Run with --remote only after adding a linked Supabase user JWT, synthetic fixture batch and explicit authorization env.");
  process.exit(0);
}

const client=createClient(values.SUPABASE_URL,values.SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{headers:{"X-Client-Info":"limpax-crm-homologation-validation","Authorization":"Bearer "+token}}
});

const {data:userData,error:userError}=await client.auth.getUser(token);
if(userError||!userData?.user){
  console.error("Supabase homologation validation: FAIL");
  console.error("- user JWT was not accepted by Supabase Auth");
  process.exit(1);
}

const profile=await client
  .from("crm_user_profiles")
  .select("user_id,role,active")
  .eq("user_id",userData.user.id)
  .maybeSingle();
if(profile.error){
  console.error("Supabase homologation validation: FAIL");
  console.error(`- crm_user_profiles read failed: ${safePostgrestError(profile.error)}`);
  process.exit(1);
}
if(!profile.data||profile.data.user_id!==userData.user.id||profile.data.active!==true||!["admin","attendant"].includes(profile.data.role)){
  console.error("Supabase homologation validation: FAIL");
  console.error("- authenticated user has no active linked CRM profile visible through RLS");
  process.exit(1);
}

const leads=await client
  .from("leads")
  .select("id",{count:"exact",head:true})
  .eq("origin","homologation")
  .eq("import_batch",fixtureBatch);
if(leads.error){
  console.error("Supabase homologation validation: FAIL");
  console.error(`- leads read failed: ${safePostgrestError(leads.error)}`);
  process.exit(1);
}
if(!leads.count){
  console.error("Supabase homologation validation: INCOMPLETE");
  console.error("- no synthetic fixture rows were visible in the designated batch");
  process.exit(1);
}

console.log("Supabase homologation validation: PASS");
console.log(`authUser=${redactUser(userData.user.email)} role=${profile.data.role} active=${profile.data.active}`);
console.log(`syntheticLeadsVisibleCount=${leads.count}`);

function readEnvFile(filePath){
  if(!fs.existsSync(filePath))return {};
  const entries={};
  for(const raw of fs.readFileSync(filePath,"utf8").split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#")||!line.includes("="))continue;
    const index=line.indexOf("=");
    entries[line.slice(0,index)]=line.slice(index+1);
  }
  return entries;
}

function readAccessToken(source){
  const value=source.SUPABASE_CRM_ACCESS_TOKEN||source.SUPABASE_USER_JWT||source.SUPABASE_ACCESS_TOKEN;
  if(!present(value))return undefined;
  const token=String(value).trim();
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)){
    failures.push("Supabase user token is not JWT-like");
    return undefined;
  }
  return token;
}

function present(value){
  return typeof value==="string"&&value.trim().length>0;
}

function safePostgrestError(error){
  return [error.code,error.message,error.hint].filter(Boolean).join(" | ");
}

function redactUser(email){
  if(!email||!email.includes("@"))return "[validated]";
  const [name,domain]=email.split("@");
  return `${name.slice(0,2)}***@${domain}`;
}
